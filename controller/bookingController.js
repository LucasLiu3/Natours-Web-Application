/* eslint-disable import/order */
const Tour = require('../models/tourModel');
const APIFeatures = require('../utilitys/apiFeatures');
const AppError = require('../utilitys/appError');
const handlerFactory = require('./handlerFactory');
const Booking = require('../models/bookingModel');
// eslint-disable-next-line import/no-extraneous-dependencies
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// eslint-disable-next-line arrow-body-style
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

exports.checkOutSection = catchAsync(async (req, res, next) => {
  //获取当前tour Id
  const tour = await Tour.findById(req.params.tourId);

  //创建check -out section,利用stripe创建支付页面
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  //创建res给客户端
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckOut = async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  //   res.redirect(req.orginalUrl.split('?')[0]);
  res.redirect(`${req.protocol}://${req.get('host')}/`);
};

exports.createBooking = handlerFactory.createEverything(Booking);
exports.getBooking = handlerFactory.getOneOfIt(Booking);
exports.getAllBooking = handlerFactory.getAll(Booking);
exports.updateBooking = handlerFactory.updateEverything(Booking);
exports.deleteBooking = handlerFactory.deleteEverything(Booking);
