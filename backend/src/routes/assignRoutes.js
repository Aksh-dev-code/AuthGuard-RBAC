// Assign role to user and permission to role
const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermission');
const {
    assignRoleToUser,
    removeRoleFromUser,
    assignPermissionToRole,
    removePermissionFromRole,
} = require('../controllers/assignController');

const router = express.Router();

// assign / remove role to/from user
router.post('/user-role', authMiddleware, checkPermission('users', 'UPDATE'), assignRoleToUser);
router.delete('/user-role', authMiddleware, checkPermission('users', 'UPDATE'), removeRoleFromUser);

// assign / remove permission to/from role
router.post('/role-permission', authMiddleware, checkPermission('roles', 'UPDATE'), assignPermissionToRole);
router.delete('/role-permission', authMiddleware, checkPermission('roles', 'UPDATE'), removePermissionFromRole);

module.exports = router;
