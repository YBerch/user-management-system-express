const mongoose = require('mongoose');
const config = require('../config');

mongoose.connect(config.get('mongoose:uri'), config.get('mongoose:enableFeatures'));

module.exports = mongoose;
