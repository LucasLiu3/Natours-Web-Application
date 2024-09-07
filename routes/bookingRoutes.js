const express = require('express');

const bookingController = require('../controller/bookingController');
const authController = require('../controller/authController');

const bookingRouter = express.Router();

bookingRouter.use(authController.protect);

bookingRouter.get(
  '/checkout-session/:tourId',
  bookingController.checkOutSection,
);

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
