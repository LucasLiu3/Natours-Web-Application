/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
//从这里开始都是用postman作为用户端请求数据

const express = require('express');

const path = require('path');

const app = express();

//引用第三方middleware
const morgan = require('morgan');

//引用第三方库rate-limit,来限制发送请求数量
const rateLimit = require('express-rate-limit');

//引用第三方库helmet,来设置安全的http请求头
const helmet = require('helmet');

//引用第三方库mongoSanitize,对于Non-sql的攻击
const mongoSanitize = require('express-mongo-sanitize');

//引用第三方库xss,对数据清洗
const xss = require('xss-clean');

//引用第三方库hpp,防止请求中的req污染
const hpp = require('hpp');

//引用第三方,将token存入客户端的cookie中
const cookieParser = require('cookie-parser');

//引用创建的分routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

//引用apperror类
const AppError = require('./utilitys/appError');

//引用error的controller
const errorController = require('./controller/errorController');

//使用helmet,在页面的headers里面找相对应的内容,看helmet文档
app.use(helmet());

//给全局设置一个middleware,来限制一个Ip发送请求的数量
const limiter = rateLimit({
  max: 1000, //最大请求量
  windowMs: 60 * 60 * 1000, //时间段
  message: 'Too much request from this IP',
});
app.use('/api', limiter);

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//使用这个,会将登陆以后的token存入到req.cookie中
app.use(cookieParser());

//调用第三方middleware,调用morgan,会产生下面middleware里面一样的callback函数(具体去github上查看)
app.use(morgan('dev')); //每一次点击路由,这个middleware会产生 路由的方法,路由地址, status和响应时间，响应大小

//设置middleware,express.json()是一个函数可以读取请求中body的值
app.use(express.json());

//防止Non-SQL 语句的攻击
app.use(mongoSanitize());
//清洗数据
app.use(xss());

//引用第三方库hpp,防止req中的params污染
app.use(hpp());

//使用这么middleware方法,客户端可以访问指定文件夹下所有静态的文档
app.use(express.static(path.join(__dirname, 'public')));

//设置自己的middleware,middleware里面的代码会应用到任何一个路由地址的请求中
//代码在middleware位置前面的路由地址,不会跑middleware里面的代码
// app.use((req, res, next) => {
//   console.log('This is the middleware text');
//   req.rightnow = new Date().toISOString(); //给req里面加属性
//   next(); //重点,只要设置middleware,在内部的callback函数里面，必须要用next(),不然整个程序会被blocked
// });

//z这么一大段是为了后面tourdetail里面地图设置的
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/',
  'https://js.stripe.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'ws://127.0.0.1:*',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ['https://*.stripe.com'],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", 'https://js.stripe.com'],
    },
  }),
);

//利用PUG(一种HTML引擎)来渲染views
app.set('view engine', 'pug');
//给app指定view的路径地址
app.set('views', path.join(__dirname, 'views'));

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//设置一个middleware给APP，来处理各种因为没有路由地址出现的网页错误
//下面代码的意思是,对于经过app所有的路由地址,如果没有上面的两个路由地址都没有符合的,说明路由地址错误
//那么就会执行后面的函数
app.all('*', (req, res, next) => {
  // const err = new Error(`Can not find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  //当middleware的next里面接受了error参数，那么系统就会跳过中间所有的middleware,直接执行处理error的middleware
  next(new AppError(`Can not find ${req.originalUrl} on this server`));
});

//设置error handling function,处理tourController里面所有操作的错误显示
//当上面的所有route里面执行报错,那么其中的一个middleware里面的next里的参数err就会传给这一个middleware
//然后系统会执行这个middleware,显示error在客户端
app.use(errorController);

module.exports = app;
