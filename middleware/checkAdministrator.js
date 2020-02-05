const HttpError = require('../error').HttpError;

module.exports = (req, res, next) => {
  if(req.session.user.permission !== 'administrator'){
    return next(new HttpError(403, 'Permission denied'))
  }
  next();
};