const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

const handlerFactory = require('./handlerFactory');

const getAllReviews = handlerFactory.getAll(Review);

const getReview = handlerFactory.getOne(Review);

const addTourIdAndUserId = (req, res, next) => {
    // allow for nested route
    if(!req.body.user)  req.body.user = req.user.id;
    if(!req.body.tour)  req.body.tour = req.params.tourId;
    next();
};

const createReview = handlerFactory.createOne(Review);

const updateReview = handlerFactory.updateOne(Review);

const deleteReview = handlerFactory.deleteOne(Review);

exports.getAllReviews = getAllReviews;
exports.getReview = getReview;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.addTourIdAndUserId = addTourIdAndUserId;