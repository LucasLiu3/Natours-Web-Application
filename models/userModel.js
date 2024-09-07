/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');

//引用第三方校验库
const validator = require('validator');

//引用第三方密码加密库
const bcrypt = require('bcryptjs');

//引用第三方库来建立新的token
const crypto = require('crypto');

const userShecma = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'error happens,must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A name must less or equal then 40 characters'],
    // minlength: [8, 'A name must more or equal then 10 characters'],
  },

  email: {
    type: String,
    required: [true, 'error happens,must have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'], //使用第三方校验库对是否是email检测
  },

  photo: { type: String, default: 'default.jpg' },

  password: {
    type: String,
    required: [true, 'error happens,must have a password'],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'error happens,must have a password'],
    validate: {
      //自定义密码检测, 下面el就是这个passwordConfirm的值,判断是否等于password,返回一个bool值
      //只能用于mongoose的save()和create()方法上，其他方法不使用
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not same',
    },
  },

  passwordChangedAt: Date,
  passwordRestToken: String,
  passwordRestExpires: Date,

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  //创建这个字段是为了当user删除账户以后,只是给账户不活动,而不是从数据库删除整个账户信息
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//自我定义密码加密函数, 对userShecma加一个middleware，
userShecma.pre('save', async function (next) {
  //当检测到这次不是password改动,那么就直接进入下一个middleware
  if (!this.isModified('password')) return next();

  //如果密码改动,那就利用第三方库对密码进行加密
  this.password = await bcrypt.hash(this.password, 12);

  //当对密码加密成功以后,对passwordConfirm进行定义为undefined删除
  this.passwordConfirm = undefined;

  next();
});

//这个middleware的作用是当更新密码的时候,更新成功以后,user账户里面的passwordChangedAt字段会更新时间
userShecma.pre('save', function (next) {
  //这里是说如果不是密码变得或者账号是新创建的,那么就会跳过这个middleware
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

//这个middleware的意思是凡是和find开头有关的方法,都会经过后面的函数
//后面的函数的意思是,当前查询内容查找条件为active不为false
userShecma.pre(/find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//给userShecma创建一个方法,然后这个方法是个async函数，利用第三方库对输入的密码和原始密码进行比较，返回bool值
userShecma.methods.correctPassword = async function (
  inputPassword,
  userPassword,
) {
  return await bcrypt.compare(inputPassword, userPassword);
};

//给userShecma创建一个方法来判断客户有没有修改密码
//然后上面字段也要添加相对应的字段, 类型为Date
//JWTTimestamp 就是每次创建账户或登录账户时，对token进行验证过程中产生的时间戳
//然后通过JWT的时间戳和修改密码的时间戳进行对比
//如果修改密码时间戳大于JWT的时间戳,说明客户在token生成以后修改了密码

userShecma.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

//给userShecma创建一个方法来给忘记密码重新设置新的token
userShecma.methods.creatPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  //userShecma有一个字段是passwordRestToken,这里是给那个字段赋值,值是加密以后的token
  this.passwordRestToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordRestExpires = Date.now() + 10 * 60 * 1000;

  console.log(resetToken, this.passwordRestToken);
  //将新的token返回出去给客户进行修改密码
  return resetToken;
};

const User = mongoose.model('User', userShecma);

module.exports = User;
