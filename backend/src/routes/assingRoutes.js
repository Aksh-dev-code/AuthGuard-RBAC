// Assing role 'to user and permission to role
const  express = require('express')
const {authMiddleware} = require('../middleware/authMiddleware')
const {checkPermission} = require('../middleware/checkPermission')

const router = express.Router();
// assisng role to user
router.post('/ro')