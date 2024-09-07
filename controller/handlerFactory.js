/* eslint-disable arrow-body-style */
const APIFeatures = require('../utilitys/apiFeatures');
const AppError = require('../utilitys/appError');

//一样的,创建这个是为了把下面的aysnc函数里面的error传递给errorController.
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

exports.deleteEverything = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document Found With That ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateEverything = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document Found With That ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createEverything = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    //给客户端发送最终显示结果
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOneOfIt = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOption) query = query.populate(populateOption);

    const doc = await query;

    //当输入没有存在的ID在客户端,这里就会进入IF语句,AppError会将里面的参数进行转换
    //然后next会将这个转换好的对象传入到errorController里面
    if (!doc) {
      return next(new AppError('No Tour Found With That ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};

    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .pagination();

    const doc = await features.query;
    //explain能查看这条query执行的信息,比如扫描了多少文件,返回了多少文件
    // const doc = await features.query.explain();

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
