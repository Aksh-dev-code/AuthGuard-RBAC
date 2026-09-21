const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermission');
const {
    createPermissionController,
    getPermissionController,
    getPermissionByIdController,
    updatePermissionController,
    deletePermissionController,
} = require('../controllers/permissionController');

const router = express.Router();

router.post('/', authMiddleware, checkPermission('permissions', 'CREATE'), createPermissionController);
router.get('/', authMiddleware, checkPermission('permissions', 'READ'), getPermissionController);
router.get('/:id', authMiddleware, checkPermission('permissions', 'READ'), getPermissionByIdController);
router.put('/:id', authMiddleware, checkPermission('permissions', 'UPDATE'), updatePermissionController);
router.delete('/:id', authMiddleware, checkPermission('permissions', 'DELETE'), deletePermissionController);

module.exports = router;