
import { prisma } from "../lib/prisma";

async function check() {
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users, null, 2));
}

check();
