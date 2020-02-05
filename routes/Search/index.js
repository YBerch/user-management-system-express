const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/checkAuth');
const checkModerator = require('../../middleware/checkModerator');
const methods = require('./Methods');

router.get('/', checkAuth, checkModerator, methods.search);

module.exports = router;