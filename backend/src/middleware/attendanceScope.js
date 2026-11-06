const prisma = require("../../prisma/config");
const { getAccess, getTeacherAssignments } = require("../utils/access");

// Attaches req.attendanceScope (decided by PERMISSIONS, not role names):
//   { type: "all" }                                  attendance:READ  (centre admin, super admin)
//   { type: "assigned", classIds, studentIds }       attendance:READ_ASSIGNED (teacher)
//        teacher -> their subjects -> those classes -> enrolled students
//   { type: "own", studentId }                       attendance:READ_OWN (student)
exports.resolveAttendanceScope = async (req, res, next) => {
    try {
        const access = getAccess(req.user);

        if (access.has("attendance:READ")) {
            req.attendanceScope = { type: "all" };
            return next();
        }

        if (access.has("attendance:READ_ASSIGNED")) {
            const { classIds } = await getTeacherAssignments(req.user.id);
            const enrolled = classIds.length
                ? await prisma.enrollment.findMany({
                      where: { classId: { in: classIds } },
                      select: { studentId: true },
                  })
                : [];
            req.attendanceScope = {
                type: "assigned",
                classIds,
                studentIds: enrolled.map((e) => e.studentId),
            };
            return next();
        }

        if (access.has("attendance:READ_OWN")) {
            req.attendanceScope = { type: "own", studentId: req.user.id };
            return next();
        }

        return res.status(403).json({ success: false, message: "Access denied" });
    } catch (error) {
        console.error("Error resolving attendance scope:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};