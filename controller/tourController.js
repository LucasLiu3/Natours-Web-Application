/* eslint-disable arrow-body-style */
/* eslint-disable node/no-unsupported-features/es-syntax */
//引用数据库
const { json } = require('express');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utilitys/apiFeatures');
const AppError = require('../utilitys/appError');
const handlerFactory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

//这个第三方库是为了更新网站里面上传照片用的
// eslint-disable-next-line import/order
const multer = require('multer');

// eslint-disable-next-line import/no-extraneous-dependencies, import/order
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     const ext = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(new AppError('Only images', 400), false);
  }
};

//这里是制定上传的照片地址
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//upload middleware,fileds意思是上传多个照片，photo是templates里面form里面名字叫photo的标签

//这个写法是上传多个templates里面多个标签的文件
exports.updateTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  { name: 'images', maxCount: 3 },
]);

// //上传单个标签上传的单个文件
// upload.single('image')
// //上传单个标签上传的多个文件
// upload.array('images',5)

exports.resizeTourPhoto = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  //这一步是为了给数据库中tour的imageCover更新
  //在updateTour的方法中，会将req.body里面所有要更新的数据上传到数据库进行更新
  //这里就是给那一步的imageCover赋值
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //这里是tour介绍里面的图片
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (each, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await sharp(each.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

//创建上面一个新的函数,然后下面所有controllers都是这个函数的返回值
//将下面每一个controller的aysnc函数和参数都放入新的函数中,进行执行,和以前的结果一样
//创建这个是为了把报错信息传递给global error handler

//因为Tour.find返回一个promise，所以函数必须设定为async/await
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //客户端返回来的request里面会有一个query的属性
//   //里面包含客户端路由地址后面的内容,比如?duration=5&price=397.
//   //就是主路由后面的每一个不同过滤标准

//   console.log(req.query);

//   //建立一个类,将所有方法放进类里面，然后创建一个类的对象,将这些方法全部chain up
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .fields()
//     .pagination();
//   const allTours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: allTours.length,
//     data: {
//       tour: allTours,
//     },
//   });
// });

//上面是get 所有tour的旧写法,下面是封装写法
exports.getAllTours = handlerFactory.getAll(Tour);

////////////////////////////////////////////////////////
// exports.getTour = catchAsync(async (req, res, next) => {
//   //通过数据库中每一条collection的ID查找相对应的数据

//   const tourById = await Tour.findById(req.params.id).populate('reviews');

//   //当输入没有存在的ID在客户端,这里就会进入IF语句,AppError会将里面的参数进行转换
//   //然后next会将这个转换好的对象传入到errorController里面
//   if (!tourById) {
//     return next(new AppError('No Tour Found With That ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tourById,
//     },
//   });
// });

//上面是旧写法,下面是用封装后的方法
exports.getTour = handlerFactory.getOneOfIt(Tour, { path: 'reviews' });

/////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//因为要获取前端传递过来的数据,
//因为Tour.creat返回一个promise 所以将这个函数设置为async/await函数
// exports.createTour = catchAsync(async (req, res, next) => {
//   //create是mongoose里面的方法,可以创建一个新的数据collection
//   //在postman里面对使用这个函数的路由地址放松数据(就是下面的req.body)
//   //因为mongoose的create方法,数据会存储到mongodb的数据库里面

//   const newTour = await Tour.create(req.body);

//   //给客户端发送最终显示结果
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

//上面是更新tour的旧写法, 下面是使用创建了一个适合所有的update函数来更新Tour
exports.createTour = handlerFactory.createEverything(Tour);

//////////////////////////////////////////////////////////////
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tourUpdated = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tourUpdated) {
//     return next(new AppError('No Tour Found With That ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tourUpdated,
//     },
//   });
// });

//上面是更新tour的旧写法, 下面是使用创建了一个适合所有的update函数来更新Tour
exports.updateTour = handlerFactory.updateEverything(Tour);

/////////////////////////////////////////////////////////
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tourDelete = await Tour.findByIdAndDelete(req.params.id);

//   if (!tourDelete) {
//     return next(new AppError('No Tour Found With That ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

//上面是删除tour的旧写法,下面是创建了handlerfactory以后的封装写法
exports.deleteTour = handlerFactory.deleteEverything(Tour);

////////////////////////////////
//利用mongodb的aggregate pipeline
//利用这个办法可以查询各种平均值,最大值,最小值,等

//第一个对象,$match 里面是首先查找满足特定要求的数据
//第二个对象,$group里是查询的各种aggregation值,都是根据_id里面的参数来进行分组计算的
//第三个对象, $sort，可以根据上面$group里面的参数来进行排序,1是升序,-1是降序
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { numTours: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

//////////////////////////////////////

//unwind会根据后面的参数,对数据进行分类,比如一个数据有3个startDates，那么unwind会将这个数据根据不同的startDates分成3个一样的数据,但是不同的startDates
//第二个参数,根据的数据里面startDates进行指定条件筛选
//第三个参数,用法$month 对'startDates'字段的月份进行提取，然后分组,然后计算每个月份有多少个tour, 最后用$push 对名字添加到一个数组里去
//第四个参数，给每个数据加一个字段
//第五个参数, $project, 可以对指定字段进行隐藏,0是隐藏,1是显示

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursEachMonth: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numToursEachMonth: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

//路由地址： '/tours-within/:distance/center/:latlng/unit/:unit',
//这个函数是让客户端能根据自己的经度维度地址查询指定距离内的tour
exports.getToursWithin = catchAsync(async (req, res, next) => {
  //将客户端传入进来的距离,经纬度,距离单位进行分解
  const { distance, latlng, unit } = req.params;

  //将经纬度进行分解
  const [lat, lng] = latlng.split(',');

  //利用公式进行半径的计算
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Provide correct Lat Or Lng', 400));
  }

  //然后再tour里面通过对startLocation字段结合上面经纬度，半径，利用mongoDB里面geospatial方法，查找存在的tour信息,
  //startLocation是地理位置字段，$geoWithin指示查询在指定的地理形状内，$centerSphere是指以球形的方式定义中心点和半径。
  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    result: tour.length,
    data: {
      data: tour,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  //将客户端传入进来的经纬度,距离单位进行分解
  const { latlng, unit } = req.params;

  //将经纬度进行分解
  const [lat, lng] = latlng.split(',');

  //对计量单位进行转换,如果是mil,然后将将multiplier放入下面stage中
  const multiplier = unit === 'mil' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Provide correct Lat Or Lng', 400));
  }

  const distance = await Tour.aggregate([
    //通过aggregate计算距离,但是切记,geoNear要是第一的位置
    //如果其他地方有middleware提前添加了其他stage,那么会报错,比如在tourModel 209行有middleware，不注释就会报错
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        //计算出来的距离就会在每一个tour的信息里面添加一个字段:distance
        //显示这个tour到提供的lat,lng的距离
        distanceField: 'distance',
        distanceMultiplier: multiplier, //这个会对所有的distance进行multiplier的乘法计算
      },
    },
    {
      //这个stage,会让结果只显示distance和name,而且是按照升序排列
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: distance.length,
    data: {
      data: distance,
    },
  });
});
