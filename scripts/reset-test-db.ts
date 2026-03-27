import path from 'path'
import { DEFAULT_TEST_DB_PATH, resetDatabase } from '../prisma/testDb'

async function main() {
  const dbPath = process.env.FAMILY_FINANCE_DB_PATH
    ? path.resolve(process.env.FAMILY_FINANCE_DB_PATH)
    : DEFAULT_TEST_DB_PATH

  await resetDatabase(dbPath)
  console.log(`Test database reset at ${dbPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
