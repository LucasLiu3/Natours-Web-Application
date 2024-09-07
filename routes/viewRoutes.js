const express = require('express');

const viewController = require('../controller/viewController');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');

const viewRouter = express.Router();

viewRouter.get(
  '/',
  bookingController.createBookingCheckOut,
  authController.isloggedIn,
  viewController.getOverView,
);
viewRouter.get(
  '/tour/:tourName',
  authController.isloggedIn,
  viewController.getTourDetail,
);
viewRouter.get('/login', authController.isloggedIn, viewController.login);

viewRouter.get('/signup', viewController.signup);

viewRouter.get('/me', authController.protect, viewController.getMe);

viewRouter.get('/my-tours', authController.protect, viewController.getMyTour);

// viewRouter.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUserData,
// );

module.exports = viewRouter;
