const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const { resolveAttendanceScope } = require("../middleware/attendanceScope");
const { markAttendance, getAttendance } = require("../controllers/attendanceController");

const router = express.Router();

// Any of these three permissions is enough to view (scope narrows what's actually returned)
router.get("/", authMiddleware, resolveAttendanceScope, getAttendance);

router.post("/", authMiddleware, checkPermission("attendance", "CREATE"), resolveAttendanceScope, markAttendance);

module.exports = router;