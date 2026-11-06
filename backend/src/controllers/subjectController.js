const prisma = require("../../prisma/config");
const { getAccess, getTeacherAssignments, getStudentClassId, toInt } = require("../utils/access");

const fail = (res, code, message) => res.status(code).json({ success: false, message });
const cleanName = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

const INCLUDE = {
    class: { select: { id: true, name: true } },
    teachers: { include: { teacher: { select: { id: true, name: true } } } },
    _count: { select: { questions: true } },
};
const shape = (s) => ({
    id: s.id,
    name: s.name,
    classId: s.classId,
    class: s.class,
    questionCount: s._count.questions,
    teachers: s.teachers.map((t) => t.teacher),
});

// GET /subjects?classId=   scoped: all | teacher's own subjects | student's own class
exports.listSubjects = async (req, res) => {
    try {
        const a = getAccess(req.user);
        const classId = req.query.classId ? toInt(req.query.classId) : null;
        const where = {};

        if (a.has("subjects:READ")) {
            if (classId) where.classId = classId;
        } else if (a.has("subjects:READ_ASSIGNED")) {
            const { subjectIds } = await getTeacherAssignments(req.user.id);
            where.id = { in: subjectIds.length ? subjectIds : [-1] };
            if (classId) where.classId = classId;
        } else if (a.has("subjects:READ_OWN")) {
            const own = await getStudentClassId(req.user.id);
            if (classId && classId !== own) return fail(res, 403, "You can only view your own class");
            where.classId = own || -1;
        } else {
            return fail(res, 403, "Access denied");
        }

        const subjects = await prisma.subject.findMany({
            where,
            include: INCLUDE,
            orderBy: [{ classId: "asc" }, { name: "asc" }],
        });
        return res.json({ success: true, count: subjects.length, subjects: subjects.map(shape) });
    } catch (error) {
        console.error("listSubjects:", error);
        return fail(res, 500, "Server error");
    }
};

// POST /subjects { classId, name }
exports.createSubject = async (req, res) => {
    try {
        const classId = toInt(req.body.classId);
        const name = cleanName(req.body.name);
        if (!classId) return fail(res, 400, "classId is required");
        if (name.length < 2 || name.length > 60) return fail(res, 400, "Subject name must be 2-60 characters");
        if (!(await prisma.class.findUnique({ where: { id: classId } }))) return fail(res, 404, "Class not found");

        const subject = await prisma.subject.create({ data: { classId, name }, include: INCLUDE });
        return res.status(201).json({ success: true, subject: shape(subject) });
    } catch (error) {
        if (error.code === "P2002") return fail(res, 409, "This class already has a subject with that name");
        console.error("createSubject:", error);
        return fail(res, 500, "Server error");
    }
};

// PUT /subjects/:id { name }
exports.updateSubject = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        const name = cleanName(req.body.name);
        if (!id) return fail(res, 400, "Invalid subject id");
        if (name.length < 2 || name.length > 60) return fail(res, 400, "Subject name must be 2-60 characters");
        const subject = await prisma.subject.update({ where: { id }, data: { name }, include: INCLUDE });
        return res.json({ success: true, subject: shape(subject) });
    } catch (error) {
        if (error.code === "P2025") return fail(res, 404, "Subject not found");
        if (error.code === "P2002") return fail(res, 409, "This class already has a subject with that name");
        console.error("updateSubject:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /subjects/:id   (its questions go with it)
exports.deleteSubject = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        if (!id) return fail(res, 400, "Invalid subject id");
        await prisma.subject.delete({ where: { id } });
        return res.json({ success: true, message: "Subject deleted" });
    } catch (error) {
        if (error.code === "P2025") return fail(res, 404, "Subject not found");
        console.error("deleteSubject:", error);
        return fail(res, 500, "Server error");
    }
};

// POST /subjects/:id/teachers { teacherId }
exports.assignTeacher = async (req, res) => {
    try {
        const subjectId = toInt(req.params.id);
        const teacherId = toInt(req.body.teacherId);
        if (!subjectId || !teacherId) return fail(res, 400, "subject id and teacherId are required");

        const [subject, teacher] = await Promise.all([
            prisma.subject.findUnique({ where: { id: subjectId } }),
            prisma.user.findFirst({ where: { id: teacherId, roles: { some: { role: { name: "teacher" } } } } }),
        ]);
        if (!subject) return fail(res, 404, "Subject not found");
        if (!teacher) return fail(res, 400, "This user does not hold the teacher role");

        await prisma.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId, subjectId } },
            update: {},
            create: { teacherId, subjectId },
        });
        return res.status(201).json({ success: true, teacher: { id: teacher.id, name: teacher.name } });
    } catch (error) {
        console.error("assignTeacher:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /subjects/:id/teachers/:teacherId
exports.unassignTeacher = async (req, res) => {
    try {
        const subjectId = toInt(req.params.id);
        const teacherId = toInt(req.params.teacherId);
        if (!subjectId || !teacherId) return fail(res, 400, "Invalid ids");
        await prisma.teacherSubject.deleteMany({ where: { subjectId, teacherId } });
        return res.json({ success: true });
    } catch (error) {
        console.error("unassignTeacher:", error);
        return fail(res, 500, "Server error");
    }
};