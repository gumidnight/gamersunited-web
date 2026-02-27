
import { prisma } from "./lib/prisma";

async function verifyDb() {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { slug: "cj" },
        });

        console.log("Database connection successful.");
        if (supplier) {
            console.log("Supplier 'cj' found.");
            // Check if new columns exist by accessing them
            const hasTokens = 'accessToken' in supplier;
            console.log("New columns (accessToken) present in object:", hasTokens);
            console.log("Current accessToken value:", supplier.accessToken ? "Present" : "Null");
        } else {
            console.log("Supplier 'cj' not found in database.");
        }
    } catch (error: any) {
        console.error("Database verification failed!");
        console.error("Error Message:", error.message);
    }
}

verifyDb();
