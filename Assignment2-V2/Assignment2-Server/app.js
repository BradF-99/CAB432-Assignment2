const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

// import custom modules
const redisClient = require("./modules/redisDriver");
const loggerUtil = require("./modules/logger.js");

const indexRouter = require('./routes/index');
const twitterRouter = require('./routes/twitterRouter');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/twitter', twitterRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

redisClient.on('connect', () => {
  loggerUtil.log("Established connection to Redis.");
});

redisClient.on('error', err => {
  loggerUtil.error("Unable to connect to Redis, terminating.")
  loggerUtil.error(`${err}`);
  //process.exit(1); // fail with exit code 1 (comment out for debug)
});

module.exports = app;
