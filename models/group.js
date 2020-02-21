const mongoose = require('../lib/mongoose'), Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now()
  }

});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;