const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/checkAuth');
const checkAdministrator = require('../../middleware/checkAdministrator');
const checkModerator = require('../../middleware/checkModerator');
const methods = require('./Methods');

router.get('/', checkAuth, checkModerator, methods.getGroupsList);
router.get('/:id', checkAuth, checkModerator, methods.getGroup);
router.post('/create', checkAuth, checkModerator, methods.createGroup);
router.delete('/:id', checkAuth, checkAdministrator,  methods.deleteGroup);
router.patch('/:id', checkAuth, checkAdministrator, methods.updateGroup);

module.exports = router;