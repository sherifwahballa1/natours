const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Bookings = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  //1) Get the tour data from the collection
  const tours = await Tour.find();
  //2) Bulid template
  //3)Render that template using tour data from1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getAccount = catchAsync(async (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    res.status(404).render('error', {
      title: 'Something went wrong',
      msg: 'There is no tour with this name'
    });
  }
  //2) Build template
  //3)Render temaplate using data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all Bookings
  const bookings = await Bookings.find({ user: req.user.id });

  //2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: `Log into your account`
  });
});

// without API
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: `your account`,
    user: updatedUser
  });
});
