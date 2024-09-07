//这个文件夹是传送本地文件里JSON数据到数据库
//只会使用一次

/* eslint-disable import/no-extraneous-dependencies */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const DATABASE_LOCAL = 'mongodb://localhost:27017/natour';
mongoose
  .connect(DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database Connection successful'));

const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'),
);

const userData = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8'),
);

const reviewData = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

const importData = async () => {
  try {
    await Tour.create(tourData);
    await User.create(userData, { validateBeforeSave: false });
    await Review.create(reviewData);
    console.log('Data successfully have been londed to Mongodb Database');
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
