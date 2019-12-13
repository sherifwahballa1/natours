const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .get(authController.protect, reviewController.getReview);

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
    );

module.exports = router;
