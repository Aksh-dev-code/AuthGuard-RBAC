const prisma = require("../../prisma/config");

// POST /teachers/:teacherId/students  { studentId }
exports.assignStudentToTeacher = async (req, res) => {
    try {
        const teacherId = Number(req.params.teacherId);
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: "studentId is required" });
        }

        const [teacher, student] = await Promise.all([
            prisma.user.findUnique({
                where: { id: teacherId },
                include: { roles: { include: { role: true } } },
            }),
            prisma.user.findUnique({ where: { id: Number(studentId) } }),
        ]);

        if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        const isTeacher = teacher.roles.some((ur) => ur.role.name === "teacher");
        if (!isTeacher) {
            return res.status(400).json({ success: false, message: "This user does not hold the teacher role" });
        }

        const assignment = await prisma.teacherStudent.upsert({
            where: { teacherId_studentId: { teacherId, studentId: Number(studentId) } },
            update: {},
            create: { teacherId, studentId: Number(studentId) },
            include: { student: { select: { id: true, name: true, email: true } } },
        });

        return res.status(201).json({ success: true, message: "Student assigned to teacher", assignment });
    } catch (error) {
        console.error("Error assigning student to teacher:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// DELETE /teachers/:teacherId/students/:studentId
exports.removeStudentFromTeacher = async (req, res) => {
    try {
        const teacherId = Number(req.params.teacherId);
        const studentId = Number(req.params.studentId);

        const existing = await prisma.teacherStudent.findUnique({
            where: { teacherId_studentId: { teacherId, studentId } },
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        await prisma.teacherStudent.delete({ where: { teacherId_studentId: { teacherId, studentId } } });
        return res.status(200).json({ success: true, message: "Student removed from teacher" });
    } catch (error) {
        console.error("Error removing assignment:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET /teachers/:teacherId/students
exports.getTeacherStudents = async (req, res) => {
    try {
        const teacherId = Number(req.params.teacherId);
        const assignments = await prisma.teacherStudent.findMany({
            where: { teacherId },
            include: { student: { select: { id: true, name: true, email: true, status: true } } },
        });

        return res.status(200).json({
            success: true,
            count: assignments.length,
            students: assignments.map((a) => a.student),
        });
    } catch (error) {
        console.error("Error fetching teacher's students:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};