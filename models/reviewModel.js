/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewShecma = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review can not be empty'],
    },
    rating: { type: Number, min: 1, max: 5 },
    createAt: { type: Date, defaul: Date.now() },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Review must belongs to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must write by a user'],
    },
  },
  {
    //这里是Schema方法里面optional的值
    toJSON: { virtuals: true },
    toObject: { virtural: true },
  },
);

//index前面选项是按照tour和user的升序扫描数据,后面是optional, 意思是这两个数据会是独一无二的
//当同一个用户对一个tour评论2次时,就会报错.
reviewShecma.index({ tour: 1, user: 1 }, { unique: true });

//上面的创建的了字段tours和user,然后通过方法进行了引用数据模式,将传入的id字符串转换成了ObejctId,
//最后要在每一次查询或者全部查询reviews的时候将对应的ID的tour和user信息展示在reviews信息下面
//那么就要在每次查询动作之前建立一个middleware
reviewShecma.pre(/^find/, function (next) {
  //populate的意思是:当客户端新建review的时候,会传入tour和user的Id号，在reviewShecma的字段里面
  //tour和user字段定义通过了mongoose的方法,会将传入的字符串号码转换成ObjectID
  //当查询每一个review的时候,这里的populate就会将tour和user字段里面传入的转换成ObjectId的号码在tour和user数据库里查找,显示相对应的tour和user信息
  //同时可以同时创建2个populate方法
  //   this.populate({
  //     //这个是populat的指定在上面schema里面的字段
  //     path: 'tour',
  //     //这个是对指定字段里面的内容进行筛选,-号是不显示
  //     select: 'name',
  //   })
  this.populate({
    //这个是populat的指定字段
    path: 'user',
    //这个是对指定字段里面的内容进行筛选,-号是不显示
    select: 'name photo -_id',
  });

  next();
});

//对reviewShecma创建一个计算平均rating值和num of rating的函数
reviewShecma.statics.calcAverageRatings = async function (tourId) {
  const statistic = await this.aggregate([
    {
      //在这个函数里面,会先根据路由地址中tourID去查找review数据库里相对应的tourId所有的rating值
      $match: { tour: tourId },
    },
    {
      //然后根据这个review字段里的tour(其实就是tourID)进行分组
      $group: {
        _id: '$tour',
        //计算多少个rating数量
        numOfRating: { $sum: 1 },
        //计算rating的平均值
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //   console.log(statistic);
  //最后在Tour数据库里面通过tourId找到相对应的tour,然后将ratingsAverage和ratingsQuantity进行更新
  if (statistic.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: statistic[0].avgRating,
      ratingsQuantity: statistic[0].numOfRating,
    });
  } else {
    //当删除掉所有review以后,上面的statistic就会为空
    //那么相对应的tour的更新值就直接为初始值
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

//这里是,当每次Review里面rating新增的时候,
//那么就会自动执行上面的计算rating值的函数,tour里面也会自动更新了
reviewShecma.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

//这里是,当review里面的rating经过update或者整个review被删除了
//那么tour数据库里对应ID的tour的rating平均值和rating数量也要变化

//这里用/^findOneAnd/,是因为在reviewController里面updateReview和deleteReive
//里面的方法都是用的findByIdAndUpdate,findByIdAndDelete
reviewShecma.pre(/^findOneAnd/, async function (next) {
  //this.findOne() 是update 或 delete那条查询语句
  //在执行update和delete之前, 将查询语句结果赋值给this.r,结果里面有一个tour,包含tourId
  this.r = await this.findOne();
  console.log(this.r);
  next();
});
reviewShecma.post(/^findOneAnd/, async function () {
  //这里是update 和 delete之后,因为上面的middleware传下的this.r的tour作为参数进行上面函数的调用，最终进行数据更新
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewShecma);

module.exports = Review;
