const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

//这个里面的参数可以是这个路由使用任何自己做为参数为middleware的路由地址的参数
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.route('/').get(reviewController.getAllReviews).post(
  //利用authoController里面的两个方法,对只能是登录客户
  //而且角色是user的人才能发布评论
  authController.protect,
  authController.restrictTo('user'),
  reviewController.createReview,
);

reviewRouter
  .route('/:id')
  .get(reviewController.getOneReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = reviewRouter;
