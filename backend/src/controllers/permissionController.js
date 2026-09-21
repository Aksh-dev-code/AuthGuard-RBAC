const prisma = require("../../prisma/config");

// Permission names must look like "resource:ACTION", e.g. "users:CREATE"
const PERMISSION_NAME_REGEX = /^[a-z]+:[A-Z]+$/;

exports.createPermissionController = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !PERMISSION_NAME_REGEX.test(name)) {
            return res.status(400).json({
                success: false,
                message: 'A valid permission name is required, e.g. "users:CREATE"',
            });
        }

        const existingPermission = await prisma.permission.findUnique({ where: { name } });
        if (existingPermission) {
            return res.status(409).json({ success: false, message: 'Permission already exists' });
        }

        const permission = await prisma.permission.create({ data: { name } });

        return res.status(201).json({
            success: true,
            message: 'Permission created successfully',
            permission,
        });
    } catch (error) {
        console.error('Error creating permission:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPermissionController = async (req, res) => {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: { name: 'asc' },
        });
        return res.status(200).json({ success: true, count: permissions.length, permissions });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPermissionByIdController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid permission ID' });
        }

        const permission = await prisma.permission.findUnique({ where: { id } });
        if (!permission) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        return res.status(200).json({ success: true, permission });
    } catch (error) {
        console.error('Error fetching permission:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePermissionController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid permission ID' });
        }
        if (!name || !PERMISSION_NAME_REGEX.test(name)) {
            return res.status(400).json({
                success: false,
                message: 'A valid permission name is required, e.g. "users:CREATE"',
            });
        }

        const existingPermission = await prisma.permission.findUnique({ where: { id } });
        if (!existingPermission) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        const duplicate = await prisma.permission.findFirst({ where: { name, NOT: { id } } });
        if (duplicate) {
            return res.status(409).json({ success: false, message: 'Another permission with this name already exists' });
        }

        const permission = await prisma.permission.update({ where: { id }, data: { name } });

        return res.status(200).json({ success: true, message: 'Permission updated successfully', permission });
    } catch (error) {
        console.error('Error updating permission:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE PERMISSION
// DELETE /permission/:id
exports.deletePermissionController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid permission ID' });
        }

        const existingPermission = await prisma.permission.findUnique({ where: { id } });
        if (!existingPermission) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        await prisma.permission.delete({ where: { id } });

        return res.status(200).json({ success: true, message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};