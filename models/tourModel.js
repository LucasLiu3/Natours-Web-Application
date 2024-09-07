/* eslint-disable import/order */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable import/no-extraneous-dependencies */
//引用mongoose
const slugify = require('slugify');
const mongoose = require('mongoose');

//引用第三方校验库
const validator = require('validator');

const User = require('./userModel');

//创建数据的schema, 如果shcema里面没有的元素名称,在前端传递的数据中有,也不会存储到数据库中
const tourShecma = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'error happens,must have a name'], //required是mongoose的校验机制
      unique: true,
      trim: true, //这个选项会将对于这一条数据的文字两端的空格去除
      maxlength: [40, 'A name must less or equal then 40 characters'], //maxlength是mongoose的校验机制
      minlength: [5, 'A name must more or equal then 10 characters'], //minlength是mongoose的校验机制
      // validate: [validator.isAlpha, 'name should all alpha'], 使用第三方库的校验,其他校验代码可以去github上看
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      reqruied: [true, 'A tour must have a difficulty'],
      enum: {
        //enum可以让这个字段只能填写指定的内容,仅仅只能针对是字符串的字段
        values: ['easy', 'medium', 'difficult'],
        message: 'Wrong name for difficulty',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'wrong rate'], //min,max也是mongoose的校验机制
      max: [5, 'wrong rate'],
      set: (val) => Math.round(val * 10) / 10, //set会将每次传入的数据进行转换
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'error happens,must have a price'],
    },
    priceDiscount: {
      type: Number,

      validate: {
        //-----自我定义校验机制------////
        //这个机制里面的this只指向在新创一条数据的时候,只能用于save()的方法上, 其他时候比如update无法用
        validator: function (value) {
          return value < this.price;
        },
        message: 'Price is too higher',
      },
    },
    discountPrice: Number,
    summary: {
      type: String,
      trim: true, //这个选项会将对于这一条数据的文字两端的空格去除
      reqruied: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      reqruied: [true, 'A tour must have a imageCover'],
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false }, //select可以让这个信息在数据创建时,不发送给客户端
    startDates: [Date],

    //这里两个字段是下面mongoose的middleware添加的
    addByMy: String,
    secreatTour: {
      type: Boolean,
      default: false,
    },

    //给每个tour创建地理坐标字段
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    //给具体地址创建字段,必须使用array
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    //创建导游字段  如果guides直接是：Array，那么就使用下面embed数据模式
    guides: [
      //这里是引用数据模式
      //利用mongoose的方法,会将传入的字符串变成ObejctId,然后引用源ref是User数据库
      //那么就会显示guides对应的ID的user信息会显示在tour的信息里面
      { type: mongoose.Schema.ObjectId, ref: 'User' },
    ],
  },

  {
    //这里是Schema方法里面optional的值
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//index方法会让mongoose读取数据的速度变快
//当客户端查询all Tour 而且价格低于1000元时,比如这样{{URL}}api/v1/tours?price[lt]=500
//没有index,mongoose会先sacan所有数据,然后在找到低于1000元的tour
//有了index,mongoose会将数据线按指定的参数进行排序(1是升序，-1降序),然后进行扫描
//那么找到低于1000元的tour的速度就大大增加了
//当这样以后,mongod后台就自动加了index的顺序,下次查询就只会扫描少量数据了
tourShecma.index({ price: 1, ratingsAverage: -1 });
tourShecma.index({ slug: 1 });

//新增startLocation进index，但是类型是2dshere, 因为在tourController里面，需要计算地址间的距离,让系统从球形的角度去算距离
tourShecma.index({ startLocation: '2dsphere' });

//给数据模型创建一个虚拟的字段,只有每次取数据的时候,才会返回get里面的函数，在数据查找上,这个虚拟字段是无法使用的
//为了显示该虚拟字段,上面Schema方法里面要传入optional的值
tourShecma.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourShecma.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//这里给tourShecma创建一个虚拟的字段,review,那么就不会使用很大空间
//这个虚拟字段,引用来自Review数据库, foreigField是引用数据库中的字段
//localFiled就是使用虚拟字段的数据库中的字段,这种方法可以将两种数据库相连
//就像sql里面 a._id = review.tour，那么这个虚拟review字段就有了相对应的所有信息
//然后再TourController里面的getOneTour里面使用populate方法,将这个虚拟字段显示在当前tour的信息下面
tourShecma.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//mongoose的middleware:
//pre方法的save只会在mongoose的save()和create()之前运行，
//所以在controller里面有save()或create()方法的路由页面调用数据之前,这个都会先实行
tourShecma.pre('save', function (next) {
  //这个this就是当前使用的整个数据对象,当给它加其他字段的时候，需要在shecma里面添加它的属性
  this.addByMy = this.name.slice(5);
  next();
});
// tourShecma.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//pre方法的/^find/只会在mongoose的任何关于 find()方法 之前运行，
//所以只能在controller里面有关 find()的方法,比如find(),findOne(),findMany()
//同样要给上面scheme加上相对应的字段
tourShecma.pre(/^find/, function (next) {
  this.find({ secreatTour: { $ne: true } });
  next();
});

//这个middleware是给新建Tour嵌入(embed)一个字段,那么新建Tour如果使用引用式数据模式,那么就在字段里面直接利用库引用
//给tourSchema新建一个middleware，这么middleware只对新建tour那么路由地址起作用
//因为在tourScheme中创建了一个guides的字段,当创造新的tour的时候,会有user的id传入guides中为值
//那么这个middleware,是为了讲user的id的代表的user在Tour里面显示
// tourShecma.pre('save', async function (next) {
//   //通过客户端新建Tour传输的guides的id数据, 在User数据库里面查找该user信息
//   //然后将这些信息做为object重新给新建tour的guides赋值,里面就是一个个user的信息了
//   const guidesPromise = this.guides.map(
//     async (each) => await User.findById(each),
//   );
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

//上面的创建的了字段guides,然后通过方法进行了引用数据模式,将传入的id字符串转换成了ObejctId,
//最后要在每一次查询或者全部查询Tour的时候将对应的ID的user信息展示在tour信息下面
//那么就要在每次查询动作之前建立一个middleware
tourShecma.pre(/^find/, function (next) {
  //populate的意思是:当客户端新建Tour的时候,会传入guides的Id号，在tourShecma的字段里面
  //guides通过了mongoose的方法,会将传入的字符串号码转换成ObjectID
  //当查询每一个Tour的时候,这里的populate就会将guides字段里面传入的转换成ObjectId的号码在User数据库里查找,显示相对应的user信息
  this.populate({
    //这个是populat的指定字段
    path: 'guides',
    //这个是对指定字段里面的内容进行筛选,-号是不显示
    select: '-__v -passwordChangedAt',
  });
  next();
});

//aggregation middleware, 会在任何数据的aggregation调用之前实行
//这个里面的this，会指向路由页面指向的那个controller里面的函数
// tourShecma.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secreatTour: { $ne: true } } });

//   next();
// });

//以mongoose的model建立数据库, 名称为Tour,模型为上面的tourSheme
const Tour = mongoose.model('Tour', tourShecma);

module.exports = Tour;
