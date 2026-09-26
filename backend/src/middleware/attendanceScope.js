const prisma = require("../../prisma/config");

// Attaches req.attendanceScope describing what this caller may see/touch:
//   { type: "all" }                              -> super_admin, principal
//   { type: "assigned", studentIds: [...] }       -> teacher
//   { type: "own", studentId }                    -> student
exports.resolveAttendanceScope = async (req, res, next) => {
    try {
        const roles = req.user.roles.map((ur) => ur.role.name);

        if (roles.includes("super_admin") || roles.includes("principal")) {
            req.attendanceScope = { type: "all" };
            return next();
        }

        if (roles.includes("teacher")) {
            const assignments = await prisma.teacherStudent.findMany({
                where: { teacherId: req.user.id },
                select: { studentId: true },
            });
            req.attendanceScope = {
                type: "assigned",
                studentIds: assignments.map((a) => a.studentId),
            };
            return next();
        }

        req.attendanceScope = { type: "own", studentId: req.user.id };
        return next();
    } catch (error) {
        console.error("Error resolving attendance scope:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};