const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");

const {
    roleCreateController,
    roleGetController,
    roleGetByIdController,
    updateRoleController,
    roleDeleteController,
} = require("../controllers/roleControllers");

const router = express.Router();

// Create role
router.post("/", authMiddleware, checkPermission("roles", "CREATE"), roleCreateController);

// Get all roles
router.get("/", authMiddleware, checkPermission("roles", "READ"), roleGetController);

// Get role by id
router.get("/:id", authMiddleware, checkPermission("roles", "READ"), roleGetByIdController);

// Update role
router.put("/:id", authMiddleware, checkPermission("roles", "UPDATE"), updateRoleController);

// Delete role
router.delete("/:id", authMiddleware, checkPermission("roles", "DELETE"), roleDeleteController);

module.exports = router;