const Group = require('../../../models/group');
const User = require('../../../models/user');
const HttpError = require('../../../error').HttpError;
const ObjectID = require('mongodb').ObjectID;

/** get groups list (GET) **/
exports.getGroupsList = (req, res, next) => {
  const { page, size, groups } = req.query;

  const groupsArr = groups && groups !== 'undefined' && JSON.parse(groups);

  if(groupsArr) {
    if (Array.isArray(groupsArr)) {
      try {
        for(let i=0; i<groupsArr.length; i++){
          new ObjectID(groupsArr[i])
        }
      } catch (e) {
        return next(new HttpError(401, 'Incorrect group id'))
      }
    } else {
      return next(new HttpError(401, 'Incorrect groups param format'))
    }
  }

  const records = Group.find(groupsArr ? {"_id": {"$in": groupsArr}} : {})
    .skip(page * size - size)
    .limit(+size);

  records
    .then(groups => {
      if(!groups) {
        throw new HttpError(404, 'Database is empty')
      }
      records.estimatedDocumentCount()
        .then(totalSize => {
          const listName = page || 'list';
          if(groupsArr){
            res.json(groups)
          } else {
            res.json({totalSize, [listName]: groups})
          }
        })
    })
    .catch(err => next(err))
};

/** get group by id (GET) **/
exports.getGroup = (req, res, next) => {
  let id = null;
  try {
    id = new ObjectID(req.params.id)
  } catch(e){
    return next(new HttpError(401, 'Incorrect group id'))
  }

  Group.findById(id)
    .then(group => {
      if(!group){
        next(new HttpError(404, 'Group not found'))
      } else {
        res.json(group)
      }
    })
    .catch(err => next(err))
};

/** create group (POST) **/
exports.createGroup = (req, res, next) => {
  const {name} = req.body;

  /** to form required parameters array for error message **/
  let requiredParams = [];
  for(const key in req.body){
    if(req.body.hasOwnProperty(key)) {
      if (!req.body[key]){
        requiredParams.push(key)
      }
    }
  }

  /** throw error if required parameters array is not empty **/
  if(requiredParams.length) {
    const responseMessage = `${requiredParams.length > 1 ?
      'Fields:' : 'Field:'} '${requiredParams.join(`', '`)}' - required`;
    throw new HttpError(402, responseMessage);
  }

  Group.findOne({name})
    .then(group => {
      if(group){
        throw new HttpError(400, 'Group with this name already exist')
      } else {
        return new Group({name}).save()
      }
    })
    .then(group => {
      res.json({group, message: 'Create group success'});
      const socket = require('../../../bin/www');

      /** emit message for all users for update users data **/
      socket.emit('ping', { payload: 'groups' })
    })
    .catch(err => {
      next(err)
    })
};

/** delete group (DELETE) **/
exports.deleteGroup = (req, res, next) => {
  let id = null;
  try {
    id = ObjectID(req.params.id);
  } catch(e) {
    return next(new HttpError(401, 'Incorrect group id'))
  }
  Group.findById({_id: id})
    .then(group => {
      User.find({groups: {$all: [id]}})
        .then(users => {
          if(users.length) {
            return next(new HttpError(402, 'Cannot delete group with existing users'));
          } else {
            Group.deleteOne({_id: group._id})
              .then((result) => {
                if(result.n){
                  res.json({message: 'Delete success'});

                  const socket = require('../../../bin/www');

                  /** emit message for all users for update users data **/
                  socket.emit('ping', { payload: 'groups' })
                } else {
                  next(new HttpError(404, 'Group not found'))
                }
              })
          }
        })
    })
    .catch(err => next(err))
};

/** update group (PATCH) **/
exports.updateGroup = (req, res, next) => {
  const {name} = req.body;
  let id = null;
  try {
    id = ObjectID(req.params.id);
  } catch(e) {
    return next(new HttpError(401, 'Incorrect group id'))
  }
  Group.updateOne({_id: id}, {name})
    .then(result => {
      if(result.n){
        if(result.nModified){
          res.json({message: 'Group update success'});

          const socket = require('../../../bin/www');

          /** emit message for all users for update users data **/
          socket.emit('ping', { payload: 'groups' })
        } else {
          next(new HttpError(400, 'Not modified'));
        }
      } else {
        next(new HttpError(404, 'Group not found'));
      }
    })
    .catch(err => next(err))
};