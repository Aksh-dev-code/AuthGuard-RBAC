const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const {
    assignStudentToTeacher,
    removeStudentFromTeacher,
    getTeacherStudents,
} = require("../controllers/teacherAssignmentController");

const router = express.Router();

router.get("/:teacherId/students", authMiddleware, checkPermission("teachers", "MANAGE"), getTeacherStudents);
router.post("/:teacherId/students", authMiddleware, checkPermission("teachers", "MANAGE"), assignStudentToTeacher);
router.delete("/:teacherId/students/:studentId", authMiddleware, checkPermission("teachers", "MANAGE"), removeStudentFromTeacher);

module.exports = router;