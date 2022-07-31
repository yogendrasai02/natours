const Tour = require('./tourModel');
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must be associated to a tour'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must be submitted by an existing user']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ** indexes **
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // to prevent duplicate reviews

// *** QUERY MIDDLEWARES ***

// ** pre find query middleware to populate tour, user **
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// to calculate avg rating while saving review
reviewSchema.post('save', function() {
    // this: current document
    // this.constructor: model
    this.constructor.calcAvgRatings(this.tour);
});

// to calc avg rating while updating/deleting review
reviewSchema.post(/^findOneAnd/, async function(doc) {
    // console.log(doc);
    if(doc) {
        await doc.constructor.calcAvgRatings(doc.tour);
    }
});

// ** static functions **

// calculate average rating & no of ratings
reviewSchema.statics.calcAvgRatings = async function(tourId) {
    // this: current model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                noOfRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    // console.log(stats);
    if(stats.length > 0) {
        const updatedTour = await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].noOfRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        const updatedTour = await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;