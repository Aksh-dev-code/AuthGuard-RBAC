const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");

const {
    roleCreateController,
    roleGetController,
    roleDeleteController
} = require("../controllers/roleControllers");

const router = express.Router();

// Create role
router.post(
    "/",
    authMiddleware,
    checkPermission("roles", "CREATE"),
    roleCreateController
);

// Get roles
router.get(
    "/",
    authMiddleware,
    checkPermission("roles", "READ"),
    roleGetController
);

// Delete role
router.delete(
    "/:id",
    authMiddleware,
    checkPermission("roles", "DELETE"),
    roleDeleteController
);

module.exports = router;