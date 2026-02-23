
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const username = 'gumidnight'

    // Try to find the user by name (Discord username)
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: username },
                { email: { contains: username } }
            ]
        }
    })

    if (!user) {
        console.error(`User with username or email containing "${username}" not found.`)
        const allUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } })
        console.log('Current users:', allUsers)
        return
    }

    console.log(`Found user: ${user.name} (${user.id}) with current role: ${user.role}`)

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
    })

    console.log(`Successfully updated ${updatedUser.name} to role: ${updatedUser.role}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
