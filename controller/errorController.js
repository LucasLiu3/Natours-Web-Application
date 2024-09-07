/* eslint-disable arrow-body-style */
/* eslint-disable no-new */
/* eslint-disable no-shadow */

const AppError = require('../utilitys/appError');

/* eslint-disable node/no-unsupported-features/es-syntax */
const sendEroorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorPro = (err, req, res) => {
  //因为前面error经过AppError类的转换，里面已经添加了isOperational的property
  //当报错是因为输入错误或者其他客户端问题,会发送这里
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //如果是第三方库或者系统问题,那么就会发这种普通报错信息
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const errorName = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field ${errorName[0]}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((each) => each.message);
  const message = `Invalid input data, ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid Token, Please Log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token has expired, Please Log in again', 401);
};

module.exports = (err, req, res, next) => {
  console.log(err.stack); //err.stack会显示在哪个地方报错了

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //这里对开发模式进行区分,需要切换模式去看production模式下的报错信息显示
  // process.env.NODE_ENV = 'production';

  //对报错进行分类,对开发者和对消费者
  if (process.env.NODE_ENV === 'development') {
    sendEroorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //当客户端产生一些错误时，下面的代码还是无法识别，会展示mongoose的报错信息,这里就要对这些报错进行修改
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

    if (err.name === 'JsonWebTokenError') err = handleJWTError();

    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

    sendErrorPro(err, req, res);
  }
};
