class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //这个property是来判断错误来源是客户端还是外界库或者系统

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
