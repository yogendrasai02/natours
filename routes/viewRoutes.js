const express = require('express');
const authController = require('../controllers/authController');
const viewRouter = express.Router();
const viewController = require('../controllers/viewController');
const bookingController = require('../controllers/bookingController');

viewRouter.use(authController.isLoggedIn);

viewRouter.get('/', bookingController.createBookingCheckout, viewController.getOverview);
viewRouter.get('/tour/:slug', viewController.getTour);
viewRouter.get('/login', viewController.getLoginForm);
viewRouter.get('/me', authController.protectRoute, authController.getAccount);
viewRouter.get('/my-tours', authController.protectRoute, viewController.getMyTours);

module.exports = viewRouter;