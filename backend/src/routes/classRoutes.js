const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission, checkAnyPermission } = require("../middleware/checkPermission");
const c = require("../controllers/classController");

const router = express.Router();
const read = checkAnyPermission("classes:READ", "classes:READ_ASSIGNED", "classes:READ_OWN");

router.get("/", authMiddleware, read, c.listClasses);
router.get("/:id", authMiddleware, read, c.getClass);
router.get("/:id/students", authMiddleware, read, c.getClassStudents);
router.post("/", authMiddleware, checkPermission("classes", "CREATE"), c.createClass);
router.put("/:id", authMiddleware, checkPermission("classes", "UPDATE"), c.updateClass);
router.delete("/:id", authMiddleware, checkPermission("classes", "DELETE"), c.deleteClass);

module.exports = router;