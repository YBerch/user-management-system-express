const express = require('express');
const mongoose = require('./lib/mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const config = require('./config');
const MongoStore = require('connect-mongo')(session);

const app = express();

/** view engine setup **/
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

if(app.get('env') === 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('default'));
}

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

/** connect session **/
app.use(session({
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  cookie: config.get('session:cookie'),
  store: new MongoStore({mongooseConnection: mongoose.connection}),
  resave: true,
  saveUninitialized: true
}));

app.use(require('./middleware/sendHttpError'));

app.use(express.static(path.join(__dirname, 'public')));

/** connect routes **/
require('./routes')(app);

/** catch 404 and forward to error handler **/
app.use((req, res, next) => {
  next(createError(404));
});

/** error handler **/
app.use(function(err, req, res, next) {
  res.status(err.status).send({message: err.message});
});

module.exports = app;
