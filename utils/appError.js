class AppError extends Error {
    
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = ((this.statusCode == 400) ? 'fail' : 'error');
        this.isOperational = true;  // is it operational error or not
        Error.captureStackTrace(this, this.constructor);    // capture the stack trace
    }

}

module.exports = AppError;