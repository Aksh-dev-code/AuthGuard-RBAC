const prisma = require('../../prisma/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DEFAULT_ROLE_NAME = 'student';

// Shape a Prisma user (with roles: UserRole[] -> role: Role) into a safe API response
function toSafeUser(user) {
    const roles = user.roles || [];
    const permissionSet = new Set();
    for (const ur of roles) {
        for (const rp of ur.role.permissions || []) {
            permissionSet.add(rp.permission.name);
        }
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        roles: roles.map((ur) => ur.role.name),
        permissions: Array.from(permissionSet),
    };
}

exports.getMe = async (req, res) => {
    try {
        // req.user is attached by authMiddleware and already includes roles->role
        res.json({ success: true, user: toSafeUser(req.user) });
    } catch (error) {
        console.error('Error getting me data:', error);
        res.status(500).json({ success: false, message: 'Error getting me data' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const { id } = req.user;
        const { name, email, password } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: toSafeUser(updatedUser),
        });
    } catch (error) {
        console.error('Error updating me data:', error);
        res.status(500).json({ success: false, message: 'Error updating me data' });
    }
};

exports.loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.json({ success: true, token, user: toSafeUser(user) });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.registerController = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const defaultRole = await prisma.role.findUnique({ where: { name: DEFAULT_ROLE_NAME } });
        if (!defaultRole) {
            return res.status(500).json({
                success: false,
                message: `Default role "${DEFAULT_ROLE_NAME}" does not exist. Please seed the database first.`,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roles: {
                    create: {
                        role: { connect: { id: defaultRole.id } },
                    },
                },
            },
            include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        });

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered',
            token,
            user: toSafeUser(user),
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};