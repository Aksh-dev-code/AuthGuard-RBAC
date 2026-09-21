const prisma = require("../../prisma/config");

const ADMIN_ROLE_NAME = "admin";

exports.checkPermission = (resource, action) => {
    const requiredPermission = `${resource}:${action}`;

    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Not authenticated" });
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: { permission: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Admins bypass granular permission checks
            const isAdmin = user.roles.some((ur) => ur.role.name === ADMIN_ROLE_NAME);
            if (isAdmin) {
                return next();
            }

            const hasPermission = user.roles.some((ur) =>
                ur.role.permissions.some((rp) => rp.permission.name === requiredPermission)
            );

            if (!hasPermission) {
                return res.status(403).json({ success: false, message: "Access denied" });
            }

            return next();
        } catch (error) {
            console.error("Error checking permission:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    };
};