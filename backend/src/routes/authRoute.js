const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware");

const {
    loginController,
    registerController,
    getMe
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", loginController);

router.post("/register", registerController);

router.get("/me", authMiddleware, getMe); // get logged in user data

module.exports = router;