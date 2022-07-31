// create the SUB APPLICATION
const express = require('express');

// import the ROUTE HANDLERS
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

// create the ROUTER
const tourRouter = express.Router();

tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/tours-within/:distance/centre/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

tourRouter.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistancesToLocations);

// ALIASING
tourRouter
    .route('/top-5-cheap-tours')
    .get(tourController.aliasTopFiveCheap, tourController.getAllTours);

// for TOUR STATISTICS
tourRouter.route('/tour-stats').get(tourController.getTourStats);

// for busiest months
tourRouter.route('/busiest-months/:year')
    .get(authController.protectRoute, 
        authController.restrictRoute('admin', 'lead-guide', 'guide'), 
        tourController.getBusiestMonths);

// the url so far is '/api/v1/tours' (for sub app)
tourRouter
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protectRoute, 
        authController.restrictRoute('admin', 'lead-guide'), 
        tourController.createTour);

tourRouter
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protectRoute, 
        authController.restrictRoute('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protectRoute, 
        authController.restrictRoute('admin', 'lead-guide'), 
        tourController.deleteTour);

// export the ROUTER
module.exports = tourRouter;