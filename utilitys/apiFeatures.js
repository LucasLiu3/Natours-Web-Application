/* eslint-disable node/no-unsupported-features/es-syntax */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    ////////////////-----------------筛选-------------------------///////////////////////////

    //这些代码是防止路由地址客户端输入一些tour里面没有的筛选条件
    const queryObejct = { ...this.queryString }; //这个步骤可以将路由地址里面的筛选地址进行深拷贝,那么两个对象间都不互相影响了
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((each) => delete queryObejct[each]);

    //当路由地址里面出现大于,小于的筛选条件时,比如这样127.0.0.1:3000/api/v1/tours?duration[gte]=5&difficulty=easy
    //由于mongodb的语法,需要给[get]加$,才能有效筛选
    let queryStr = JSON.stringify(queryObejct);
    queryStr = queryStr.replace(/\b(gte|gt|let|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    //Tour是mongoose的对象,find()方法可以查询数据库中所有的数据
    //后面的JSON.parse(queryStr)是对路由地址的后缀判断条件进行深拷贝后剔除没有的元素的筛选信息,如果没有,那就是全部信息

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    ///////////////---------------------排序--------------------------/////////////////////

    //当路由地址里面有sort的时候,将query利用mongoose的sort方法,然后将路由地址里面的指定排序条件作为参数进行对整个query排序
    if (this.queryString.sort) {
      //当多重条件排序时，路由地址会像这样 127.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage
      //那么需要将sort=price,ratingsAverage 利用下面的方法转化为字符串，然后放入mongoose的sort方法进行排序
      const sortBy = this.queryString.sort.split(',').join('');

      this.query = this.query.sort(sortBy);
    } else {
      //进行排序初始化设置,当客户端没有进行特定条件排序,这里自动返回按照创建日期排序的数据
      this.query = this.query.sort('createdAt');
    }

    return this;
  }

  fields() {
    ///////////////---------------------Limiting Fields--------------------------/////////////////////
    //127.0.0.1:3000/api/v1/tours?fields=_id,name,duration,price,difficulty
    //当路由地址里面有field的时候,将query利用mongoose的select方法
    //然后将路由地址里面的指定条件作为参数进行对整个query筛选,只显示每一条collection里面的指定筛选fields

    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //如果没有fields的筛选条件, 初始化设置不讲__v这项数据发送给客户
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    ///////////////---------------------Pagination--------------------------/////////////////////
    //127.0.0.1:3000/api/v1/tours?page=2&limit=10
    //当路由地址里面有page和limit的时候,将query利用mongoose的skip和limit方法
    //然后mongoose会将数据库的所有数据分页,对每页限定条数

    const pageValue = this.queryString.page * 1 || 1; //将路由里面的page的值进行type转换,如果没有前面的,那就是1
    const limitValue = this.queryString.limit * 1 || 100;
    const skipValue = (pageValue - 1) * limitValue;

    //当页面是2时,skip会跳过前5条数据，然后展示limit里面设定的指定数量的数据
    this.query = this.query.skip(skipValue).limit(limitValue);

    //这里是判断页面如果超过数据库的总数,那么就要抛出错误
    // if (this.queryString.page) {
    //   const numTour = await Tour.countDocuments();
    //   if (skipValue >= numTour) throw new Error('This page does not exit');
    // }

    return this;
  }
}

module.exports = APIFeatures;
