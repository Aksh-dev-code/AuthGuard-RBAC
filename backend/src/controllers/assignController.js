const prisma = require("../../prisma/config");

const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res.status(400).json({
        success: false,
        message: "roleId and permissionId are required",
      });
    }

    // Check role
    const role = await prisma.role.findUnique({
      where: {
        id: Number(roleId),
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check permission
    const permission = await prisma.permission.findUnique({
      where: {
        id: Number(permissionId),
      },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Create relationship
    const rolePermission = await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: Number(roleId),
          permissionId: Number(permissionId),
        },
      },
      update: {},
      create: {
        roleId: Number(roleId),
        permissionId: Number(permissionId),
      },
      include: {
        role: true,
        permission: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Permission assigned to role successfully",
      data: rolePermission,
    });
  } catch (error) {
    console.error("Assign Permission Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign permission",
      error: error.message,
    });
  }
};


const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "userId and roleId are required",
      });
    }

    // Check user
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check role
    const role = await prisma.role.findUnique({
      where: {
        id: Number(roleId),
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Create relationship
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: Number(userId),
          roleId: Number(roleId),
        },
      },
      update: {},
      create: {
        userId: Number(userId),
        roleId: Number(roleId),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        role: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Role assigned to user successfully",
      data: userRole,
    });
  } catch (error) {
    console.error("Assign Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign role",
      error: error.message,
    });
  }
};

const removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    if (!roleId || !permissionId) {
      return res.status(400).json({
        success: false,
        message: "roleId and permissionId are required",
      });
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: Number(roleId),
          permissionId: Number(permissionId),
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Permission removed from role successfully",
    });
  } catch (error) {
    console.error("Remove Permission Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Role-permission assignment not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to remove permission",
      error: error.message,
    });
  }
};


const removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "userId and roleId are required",
      });
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: Number(userId),
          roleId: Number(roleId),
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Role removed from user successfully",
    });
  } catch (error) {
    console.error("Remove Role Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "User-role assignment not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to remove role",
      error: error.message,
    });
  }
};


module.exports = {
  assignPermissionToRole,
  assignRoleToUser,
  removePermissionFromRole,
  removeRoleFromUser,
};