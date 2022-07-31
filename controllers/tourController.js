// import TOUR MODEL
const Tour = require('../models/tourModel');

const handlerFactory = require('./handlerFactory');

// import the api features (filter, sort, paginate, limit)
const APIFeatures = require('../utils/api-features');
const AppError = require('../utils/appError');

const generalUtils = require('../utils/general');

const catchAsync = require('../utils/catchAsync');

const multer = require('multer');
const sharp = require('sharp');

/* MULTER RELATED STUFF */

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    // only if file is an image, process further, else throw an error
    if(!file.mimetype.startsWith('image')) {
        const err = new AppError('File format not support, please upload images only', 400);
        cb(err, false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: multerStorage, 
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if(!req.files.imageCover || !req.files.images) {
        next();
        return;
    }
    const imageCover = req.files.imageCover[0];
    const images = req.files.images;
    const ext = imageCover.mimetype.split('/')[1];
    
    // resize image cover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.${ext}`;
    await sharp(imageCover.buffer).resize(2000, 1350)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // resize images
    req.body.images = [];
    await Promise.all(
        images.map(async (img, ind) => {
            const ext = img.mimetype.split('/')[1];
            const fileName = `tour-${req.params.id}-${Date.now()}-${ind + 1}.${ext}`;
            await sharp(img.buffer).resize(2000, 1350)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${fileName}`);
            req.body.images.push(fileName);
        })
    );
    next();
});

/* END OF MULTER RELATED STUFF */



// ** MIDDLEWARE for ALIASING **
const aliasTopFiveCheap = (req, res, next) => {
    req.query.sort = '-ratingsAverage,price';
    req.query.limit = '5';
    next();
};

// *** ROUTE HANDLERS FOR TOURS ***

// fetch all tours
// also apply FILTERTING
const getAllTours = handlerFactory.getAll(Tour);

// fetch a single tour based on id
const getTour = handlerFactory.getOne(Tour, { path: 'reviews' });

// create a tour
const createTour = handlerFactory.createOne(Tour);

// update a tour based on id
const updateTour = handlerFactory.updateOne(Tour);

// delete a tour based on id
const deleteTour = handlerFactory.deleteOne(Tour);

// *** AGGREGATION PIPELINE  ***

// tour statistics 
const getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: {$gte: 4.5} }
        }, 
        {
            $group: {
                _id: '$difficulty',
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                countOfTours: { $sum: 1 },
                countOfRatings: { $sum: '$ratingsQuantity' }
            }
        },
        {
            $sort: {
                avgPrice: -1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        results: stats.length,
        data: {
            stats: stats
        }
    });
});

// busiest months in a given year
const getBusiestMonths = catchAsync(async (req, res, next) => {
    const year = +req.params.year;
    // console.log(year);
    // 1. unwind on start dates
    // 2. filter dates which are in given year
    // 3. group on month of each start date, count tours, get tour names
    // 4. add a month fied
    // 5. project the _id field out of response
    // 6. sort based on month
    const busyMonthsData = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match:{
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                countOfTours: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { _id: 0 }
        },
        {
            $sort: { month: -1 }
        }
    ]);
    res.status(200).json({
        status: 'success',
        results: busyMonthsData.length,
        data: {
            busyMonthsData: busyMonthsData
        }
    });
});

// /tours-within/:distance/centre/:latlng/unit/:unit
const getToursWithin = catchAsync(async (req, res, next) => {
    // 1. get parameters from req obj
    let { distance, latlng, unit } = req.params;
    unit = unit || 'km';
    latlng = latlng.split(',');
    if(!latlng || latlng.length != 2) {
        next(new AppError('Provide Latitude & Longitude in lat,long format', 400));
        return;
    }
    let [lat, lng] = latlng;    
    lat = +lat;
    lng = +lng;
    // create & await query
    const radius = (unit === 'mi') 
                    ? generalUtils.milesToRadians(distance) 
                    : generalUtils.kmToRadians(distance);
    console.log(distance, lat, lng, unit);
    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat],  // LONGITUDE first
                    radius
                ]
            }
        }
    });
    console.log(tours);
    // send response
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours
        }
    });
});

// /distances/:latlng/unit/:unit
const getDistancesToLocations = catchAsync(async (req, res, next) => {
    // 1. get parameters from req obj
    let { latlng, unit } = req.params;
    unit = unit || 'km';
    latlng = latlng.split(',');
    if(!latlng || latlng.length != 2) {
        next(new AppError('Provide Latitude & Longitude in lat,long format', 400));
        return;
    }
    let [lat, lng] = latlng; 
    lat = +lat;
    lng = +lng;  
    // 2. create & await aggregation query
    const mult = (unit === 'km') ? 0.001 : 0.000621371;
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                distanceField: 'distance',
                distanceMultiplier: mult
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    // 3. send response
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
}); 

// *** EXPORT ROUTE HANDLERS ***
exports.getAllTours = getAllTours;
exports.getTour = getTour;
exports.createTour = createTour;
exports.updateTour = updateTour;
exports.deleteTour = deleteTour;

// export other stuff
exports.aliasTopFiveCheap = aliasTopFiveCheap;
exports.getTourStats = getTourStats;
exports.getBusiestMonths = getBusiestMonths;

// route handlers related to geospatial data
exports.getToursWithin = getToursWithin;
exports.getDistancesToLocations = getDistancesToLocations;