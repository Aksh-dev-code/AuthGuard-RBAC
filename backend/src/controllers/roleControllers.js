
const prisma = require("../config/prisma");

// CREATE ROLE
// POST /api/roles

exports.roleCreateController = async (req, res) => {
    try {
        const { name, permissions } = req.body;

        // Validate input
        if (
            !name ||
            !Array.isArray(permissions) ||
            permissions.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and permissions are required",
            });
        }

        // Remove duplicate permissions
        const uniquePermissions = [...new Set(permissions)];

        if (uniquePermissions.length !== permissions.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate permissions are not allowed",
            });
        }

        // Check if role already exists
        const existingRole = await prisma.role.findUnique({
            where: {
                name,
            },
        });

        if (existingRole) {
            return res.status(409).json({
                success: false,
                message: "Role already exists",
            });
        }

        // Find permissions in database
        const permissionRecords = await prisma.permission.findMany({
            where: {
                name: {
                    in: uniquePermissions,
                },
            },
        });

        // Check if all requested permissions exist
        if (permissionRecords.length !== uniquePermissions.length) {
            const foundPermissions = permissionRecords.map(
                (permission) => permission.name
            );

            const missingPermissions = uniquePermissions.filter(
                (permission) => !foundPermissions.includes(permission)
            );

            return res.status(400).json({
                success: false,
                message: "One or more permissions do not exist",
                missingPermissions,
            });
        }

        // Create role and connect permissions
        const role = await prisma.role.create({
            data: {
                name,

                permissions: {
                    create: permissionRecords.map((permission) => ({
                        permission: {
                            connect: {
                                id: permission.id,
                            },
                        },
                    })),
                },
            },

            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            role,
        });

    } catch (error) {
        console.error("Error creating role:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// =====================================================
// GET ALL ROLES
// GET /api/roles
// =====================================================
exports.roleGetController = async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            count: roles.length,
            roles,
        });

    } catch (error) {
        console.error("Error fetching roles:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// =====================================================
// GET ROLE BY ID
// GET /api/roles/:id
// =====================================================
exports.roleGetByIdController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Validate ID
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        const role = await prisma.role.findUnique({
            where: {
                id,
            },

            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },

                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        // Role not found
        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            role,
        });

    } catch (error) {
        console.error("Error fetching role:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


// =====================================================
// UPDATE ROLE
// PUT /api/roles/:id
// =====================================================
exports.updateRoleController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name, permissions } = req.body;

        // Validate ID
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        // Validate input
        if (
            !name ||
            !Array.isArray(permissions) ||
            permissions.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and permissions are required",
            });
        }

        // Remove duplicate permissions
        const uniquePermissions = [...new Set(permissions)];

        if (uniquePermissions.length !== permissions.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate permissions are not allowed",
            });
        }

        // Check role exists
        const existingRole = await prisma.role.findUnique({
            where: {
                id,
            },
        });

        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        // Check if another role has the same name
        const duplicateRole = await prisma.role.findFirst({
            where: {
                name,
                NOT: {
                    id,
                },
            },
        });

        if (duplicateRole) {
            return res.status(409).json({
                success: false,
                message: "Another role with this name already exists",
            });
        }

        // Find permissions
        const permissionRecords = await prisma.permission.findMany({
            where: {
                name: {
                    in: uniquePermissions,
                },
            },
        });

        // Check permissions
        if (permissionRecords.length !== uniquePermissions.length) {
            const foundPermissions = permissionRecords.map(
                (permission) => permission.name
            );

            const missingPermissions = uniquePermissions.filter(
                (permission) => !foundPermissions.includes(permission)
            );

            return res.status(400).json({
                success: false,
                message: "One or more permissions do not exist",
                missingPermissions,
            });
        }

        // Update role and replace permissions
        const updatedRole = await prisma.$transaction(async (tx) => {

            // Delete existing role-permission relations
            await tx.rolePermission.deleteMany({
                where: {
                    roleId: id,
                },
            });

            // Update role
            const role = await tx.role.update({
                where: {
                    id,
                },

                data: {
                    name,

                    permissions: {
                        create: permissionRecords.map((permission) => ({
                            permission: {
                                connect: {
                                    id: permission.id,
                                },
                            },
                        })),
                    },
                },

                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });

            return role;
        });

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            role: updatedRole,
        });

    } catch (error) {
        console.error("Error updating role:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// DELETE ROLE
// DELETE /api/roles/:id

exports.roleDeleteController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        // Validate ID
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        // Check role exists
        const existingRole = await prisma.role.findUnique({
            where: {
                id,
            },
        });

        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        // Delete role
        await prisma.role.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting role:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
