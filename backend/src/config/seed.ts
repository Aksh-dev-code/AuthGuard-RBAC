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
        "users:CREATE", "users:READ", "users:UPDATE", "users:DELETE",
        "roles:CREATE", "roles:READ", "roles:UPDATE", "roles:DELETE",
        "permissions:CREATE", "permissions:READ", "permissions:UPDATE", "permissions:DELETE",

        // attendance domain
        "attendance:CREATE",        // mark attendance
        "attendance:READ",          // view anyone's (principal/super_admin)
        "attendance:READ_OWN",      // view own (student)
        "attendance:READ_ASSIGNED", // view assigned students' (teacher)
        "students:READ",
        "teachers:MANAGE",          // assign/remove students to a teacher
    ];

    const permissions = [];

    for (const name of permissionNames) {
        const permission = await prisma.permission.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        permissions.push(permission);
    }

    console.log(`Created/found ${permissions.length} permissions`);

    // 2. Create roles and connect their permissions
    const roleDefinitions = {
        super_admin: permissionNames, // everything
        principal: ["attendance:READ", "users:READ", "teachers:MANAGE", "students:READ"],
        teacher: ["attendance:CREATE", "attendance:READ_ASSIGNED", "students:READ"],
        student: ["attendance:READ_OWN"],
    };

    const roles = {};

    for (const [roleName, perms] of Object.entries(roleDefinitions)) {
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
        roles[roleName] = role;

        for (const permName of perms) {
            const permission = permissions.find((p) => p.name === permName);
            if (!permission) continue;
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
                update: {},
                create: { roleId: role.id, permissionId: permission.id },
            });
        }
        console.log(`${roleName} role configured with ${perms.length} permissions`);
    }

    // 3. Create the super admin user
    const adminPasswordHash = await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
        10
    );

    const adminUser = await prisma.user.upsert({
        where: { email: "admin134@gmail.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin134@gmail.com",
            password: adminPasswordHash,
            status: "ACTIVE",
        },
    });

    console.log("Admin user ID:", adminUser.id);

    // 4. Assign super_admin role to the admin user
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: roles.super_admin.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: roles.super_admin.id,
        },
    });

    console.log("super_admin role assigned to admin user");
}

main()
    .catch((error) => {
        console.error("Error while seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });