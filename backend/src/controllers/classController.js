const prisma = require("../../prisma/config");
const { getAccess, getTeacherAssignments, getStudentClassId, toInt } = require("../utils/access");
const { todayISO, isISODate, toDate } = require("../utils/dates");

const fail = (res, code, message) => res.status(code).json({ success: false, message });

// What may this caller see?  all | assigned (teacher) | own (student)
async function classScope(req) {
    const a = getAccess(req.user);
    if (a.has("classes:READ")) return { type: "all" };
    if (a.has("classes:READ_ASSIGNED")) {
        const { classIds } = await getTeacherAssignments(req.user.id);
        return { type: "assigned", classIds };
    }
    if (a.has("classes:READ_OWN")) {
        const classId = await getStudentClassId(req.user.id);
        return { type: "own", classIds: classId ? [classId] : [] };
    }
    return null;
}

const allowed = (scope, id) => scope.type === "all" || scope.classIds.includes(id);

// GET /classes?date=   cards: student count + that day's attendance (staff only)
exports.listClasses = async (req, res) => {
    try {
        const scope = await classScope(req);
        if (!scope) return fail(res, 403, "Access denied");

        const iso = req.query.date && isISODate(req.query.date) ? req.query.date : todayISO();
        const classes = await prisma.class.findMany({
            where: scope.type === "all" ? {} : { id: { in: scope.classIds.length ? scope.classIds : [-1] } },
            include: { _count: { select: { enrollments: true, subjects: true } } },
            orderBy: { name: "asc" },
        });

        let stats = new Map();
        if (scope.type !== "own" && classes.length) {
            // count through the CURRENT enrollment so the card always agrees with the roster
            const rows = await prisma.attendance.findMany({
                where: { date: toDate(iso), student: { enrollment: { classId: { in: classes.map((c) => c.id) } } } },
                select: { status: true, student: { select: { enrollment: { select: { classId: true } } } } },
            });
            for (const r of rows) {
                const cid = r.student.enrollment.classId;
                const s = stats.get(cid) || { present: 0, late: 0, absent: 0 };
                s[r.status.toLowerCase()] += 1;
                stats.set(cid, s);
            }
        }

        return res.json({
            success: true,
            date: iso,
            classes: classes.map((c) => {
                const out = { id: c.id, name: c.name, studentCount: c._count.enrollments, subjectCount: c._count.subjects };
                if (scope.type !== "own") {
                    const s = stats.get(c.id) || { present: 0, late: 0, absent: 0 };
                    const marked = s.present + s.late + s.absent;
                    out.today = {
                        ...s,
                        marked,
                        unmarked: c._count.enrollments - marked,
                        percent: c._count.enrollments ? Math.round(((s.present + s.late) / c._count.enrollments) * 100) : null,
                    };
                }
                return out;
            }),
        });
    } catch (error) {
        console.error("listClasses:", error);
        return fail(res, 500, "Server error");
    }
};

// GET /classes/:id
exports.getClass = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        const scope = await classScope(req);
        if (!id) return fail(res, 400, "Invalid class id");
        if (!scope || !allowed(scope, id)) return fail(res, 403, "You don't have access to this class");

        const klass = await prisma.class.findUnique({
            where: { id },
            include: { _count: { select: { enrollments: true, subjects: true } } },
        });
        if (!klass) return fail(res, 404, "Class not found");

        return res.json({
            success: true,
            class: { id: klass.id, name: klass.name, studentCount: klass._count.enrollments, subjectCount: klass._count.subjects },
        });
    } catch (error) {
        console.error("getClass:", error);
        return fail(res, 500, "Server error");
    }
};

// GET /classes/:id/students   (staff only: admin, or the teacher of that class)
exports.getClassStudents = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        const scope = await classScope(req);
        if (!id) return fail(res, 400, "Invalid class id");
        if (!scope || scope.type === "own") return fail(res, 403, "Access denied");
        if (!allowed(scope, id)) return fail(res, 403, "This is not one of your classes");

        const rows = await prisma.enrollment.findMany({
            where: { classId: id },
            include: { student: { select: { id: true, name: true, email: true } } },
            orderBy: { student: { name: "asc" } },
        });
        return res.json({ success: true, count: rows.length, students: rows.map((r) => r.student) });
    } catch (error) {
        console.error("getClassStudents:", error);
        return fail(res, 500, "Server error");
    }
};

const cleanName = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

// POST /classes { name }
exports.createClass = async (req, res) => {
    try {
        const name = cleanName(req.body.name);
        if (name.length < 2 || name.length > 60) return fail(res, 400, "Class name must be 2-60 characters");
        const klass = await prisma.class.create({ data: { name } });
        return res.status(201).json({ success: true, class: klass });
    } catch (error) {
        if (error.code === "P2002") return fail(res, 409, "A class with this name already exists");
        console.error("createClass:", error);
        return fail(res, 500, "Server error");
    }
};

// PUT /classes/:id { name }
exports.updateClass = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        const name = cleanName(req.body.name);
        if (!id) return fail(res, 400, "Invalid class id");
        if (name.length < 2 || name.length > 60) return fail(res, 400, "Class name must be 2-60 characters");
        const klass = await prisma.class.update({ where: { id }, data: { name } });
        return res.json({ success: true, class: klass });
    } catch (error) {
        if (error.code === "P2025") return fail(res, 404, "Class not found");
        if (error.code === "P2002") return fail(res, 409, "A class with this name already exists");
        console.error("updateClass:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /classes/:id   (removes its subjects + questions + enrollments; attendance history is kept)
exports.deleteClass = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        if (!id) return fail(res, 400, "Invalid class id");
        await prisma.class.delete({ where: { id } });
        return res.json({ success: true, message: "Class deleted" });
    } catch (error) {
        if (error.code === "P2025") return fail(res, 404, "Class not found");
        console.error("deleteClass:", error);
        return fail(res, 500, "Server error");
    }
};