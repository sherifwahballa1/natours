const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign(
    {
      id: id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPRIRED_IN
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //cookie will send only in https
  //res.cookie('name of the cookie', 'token', 'options')
  res.cookie('jwt', token, cookieOptions);

  //remove the password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    date: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  // const token = signToken(user._id);

  // res.status(201).json({
  //   status: 'success',
  //   token: token,
  //   date: {
  //     user: user
  //   }
  // });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error('please provide email and password');
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }

  const user = await User.findOne({
    email: email
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    const err = new Error('Incorrect email or password');
    err.statusCode = 401;
    err.status = 'fail';
    next(err);
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1 Getting Token and check of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    const err = new Error('You are not logged in! please login to get access');
    err.statusCode = 401;
    err.status = 'fail';
    next(err);
  }
  //2 Vertification token with signature

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3 check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser) {
    const err = new Error('The user belong to this token not exists');
    err.statusCode = 401;
    err.status = 'fail';
    next(err);
  }

  //4 check if user change password  after the token issued
  if (freshUser.changedPasswordAfter(decode.iat)) {
    const err = new Error(
      'User Recently changed the password please login again'
    );
    err.statusCode = 401;
    err.status = 'fail';
    next(err);
  }

  //Grant access to protected route
  req.user = freshUser;
  res.locals.user = freshUser; //locals used in render (pug pages)
  next();
});

//only for rendered pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1 Vertification token with signature
      const decode = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2 check if user still exists
      const freshUser = await User.findById(decode.id);
      if (!freshUser) {
        return next();
      }

      //3 check if user change password  after the token issued
      if (freshUser.changedPasswordAfter(decode.iat)) {
        return next();
      }

      //There is Logged in user
      res.locals.user = freshUser;
      return next();

    } catch (err) {
      return next();
    }
  }
  next();
};

//for delete route
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const err = new Error('You dont have permisson to do this action');
      err.statusCode = 401;
      err.status = 'fail';
      next(err);
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const err = new Error('not exist user with this email address');
    err.statusCode = 404;
    err.status = 'fail';
    next(err);
  }
  //2 generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3 send it to user's email

  try {
    const resetUrL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExprires = undefined;

    await user.save({ validateBeforeSave: false });
    const err2 = new Error('There was an error sending email try again later');
    err2.statusCode = 500;
    err2.status = 'fail';
    next(err2);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2)if token has not expired, and there is user set new password
  if (!user) {
    const err = new Error('Token is invalid or has expired');
    err.statusCode = 404;
    err.status = 'fail';
    next(err);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) update changedPasswordAt property for user

  //4)login the user in, send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2) check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    const err = new Error('Current Password is Wrong');
    err.statusCode = 401;
    err.status = 'fail';
    next(err);
  }
  //3)If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User findByIdAndUpdate will not work as intended!

  //4)Log in user, send JWT
  createSendToken(user, 200, res);
});
