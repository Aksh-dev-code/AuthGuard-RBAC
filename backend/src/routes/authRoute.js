const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware");

const {
    loginController,
    registerController,
    getMe,
    updateMe
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", loginController);

router.post("/register", registerController);

router.get("/me", authMiddleware, getMe); // get logged in user data

router.put("/me", authMiddleware, updateMe); // update logged in user data

module.exports = router;