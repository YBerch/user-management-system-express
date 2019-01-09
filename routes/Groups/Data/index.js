const Group = require('models/group');
const HttpError = require('error').HttpError;
const ObjectID = require('mongodb').ObjectID;

/** get groups list (GET) **/
exports.getGroupsList = (req, res, next) => {
  const { page, size } = req.query;

  const records = Group.find({})
    .skip(page * size - size)
    .limit(+size);

  records
    .then(groups => {
      if(!groups) {
        throw new HttpError(404, 'Database is empty')
      }
      records.estimatedDocumentCount()
        .then(totalSize => {
          res.json({totalSize, list: groups})
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
      res.json({group, message: 'Create group success'})
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
  Group.deleteOne({_id: id})
    .then((result) => {
      if(result.n){
        res.json({message: 'Delete success'})
      } else {
        next(new HttpError(404, 'Group not found'))
      }
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
          res.json({message: 'Group update success'})
        } else {
          next(new HttpError(400, 'Not modified'));
        }
      } else {
        next(new HttpError(404, 'Group not found'));
      }
    })
    .catch(err => next(err))
};