require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {

    // 1. Create permissions

    const permissionNames = [
        "users:CREATE",
        "users:READ",
        "users:UPDATE",
        "users:DELETE",

        "roles:CREATE",
        "roles:READ",
        "roles:UPDATE",
        "roles:DELETE",

        "permissions:CREATE",
        "permissions:READ",
        "permissions:UPDATE",
        "permissions:DELETE",

        "resources:READ",
    ];

    const permissions = [];

    for (const name of permissionNames) {
        const permission = await prisma.permission.upsert({
            where: {
                name,
            },
            update: {},
            create: {
                name,
            },
        });

        permissions.push(permission);
    }

    console.log(`Created/found ${permissions.length} permissions`);
    // 2. Create admin role

    const adminRole = await prisma.role.upsert({
        where: {
            name: "admin",
        },
        update: {},
        create: {
            name: "admin",
        },
    });

    console.log("Admin role ID:", adminRole.id);

    // 3. Connect permissions to role
    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
    }

    console.log("Admin permissions assigned");

    // 3b. Create default "user" role (no elevated permissions) so that
    // newly self-registered users have a role to be assigned automatically.
    const userRole = await prisma.role.upsert({
        where: {
            name: "user",
        },
        update: {},
        create: {
            name: "user",
        },
    });

    console.log("Default user role ID:", userRole.id);

    // 4. Create admin user
    const adminPasswordHash = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
        10
    );

    const adminUser = await prisma.user.upsert({
        where: {
            email: "admin134@gmail.com",
        },
        update: {},
        create: {
            name: "Admin User",
            email: "admin134@gmail.com",
            password: adminPasswordHash,
            status: "ACTIVE",
        },
    });

    console.log("Admin user ID:", adminUser.id);

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    console.log("Admin role assigned to user");
}

main()
    .catch((error) => {
        console.error("Error while seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });