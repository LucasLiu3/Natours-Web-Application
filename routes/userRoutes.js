/* eslint-disable import/no-extraneous-dependencies */
/*

///////////////////////////////
//还可以把各种方法里面的callback函数单独设立函数,然后再方法里面调用
//但是为了方便查看笔记,这里全部写在一起

const express = require('express');

//利用middleware来设置一个总路由,然后总路由利用middleware创建多个分路由
//先建立一个express的middleware
//然后app.use里面设定一个总路由地址,当客户端地址栏出现这个地址的时候,后面的tourRouter的middleware就会调用
//然后下面tourRouter有自己的方法,会根据客户端路由地址栏的名称进行分类调用

const userRouter = express.Router();

//设置只针对指定的路由地址出现的middleware,比如当路由地址是127.0.0.1:3000/api/v1/users/:id
//那么这个middleware后面的callback函数就会调用
userRouter.param('id', (req, res, next, val) => {
  console.log(
    `这个middleware 只针对路由带有id的地址出现 和 id的值是callback的参数val ${val}`
  );
  next();
});

//route('路由地址'),route的作用就是chian up一个路由地址的所有方法
userRouter
  .route('/')
  .get((req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined',
    });
  })
  .post((req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined',
    });
  });

userRouter
  .route('/:id')
  .get((req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined',
    });
  })
  .patch((req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined',
    });
  })
  .delete((req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined',
    });
  });



*/

///////////////////////////////////////////////////////////////////
//上面是最初版,下面是用MVC框架写的版本

//还可以把各种方法里面的callback函数单独设立函数,然后再方法里面调用
//但是为了方便查看笔记,这里全部写在一起

const express = require('express');
const userController = require('../controller/userController');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

//利用middleware来设置一个总路由,然后总路由利用middleware创建多个分路由
//先建立一个express的middleware
//然后app.use里面设定一个总路由地址,当客户端地址栏出现这个地址的时候,后面的tourRouter的middleware就会调用
//然后下面tourRouter有自己的方法,会根据客户端路由地址栏的名称进行分类调用
const userRouter = express.Router();

//专门创建一个建立新账号的路由,因为是客户端新建账号,所以是Post方法
userRouter.post('/signup', authController.signup);

//创建一个登录的路由,因为是接受客户端信息登录,所以是Post方法
userRouter.post('/login', authController.login);

userRouter.get('/logout', authController.logout);

//创建路由给忘记密码和更新密码
userRouter.post('/forgotpassword', authController.forgetPassword);
userRouter.patch('/resetpassword/:token', authController.resetPassword);

//这里是第一个middleware,下面所有路由地址的middleware都要先实现这个middleware才能运行
userRouter.use(authController.protect);

//登录以后修改密码路由地址
userRouter.patch('/updatepassword', authController.updatePassword);
userRouter.get('/me', userController.getMe, userController.getUser);

//给userController里面的updateME创建路由,前面会经过protect这个middleware
userRouter.patch(
  '/updateme',
  userController.uploadPhoto,
  userController.resizePhoto,
  userController.updateMe,
);

//给userController里面的deleteME创建路由,前面会经过protect这个middleware
userRouter.delete('/deleteme', userController.deleteMe);

userRouter.use(authController.restrictTo('admin'));
//下面的路由地址,必须上面这条middleware通过才能实现
userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
