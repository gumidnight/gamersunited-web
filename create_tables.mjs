import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const sql = neon(process.env.DATABASE_URL);

async function run() {
    console.log('Attempting to create tables...');
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS "Newsletter" (
                "id" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
            );
        `;
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Newsletter_email_key" ON "Newsletter"("email");`;

        await sql`
            CREATE TABLE IF NOT EXISTS "ContactMessage" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
            );
        `;

        console.log('Tables created or already exist.');
    } catch (err) {
        console.error('Error creating tables:', err);
    }
}

run();
