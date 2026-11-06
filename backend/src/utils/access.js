const prisma = require("../../prisma/config");

const ADMIN_ROLES = ["super_admin", "admin"];

// req.user is loaded by authMiddleware with roles -> role -> permissions,
// so no extra database query is needed to know what the caller may do.
exports.getAccess = (user) => {
    const roleNames = user.roles.map((ur) => ur.role.name);
    const permissions = new Set();
    for (const ur of user.roles) {
        for (const rp of ur.role.permissions || []) permissions.add(rp.permission.name);
    }
    const isAdmin = roleNames.some((r) => ADMIN_ROLES.includes(r));
    return {
        roleNames,
        isAdmin,
        has: (name) => isAdmin || permissions.has(name),
    };
};

// teacher -> their subjects -> (subjectIds, classIds)
exports.getTeacherAssignments = async (teacherId) => {
    const rows = await prisma.teacherSubject.findMany({
        where: { teacherId },
        select: { subject: { select: { id: true, classId: true } } },
    });
    return {
        subjectIds: rows.map((r) => r.subject.id),
        classIds: [...new Set(rows.map((r) => r.subject.classId))],
    };
};

// the one class a student is enrolled in (or null)
exports.getStudentClassId = async (studentId) => {
    const e = await prisma.enrollment.findUnique({ where: { studentId } });
    return e ? e.classId : null;
};

exports.toInt = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};