const HttpError = require('../error').HttpError;

module.exports = (req, res, next) => {
  switch (req.session.user.permission){
    case 'administrator':
      next();
      break;
    case 'moderator':
      next();
      break;
    default:
      return next(new HttpError(403, 'Permission denied'));
  }
};