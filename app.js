'use strict';

// Assigning variables for node package handlers
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const io = require('socket.io')();
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

// Creating a room
const namespaces = io.of(/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);

// Displaying message for a successful connection
namespaces.on('connection', function(socket) {
  const namespace = socket.nsp;
  socket.emit('message', `Successfully connected on namespace: ${namespace.name}`);
  socket.on('calling', function() {
    socket.broadcast.emit('calling');
  });
  // Handle signaling events and their destructured object data
  socket.on('signal', function({ description, candidate}) {
    console.log(`Received a signal from ${socket.id}`);
    console.log({description, candidate});
    // We want to broadcast the received signal so that the sending
    // side does not receive its own description or candidate
    socket.broadcast.emit('signal', { description, candidate });
  });
  socket.on('checkers', function(data) {
    socket.broadcast.emit('checkers',data);
  });
});

// Initialize a chat connection
io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('send-message', function(message) {
    socket.broadcast.emit('chat-message', { message: message });
  });
  socket.on('disconnect', function() {
    console.log('user disconnected');
  })
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

module.exports = {app, io};