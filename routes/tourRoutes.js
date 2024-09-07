///////////////////////////////////////////////////////////
//这里都是开始的写法,带有笔记,从下一个斜杆线以下才是MVC框架的写法

/*
///////////////////////
//还可以把各种方法里面的callback函数单独设立函数,然后再方法里面调用
//但是为了方便查看笔记,这里全部写在一起

const express = require('express');
const fs = require('fs');

//引用数据库
const Tour = require('../models/tourModel');

//获取在本地储存的客户数据,对其解析成js对象形式
const toursData = JSON.parse(
  fs.readFileSync('./dev-data/data/tours-simple.json'),
);

//利用middleware来设置一个总路由,然后总路由利用middleware创建多个分路由
//先建立一个express的middleware
//然后app.use里面设定一个总路由地址,当客户端地址栏出现这个地址的时候,后面的tourRouter的middleware就会调用
//然后下面tourRouter有自己的方法,会根据客户端路由地址栏的名称进行分类调用
const tourRouter = express.Router();

//设置只针对指定的路由地址出现的middleware,比如当路由地址是127.0.0.1:3000/api/v1/users/:id
//那么这个middleware后面的callback函数就会调用
// tourRouter.param('id', (req, res, next, val) => {
// console.log(
//   `这个middleware 只针对路由带有id的地址出现 和 id的值是callback的参数val ${val}`,
// );
// //因为下面几个方法里面都有判断id是否存在的代码,所以可以把所有相同的代码写在middleware里面
// if (req.params.id * 1 > toursData.length) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid ID',
//   });
// }
// next();
// });

//设置api路由地址，方法为get,给客户端以jsend 数据形式发送数据结果,但是里面的toursData是js对象的形式
tourRouter.get('/', (req, res) => {
  // console.log(req);
  res.status(200).json({
    status: 'success',
    // results: toursData.length,
    // data: {
    //   tour: toursData,
    // },
  });
});

//根据路由器地址的变化,获得变化的内容,然后返回指定数据
tourRouter.get(`/:id`, (req, res) => {
  //在请求的req中,有一个params的元素,是包含路由地址中的变更元素,比如上面的:id(可以随便写)
  //当你在网站中输入/api/v1/tours/5,那么params就是5
  console.log(req.params);

  //对路由器的id进行数字转换然后判断
  const id = req.params.id * 1;

  // //根据路由上的id，对数据库进行数据查询
  // const tour = toursData.find((eachtour) => eachtour.id === id);

  // //给客户端进行指定ID的数据传输
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour: tour,
  //   },
  // });
});

//设置api路由地址，方法为post,接收客户端传送过来的数据
tourRouter.post('/', (req, res) => {
  // //能接收到下面的res的body里面的数据,是因为上面设置了middleware,如果没有,结果就是undefined
  // console.log(req.body);

  // //将传进来的数据,写入本地的数据库

  // const newId = toursData[toursData.length - 1].id + 1;

  // //object.assign可以将第一个对象的属性复制到第二个目标对象中
  // // eslint-disable-next-line prefer-object-spread
  // const newTour = Object.assign({ id: newId }, req.body);

  // //将newTour加入到已经解析成js对象的tour里面去
  // toursData.push(newTour);

  // //将所有tour的JSON文件进行数据更新
  // fs.writeFile(
  //   './dev-data/data/tours-simple.json',
  //   JSON.stringify(toursData),
  //   //当数据跟新玩以后，给客户端返回只添加的tour的信息,还是以jsend的形式
  //   (err) => {
  //     res.status(201).json({ status: 'success', data: { tour: newTour } });
  //   },
  // );

  res.status(201).json({ status: 'success' });
});

//设置api路由地址，方法为patch,对指定ID的数据进行更新,这里只是写法
tourRouter.patch('/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here....>',
    },
  });
});

//设置api路由地址，方法为delete,对指定ID的数据进行删除,这里只是写法
tourRouter.delete('/:id', (req, res) => {
  //当删除数据时,status是204,而且不返回任何数据
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
 
*/

///////////////////////////////////////////////////////////////////
//上面是最初版,下面是用MVC框架写的版本

const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./reviewRoutes');

//利用middleware来设置一个总路由,然后总路由利用middleware创建多个分路由
//先建立一个express的middleware
//然后app.use里面设定一个总路由地址,当客户端地址栏出现这个地址的时候,后面的tourRouter的middleware就会调用
//然后下面tourRouter有自己的方法,会根据客户端路由地址栏的名称进行分类调用
const tourRouter = express.Router();

//创建这个router是为了当客户端登录以后,进入某一个tour,然后写review使用
//这里经过3重middleware
//第一重, protect证明需要log in才能写review
//第二重，只能user才能写评论
//第三重, 才能提交写的review
// tourRouter
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

//上面是旧写法,这里是新写法
//当路由经过前面那样的地址时，会进入reviewRouter里面
//在创建reviewRouter代码里,express.Router会加一个参数: { mergeParams: true }
//那么reviewRouter这个路由地址就能使用tourRouter这里路由地址中的参数了
tourRouter.use('/:tourId/reviews', reviewRouter);

//这里重新创建一个路由地址，这里就是Aliasing , 127.0.0.1:3000/api/v1/tours/top-5-cheap
//然后经过middleware(aliasTopTours)，最后实行（getAllTours）
//在middleware中,对req.query进行了一些条件设置,最后getAllTours会按照这些条件设置去查找数据
tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//这个路由地址,能让user根据自己的lat,lng位置查找自己范围内distance的tour
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

//这个路由地址能让user知道,所有tour到指定的latlng地址的距离
tourRouter
  .route('/distance/:latlng/unit/:unit')
  .get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTourImages,
    tourController.resizeTourPhoto,
    tourController.updateTour,
  )
  //在删除tour以前,增加2个middleware,一个是上面一样的,判断客户是否登录
  //另外一个是限制,只能是admin才能删除
  .delete(
    //因为第一步是进入protect middleware, 如果没报错，那么req请求中会添加一项user的值,就是现在登录的user
    authController.protect,
    //然后user的值中有role这一项property，进入restrictTo middleware
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

//这是nodejs export的写法
module.exports = tourRouter;
