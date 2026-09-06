 const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMe } = require('../controllers/authController');
 const router = express.router();

router.post("/login",loginController)
router.post("/register",registerController)
router.get("/me",authMiddleware,getMe) // get logged in user data
router.post("/me",)  // update logged in user data

module.exports = router;