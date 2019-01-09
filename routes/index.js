const usersRouter = require('./Users');
const groupsRouter = require('./Groups');
const authRouter = require('./Auth');
const searchRouter = require('./Search');


module.exports = app => {
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/groups', groupsRouter);
  app.use('/search', searchRouter);
};
