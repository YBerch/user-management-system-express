const User = require('../../../models/user');
const Group = require('../../../models/group');
const HttpError = require('../../../error').HttpError;
const ObjectId = require('mongodb').ObjectId;

/** get users list (GET) **/
exports.getUsersList = (req, res, next) => {
  const { page = 1, size = 20, groupId } = req.query;

  let id = null;
  if (groupId) {
    if (!ObjectId.isValid(groupId)) return next(new HttpError(401, 'Incorrect group id'));
    id = new ObjectId(groupId);
  }

  const records = User.find(groupId ? { groups: { $all: [id] } } : {})
    .skip(page * size - size)
    .limit(+size);

  records
    .then(users => {
      if (!users) throw new HttpError(404, 'Database is empty');
      if (groupId) return res.json(users);
      User.estimatedDocumentCount()
        .then(totalSize => res.json({ totalSize, [page]: users }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

/** get user by id (GET)**/
exports.getUser = (req, res, next) => {
  const idParam = req.params.id;
  if (!ObjectId.isValid(idParam)) return next(new HttpError(401, 'Incorrect user id'));
  const id = new ObjectId(idParam);

  User.findById(id)
    .then(user => {
      if (!user) return next(new HttpError(404, 'User not found'));
      res.json(user);
    })
    .catch(err => next(err));
};

/** create user (POST) **/
exports.createUser = (req, res, next) => {
  const { email, phone, permission } = req.body;

  let requiredParams = [];
  // validate required fields if needed
  if (requiredParams.length) {
    const responseMessage = `${requiredParams.length > 1 ? 'Fields:' : 'Field:'} '${requiredParams.join(`', '`)}' - required!`;
    return next(new HttpError(402, responseMessage));
  }

  if (req.session && req.session.user && req.session.user.permission === 'moderator' && permission !== 'user') {
    return next(new HttpError(403, 'Moderator can create user only with "user" permission '));
  }

  const permissionValid = permission === 'administrator' || permission === 'moderator' || permission === 'user';
  if (!permissionValid) return next(new HttpError(400, 'permission type does not exist'));

  User.findOne({ $or: [{ email }, { phone }] })
    .then(user => {
      if (user) throw new HttpError(400, 'User with this email or phone already exist');
      return new User(req.body).save();
    })
    .then(user => {
      res.json({ user, session: req.session, message: 'register' });
      const socket = require('../../../bin/www');
      socket.emit('ping', { payload: 'users' });
    })
    .catch(err => next(err));
};

/** delete user (DELETE) **/
exports.deleteUser = (req, res, next) => {
  const idParam = req.params.id;
  if (!ObjectId.isValid(idParam)) return next(new HttpError(401, 'Incorrect user id'));
  const id = new ObjectId(idParam);

  User.findById(id)
    .then(user => {
      if (!user) return next(new HttpError(404, 'User not found'));
      return User.deleteOne({ _id: id });
    })
    .then(() => {
      res.json({ message: 'Delete success' });
      const socket = require('../../../bin/www');
      socket.emit('ping', { payload: 'users' });
    })
    .catch(err => next(err));
};

/** update user (PATCH) **/
exports.updateUser = (req, res, next) => {
  const { firstName, lastName, email, phone, permission } = req.body;

  if (req.session && req.session.user && req.session.user.permission === 'moderator' && permission !== 'user') {
    return next(new HttpError(403, 'Moderator can create user only with "user" permission '));
  }

  const permissionValid = permission === 'administrator' || permission === 'moderator' || permission === 'user';
  if (!permissionValid) return next(new HttpError(400, 'permission type does not exist'));

  const updateObject = {};
  firstName && (updateObject.firstName = firstName);
  lastName && (updateObject.lastName = lastName);
  email && (updateObject.email = email);
  phone && (updateObject.phone = phone);
  permission && (updateObject.permission = permission);

  const idParam = req.params.id;
  if (!ObjectId.isValid(idParam)) return next(new HttpError(401, 'Incorrect user id'));
  const id = new ObjectId(idParam);

  User.updateOne({ _id: id }, updateObject)
    .then(result => {
      if (result.n) {
        if (result.nModified) {
          res.json({ result, message: 'User update success' });
          const socket = require('../../../bin/www');
          socket.emit('ping', { payload: 'users' });
        } else {
          return next(new HttpError(400, 'Not modified'));
        }
      } else {
        return next(new HttpError(404, 'User not found'));
      }
    })
    .catch(err => next(err));
};

/** add group to user (PUT) **/
exports.addGroupToUser = (req, res, next) => {
  const userIdSource = req.params.id || (req.body && (req.body.userId || req.body.id));
  const groupIdSource = req.body && (req.body.groupId || req.body.group_id);

  if (!userIdSource || !ObjectId.isValid(userIdSource)) return next(new HttpError(401, 'Incorrect id'));
  if (!groupIdSource || !ObjectId.isValid(groupIdSource)) return next(new HttpError(401, 'Incorrect id'));

  const id = new ObjectId(userIdSource);
  const groupId = new ObjectId(groupIdSource);

  User.findById(id)
    .then(user => {
      if (!user) return next(new HttpError(401, 'User does not exist'));
      return Group.findById(groupId).then(group => {
        if (!group) return next(new HttpError(403, 'Group does not exist'));
        const alreadyHas = user.groups.some(g => String(g) === String(groupId));
        if (!alreadyHas) {
          user.groups.push(groupId);
          return user.save().then(() => {
            res.json({ groups: user.groups, userId: id, message: 'Add success' });
            const io = require('../../../bin/www');
            io.emit('ping', { payload: 'users' });
          });
        }
        return next(new HttpError(403, 'Group already exist'));
      });
    })
    .catch(err => next(err));
};

/** delete user from group (DELETE) **/
exports.deleteGroupFromUser = (req, res, next) => {
  const userIdSource = req.params.id || (req.body && (req.body.userId || req.body.id));
  const groupIdSource = req.body && (req.body.groupId || req.body.group_id);

  if (!userIdSource || !ObjectId.isValid(userIdSource)) return next(new HttpError(401, 'Incorrect id'));
  if (!groupIdSource || !ObjectId.isValid(groupIdSource)) return next(new HttpError(401, 'Incorrect id'));

  const id = new ObjectId(userIdSource);
  const groupId = new ObjectId(groupIdSource);

  User.findById(id)
    .then(user => {
      if (!user) return next(new HttpError(401, 'User does not exist'));
      return Group.findById(groupId).then(group => {
        if (!group) return next(new HttpError(403, 'Group does not exist'));
        const index = user.groups.findIndex(g => String(g) === String(groupId));
        if (index !== -1) {
          user.groups.splice(index, 1);
          return user.save().then(() => {
            res.json({ groups: user.groups, userId: id, message: 'Delete success' });
            const io = require('../../../bin/www');
            io.emit('ping', { payload: 'users' });
          });
        }
        return next(new HttpError(403, 'Group does not exist in user list'));
      });
    })
    .catch(err => next(err));
};
