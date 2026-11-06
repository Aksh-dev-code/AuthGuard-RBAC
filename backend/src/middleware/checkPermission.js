const { getAccess } = require("../utils/access");

// Uses req.user (set by authMiddleware, already includes roles + permissions),
// so it costs no extra database query. super_admin / admin bypass the check.
exports.checkPermission = (resource, action) => exports.checkAnyPermission(`${resource}:${action}`);

// Allows the request if the caller holds ANY of the listed permissions.
exports.checkAnyPermission = (...names) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const access = getAccess(req.user);
    if (names.some((n) => access.has(n))) return next();
    return res.status(403).json({ success: false, message: "Access denied" });
};