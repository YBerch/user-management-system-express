const HttpError = require('../error').HttpError;

module.exports = (req, res, next) => {
  if(!req.session.user.id){
    return next(new HttpError(401, 'Unauthorized'))
  }
  next();
};