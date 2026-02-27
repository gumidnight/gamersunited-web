const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    await prisma.product.deleteMany({});
    console.log("Deleted all products.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
