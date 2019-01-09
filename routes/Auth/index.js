const express = require('express');
const router = express.Router();
const methods = require('./Methods');

router.post('/sign-up', methods.signUp);
router.post('/sign-in', methods.signIn);
router.post('/sign-out', methods.signOut);

module.exports = router;