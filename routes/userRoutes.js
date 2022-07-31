// create the SUB APPLICATION
const express = require('express');

// import the ROUTE HANDLERS
const userController = require('../controllers/userController');

const authController = require('../controllers/authController');

// create the ROUTER
const userRouter = express.Router();

// these routes DO NOT fit perfectly into REST architecture
// hence, its best to separate them
userRouter.post('/signup', authController.signup);

userRouter.post('/login', authController.login);

userRouter.get('/logout', authController.logout);

// forgot password and password reset routes
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

userRouter.use(authController.protectRoute);
userRouter.patch('/updateMyPassword', authController.updatePassword);

userRouter.patch('/updateMe', userController.uploadUserPhoto, userController.resizeImage, userController.updateMe);

userRouter.delete('/deleteMe', userController.deleteMe);

userRouter.get('/me', userController.getMe, userController.getUser);

userRouter.use(authController.restrictRoute('admin'));
// the url so far is '/api/v1/users' (for sub app)
userRouter
    .route('/')
    .get(userController.getAllUsers);

userRouter
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// export the ROUTER
module.exports = userRouter;