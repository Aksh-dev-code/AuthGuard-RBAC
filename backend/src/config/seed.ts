const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const adminPermissions = [
        { resource: "users", action: "CREATE" },
        { resource: "users", action: "READ" },
        { resource: "users", action: "UPDATE" },
        { resource: "users", action: "DELETE" },

        { resource: "roles", action: "CREATE" },
        { resource: "roles", action: "READ" },
        { resource: "roles", action: "UPDATE" },
        { resource: "roles", action: "DELETE" },

        { resource: "permissions", action: "CREATE" },
        { resource: "permissions", action: "READ" },
        { resource: "permissions", action: "UPDATE" },
        { resource: "permissions", action: "DELETE" },

        { resource: "resources", action: "READ" },
    ];

    // Create admin role with permissions
    const adminRole = await prisma.role.create({
        data: {
            name: "admin",
            permissions: {
                create: adminPermissions,
            },
        },
    });

    console.log("Admin role created with ID:", adminRole.id);

    // Create admin user and assign admin role
    const adminUser = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin134@gmail.com",
            password: "$2wertyuiuytreDFGJreteFETWEEFERY",
            role: {
                connect: {
                    id: adminRole.id,
                },
            },
        },
    });

    console.log("Admin user created with ID:", adminUser.id);
}

main()
    .catch((error) => {
        console.error("Error while seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });