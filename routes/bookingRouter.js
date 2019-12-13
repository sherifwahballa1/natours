const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourID',
  authController.protect,
  bookingController.getCheckoutSession
);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.getAllBookings
  )
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide')
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.getBooking
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.updateBooking
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.deleteBooking
  );

module.exports = router;
