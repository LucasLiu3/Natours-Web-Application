// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');
const pug = require('pug');
// eslint-disable-next-line import/no-extraneous-dependencies
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Lucas${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //如果需要测试这里，把下面注释掉,只使用这部分就行了
      //用mailsac.com来注册假的邮箱
      //这里是给真实的邮箱发送相对应的邮件  sendinblue密保：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
      return nodemailer.createTransport({
        service: 'SendinBlue',

        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      },
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.convert(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Website');
  }

  async sendPasswordReset() {
    await this.send('password', 'Your password reset');
  }
};

////////////////////////////////////////////////////////////////
//旧版本发送邮件代码
// const sendEmail = async (options) => {
//   //创建 transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   //定义email options

//   const mailOptions = {
//     from: 'Lucas Liu <lucasliu@qq.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   //发送email通过nodemailer,
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
