const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const {
    assignStudentToTeacher,
    removeStudentFromTeacher,
    getTeacherStudents,
    getMyStudents,
} = require("../controllers/teacherAssignmentController");

const router = express.Router();

// Must be declared BEFORE "/:teacherId/students", otherwise Express would treat
// the word "me" as a teacherId.
router.get("/me/students", authMiddleware, checkPermission("students", "READ"), getMyStudents);

router.get("/:teacherId/students", authMiddleware, checkPermission("teachers", "MANAGE"), getTeacherStudents);
router.post("/:teacherId/students", authMiddleware, checkPermission("teachers", "MANAGE"), assignStudentToTeacher);
router.delete("/:teacherId/students/:studentId", authMiddleware, checkPermission("teachers", "MANAGE"), removeStudentFromTeacher);

module.exports = router;