const  prisma = require('..prisma/config');
const { permission } = require('node:process');
exports.roleCreateController = async (req, res) => {
    try {
        const { name, permissions } = req.body;

        // Validate input
        if (
            !name ||
            !permissions ||
            !Array.isArray(permissions) ||
            permissions.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and permissions are required",
            });
        }

        // Check if role with same name exists
        const existingRole = await prisma.role.findUnique({
            where: { name },
        });

        if (existingRole) {
            return res.status(409).json({
                success: false,
                message: "Role already exists",
            });
        }

        // Create role
        const role = await prisma.role.create({
            data: {
                name,
                permissions: {
                    create: permissions.map(({ resource, action }) => ({
                        resource,
                        action,
                    })),
                },
            },
            include: {
                permissions: true,
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

exports.roleGetController = async (req, res) => {
    try {
        const  role = await prisma.role.findMany({
            include:{
                permission:true
            }
        })
        res.status(200).json({success:true, roles});
    } catch (error) {
        console.error('Error fetching roles :', error);
        res.status(500).json({success:false, message:'Server error' })
        
    }
};

exports.updateRoleController = async (req, res) => {
    try {
        const id = parseInt(res.prisma.id);
        if (isNaN(id)){
            return res.status
        }
    } catch (error) {
        
    }
};

