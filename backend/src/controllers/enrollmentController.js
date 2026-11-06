const prisma = require("../../prisma/config");
const { toInt } = require("../utils/access");

const fail = (res, code, message) => res.status(code).json({ success: false, message });

const isStudent = (userId) =>
    prisma.user.findFirst({ where: { id: userId, roles: { some: { role: { name: "student" } } } } });

// GET /enrollments  -> every student with their class (or null)
exports.listEnrollments = async (req, res) => {
    try {
        const students = await prisma.user.findMany({
            where: { roles: { some: { role: { name: "student" } } } },
            select: {
                id: true,
                name: true,
                email: true,
                enrollment: { select: { class: { select: { id: true, name: true } } } },
            },
            orderBy: { name: "asc" },
        });
        return res.json({
            success: true,
            count: students.length,
            students: students.map((s) => ({
                id: s.id,
                name: s.name,
                email: s.email,
                class: s.enrollment ? s.enrollment.class : null,
            })),
        });
    } catch (error) {
        console.error("listEnrollments:", error);
        return fail(res, 500, "Server error");
    }
};

// POST /enrollments { classId, studentId }   (409 if already in ANOTHER class: use PUT to move)
exports.enroll = async (req, res) => {
    try {
        const classId = toInt(req.body.classId);
        const studentId = toInt(req.body.studentId);
        if (!classId || !studentId) return fail(res, 400, "classId and studentId are required");

        const [klass, student, existing] = await Promise.all([
            prisma.class.findUnique({ where: { id: classId } }),
            isStudent(studentId),
            prisma.enrollment.findUnique({ where: { studentId }, include: { class: true } }),
        ]);
        if (!klass) return fail(res, 404, "Class not found");
        if (!student) return fail(res, 400, "This user does not hold the student role");
        if (existing && existing.classId === classId) return res.json({ success: true, classId });
        if (existing) return fail(res, 409, `Already enrolled in ${existing.class.name}. Move the student instead.`);

        await prisma.enrollment.create({ data: { classId, studentId } });
        return res.status(201).json({ success: true, classId });
    } catch (error) {
        console.error("enroll:", error);
        return fail(res, 500, "Server error");
    }
};

// PUT /enrollments/:studentId { classId }   enrol OR move (one atomic step)
exports.moveStudent = async (req, res) => {
    try {
        const studentId = toInt(req.params.studentId);
        const classId = toInt(req.body.classId);
        if (!studentId || !classId) return fail(res, 400, "studentId and classId are required");

        const [klass, student, existing] = await Promise.all([
            prisma.class.findUnique({ where: { id: classId } }),
            isStudent(studentId),
            prisma.enrollment.findUnique({ where: { studentId } }),
        ]);
        if (!klass) return fail(res, 404, "Class not found");
        if (!student) return fail(res, 400, "This user does not hold the student role");

        if (!existing || existing.classId !== classId) {
            await prisma.$transaction([
                prisma.enrollment.deleteMany({ where: { studentId } }),
                prisma.enrollment.create({ data: { classId, studentId } }),
            ]);
        }
        return res.json({ success: true, classId, previousClassId: existing ? existing.classId : null });
    } catch (error) {
        console.error("moveStudent:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /enrollments/:studentId   (returns previousClassId so the UI can offer Undo)
exports.unenroll = async (req, res) => {
    try {
        const studentId = toInt(req.params.studentId);
        if (!studentId) return fail(res, 400, "Invalid student id");
        const existing = await prisma.enrollment.findUnique({ where: { studentId } });
        await prisma.enrollment.deleteMany({ where: { studentId } });
        return res.json({ success: true, previousClassId: existing ? existing.classId : null });
    } catch (error) {
        console.error("unenroll:", error);
        return fail(res, 500, "Server error");
    }
};