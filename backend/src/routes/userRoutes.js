const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermission');
const {
    getUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', authMiddleware, checkPermission('users', 'READ'), getUsersController);
router.get('/:id', authMiddleware, checkPermission('users', 'READ'), getUserByIdController);
router.put('/:id', authMiddleware, checkPermission('users', 'UPDATE'), updateUserController);
router.delete('/:id', authMiddleware, checkPermission('users', 'DELETE'), deleteUserController);

module.exports = router;