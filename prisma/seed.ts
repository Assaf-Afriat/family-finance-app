import { PrismaClient } from '@prisma/client'
import path from 'path'
import { seedDatabase } from './seedData'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, 'family-finance.db')}`,
    },
  },
})

async function main() {
  await seedDatabase(prisma)
  console.log('Database seeded successfully!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
