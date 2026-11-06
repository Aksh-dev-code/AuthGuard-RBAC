const prisma = require("../../prisma/config");
const { getAccess, toInt } = require("../utils/access");
const { todayISO, isISODate, toDate } = require("../utils/dates");

const STATUSES = ["PRESENT", "LATE", "ABSENT"];
const fail = (res, code, message) => res.status(code).json({ success: false, message });

const classAllowed = (scope, classId) =>
    scope.type === "all" || (scope.type === "assigned" && scope.classIds.includes(classId));

const shape = (r) => ({
    id: r.id,
    studentId: r.studentId,
    date: r.date,
    status: r.status,
    classId: r.classId,
    markedBy: r.markedBy ? { id: r.markedBy.id, name: r.markedBy.name } : null,
    markedAt: r.updatedAt,
});

// Validates ?date / body.date. Returns an ISO string or sends the error.
function readDate(res, value, { allowFuture = false } = {}) {
    const iso = value || todayISO();
    if (!isISODate(iso)) {
        fail(res, 400, "date must be YYYY-MM-DD");
        return null;
    }
    if (!allowFuture && iso > todayISO()) {
        fail(res, 400, "Attendance cannot be marked for a future date");
        return null;
    }
    return iso;
}

// GET /attendance/roster?classId=&date=   -> class roster with that day's attendance
exports.getRoster = async (req, res) => {
    try {
        const scope = req.attendanceScope;
        const classId = toInt(req.query.classId);
        if (!classId) return fail(res, 400, "classId is required");
        if (scope.type === "own") return fail(res, 403, "Students cannot view class rosters");
        if (!classAllowed(scope, classId)) return fail(res, 403, "This is not one of your classes");

        const iso = readDate(res, req.query.date, { allowFuture: true });
        if (!iso) return;

        const klass = await prisma.class.findUnique({ where: { id: classId } });
        if (!klass) return fail(res, 404, "Class not found");

        const enrollments = await prisma.enrollment.findMany({
            where: { classId },
            include: { student: { select: { id: true, name: true, email: true } } },
            orderBy: { student: { name: "asc" } },
        });
        const studentIds = enrollments.map((e) => e.studentId);

        const records = studentIds.length
            ? await prisma.attendance.findMany({
                  where: { date: toDate(iso), studentId: { in: studentIds } },
                  include: { markedBy: { select: { id: true, name: true } } },
              })
            : [];
        const byStudent = new Map(records.map((r) => [r.studentId, r]));

        const students = enrollments.map((e) => ({
            id: e.student.id,
            name: e.student.name,
            email: e.student.email,
            record: byStudent.has(e.studentId) ? shape(byStudent.get(e.studentId)) : null,
        }));

        const count = (s) => students.filter((x) => x.record?.status === s).length;
        const summary = {
            total: students.length,
            present: count("PRESENT"),
            late: count("LATE"),
            absent: count("ABSENT"),
        };
        summary.unmarked = summary.total - summary.present - summary.late - summary.absent;

        return res.json({
            success: true,
            class: { id: klass.id, name: klass.name },
            date: iso,
            today: todayISO(),
            canMark: getAccess(req.user).has("attendance:CREATE"),
            summary,
            students,
        });
    } catch (error) {
        console.error("getRoster:", error);
        return fail(res, 500, "Server error");
    }
};

// Shared guard for every write: the student must be enrolled, and in a class the caller may mark.
async function resolveWritableStudent(req, res, studentId) {
    const scope = req.attendanceScope;
    if (scope.type === "own") {
        fail(res, 403, "Students cannot mark attendance");
        return null;
    }
    const enrollment = await prisma.enrollment.findUnique({ where: { studentId } });
    if (!enrollment) {
        fail(res, 400, "This student is not enrolled in any class");
        return null;
    }
    if (!classAllowed(scope, enrollment.classId)) {
        fail(res, 403, "This student is not in one of your classes");
        return null;
    }
    return enrollment;
}

// POST /attendance  { studentId, date?, status }   (one tap; idempotent per student+day)
exports.markAttendance = async (req, res) => {
    try {
        const studentId = toInt(req.body.studentId);
        const { status } = req.body;
        if (!studentId) return fail(res, 400, "studentId is required");
        if (!STATUSES.includes(status)) return fail(res, 400, "status must be PRESENT, LATE or ABSENT");

        const iso = readDate(res, req.body.date);
        if (!iso) return;

        const enrollment = await resolveWritableStudent(req, res, studentId);
        if (!enrollment) return;

        const args = {
            where: { studentId_date: { studentId, date: toDate(iso) } },
            update: { status, markedById: req.user.id, classId: enrollment.classId },
            create: {
                studentId,
                date: toDate(iso),
                status,
                markedById: req.user.id,
                classId: enrollment.classId,
            },
            include: { markedBy: { select: { id: true, name: true } } },
        };

        let record;
        try {
            record = await prisma.attendance.upsert(args);
        } catch (e) {
            // two taps racing to create the same row: the unique key kept it to one, so just update
            if (e.code !== "P2002") throw e;
            record = await prisma.attendance.upsert(args);
        }
        return res.status(201).json({ success: true, record: shape(record) });
    } catch (error) {
        console.error("markAttendance:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /attendance?studentId=&date=   (tap the active status again = clear)
exports.clearAttendance = async (req, res) => {
    try {
        const studentId = toInt(req.query.studentId);
        if (!studentId) return fail(res, 400, "studentId is required");
        const iso = readDate(res, req.query.date);
        if (!iso) return;

        if (!(await resolveWritableStudent(req, res, studentId))) return;

        const { count } = await prisma.attendance.deleteMany({
            where: { studentId, date: toDate(iso) },
        });
        return res.json({ success: true, removed: count });
    } catch (error) {
        console.error("clearAttendance:", error);
        return fail(res, 500, "Server error");
    }
};

// POST /attendance/bulk  { classId, date?, status? = PRESENT }
// Fills ONLY unmarked students, so exceptions already marked Late/Absent are never overwritten.
exports.bulkMark = async (req, res) => {
    try {
        const scope = req.attendanceScope;
        const classId = toInt(req.body.classId);
        const status = req.body.status || "PRESENT";
        if (!classId) return fail(res, 400, "classId is required");
        if (!STATUSES.includes(status)) return fail(res, 400, "Invalid status");
        if (!classAllowed(scope, classId)) return fail(res, 403, "This is not one of your classes");

        const iso = readDate(res, req.body.date);
        if (!iso) return;

        const enrolled = await prisma.enrollment.findMany({ where: { classId }, select: { studentId: true } });
        const ids = enrolled.map((e) => e.studentId);
        const existing = ids.length
            ? await prisma.attendance.findMany({
                  where: { date: toDate(iso), studentId: { in: ids } },
                  select: { studentId: true },
              })
            : [];
        const done = new Set(existing.map((r) => r.studentId));
        const targets = ids.filter((id) => !done.has(id));

        if (targets.length) {
            await prisma.attendance.createMany({
                data: targets.map((studentId) => ({
                    studentId,
                    date: toDate(iso),
                    status,
                    markedById: req.user.id,
                    classId,
                })),
                skipDuplicates: true, // the unique (studentId, date) key guarantees no duplicates
            });
        }
        return res.status(201).json({ success: true, studentIds: targets });
    } catch (error) {
        console.error("bulkMark:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /attendance/bulk  { classId, date, studentIds }   (undo of "mark all present")
exports.bulkUndo = async (req, res) => {
    try {
        const scope = req.attendanceScope;
        const classId = toInt(req.body.classId);
        const studentIds = Array.isArray(req.body.studentIds) ? req.body.studentIds.map(Number).filter(Number.isInteger) : [];
        if (!classId || !studentIds.length) return fail(res, 400, "classId and studentIds are required");
        if (!classAllowed(scope, classId)) return fail(res, 403, "This is not one of your classes");
        const iso = readDate(res, req.body.date);
        if (!iso) return;

        const { count } = await prisma.attendance.deleteMany({
            where: { date: toDate(iso), classId, studentId: { in: studentIds }, status: "PRESENT" },
        });
        return res.json({ success: true, removed: count });
    } catch (error) {
        console.error("bulkUndo:", error);
        return fail(res, 500, "Server error");
    }
};

// GET /attendance?studentId=&classId=&from=&to=&limit=   (history, auto-scoped)
exports.getAttendance = async (req, res) => {
    try {
        const scope = req.attendanceScope;
        const where = {};
        const studentId = req.query.studentId ? toInt(req.query.studentId) : null;
        const classId = req.query.classId ? toInt(req.query.classId) : null;

        if (scope.type === "own") {
            where.studentId = scope.studentId; // any studentId/classId in the URL is ignored
        } else if (scope.type === "assigned") {
            if (studentId && !scope.studentIds.includes(studentId)) {
                return fail(res, 403, "This student is not in one of your classes");
            }
            if (classId && !scope.classIds.includes(classId)) {
                return fail(res, 403, "This is not one of your classes");
            }
            where.studentId = studentId || { in: scope.studentIds.length ? scope.studentIds : [-1] };
            if (classId) where.classId = classId;
        } else {
            if (studentId) where.studentId = studentId;
            if (classId) where.classId = classId;
        }

        const { from, to } = req.query;
        if ((from && !isISODate(from)) || (to && !isISODate(to))) {
            return fail(res, 400, "from/to must be YYYY-MM-DD");
        }
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = toDate(from);
            if (to) where.date.lte = toDate(to);
        }

        const take = Math.min(toInt(req.query.limit) || 366, 1000);
        const records = await prisma.attendance.findMany({
            where,
            include: {
                student: { select: { id: true, name: true } },
                markedBy: { select: { id: true, name: true } },
                class: { select: { id: true, name: true } },
            },
            orderBy: [{ date: "desc" }, { id: "desc" }],
            take,
        });

        return res.json({
            success: true,
            count: records.length,
            attendance: records.map((r) => ({
                ...shape(r),
                student: r.student,
                class: r.class,
            })),
        });
    } catch (error) {
        console.error("getAttendance:", error);
        return fail(res, 500, "Server error");
    }
};