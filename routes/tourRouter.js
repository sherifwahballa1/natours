const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRouter');

const router = express.Router();

//middleware check Id
//router.param('id', tourController.checkID);

// POST /tour/2345gdg/reviews
// GET /tour/2345gdg/reviews
// GET tour/2345gdg/reviews/5465ghjj

//Create review on tour
router.use('/:tourId/reviews', reviewRouter);

//middleware select top 5 tours with alias name = top-5-tours
router
  .route('/top-5-tours')
  .get(tourController.alisTopTours, tourController.getAllTours);

router.route('/tours-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  //protect to check if user login or not
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
module.exports = router;
