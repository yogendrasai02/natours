const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1. get tour data from collection
    const tours = await Tour.find();
    // 2. build template -> overview.pug
    // 3. render that template using tour data
    res.status(200).render('overview', {
        title: 'All Tours',
        tours: tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const slug = req.params.slug;
    const tour = await Tour.findOne({ slug: slug })
                        .populate('reviews');
    if(!tour) {
        next(new AppError('Tour not found', 404));
        return;
    }
    res.status(200).render('tour', {
        title: tour.name,
        tour: tour
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Login to your account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user:req.user.id });
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });
    res.status(200).render('overview', {
        title: 'My Tours', 
        tours: tours
    });
});

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if(alert === 'booking') {
        res.locals.alert = 'Your booking was successful. A confirmation email is sent to your registered email address';
    }
    next();
};