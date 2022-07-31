const authController = require('../controllers/authController.js');
const reviewController = require('../controllers/reviewController.js');

const express = require('express');

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protectRoute, 
        authController.restrictRoute('user'), 
        reviewController.addTourIdAndUserId, 
        reviewController.createReview);

reviewRouter.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.protectRoute, 
        authController.restrictRoute('user', 'admin'), 
        reviewController.updateReview)
    .delete(authController.protectRoute, 
        authController.restrictRoute('user', 'admin'), 
        reviewController.deleteReview);

module.exports = reviewRouter;