const express = require('express');
const authController = require('../controllers/authController');
const viewRouter = express.Router();
const viewController = require('../controllers/viewController');

viewRouter.use(authController.isLoggedIn);

viewRouter.use(viewController.alerts);

// viewRouter.get('/', bookingController.createBookingCheckout, viewController.getOverview);
viewRouter.get('/', viewController.getOverview);
viewRouter.get('/tour/:slug', viewController.getTour);
viewRouter.get('/login', viewController.getLoginForm);
viewRouter.get('/me', authController.protectRoute, authController.getAccount);
viewRouter.get('/my-tours', authController.protectRoute, viewController.getMyTours);

module.exports = viewRouter;