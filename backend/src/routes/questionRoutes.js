const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/checkPermission");
const { resolveQuestionScope } = require("../middleware/questionScope");
const c = require("../controllers/questionController");

const router = express.Router();

router.get("/", authMiddleware, resolveQuestionScope, c.listQuestions);
router.get("/:id", authMiddleware, resolveQuestionScope, c.getQuestion);

// Writes need the permission AND (inside the controller) a subject assigned to the teacher.
router.post("/", authMiddleware, checkPermission("questions", "CREATE"), resolveQuestionScope, c.createQuestion);
router.put("/:id", authMiddleware, checkPermission("questions", "UPDATE"), resolveQuestionScope, c.updateQuestion);
router.delete("/:id", authMiddleware, checkPermission("questions", "DELETE"), resolveQuestionScope, c.deleteQuestion);

module.exports = router;