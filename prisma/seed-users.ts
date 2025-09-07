import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with users...');
    const users = [
        {
            id: 'cmeod2gk50000722833o2omi3',
            username: 'mhaiderali',
            email: 'mhaiderali.dev@gmail.com',
            password: '$2b$10$67hYgivIgU6jmfLqI3dJn.8UFJNrvNtUcOSIPXZxrL.8Wi0PPez4y',
        },
    ];

    for (const user of users) {
        try {
            await prisma.user.upsert({
                where: {
                    email: user.email,
                },
                update: {
                    username: user.username,
                    password: user.password,
                },
                create: user,
            });
            console.log(`✅ Added/Updated user: ${user.email}`);
        } catch (error) {
            console.error(`❌ Error adding/updating user ${user.email}:`, error);
        }
    }
    console.log('User seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
