const User = require('../../../models/user');
const Group = require('../../../models/group');
const HttpError = require('../../../error').HttpError;

/** get users list (GET) **/
exports.search = (req, res, next) => {
  if(!req.query.general){
    res.json(null);
    return;
  }

  const query = new RegExp(`^${req.query.general}`, 'i');

  const records = {};

  User.find({ $or: [
      { 'firstName': query },
      { 'lastName': query },
      { 'email': query },
      { 'phone': query }
    ]
  })
    .then(users => {
      records.users = users;
    })
    .then(() => {
      Group.find({ $or: [
          { 'name': query },
        ]
      })
        .then(groups => {
          records.groups = groups;
          res.json(records)
        })
    })
    .catch(err => next(err))
};