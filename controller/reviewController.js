const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');

// eslint-disable-next-line arrow-body-style
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};

//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     result: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

//上面是get 所有reviews的旧写法,下面是封装写法
exports.getAllReviews = handlerFactory.getAll(Review);

exports.createReview = catchAsync(async (req, res, next) => {
  //在tourRoutes里面建立新的路由为单个tour写review
  //当req里面没有tour的id时，那么就将路由地址中的：tour id 赋值给req的body里面
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //当req里面没有user的id时,那么在第一重protect中,有将当前登录者的信息赋值给req.user
  //那么这里就可以将req.user里的id传给req.body.user
  if (!req.body.user) req.body.user = req.user.id;

  //然后根据req.body里面传入的review内容,创建新review,发送给客户端
  const newReview = await Review.create(req.body);
  //   console.log(newReview);
  res.status(200).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

exports.updateReview = handlerFactory.updateEverything(Review);

exports.deleteReview = handlerFactory.deleteEverything(Review);

exports.getOneReview = handlerFactory.getOneOfIt(Review);
