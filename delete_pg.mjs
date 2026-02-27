https://gamersunited.cy/import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        await sql`DELETE FROM "Product";`;
        console.log('Deleted successfully.');
    } catch (err) {
        console.error(err);
    }
}

run();
