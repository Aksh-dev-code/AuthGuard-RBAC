const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const c = require("../controllers/enrollmentController");

const router = express.Router();

router.get("/", authMiddleware, checkPermission("enrollment", "READ"), c.listEnrollments);
router.post("/", authMiddleware, checkPermission("enrollment", "CREATE"), c.enroll);
router.put("/:studentId", authMiddleware, checkPermission("enrollment", "UPDATE"), c.moveStudent);
router.delete("/:studentId", authMiddleware, checkPermission("enrollment", "DELETE"), c.unenroll);

module.exports = router;