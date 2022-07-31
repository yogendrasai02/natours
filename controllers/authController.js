const util = require('util');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Email = require('../utils/email');

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// sign and return token
const signToken = function (userId) {
    const token = jwt.sign({
        id: userId
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    return token;
};

// create token and send response
const createAndSendToken = (user, statusCode, res) => {

    const token = signToken(user._id);

    user.password = undefined;

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: (process.env.NODE_ENV === 'production' ? true : false),
        httpOnly: true
    };

    // add a HTTPOnly COOKIE which has the token
    res.cookie('token', token, cookieOptions);

    res.status(statusCode).send({
        status: 'success',
        token: token,
        data: {
            user: user
        }
    });
};

// ** SIGNUP user route handler **
const signup = catchAsync(async (req, res, next) => {
    // create the new user obj
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    // send welcome email
    const url = `${req.protocol}://${req.hostname}:${process.env.PORT}/me`;
    await new Email(newUser, url).sendWelcome();

    // create the JWT
    createAndSendToken(newUser, 201, res);

});

// *** USER LOGIN ***
const login = catchAsync(async (req, res, next) => {
    /* Steps to login a user:
    *   1. get email, pwd from req.body 
    *   2. check if both exist in req.body
    *   3. check if the user exists in DB
    *   4. check if passwords are same
    *   5. create the token and send to client
    */

    // get email and pwd from req.body
    const {email, password} = req.body;
    if(!email || !password) {
        next(new AppError('An email and a password are required.', 400));
        return;
    }

    // check if user exists in db
    const user = await User.findOne({ email: email }).select('+password');
    // IMP: find() methods wont return password field because we set select: false for pwd in schema 

    if(!user) {
        next(new AppError('Invalid email or password', 400));
        return;
    }

    // compare passwords
    const ok = await user.comparePasswords(password);

    if(!ok) {
        next(new AppError('Invalid email or password', 401));
        return;
    }

    // create and send the token
    createAndSendToken(user, 200, res);

});

const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        maxAge: 10 * 1000
    });
    res.status(200).json({ status: 'success' });
};

const getAccount = (req, res) => {
    // req.locals.user is present from protectRouter middleware
    res.status(200).render('account', {
        title: 'Your account'
    });
};

// *** middleware to PROTECT ROUTES ***
/**
 * STEPS:
 * 1. check if token exists and get the token
 * 2. check if token is valid (payload not changed & not expired)
 * 3. check if user still exists
 * 4. check if user changed pwd after token is issued
 */

const protectRoute = catchAsync(async (req, res, next) => {

    // 1. check if token exists and get the token
    let tokenFromHeadersExists = (req.headers.authorization != null) && req.headers.authorization.startsWith('Bearer');
    let tokenFromCookieExists = (req.cookies.token != null);
    if(!tokenFromHeadersExists && !tokenFromCookieExists) {
        next(new AppError('Please login to continue.'));
        return;
    }
    let token;
    if(tokenFromCookieExists) {
        token = req.cookies.token;
    } else {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. check if token is valid
    // verify token -> we get decoded token (with payload)
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    // console.log(decoded);
    // handle errors with this verification: a) invalid token b) token expired
    // this error handling is done at the global error handling middleware

    // get the payload
    const id = decoded.id;
    let issuedAt = decoded.iat;

    // 3. check if user exists with that given id
    const currentUser = await User.findById(id);

    if(!currentUser) {
        next(new AppError('The user with this token does not exists. Please login again or signup.', 401));
        return;
    }

    // 4. check if user had changed pwd after token issual
    if(currentUser.passwordChangedAfter(issuedAt)) {
        // password changed after token issual
        next(new AppError('User changed password recently. Please re login to continue.', 401));
        return;
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

const isLoggedIn = async (req, res, next) => {

    try {
        // 1. check if token exists and get the token
        let tokenFromCookieExists = (req.cookies.token != null);
        if(!tokenFromCookieExists) {
            next();
            return;
        }
        let token;
        token = req.cookies.token;
        // 2. check if token is valid
        // verify token -> we get decoded token (with payload)
        const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        // handle errors with this verification: a) invalid token b) token expired
        // this error handling is done at the global error handling middleware

        // get the payload
        const id = decoded.id;
        let issuedAt = decoded.iat;

        // 3. check if user exists with that given id
        const currentUser = await User.findById(id);

        if(!currentUser) {
            next(new AppError('The user with this token does not exists. Please login again or signup.', 401));
            return;
        }

        // 4. check if user had changed pwd after token issual
        if(currentUser.passwordChangedAfter(issuedAt)) {
            // password changed after token issual
            next(new AppError('User changed password recently. Please re login to continue.', 401));
            return;
        }

        // res.locals.x will be available as x in a pug template
        res.locals.user = currentUser;
    } catch (err) {
        
    }
    next();
};

// *** middleware to RESTRICT ACCESS to routes to certains user roles ***
const restrictRoute = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if(!roles.includes(userRole)) {
            next(new AppError('You do not have permission to access this page.', 403));
            return;
        }
        next();
    };
};

// *** PASSWORD RESET FEATURE ***
// 2 steps: 1) forgot pwd and 2) reset pwd

// ** FORGOT PASSWORD **
const forgotPassword = catchAsync(async (req, res, next) => {
    /**
     * Steps:
     * 1. get the POSTed email from user (ForgotPassword link)
     * 2. check if the user with that email exists
     * 3. generate random reset token
     * 4. send that to user's email
     */

    // 1, 2. get the POSTed email and check if the user exists
    const user = await User.findOne({ email: req.body.email });

    if(!user) {
        next(new AppError('User with the given email does not exist.', 404));
        return;
    }

    // 3. get random reset token
    const resetToken = user.createResetPasswordToken();

    // save to db
    user.save({ validateBeforeSave: false });

    // 4. send email
    // create the reset url and the message
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // send email
    try {

        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success', 
            message: 'Token sent to your email'
        });

    } catch(err) {
        
        user.passwordResetToken = undefined;
        user.passwordResetExpiresAt = undefined;

        await user.save({ validateBeforeSave: false });

        next(new AppError('Error while sending an email.', 500));

        return;

    }
});

// ** RESET PASSWORD **
/** FOR RESET PWD:
 * 1. get user based on received reset token
 * 2. if token is not expired and user exists, update password
 * 3. update passwordChangedAt field on the user
 * 4. login the user, send the JWT
 *  */ 
const resetPassword = catchAsync(async (req, res, next) => {

    // get user based on received token
    const receivedResetToken = req.params.token;
    // convert it into encrypted format
    const encryptedResetToken = crypto.createHash('sha256')
                                    .update(receivedResetToken)
                                    .digest('hex');

    // get user based on encrypted token and whose token is not expired
    const user = await User.findOne({
        passwordResetToken: encryptedResetToken,
        passwordResetExpiresAt: {
            $gt: Date.now()
        }
    });

    if(!user) {
        next(new AppError('Token is invalid or is expired', 400));
        return
    }

    // update user's actual password sent via request body
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save();

    // update passwordChangedAt property -> using a pre save hook mware in userModel

    // get the new token for login
    createAndSendToken(user, 200, res);
});

// *** Update Password for a logged in user ***
const updatePassword = catchAsync(async (req, res, next) => {

    // 1. get currently logged in user
    const user = await User.findById(req.user._id).select('+password');
    if(!(await user.comparePasswords(req.body.currentPassword))) {
        next(new AppError('The password you entered does not match your current password.', 400));
        return;
    }

    // 2. get the POSTed password
    const { newPassword, newPasswordConfirm } = req.body;

    // 3. update the password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;

    await user.save();

    // login the user and send the token
    createAndSendToken(user, 200, res);

});

exports.signup = signup;
exports.login = login;
exports.logout = logout;

exports.protectRoute = protectRoute;
exports.restrictRoute = restrictRoute;
exports.isLoggedIn = isLoggedIn;

exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.updatePassword = updatePassword;

exports.getAccount = getAccount;