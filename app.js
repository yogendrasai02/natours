// *** IMPORTS ***
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); 
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
module.exports = app;   // export the app

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

app.use(express.static(path.join(__dirname, 'public')));

app.use(compression());

app.enable('trust proxy');  // FOR HEROKU

app.use(cors());

const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org', 'https://js.stripe.com/v3/'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
 
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", ...scriptSrcUrls]
    }
  })
);
/*
app.use(helmet());
// set HTTP security headers
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org', 
  'https://js.stripe.com'
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = ['unsafe-inline', 'data:', 'blob:', 'https://unpkg.com', 'https://tile.openstreetmap.org', 'https://js.stripe.com'];
const fontSrcUrls = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const workerSrcUrls = [
  'self',
  'unsafe-inline',
  'data:',
  'blob:',
  'https://*.stripe.com',
  'https://unpkg.com',
  'https://tile.openstreetmap.org'
];
const frameSrcUrls = [
  'self',
  'unsafe-inline',
  'data:',
  'blob:',
  'https://*.stripe.com',
  'https://*.mapbox.com',
  'https://*.cloudflare.com/'
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ['self'],
      connectSrc: ['self', ...connectSrcUrls],
      scriptSrc: ['self', 'unsafe-inline', 'data', 'blob', ...scriptSrcUrls],
      styleSrc: ['self', 'unsafe-inline', 'https:', ...styleSrcUrls],
      workerSrc: [...workerSrcUrls],
      objectSrc: [],
      imgSrc: ['self', 'blob:', 'data:', 'https:'],
      fontSrc: ['self', ...fontSrcUrls],
      frameSrc: [...frameSrcUrls],
    }
  })
);
*/

// limit requests coming from a single IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,   // time duration in milli seconds
    message: 'Too many requests from this IP, please try again after one hour'
});
app.use('/api', limiter);

// to log the REQUEST INFO in the console
const morgan = require('morgan');
app.use(morgan('dev'));

// to parse the BODY of request object
app.use(express.json());

app.use(cookieParser());

// data sanitization for NoSQL query injection
app.use(mongoSanitize());

// data sanitization for XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// this middleware runs for all requests
// app.use((req, res, next) => {
//     console.log("Cookies: ", req.cookies);
//     next();
// });

// to respond to OPTIONS pre-flight phase sent by browser
app.options('*', cors());

// import routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// forward the request to APPROPRIATE ROUTE
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

// ** UNHANDLED routes **
app.all('*', (req, res, next) => {
    // create an error and call the global error handling middleware
    // const err = new Error(`Cannot find ${req.url}: Resource not found`);
    // err.statusCode = 404;
    // err.status = 'fail';
    // next(err);
    const err = new AppError(`Cannot find ${req.url}: Resource not found`, 404);
    next(err);
});

// *** GLOBAL ERROR HANDLING MIDDLEWARE ***
app.use(globalErrorHandler);