const express = require('express')
const{authMiddleware} = require('../middleware/authMiddleware')
const{checkPermission} = require('../middleware/checkPermission')

const router = express.Router();

// create permission
router.post('/',authMiddleware,checkPermission('permissions','CREATE'),createPermissionController)
// get permission
router.get('/',authMiddleware,checkPermission('permissions','READ'),getPermissionController)

module.exports = router;