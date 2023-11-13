const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const {router: authRouter,verifyOneTime} = require('./routes/auth');

const app = express();

const fileUpload = require('express-fileupload');
// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/healthcheck', (req,res,next) => {
  res.json({status: "ok"});
});
app.use('/auth', authRouter);
app.use(function(req,res,next){
  if(!req.cookies['X-one-time-token']){
    return res.redirect('/auth/login');
  } else {
    const token = req.cookies['X-one-time-token'];
    if(verifyOneTime(token)) next();
    else return res.cookie('X-one-time-token', null, {maxAge:0}).redirect('/auth/login');
  }
});
app.use('/', indexRouter);

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

module.exports = app;
