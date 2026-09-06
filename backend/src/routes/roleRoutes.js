const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');
const { roleCreateController } = require('../controllers/roleControllers');

const router = express.Router();

// crete roles
router.post('/',authMiddleware,checkPermission('roles','CREATE'),roleCreateController),

router.post('/',authMiddleware,checkPermission('roles','READ'),,rolegetController),

router.post('/',authMiddleware,checkPermission('roles','DELETE'),,updateCreateController)

module.exports = router;
