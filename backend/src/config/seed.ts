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

// Helper: ["classes"] x ["CREATE","READ"] -> ["classes:CREATE", "classes:READ"]
const perms = (resource, actions) => actions.map((a) => `${resource}:${a}`);

async function main() {

    // 1. Permissions (resource:ACTION)
    const permissionNames = [
        ...perms("users", ["CREATE", "READ", "UPDATE", "DELETE"]),
        ...perms("roles", ["CREATE", "READ", "UPDATE", "DELETE"]),
        ...perms("permissions", ["CREATE", "READ", "UPDATE", "DELETE"]),

        // attendance
        "attendance:CREATE",        // mark attendance
        "attendance:READ",          // everyone's (centre admin)
        "attendance:READ_OWN",      // student
        "attendance:READ_ASSIGNED", // teacher: students of the classes they teach
        "students:READ",

        // coaching centre
        ...perms("classes", ["CREATE", "READ", "UPDATE", "DELETE", "READ_OWN", "READ_ASSIGNED"]),
        ...perms("enrollment", ["CREATE", "READ", "UPDATE", "DELETE"]),
        ...perms("subjects", ["CREATE", "READ", "UPDATE", "DELETE", "READ_OWN", "READ_ASSIGNED"]),
        ...perms("questions", ["CREATE", "READ", "UPDATE", "DELETE", "READ_OWN_CLASS", "READ_ASSIGNED"]),
    ];

    const permissions = [];
    for (const name of permissionNames) {
        permissions.push(
            await prisma.permission.upsert({ where: { name }, update: {}, create: { name } })
        );
    }
    console.log(`Created/found ${permissions.length} permissions`);

    // 2. Roles and their permissions ("principal" is shown as "Centre Admin" in the UI)
    const roleDefinitions = {
        super_admin: permissionNames, // everything
        principal: [
            "attendance:READ", "users:READ", "students:READ",
            ...perms("classes", ["CREATE", "READ", "UPDATE", "DELETE"]),
            ...perms("enrollment", ["CREATE", "READ", "UPDATE", "DELETE"]),
            ...perms("subjects", ["CREATE", "READ", "UPDATE", "DELETE"]),
            "questions:READ",
        ],
        teacher: [
            "attendance:CREATE", "attendance:READ_ASSIGNED", "students:READ",
            "classes:READ_ASSIGNED", "subjects:READ_ASSIGNED",
            "questions:CREATE", "questions:UPDATE", "questions:DELETE", "questions:READ_ASSIGNED",
        ],
        student: [
            "attendance:READ_OWN", "classes:READ_OWN", "subjects:READ_OWN", "questions:READ_OWN_CLASS",
        ],
    };

    const roles = {};
    for (const [roleName, list] of Object.entries(roleDefinitions)) {
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
        roles[roleName] = role;

        for (const permName of list) {
            const permission = permissions.find((p) => p.name === permName);
            if (!permission) continue;
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
                update: {},
                create: { roleId: role.id, permissionId: permission.id },
            });
        }
        console.log(`${roleName} role configured with ${list.length} permissions`);
    }

    // Helper: create a user once, give them a role
    const ensureUser = async (name, email, passwordHash, roleName) => {
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { name, email, password: passwordHash, status: "ACTIVE" },
        });
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: roles[roleName].id } },
            update: {},
            create: { userId: user.id, roleId: roles[roleName].id },
        });
        return user;
    };

    // 3. Super admin
    const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "Admin@12345", 10);
    const adminUser = await ensureUser("Admin User", "admin134@gmail.com", adminHash, "super_admin");
    console.log("Super admin ready, user ID:", adminUser.id);

    // 4. Demo data (safe to re-run). Skip with SEED_DEMO=false.
    if (process.env.SEED_DEMO === "false") {
        console.log("SEED_DEMO=false -> skipping demo data");
        return;
    }

    const demoHash = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD || "Demo@12345", 10);

    const classNine = await prisma.class.upsert({
        where: { name: "Class Nine" },
        update: {},
        create: { name: "Class Nine" },
    });

    const subjects = {};
    for (const name of ["English", "Mathematics", "Science"]) {
        subjects[name] = await prisma.subject.upsert({
            where: { classId_name: { classId: classNine.id, name } },
            update: {},
            create: { classId: classNine.id, name },
        });
    }

    const teacher = await ensureUser("Demo Teacher", "teacher@example.com", demoHash, "teacher");
    for (const subject of Object.values(subjects)) {
        await prisma.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subject.id } },
            update: {},
            create: { teacherId: teacher.id, subjectId: subject.id },
        });
    }

    const studentNames = ["Aarav Sharma", "Diya Patel", "Rohan Das", "Sneha Roy", "Imran Khan"];
    for (let i = 0; i < studentNames.length; i++) {
        const student = await ensureUser(studentNames[i], `student${i + 1}@example.com`, demoHash, "student");
        await prisma.enrollment.upsert({
            where: { studentId: student.id },
            update: {},
            create: { classId: classNine.id, studentId: student.id },
        });
    }

    const sampleQuestions = [
        ["English", "Write a short paragraph on your favourite festival."],
        ["Mathematics", "Solve: 3x + 7 = 25. Show every step."],
        ["Science", "Why does ice float on water?"],
    ];
    for (const [subjectName, text] of sampleQuestions) {
        const subjectId = subjects[subjectName].id;
        const found = await prisma.question.findFirst({ where: { subjectId, text } });
        if (!found) await prisma.question.create({ data: { subjectId, text, createdById: teacher.id } });
    }

    console.log("Demo data ready: Class Nine, 3 subjects, 5 students, 1 teacher");
    console.log("Demo logins: teacher@example.com / student1@example.com ... student5@example.com");
}

main()
    .catch((error) => {
        console.error("Error while seeding:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });