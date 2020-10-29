'use strict';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const socket = require('socket.io')();

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// send a message on successful socket connection
// socket.on('connection', function(){
//   socket.emit('message', 'Successfully connected.');
// });

const namespaces = socket.of(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);

namespaces.on('connection', function(io) {
  const namespace = io.nsp;
  io.emit('message', 'Successfully connected on namespace: ${namespace.name}');
  io.on('calling', function() {
    io.broadcast.emit('calling');
});
// Handle signaling events and their destructured object data
  io.on('signal', function({ description, candidate}) {
    console.log(`Received a signal from ${io.id}`);
    console.log({description, candidate});
    // We want to broadcast the received signal so that the sending
    // side does not receive its own description or candidate
    io.broadcast.emit('signal', { description, candidate });
  });
});

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

module.exports = {app, socket};
