//引用环境变量模块
const dotenv = require('dotenv');

//在文件夹下创建config.env文件,里面设定环境变量
//然后下面开始读取环境变量
dotenv.config({ path: './config.env' });

//查看环境变量
// console.log(process.env);

///////////////////////////////////////////////////////////////////
//引用mongoose
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

//利用mongoose连接本地数据库
mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database Connection successful'));

//////////////////////////////////////////////////////////
const app = require('./app');

const port = 3000;
app.listen(port, () => {
  console.log(`App runing on port ${port}.....`);
});

//nodejs如何debug
//在terminal 安装ndb: npm install ndb
//然后再项目的package.json里面的scripts里加上"debug",值为 "ndb server.js"
//最后在terminal里面运行 npm run debug

//处理unhandlling error， 比如数据库密码错误
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection....');
  process.exit(1);
});

//处理uncaught error. 比如未定义的变量

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('uncaught Exception ....');
  process.exit(1);
});

// console.log(x);
