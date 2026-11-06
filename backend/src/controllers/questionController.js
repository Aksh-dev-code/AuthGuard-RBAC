const prisma = require("../../prisma/config");
const { toInt } = require("../utils/access");

const fail = (res, code, message) => res.status(code).json({ success: false, message });

const INCLUDE = {
    subject: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true } } } },
    createdBy: { select: { id: true, name: true } },
};

// Which subjects may this caller WRITE in?  null = any subject (admin) | [] = none (student)
const writableSubjects = (scope) =>
    scope.type === "all" ? null : scope.type === "assigned" ? scope.subjectIds : [];

const canWriteIn = (scope, subjectId) => {
    const w = writableSubjects(scope);
    return w === null || w.includes(subjectId);
};

// Can this caller READ a question that lives in this subject / class?
const canReadSubject = (scope, subject) =>
    scope.type === "all" ||
    (scope.type === "assigned" && scope.subjectIds.includes(subject.id)) ||
    (scope.type === "own" && scope.classId === subject.classId);

const cleanText = (v) => (typeof v === "string" ? v.trim() : "");

// GET /questions?classId=&subjectId=&q=&limit=
exports.listQuestions = async (req, res) => {
    try {
        const scope = req.questionScope;
        const classId = req.query.classId ? toInt(req.query.classId) : null;
        const subjectId = req.query.subjectId ? toInt(req.query.subjectId) : null;
        const where = {};

        if (scope.type === "assigned") {
            if (subjectId && !scope.subjectIds.includes(subjectId)) return fail(res, 403, "This subject is not assigned to you");
            if (classId && !scope.classIds.includes(classId)) return fail(res, 403, "This is not one of your classes");
            where.subjectId = subjectId || { in: scope.subjectIds.length ? scope.subjectIds : [-1] };
        } else if (scope.type === "own") {
            // students: any other class / subject in the URL is refused outright
            if (classId && classId !== scope.classId) return fail(res, 403, "You can only view your own class");
            if (subjectId && !scope.subjectIds.includes(subjectId)) return fail(res, 403, "You can only view your own class");
            where.subjectId = subjectId || { in: scope.subjectIds.length ? scope.subjectIds : [-1] };
        } else if (subjectId) {
            where.subjectId = subjectId;
        }
        if (classId && scope.type !== "own") where.subject = { classId };

        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (q) where.text = { contains: q, mode: "insensitive" };

        const take = Math.min(toInt(req.query.limit) || 200, 500);
        const questions = await prisma.question.findMany({
            where,
            include: INCLUDE,
            orderBy: { createdAt: "desc" },
            take,
        });

        return res.json({
            success: true,
            count: questions.length,
            writableSubjectIds: writableSubjects(scope), // UI hint only; the server re-checks every write
            questions,
        });
    } catch (error) {
        console.error("listQuestions:", error);
        return fail(res, 500, "Server error");
    }
};

// GET /questions/:id   (out of scope -> 404, so students cannot probe other classes by id)
exports.getQuestion = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        if (!id) return fail(res, 400, "Invalid question id");
        const question = await prisma.question.findUnique({ where: { id }, include: INCLUDE });
        if (!question || !canReadSubject(req.questionScope, question.subject)) return fail(res, 404, "Question not found");
        return res.json({ success: true, question });
    } catch (error) {
        console.error("getQuestion:", error);
        return fail(res, 500, "Server error");
    }
};

// POST /questions { subjectId, text }
exports.createQuestion = async (req, res) => {
    try {
        const subjectId = toInt(req.body.subjectId);
        const text = cleanText(req.body.text);
        if (!subjectId) return fail(res, 400, "subjectId is required");
        if (text.length < 3 || text.length > 2000) return fail(res, 400, "Question must be 3-2000 characters");
        if (!canWriteIn(req.questionScope, subjectId)) return fail(res, 403, "This subject is not assigned to you");

        if (!(await prisma.subject.findUnique({ where: { id: subjectId } }))) return fail(res, 404, "Subject not found");

        const question = await prisma.question.create({
            data: { subjectId, text, createdById: req.user.id },
            include: INCLUDE,
        });
        return res.status(201).json({ success: true, question });
    } catch (error) {
        console.error("createQuestion:", error);
        return fail(res, 500, "Server error");
    }
};

// PUT /questions/:id { text }
exports.updateQuestion = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        const text = cleanText(req.body.text);
        if (!id) return fail(res, 400, "Invalid question id");
        if (text.length < 3 || text.length > 2000) return fail(res, 400, "Question must be 3-2000 characters");

        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return fail(res, 404, "Question not found");
        if (!canWriteIn(req.questionScope, existing.subjectId)) return fail(res, 403, "This subject is not assigned to you");

        const question = await prisma.question.update({ where: { id }, data: { text }, include: INCLUDE });
        return res.json({ success: true, question });
    } catch (error) {
        console.error("updateQuestion:", error);
        return fail(res, 500, "Server error");
    }
};

// DELETE /questions/:id
exports.deleteQuestion = async (req, res) => {
    try {
        const id = toInt(req.params.id);
        if (!id) return fail(res, 400, "Invalid question id");
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return fail(res, 404, "Question not found");
        if (!canWriteIn(req.questionScope, existing.subjectId)) return fail(res, 403, "This subject is not assigned to you");

        await prisma.question.delete({ where: { id } });
        return res.json({ success: true, message: "Question deleted" });
    } catch (error) {
        console.error("deleteQuestion:", error);
        return fail(res, 500, "Server error");
    }
};