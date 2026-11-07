const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const { resolveAttendanceScope } = require("../middleware/attendanceScope");
const c = require("../controllers/attendanceController");

const router = express.Router();

// Reads: the scope middleware decides what each caller may see (and 403s if they have no attendance permission).
router.get("/", authMiddleware, resolveAttendanceScope, c.getAttendance);
router.get("/roster", authMiddleware, resolveAttendanceScope, c.getRoster);

// Writes need attendance:CREATE, then the class/student must be inside the caller's scope.
const write = [authMiddleware, checkPermission("attendance", "CREATE"), resolveAttendanceScope];
router.post("/bulk", ...write, c.bulkMark);
router.delete("/bulk", ...write, c.bulkUndo);
router.post("/", ...write, c.markAttendance);
router.delete("/", ...write, c.clearAttendance);

module.exports = router;