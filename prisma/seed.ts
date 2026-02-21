import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const expenseCategories = [
    { name: 'Housing', icon: '🏠', color: '#3b82f6', type: 'Expense' },
    { name: 'Groceries', icon: '🛒', color: '#22c55e', type: 'Expense' },
    { name: 'Transportation', icon: '🚗', color: '#f59e0b', type: 'Expense' },
    { name: 'Utilities', icon: '💡', color: '#8b5cf6', type: 'Expense' },
    { name: 'Entertainment', icon: '🎬', color: '#ec4899', type: 'Expense' },
    { name: 'Healthcare', icon: '🏥', color: '#14b8a6', type: 'Expense' },
    { name: 'Dining Out', icon: '🍽️', color: '#f97316', type: 'Expense' },
    { name: 'Shopping', icon: '🛍️', color: '#a855f7', type: 'Expense' },
    { name: 'Education', icon: '📚', color: '#06b6d4', type: 'Expense' },
    { name: 'Other', icon: '📦', color: '#6b7280', type: 'Expense' },
  ]

  const incomeCategories = [
    { name: 'Salary', icon: '💰', color: '#22c55e', type: 'Income' },
    { name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'Income' },
    { name: 'Investments', icon: '📈', color: '#8b5cf6', type: 'Income' },
    { name: 'Gifts', icon: '🎁', color: '#ec4899', type: 'Income' },
    { name: 'Other Income', icon: '💵', color: '#6b7280', type: 'Income' },
  ]

  for (const category of [...expenseCategories, ...incomeCategories]) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default users
  const assaf = await prisma.user.upsert({
    where: { id: 'user-assaf' },
    update: {},
    create: {
      id: 'user-assaf',
      name: 'Assaf',
      avatar: null,
    },
  })

  const partner = await prisma.user.upsert({
    where: { id: 'user-partner' },
    update: {},
    create: {
      id: 'user-partner',
      name: 'Partner',
      avatar: null,
    },
  })

  // Create accounts
  const checkingAccount = await prisma.account.upsert({
    where: { id: 'account-checking' },
    update: {},
    create: {
      id: 'account-checking',
      name: 'Main Checking',
      type: 'Checking',
      balance: 45000,
      isJoint: true,
      ownerId: assaf.id,
    },
  })

  const savingsAccount = await prisma.account.upsert({
    where: { id: 'account-savings' },
    update: {},
    create: {
      id: 'account-savings',
      name: 'Savings Account',
      type: 'Savings',
      balance: 120000,
      isJoint: true,
      ownerId: assaf.id,
    },
  })

  const creditCard = await prisma.account.upsert({
    where: { id: 'account-credit' },
    update: {},
    create: {
      id: 'account-credit',
      name: 'Credit Card',
      type: 'Credit',
      balance: -5000,
      isJoint: false,
      ownerId: assaf.id,
    },
  })

  // Create sample transactions for the last 6 months
  const now = new Date()
  const transactions = []

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    
    // Monthly salary
    transactions.push({
      amount: 20000,
      date: new Date(month.getFullYear(), month.getMonth(), 10),
      description: 'Monthly Salary',
      category: 'Salary',
      type: 'Income',
      ownership: 'Personal',
      accountId: checkingAccount.id,
      userId: assaf.id,
    })

    // Partner salary
    transactions.push({
      amount: 15000,
      date: new Date(month.getFullYear(), month.getMonth(), 12),
      description: 'Partner Salary',
      category: 'Salary',
      type: 'Income',
      ownership: 'Personal',
      accountId: checkingAccount.id,
      userId: partner.id,
    })

    // Rent
    transactions.push({
      amount: 5500,
      date: new Date(month.getFullYear(), month.getMonth(), 1),
      description: 'Monthly Rent',
      category: 'Housing',
      type: 'Expense',
      ownership: 'Joint',
      accountId: checkingAccount.id,
      userId: assaf.id,
    })

    // Groceries (multiple)
    for (let week = 0; week < 4; week++) {
      transactions.push({
        amount: 600 + Math.random() * 200,
        date: new Date(month.getFullYear(), month.getMonth(), 5 + week * 7),
        description: 'Weekly Groceries',
        category: 'Groceries',
        type: 'Expense',
        ownership: 'Joint',
        accountId: checkingAccount.id,
        userId: week % 2 === 0 ? assaf.id : partner.id,
      })
    }

    // Utilities
    transactions.push({
      amount: 350,
      date: new Date(month.getFullYear(), month.getMonth(), 15),
      description: 'Electricity Bill',
      category: 'Utilities',
      type: 'Expense',
      ownership: 'Joint',
      accountId: checkingAccount.id,
      userId: assaf.id,
    })

    transactions.push({
      amount: 150,
      date: new Date(month.getFullYear(), month.getMonth(), 18),
      description: 'Internet & Phone',
      category: 'Utilities',
      type: 'Expense',
      ownership: 'Joint',
      accountId: checkingAccount.id,
      userId: assaf.id,
    })

    // Transportation
    transactions.push({
      amount: 400,
      date: new Date(month.getFullYear(), month.getMonth(), 20),
      description: 'Gas & Parking',
      category: 'Transportation',
      type: 'Expense',
      ownership: 'Personal',
      accountId: checkingAccount.id,
      userId: assaf.id,
    })

    // Entertainment
    transactions.push({
      amount: 200 + Math.random() * 150,
      date: new Date(month.getFullYear(), month.getMonth(), 22),
      description: 'Streaming Services',
      category: 'Entertainment',
      type: 'Expense',
      ownership: 'Joint',
      accountId: creditCard.id,
      userId: assaf.id,
    })

    transactions.push({
      amount: 350 + Math.random() * 200,
      date: new Date(month.getFullYear(), month.getMonth(), 25),
      description: 'Dining Out',
      category: 'Dining Out',
      type: 'Expense',
      ownership: 'Joint',
      accountId: creditCard.id,
      userId: partner.id,
    })
  }

  // Insert transactions
  for (const tx of transactions) {
    await prisma.transaction.create({
      data: tx,
    })
  }

  // Create budgets for current month
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const budgets = [
    { category: 'Groceries', limit: 3000, month: currentMonth, year: currentYear, userId: assaf.id },
    { category: 'Entertainment', limit: 1500, month: currentMonth, year: currentYear, userId: assaf.id },
    { category: 'Transportation', limit: 800, month: currentMonth, year: currentYear, userId: assaf.id },
    { category: 'Dining Out', limit: 1200, month: currentMonth, year: currentYear, userId: assaf.id },
    { category: 'Utilities', limit: 600, month: currentMonth, year: currentYear, userId: assaf.id },
  ]

  for (const budget of budgets) {
    await prisma.budget.upsert({
      where: {
        category_month_year_userId: {
          category: budget.category,
          month: budget.month,
          year: budget.year,
          userId: budget.userId,
        },
      },
      update: {},
      create: budget,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
