const prisma = require("../../prisma/config");

// POST /attendance  { studentId, date, status }
exports.markAttendance = async (req, res) => {
    try {
        const { studentId, date, status } = req.body;
        const scope = req.attendanceScope;

        if (!studentId || !date) {
            return res.status(400).json({ success: false, message: "studentId and date are required" });
        }

        const validStatuses = ["PRESENT", "ABSENT", "LATE"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        if (scope.type === "assigned" && !scope.studentIds.includes(Number(studentId))) {
            return res.status(403).json({ success: false, message: "This student is not assigned to you" });
        }
        if (scope.type === "own") {
            return res.status(403).json({ success: false, message: "Students cannot mark attendance" });
        }

        const student = await prisma.user.findUnique({ where: { id: Number(studentId) } });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const record = await prisma.attendance.upsert({
            where: {
                studentId_date: { studentId: Number(studentId), date: new Date(date) },
            },
            update: { status: status || "PRESENT", markedById: req.user.id },
            create: {
                studentId: Number(studentId),
                date: new Date(date),
                status: status || "PRESENT",
                markedById: req.user.id,
            },
            include: {
                student: { select: { id: true, name: true, email: true } },
                markedBy: { select: { id: true, name: true } },
            },
        });

        return res.status(201).json({ success: true, message: "Attendance recorded", attendance: record });
    } catch (error) {
        console.error("Error marking attendance:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET /attendance?studentId=&from=&to=  (auto-scoped by req.attendanceScope)
exports.getAttendance = async (req, res) => {
    try {
        const scope = req.attendanceScope;
        const { studentId, from, to } = req.query;
        const where = {};

        if (scope.type === "own") {
            where.studentId = scope.studentId;
        } else if (scope.type === "assigned") {
            if (studentId && !scope.studentIds.includes(Number(studentId))) {
                return res.status(403).json({ success: false, message: "This student is not assigned to you" });
            }
            where.studentId = studentId ? Number(studentId) : { in: scope.studentIds.length ? scope.studentIds : [-1] };
        } else if (studentId) {
            where.studentId = Number(studentId);
        }

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, email: true } },
                markedBy: { select: { id: true, name: true } },
            },
            orderBy: { date: "desc" },
        });

        return res.status(200).json({ success: true, count: records.length, attendance: records });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
