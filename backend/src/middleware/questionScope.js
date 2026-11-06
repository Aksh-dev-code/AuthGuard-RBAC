const prisma = require("../../prisma/config");
const { getAccess, getTeacherAssignments, getStudentClassId } = require("../utils/access");

// Attaches req.questionScope:
//   { type: "all" }                              questions:READ (centre admin, super admin)
//   { type: "assigned", subjectIds, classIds }   questions:READ_ASSIGNED (teacher)
//   { type: "own", classId, subjectIds }         questions:READ_OWN_CLASS (student: own class only)
// Write access is derived from the same scope: only "all" and "assigned"
// scopes can write, and "assigned" only inside their own subjects.
exports.resolveQuestionScope = async (req, res, next) => {
    try {
        const access = getAccess(req.user);

        if (access.has("questions:READ")) {
            req.questionScope = { type: "all" };
            return next();
        }

        if (access.has("questions:READ_ASSIGNED")) {
            const { subjectIds, classIds } = await getTeacherAssignments(req.user.id);
            req.questionScope = { type: "assigned", subjectIds, classIds };
            return next();
        }

        if (access.has("questions:READ_OWN_CLASS")) {
            const classId = await getStudentClassId(req.user.id);
            const subjects = classId
                ? await prisma.subject.findMany({ where: { classId }, select: { id: true } })
                : [];
            req.questionScope = { type: "own", classId, subjectIds: subjects.map((s) => s.id) };
            return next();
        }

        return res.status(403).json({ success: false, message: "Access denied" });
    } catch (error) {
        console.error("Error resolving question scope:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};