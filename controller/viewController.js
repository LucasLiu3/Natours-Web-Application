/* eslint-disable arrow-body-style */

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utilitys/appError');
const Booking = require('../models/bookingModel');

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

exports.getOverView = catchAsync(async (req, res, next) => {
  //get all tour data from collection

  const allTour = await Tour.find();

  //build template in overview.pug

  //render template
  res.status(200).render('overview', {
    title: 'Exciting tours for adventurous people',
    tours: allTour,
  });
});

exports.getTourDetail = catchAsync(async (req, res, next) => {
  const tourName = req.params.tourName;

  const tour = await Tour.findOne({ slug: tourName }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('Not such tour found with this name', 404));
  }
  res.status(200).render('tourdetail', {
    title: tour.name,
    tour: tour,
  });
});

exports.login = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log in',
  });
});

exports.signup = catchAsync(async (req, res) => {
  res.status(200).render('signup', {
    title: 'sign up',
  });
});

exports.getMe = (req, res) => {
  //在这里,viewRouter里面，会经过protect 这个middleware
  //然而在middleware里面,有给req.user和req.locals.user设定值
  //那么渲染accoutTemplate的时候,就不需要给里面传值了
  res.status(200).render('accountTemplate', {
    title: 'Your Account',
  });
};

//这个是配合accountTemplate里面注释的那个form形式写的，包括viewRoutes里面的路由地址
// exports.updateUserData = async (req, res, next) => {
//   //req.body里面就是accoutTemplate里面更新，然后按钮提交以后的数据
//   //因为在app.js里面设置了app.use(express.urlencoded)，所以才会有这个数据
//   // console.log(req.body);

//   const user = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     },
//   );

//   res.status(200).render('accountTemplate', {
//     title: 'Your Account',
//     user: user,
//   });
// };

exports.getMyTour = async (req, res, next) => {
  //找到bookings
  const bookings = await Booking.find({ user: req.user.id });

  //找到tours with the returned IDs
  const tourIDs = bookings.map((each) => each.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
};
