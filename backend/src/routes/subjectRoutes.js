const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const c = require("../controllers/subjectController");

const router = express.Router();

router.get("/", authMiddleware, c.listSubjects); // scope + 403 are decided inside
router.post("/", authMiddleware, checkPermission("subjects", "CREATE"), c.createSubject);
router.put("/:id", authMiddleware, checkPermission("subjects", "UPDATE"), c.updateSubject);
router.delete("/:id", authMiddleware, checkPermission("subjects", "DELETE"), c.deleteSubject);
router.post("/:id/teachers", authMiddleware, checkPermission("subjects", "UPDATE"), c.assignTeacher);
router.delete("/:id/teachers/:teacherId", authMiddleware, checkPermission("subjects", "UPDATE"), c.unassignTeacher);

module.exports = router;