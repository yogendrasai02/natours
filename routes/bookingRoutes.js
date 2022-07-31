const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const bookingRouter = express.Router();

bookingRouter.use(authController.protectRoute);
bookingRouter.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

bookingRouter.use(authController.restrictRoute('admin', 'lead-guide'));

bookingRouter.route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);

bookingRouter.route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = bookingRouter;