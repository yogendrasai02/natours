const mongoose = require('mongoose');
const User = require('./userModel');

const slugify = require('slugify');

// *** TOUR SCHEMA definition ***
// Note that VALIDATORS are also applied at some places
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The tour must have a name'],
        unique: [true, 'The tour name must be unique'],
        trim: true,
        minLength: [2, 'The tour name must be atleast 2 characters long!'],
        maxLength: [40, 'The tour name must be atmost 40 characters long']
    },
    duration: {
        type: Number, 
        required: true,
        min: [1, 'The tour must be atleast 1 day long']
    }, 
    maxGroupSize: {
        type: Number, 
        required: true
    },
    difficulty: {
        type: String, 
        required: true,
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: "The tour difficulty can be either 'easy' or 'medium' or 'difficult'"
        }
    },
    ratingsAverage: {
        type: Number,
        min: [1, 'The average rating must be atleast 1.0'],
        max: [5, 'The average rating can be atmost 5.0'],
        set: rating => Math.round((rating + Number.EPSILON) * 100) / 100
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // DOESNT work in UPDATE scenario because 'this' keyboard doesn't refer to current doc in that case
                return this.price > val;
                // val: priceDiscount
            }, 
            message: 'Price discount must be less that the price itself!'
        }
    },
    summary: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String
    }, 
    images: {
        type: [String]
    },
    createdAt: {
        type: Date, 
        default: Date.now(),
        select: false
    },
    startDates: {
        type: [Date]
    },
    slug: String,
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String, 
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    // guides: Array
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ** INDEXES **
tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// ** VIRTUAL PROPERTIES **

// tourSchema.virtual('durationInWeeks').get(function() {
//     return this.duration / 7;
// });

// virtual property populate to get reviews
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// *** MONGOOSE MIDDLEWARES ***

// ** DOCUMENT MIDDLEWARE **
// pre save hook to add a slug to created document
tourSchema.pre('save', function(next) {
    console.log('🙌 Before saving');
    this.slug = slugify(this.name, {
        lower:true
    });
    next();
});

// *** PRE SAVE mware to EMBED guides in tours ***
// tourSchema.pre('save', async function(next) {
//     console.log(this);
//     const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// post save hook (dummy, does nothing)
tourSchema.post('save', function(doc, next) {
    console.log('Document saved 🙌');
    next();
});

// ** QUERY MIDDLEWARE **
// pre find hook to exclude the secret tours from query results
tourSchema.pre(/^find/, function(next) {
    console.log('🙌 Before querying');
    this.find({ secretTour: { $ne: true } });
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

// post find hook (just to display queries documents)
tourSchema.post(/^find/, function(docs, next) {
    console.log('After querying 🙌');
    // console.log(docs);
    next();
});

// ** AGGREGATION MIDDLEWARE **
// pre aggregate hook to filter out secret tours from aggregation pipeline
// tourSchema.pre('aggregate', function(next) {
//     // console.log(this.pipeline());
//     this.pipeline().splice(0, 0, {
//         $match: { secretTour: { $ne: true } }
//     });
//     next();
// });

// *** Create the TOUR MODEL ***
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;