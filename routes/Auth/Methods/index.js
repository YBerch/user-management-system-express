const User = require('../../../models/user');
const HttpError = require('../../../error').HttpError;
const AuthError = require('../../../error').AuthError;

/** user log in (POST) **/
exports.signIn = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email})
    .then(user => {
      if(user){
        if(user.checkPassword(password)) {
          req.session.user = {
            id: user._id,
            permission: user.permission
          };
          res.send(user)
        } else {
          throw new AuthError('Incorrect Password')
        }
      } else {
        throw new AuthError('Bad credentials')
      }
    })
    .catch(err => {
      if(err instanceof AuthError) {
        return next(new HttpError(403, err.message))
      } else {
        return next(err)
      }
    });
};

/** user log out (POST) **/
exports.signOut = (req, res) => {
  req.session.destroy();
  res.send({logout: 'success'})
};

/** user register (POST) **/
exports.signUp = (req, res, next) => {
  const {firstName, lastName, email, password} = req.body;

  User.findOne({email})
    .then(user => {
      if(user){
        throw new AuthError('User with this email allready exist')
      } else {
        return new User({firstName, lastName, email, password}).save();
      }
    })
    .then((user) => {
      req.session.user = {
        id: user._id,
        permission: user.permission
      };
      res.send({user, session: req.session, message: 'register'})
    })
    .catch(err => {
      if(err instanceof AuthError) {
        return next(new HttpError(403, err.message))
      } else {
        return next(err)
      }
    });
};