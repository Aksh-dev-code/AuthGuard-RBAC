const prisma = require("../../prisma/config");

const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    roles: {
        include: { role: true },
    },
};

function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: (user.roles || []).map((ur) => ({ id: ur.role.id, name: ur.role.name })),
    };
}

// GET /users
exports.getUsersController = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: SAFE_USER_SELECT,
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({
            success: true,
            count: users.length,
            users: users.map(toSafeUser),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /users/:id
exports.getUserByIdController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: SAFE_USER_SELECT,
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, user: toSafeUser(user) });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /users/:id  (admin update: name, email, status — never password here)
exports.updateUserController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name, email, status } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (status) updateData.status = status;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: SAFE_USER_SELECT,
        });

        return res.status(200).json({ success: true, message: 'User updated successfully', user: toSafeUser(user) });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /users/:id
exports.deleteUserController = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await prisma.user.delete({ where: { id } });

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};