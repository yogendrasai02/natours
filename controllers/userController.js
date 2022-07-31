const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { filterObj } = require('../utils/general');

const handlerFactory = require('./handlerFactory');

const multer = require('multer');
const sharp = require('sharp');

/* MULTER RELATED STUFF */

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const dest = 'public/img/users';
//         cb(null, dest);
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         const name = `user-${req.user.id}-${Date.now()}.${ext}`;
//         cb(null, name);
//     }
// });
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

// const upload = multer({
//     dest: 'public/img/users'
// });
const upload = multer({
    storage: multerStorage, 
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeImage = catchAsync(async (req, res, next) => {
    if(!req.file) {
        next();
        return;
    }
    const ext = req.file.mimetype.split('/')[1];
    const name = `user-${req.user.id}-${Date.now()}.${ext}`;
    req.file.filename = name;

    await sharp(req.file.buffer).resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${name}`);
    next();
});

/* END OF MULTER RELATED STUFF */

// ** general middlewares related to user **
const updateMe = catchAsync(async (req, res, next) => {

    // 1. if user is trying to update password, throw an error
    if(req.body.password || req.body.passwordConfirm) {
        next(new AppError('You cannot update your password using this route. Please use /updateMyPassword for the same.', 400));
        return;
    }

    console.log(req.body);
    console.log(req.file);

    // 2. filter unwanted fields. for now, allow only name, email to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if(req.file)
        filteredBody.photo = req.file.filename;

    // 3. update the user
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true, 
        runValidators: true
    });

    updatedUser.password = undefined;

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });

});

// *** Allow a currently logged in user to DELETE himself ***
/**
 * 1. set active property of the user to false
 * 2. send 204 null response
 */
const deleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });

});

// *** ROUTE HANDLERS FOR USERS ***
// FOR NOW, SEND SOME DUMMY RESPONSE

// fetch all users
const getAllUsers = handlerFactory.getAll(User);

// fetch a single user based on id
const getUser = handlerFactory.getOne(User);

// fetch the logged in user
const getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// update a user based on id
const updateUser = handlerFactory.updateOne(User);

// delete a user based on id
const deleteUser = handlerFactory.deleteOne(User);

// *** EXPORT ROUTE HANDLERS ***
exports.getAllUsers = getAllUsers;
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.updateMe = updateMe;
exports.deleteMe = deleteMe;
exports.getMe = getMe;