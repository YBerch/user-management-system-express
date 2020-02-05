const User = require('../../../models/user');
const Group = require('../../../models/group');
const HttpError = require('../../../error').HttpError;
const ObjectID = require('mongodb').ObjectID;

/** get users list (GET) **/
exports.getUsersList = (req, res, next) => {
  const { page, size, groupId } = req.query;

  let id = '';

  if(groupId){
    try {
      id = new ObjectID(groupId)
    } catch(e){
      return next(new HttpError(401, 'Incorrect group id'))
    }
  }

  const records = User.find(groupId ? {groups: {$all: [id]}} : {})
    .skip(page * size - size)
    .limit(+size);

  records
    .then(users => {
      if(!users) {
        throw new HttpError(404, 'Database is empty')
      }

      records.estimatedDocumentCount()
        .then(totalSize => {
          if(groupId){
            res.json(users)
          } else {
            res.json({totalSize, [page]: users})
          }
        })
    })
    .catch(err => next(err))
};

/** get user by id (GET)**/
exports.getUser = (req, res, next) => {
  let id = null;
  try {
    id = new ObjectID(req.params.id)
  } catch(e){
    return next(new HttpError(401, 'Incorrect user id'))
  }

  User.findById(id)
    .then(user => {
      if(!user){
        next(new HttpError(404, 'User not found'))
      } else {
        res.json(user)
      }
    })
    .catch(err => next(err))
};

/** create user (POST) **/
exports.createUser = (req, res, next) => {
  const {email, phone, permission} = req.body;

  /** to form required parameters array for error message **/
  let requiredParams = [];
  // for(const key in req.body){
  //   if(req.body.hasOwnProperty(key)) {
  //     if (!req.body[key] || key === 'groups' && !req.body[key].length){
  //       requiredParams.push(key)
  //     }
  //   }
  // }

  /** throw error if required parameters array is not empty **/
  if(requiredParams.length) {
    const responseMessage = `${requiredParams.length > 1 ?
      'Fields:' : 'Field:'} '${requiredParams.join(`', '`)}' - required!`;
    throw new HttpError(402, responseMessage);
  }

  if(req.session.user.permission === 'moderator' && permission !== 'user'){
    throw new HttpError(403, 'Moderator can create user only with "user" permission ')
  }

  const permissionValid = permission === 'administrator' || permission === 'moderator' || permission === 'user';

  if(!permissionValid){
    throw new HttpError(400, 'permission type does not exist')
  }

  User.findOne({
    $or: [
      {email},
      {phone}
    ]
  })
    .then(user => {
      if(user){
        throw new HttpError(400, 'User with this email or phone already exist')
      } else {
        return new User(req.body).save();
      }
    })
    .then((user) => {
      res.json({user, session: req.session, message: 'register'});

      const socket = require('../../../bin/www');

      /** emit message for all users for update users data **/
      socket.emit('ping', { payload: 'users' })
    })
    .catch(err => next(err));
};

/** delete user (DELETE) **/
exports.deleteUser = (req, res, next) => {
  let id = null;
  try {
    id = ObjectID(req.params.id);
  } catch(e) {
    return next(new HttpError(401, 'Incorrect user id'))
  }
  User.findById(id)
    .then(user => {
      if (!user) {
        return next(new HttpError(404, 'User not found'));
      } else {
        User.deleteOne({_id: id})
          .then(() => {
            res.json({message: 'Delete success'});

            const socket = require('../../../bin/www');

            /** emit message for all users for update users data **/
            socket.emit('ping', { payload: 'users' })
          })
      }
    })
    .catch(err => next(err))
};

/** update user (PATCH) **/
exports.updateUser = (req, res, next) => {
  const {firstName, lastName, email, phone, permission} = req.body;

  if(req.session.user.permission === 'moderator' && permission !== 'user'){
    throw new HttpError(403, 'Moderator can create user only with "user" permission ')
  }

  const permissionValid = permission === 'administrator' || permission === 'moderator' || permission === 'user';

  if(!permissionValid){
    throw new HttpError(400, 'permission type does not exist')
  }

  const updateObject = {};
  firstName && (updateObject.firstName = firstName);
  lastName && (updateObject.lastName = lastName);
  email && (updateObject.email = email);
  phone && (updateObject.phone = phone);
  permission && (updateObject.permission = permission);

  let id = null;
  try {
    id = ObjectID(req.params.id);
  } catch(e) {
    return next(new HttpError(401, 'Incorrect user id'))
  }
  User.updateOne({_id: id}, updateObject)
    .then(result => {
      if(result.n){
        if(result.nModified){
          res.json({result, message: 'User update success'});

          const socket = require('../../../bin/www');

          /** emit message for all users for update users data **/
          socket.emit('ping', { payload: 'users' })
        } else {
          next(new HttpError(400, 'Not modified'));
        }
      } else {
        next(new HttpError(404, 'User not found'));
      }
    })
    .catch(err => next(err))
};

/** add group to user (PUT) **/
exports.addGroupToUser = (req, res, next) => {
  let groupId = null;
  let id = null;
  try {
    id = ObjectID(req.params.id);
    groupId = ObjectID(req.body.groupId)
  } catch(e) {
    return next(new HttpError(401, 'Incorrect id'))
  }
  User.findById(id)
    .then(user => {
      if(!user) {
        next(new HttpError(401, 'User does not exist'))
      } else {
        Group.findById(groupId)
          .then(group => {
            if (!group) {
              next(new HttpError(403, 'Group does not exist'))
            } else if (user.groups.indexOf(groupId) === -1) {
              user.groups.push(groupId);
              user.save();
              res.json({groups: user.groups, userId: id, message: 'Add success'});

              const socket = require('../../../bin/www');

              /** emit message for all users for update users data **/
              socket.emit('ping', { payload: 'users' })
            } else {
              next(new HttpError(403, 'Group already exist'))
            }
          });
      }
    })
    .catch(err => next(err))
};

/** delete user from group (DELETE) **/
exports.deleteGroupFromUser = (req, res, next) => {
  let groupId = null;
  let id = null;
  try {
    id = ObjectID(req.params.id);
    groupId = ObjectID(req.body.groupId)
  } catch(e) {
    return next(new HttpError(401, 'Incorrect id'))
  }
  User.findById(id)
    .then(user => {
      if(!user) {
        next(new HttpError(401, 'User does not exist'))
      } else {
        Group.findById(groupId)
          .then(group => {
            const index = user.groups.indexOf(groupId);
            if (!group) {
              next(new HttpError(403, 'Group does not exist'))
            } else if (index !== -1) {
              user.groups.splice(index, 1);
              user.save();
              res.json({groups: user.groups, userId: id, message: 'Delete success'});

              const socket = require('../../../bin/www');

              /** emit message for all users for update users data **/
              socket.emit('ping', { payload: 'users' })
            } else {
              next(new HttpError(403, 'Group does not exist in user list'))
            }
          });
      }
    })
    .catch(err => next(err))
};
