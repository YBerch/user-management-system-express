const mongoose = require('mongoose');
const config = require('../config');

// Connect with the URI only; modern mongoose handles parser/topology options internally.
mongoose.connect(config.get('mongoose:uri'));

module.exports = mongoose;
