import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { seedDatabase } from './seedData'

export const DEFAULT_TEST_DB_PATH = path.resolve(process.cwd(), 'prisma', 'family-finance.test.db')
const BASE_DB_PATH = path.resolve(process.cwd(), 'prisma', 'family-finance.db')

export function getDatabaseUrl(dbPath: string) {
  return `file:${path.resolve(dbPath)}`
}

export async function resetDatabase(dbPath: string = DEFAULT_TEST_DB_PATH) {
  const resolvedPath = path.resolve(dbPath)
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
  fs.rmSync(resolvedPath, { force: true })
  fs.rmSync(`${resolvedPath}-journal`, { force: true })
  fs.copyFileSync(BASE_DB_PATH, resolvedPath)

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(resolvedPath),
      },
    },
  })

  try {
    await prisma.transaction.deleteMany()
    await prisma.budget.deleteMany()
    await prisma.recurringTransaction.deleteMany()
    await prisma.bill.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.category.deleteMany()
    await seedDatabase(prisma)
  } finally {
    await prisma.$disconnect()
  }

  return resolvedPath
}
