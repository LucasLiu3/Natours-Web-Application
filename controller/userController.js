/* eslint-disable arrow-body-style */
const { callbackPromise } = require('nodemailer/lib/shared');
const User = require('../models/userModel');
const AppError = require('../utilitys/appError');
const handlerFactory = require('./handlerFactory');
// eslint-disable-next-line import/order
const jwt = require('jsonwebtoken');

//一样的,创建这个是为了把下面的aysnc函数里面的error传递给errorController.
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

//upload middleware,single意思是上传单个照片，photo是templates里面form里面名字叫photo的标签
exports.uploadPhoto = upload.single('photo');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     data: {
//       data: users,
//     },
//   });
// });

//上面是get所有user的旧写法,下面是封装写法

exports.getAllUsers = handlerFactory.getAll(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((each) => {
    if (fields.includes(each)) {
      newObj[each] = obj[each];
    }
  });
  return newObj;
};

////////////////////////////////////////////////
const signinToken = (_id) => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signinToken(user._id);

  //将token传送给客户端的cookie
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });

  user.password = undefined; //这里会将返回客户端信息里面的密码隐藏

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: user },
  });
};
///////////////////////////////////////////////////////
exports.updateMe = catchAsync(async (req, res, next) => {
  //这里功能是修改一些简单的个人信息,这里有个bug,当第二次去更新的时候,网页中的token就没有了,会报错,待解决

  console.log(req.file);
  //当客户修改密码，抛出异常
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Not for password update', 400));
  }

  //修改客户信息

  //这里创建一个过滤变量, 将req.body,和自定义能修改的property经过函数加工
  //返回一个对象,键是自定义property名字,值是req.body对应键名称的值(具体看filterObj函数)
  const filter = filterObj(req.body, 'name', 'email');
  if (req.file) filter.photo = req.file.filename;

  //因为这里不修改一些敏感数据,只是普通文档数据(名字...),那么可以用findByIdAndUpdate功能
  //因为在路由地址那里,这个函数前面会经过protect这个middleware
  //所以在protect最后代码给req.user赋值了,那么这里就可以直接使用
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filter, {
    new: true,
    runValidators: true,
  });

  createAndSendToken(updatedUser, 200, res);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  //在UserShecma的字段里面设置了新的字段：active
  //因为这个函数之前会经过protect的middleware,里面设置了当前user成为了req的property
  //然后下面通过User查找相对应的id,然后更新active为false
  //最后在UserModel里面设置一个新的middleware,不显示这些active为false的账户信息在页面
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'success',
    message: 'use /signup for creating a user',
  });
};

exports.getUser = handlerFactory.getOneOfIt(User);

//UpdateUser只能admin使用,不能修改密码
exports.updateUser = handlerFactory.updateEverything(User);

exports.deleteUser = handlerFactory.deleteEverything(User);
