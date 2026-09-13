// Assing role 'to user and permission to role
const  express = require('express')
const {authMiddleware} = require('../middleware/authMiddleware')
const {checkPermission} = require('../middleware/checkPermission')

const router = express.Router();
// assisng role to user
router.post('/role-to-user', authMiddleware,checkPermission('roles','ASSING'),assinRoleToUserController)

router.post('/permission-to-user', authMiddleware,checkPermission('permissions','ASSING'),assinPermissionToUserController)

module.exports = router;
