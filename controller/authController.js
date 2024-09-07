/* eslint-disable import/order */
/* eslint-disable no-unused-expressions */
/* eslint-disable arrow-body-style */

//一样的,创建这个是为了把下面的aysnc函数里面的error传递给errorController.
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

//引用第三方库对token进行加密
const crypto = require('crypto');

//引用第三方库
//这个库可以给客户端创立一个新的token，具体作用去看文档
// eslint-disable-next-line import/order, import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const { promisify } = require('util');

const User = require('../models/userModel');

const AppError = require('../utilitys/appError');

const Email = require('../utilitys/email');
const { appendFile } = require('fs');

//创建token的函数
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

//创建新的账号
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  //当创建新账号时,调用发送邮件的class,然后发送welcome邮件
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 200, res); //新写法,下面是旧写法

  //利用第三方库创建token,有了token,客户端就能不输入密码直接登录了，有期限,在config.env里面设置
  //token是每次登录或者新建账户都会产生的密保
  // const token = signinToken(newUser._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: { user: newUser },
  // });
});

//客户登录
exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  //检测email和password是否存在
  if (!email || !password) {
    return next(new AppError('provide email and password!'), 400);
  }

  //检测user是否存在, 检测password是否正确
  //因为在userModel中,password设计成了select fasle，不显示
  //但这里需要检测password是否正确,所以需要select方法把password重新显示出来
  //如果在userModel里面设置成了false select，这里select方法名字前要加 +
  const user = await User.findOne({ email: email }).select('+password');
  console.log(user);

  //因为在userModel里面给userShecma创建了一个方法
  //而user在上面是User的一个返回值,也算userShecma的对象,所以也具有创建的方法
  //然后将上面req传入的password和数据库user里面的password进行比较
  //   const isPasswordCorrect = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  createAndSendToken(user, 200, res); //新写法,下面是旧写法

  //如果一切都正确,发送token给客户端,每登录一次token会是不同的
  //token是每次登录或者新建账户都会产生的密保
  // const token = signinToken(user._id);

  // res.status(200).json({
  //   status: 'sucess',
  //   token,
  // });
});

//创建这个函数是为了当tourController里面,如果客户是登录的,那么就可以直接获取tour理由里面的信息
exports.protect = catchAsync(async (req, res, next) => {
  //获取token,判断是否存在
  let token;

  //token都会存在于req的header里面，然后property名称为authorization,值是以 Bearer开头,后面就是token的值了
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    //校验token,token是每次登录或者新建账户都会产生的密保
    return next(new AppError('You are not logged in!!', 401));
  }

  //这里先用第三方库jwt对token和config.env里面的JWT_SECRET进行验证
  //然后利用express自带的promisify对结果进行返回,返回的结果里面包含用户的id
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  //user是否存在, 通过数据库User查找上面返回结果的id
  const currentUser = await User.findById(decoded.id);
  //如果不存在,说明账号在被创建拿到token以后,被删除了,那么这种情况也要报错,不能让客户端继续访问页面
  if (!currentUser) return next(new AppError('The user not exist'), 401);

  //user是否改变密码after token生成以后
  //currentUser是User的对象,所以它能使用UserModel里面的方法
  //然后将验证token生成的时间戳作为参数和 数据库中的passwordChangedAt字段的时间戳进行比较
  //如果passwordChangedAt > Token的时间戳,就要显示报错信息在客户端
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('User Has changed password, log in again'), 401);
  }

  //如果上一步都没出错,那么就给req请求中添加user这一项,值为现在登录的user
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//////////////////////////////////////////////////////////
//创建这个函数是为了renderlogin以后的页面
//比如没login的时候,主页右上角显示login signup按钮
//login以后,显示客户照片，名字然后logout按钮

exports.isloggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      //pug能通过locals读取数据,所以这里相当于给pug里面新建了一个值为currentUser的user数据
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//////////////////////////////////////////////////////////
//创建这个方法是为了log out

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

////////////////////////////////////////////////////
//给指定客户类型授权

exports.restrictTo = (...roles) => {
  //在这个middleware中, ...roles就是在tourRoutes中传进来的值
  //然后这个函数中判断传入的值是否包含 现在user的role值
  //如果没有就报错
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No permission', 403));
    }
    next();
  };
};

//////////////////
//忘记密码和更新密码

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //获取user根据输入的email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user with this email', 404));
  }

  //产生随机token
  const restToken = user.creatPasswordResetToken();

  //将userModel里面creatPasswordResetToken里面创建的加密的token和expires 加入到当前user的数据库中
  await user.save({ validateBeforeSave: false });

  //给客户端发送邮件

  //这个resetURL就是UserRoutes里面的一个路由地址
  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${restToken}`;

  // const message = `Forgot password? Submit your new password and passwordConfirm to : ${resetURL}`;

  try {
    // 邮件发送成功;
    //旧版本发送邮件方法
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset token',
    //   message: message,
    // });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${restToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      messsage: 'Your password reset link has sent to your email',
    });
  } catch (err) {
    //邮件发送失败
    user.passwordRestToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending email', 500));
  }
});

//忘记密码后发邮件，更新密码
exports.resetPassword = catchAsync(async (req, res, next) => {
  //根据传输的token,得到user账号信息

  //路由的地址为'/resetpassword/:token',那么req的params就有token的值,
  //这里对token进行加密
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //前面在userSchema里面设置了一个新方法: creatPasswordResetToken
  //里面有给userSchema设置了一个新的字段:passwordRestToken,
  //这个字段的值就是前面方法里面生成的随机token加密后的值
  //然后再forgetPassword路由里面,生成设立新密码的URL地址中的token也是这个随机码
  //所以这里可以说hashedToken就是和user字段里面的passwordRestToken是同一个值
  const user = await User.findOne({
    passwordRestToken: hashedToken,
    //这个字段的意思是,判断token的过期时间是否大于现在
    passwordRestExpires: { $gt: Date.now() },
  });

  //如果token过期或者账号不存在,那么就抛出异常
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  ///如果token没过期过期,而且user账号存在,就可以设定新的密码
  //密码变更成功以后,会调用userModel里面的一个middleware:自我定义密码加密函数
  //会将更新的密码进行加密,然后将passwordConfirm进行覆盖不显示
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordRestToken = undefined;
  user.passwordRestExpires = undefined;
  await user.save();

  //将user账户里的changePasswordAt 字段的值进行更新
  //这一步在UserModel里面创建的middleware会自动完成

  createAndSendToken(user, 200, res); //新写法,下面是旧写法
  // //创建新的token然后发送
  // const token = signinToken(user._id);
  // res.status(200).json({
  //   status: 'sucess',
  //   token,
  // });
});

//登录正确,修改密码\
exports.updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new AppError('not log in ', 404));
  }

  //检查现在的密码是否正确
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password is wrong', 401));
  }

  //更新密码
  user.password = req.body.updatePassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendToken(user, 200, res); //新写法,下面是旧写法
  // //重新登录账号,发送新的token
  // const token = signinToken(user._id);
  // res.status(200).json({
  //   status: 'sucess',
  //   token,
  // });
};
