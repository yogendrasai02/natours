const AppError = require('../utils/appError');

// if the error is at api, send json response; else, render a template
const sendErrorDev = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        // 1) API -> send a detailed error
        res.status(err.statusCode).json({
            status: err.status,
            errorObject: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // 2) Webpage -> render a template with error message
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message
        });
    }
};

const sendErrorProd = (err, req, res) => {
    console.error('ERROR💥');
    console.error(err);
    if(req.originalUrl.startsWith('/api')) {
        if(err.isOperational) {
            // dont leak too much info to the client
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // send a generic error
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    } else {
        const msg = (err.isOperational) ? err.message : 'Something went wrong, try again after sometime';
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: msg
        });
    }
};

const handleCastErrorDB = err => {
    const msg = `Invalid ${err.path}:${err.value}`;
    return new AppError(msg, 400);
};

const handleDuplicateFieldErrorDB = err => {
    console.log(err);
    const msg = `Duplicate field: ${JSON.stringify(err.keyValue)}`
    return new AppError(msg, 400);
};

const handleValidationErrorDB = err => {
    let msg = 'Invalid input data:\n';
    const errors = err['errors'];
    for(let error in errors) {
        msg += errors[error].message;
        msg += '\n';
    }
    return new AppError(msg, 400);
};

const handleJWTExpiredError = err => {
    return new AppError('Session expired, please login again.', 401);
};

const handleJWTError = err => {
    return new AppError('Invalid session, please login again.', 401);
};

const globalErrorHandler = (err, req, res, next) => {
    // set status code, status and send json error response
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if(process.env.NODE_ENV === 'production') {
        // 'err' object wont destructure the 'name' property 
        // (REFER: https://stackoverflow.com/questions/62455889/can-t-find-name-property-in-mongoose-error-function)
        let errorObj = err;
        // handle mongoose CastError : invalid _id
        if(errorObj.name === 'CastError') {
            errorObj = handleCastErrorDB(errorObj);
        }

        // handle mongodb duplicate field error (Note that this code is a bit diff than the one in the course)
        if(errorObj.code === 11000) {
            errorObj = handleDuplicateFieldErrorDB(errorObj);
        }
        
        // handle mongodb validation error
        if(errorObj.name === 'ValidationError') {
            errorObj = handleValidationErrorDB(errorObj);
        }

        // handle jwt TokenExpiredError
        if(errorObj.name === 'TokenExpiredError') {
            errorObj = handleJWTExpiredError(errorObj);
        }

        // handle jwt error (JsonWebTokenError -> invalid signature)
        if(errorObj.name === 'JsonWebTokenError') {
            errorObj = handleJWTError(errorObj);
        }

        sendErrorProd(errorObj, req, res);
    }
};

module.exports = globalErrorHandler;