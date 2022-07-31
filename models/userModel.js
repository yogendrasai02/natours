const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// *** User SCHEMA DEFINITION ***
// **** WHEN YOU ADD A FIELD TO THE SCHEMA: add in the signup route as well ****
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name.']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email id.'],
        unique: [true, 'Email id must be unique.'],
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email'
        }
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: true,
        validate: {
            // ** works ONLY for .save() and .create() **
            validator: function(val) {
                return val === this.password;
            },
            message: 'Password and Confirm-password must match!'
        }
    },
    passwordChangedAt: {
        type: Date
    }, 
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpiresAt: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// **** WHEN YOU ADD A FIELD TO THE SCHEMA AND IF IT IS NEEDED FOR LOGIN/SIGNUP: add in the signup route as well ****

// ** ENCRYPTING users password **
// using a pre-save hook (document middleware)
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        // is the password is not modified (or) not sign-up
        next();
        return;
        // dont do anything, simply goto next middleware
    }
    // hash the password
    this.password = await bcrypt.hash(this.password, 13);
    this.passwordConfirm = undefined;   // no need to save it in DB
    // goto next middleware
    next();
});

// pre save hook to update passwordChangedAt property
userSchema.pre('save', function(next) {
    // update passwordChangedAt field only if pwd is reset and user is not new
    if(!this.isModified('password') || this.isNew) {
        next();
        return;
    }
    // this -1000 (1 second) is because this might run sometime after the token is generated
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// pre query middleware to filter out users with active:false
userSchema.pre(/^find/, function(next) {

    // attach to query
    this.find({ active: true });
    next(); 

});

// compare passwords --> instance methods
userSchema.methods.comparePasswords = async function (passwordFromClient) {
    return await bcrypt.compare(passwordFromClient, this.password);
};

// instance method --> to check if the password was changed after a certain timestamp
userSchema.methods.passwordChangedAfter = function (jwtTimestamp) {
    if(!this.passwordChangedAt) {
        // password wasnt changed 
        return false;
    }
    // note: JWT timestamps are in seconds since epoch
    const ms = new Date(this.passwordChangedAt).getTime();
    return ms > (jwtTimestamp * 1000);
};

// ** instance method to create a pwd reset token **
userSchema.methods.createResetPasswordToken = function() {
    const resetPassword = crypto.randomBytes(32).toString('hex');
    const hashedResetPassword = crypto.createHash('sha256').update(resetPassword).digest('hex');
    this.passwordResetToken = hashedResetPassword;
    // expires after 10 minutes
    this.passwordResetExpiresAt = Date.now() + (10 * 60 * 1000);
    // console.log("Expires at:", this.passwordResetExpiresAt);
    // console.log(resetPassword, hashedResetPassword);
    return resetPassword;
};

// *** User model creation ***
const User = mongoose.model('User', userSchema);

module.exports = User;