 const express = require('express');
 const router = express.router();

router.post("/login",loginController)
router.post("/register",registerController)

module.exports = router;