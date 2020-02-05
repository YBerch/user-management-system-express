const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/checkAuth');
const checkAdministrator = require('../../middleware/checkAdministrator');
const checkModerator = require('../../middleware/checkModerator');
const methods = require('./Methods');

router.get('/', checkAuth, checkModerator, methods.getUsersList);
router.get('/:id', checkAuth, checkModerator, methods.getUser);
router.post('/create', checkAuth, checkModerator, methods.createUser);
router.patch('/:id', checkAuth, checkAdministrator, methods.updateUser);
router.delete('/:id', checkAuth, checkAdministrator, methods.deleteUser);
router.put('/group/:id', checkAuth, checkModerator, methods.addGroupToUser);
router.delete('/group/:id', checkAuth, checkModerator, methods.deleteGroupFromUser);

module.exports = router;