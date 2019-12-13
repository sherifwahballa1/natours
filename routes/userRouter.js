const express = require('express');
const userContoller = require('./../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
router.get(
  '/me',
  authController.protect,
  userContoller.getMe,
  userContoller.getUser
);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.patch(
  '/updateMe',
  authController.protect,
  userContoller.uploadUserPhoto,
  userContoller.resizeUserPhoto,
  userContoller.updateMe
);
router.delete('/deleteMe', authController.protect, userContoller.deleteMe);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userContoller.getAllUsers
  )
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    userContoller.createUser
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userContoller.getUser
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    userContoller.updateUser
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    authController.protect,
    userContoller.deleteUser
  );

module.exports = router;
