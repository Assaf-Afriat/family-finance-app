import type { PrismaClient } from '@prisma/client'

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function seedDatabase(prisma: PrismaClient) {
  const expenseCategories = [
    { name: 'Housing', icon: 'Home', color: '#3b82f6', type: 'Expense' },
    { name: 'Groceries', icon: 'Cart', color: '#22c55e', type: 'Expense' },
    { name: 'Transportation', icon: 'Car', color: '#f59e0b', type: 'Expense' },
    { name: 'Utilities', icon: 'Bolt', color: '#8b5cf6', type: 'Expense' },
    { name: 'Entertainment', icon: 'Film', color: '#ec4899', type: 'Expense' },
    { name: 'Healthcare', icon: 'HeartPulse', color: '#14b8a6', type: 'Expense' },
    { name: 'Dining Out', icon: 'Utensils', color: '#f97316', type: 'Expense' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#a855f7', type: 'Expense' },
    { name: 'Education', icon: 'BookOpen', color: '#06b6d4', type: 'Expense' },
    { name: 'Other', icon: 'Package', color: '#6b7280', type: 'Expense' },
  ]

  const incomeCategories = [
    { name: 'Salary', icon: 'Wallet', color: '#22c55e', type: 'Income' },
    { name: 'Freelance', icon: 'Laptop', color: '#3b82f6', type: 'Income' },
    { name: 'Investments', icon: 'TrendingUp', color: '#8b5cf6', type: 'Income' },
    { name: 'Gifts', icon: 'Gift', color: '#ec4899', type: 'Income' },
    { name: 'Other Income', icon: 'Coins', color: '#6b7280', type: 'Income' },
  ]

  for (const category of [...expenseCategories, ...incomeCategories]) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    })
  }

  const assaf = await prisma.user.upsert({
    where: { id: 'user-assaf' },
    update: { name: 'Assaf', avatar: null },
    create: { id: 'user-assaf', name: 'Assaf', avatar: null },
  })

  const partner = await prisma.user.upsert({
    where: { id: 'user-partner' },
    update: { name: 'Partner', avatar: null },
    create: { id: 'user-partner', name: 'Partner', avatar: null },
  })

  const checkingAccount = await prisma.account.upsert({
    where: { id: 'account-checking' },
    update: {
      name: 'Main Checking',
      type: 'Checking',
      balance: 45000,
      isJoint: true,
      ownerId: assaf.id,
    },
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
    update: {
      name: 'Savings Account',
      type: 'Savings',
      balance: 120000,
      isJoint: true,
      ownerId: assaf.id,
    },
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
    update: {
      name: 'Credit Card',
      type: 'Credit',
      balance: -5000,
      isJoint: false,
      ownerId: assaf.id,
    },
    create: {
      id: 'account-credit',
      name: 'Credit Card',
      type: 'Credit',
      balance: -5000,
      isJoint: false,
      ownerId: assaf.id,
    },
  })

  const partnerCash = await prisma.account.upsert({
    where: { id: 'account-partner-cash' },
    update: {
      name: 'Partner Cash',
      type: 'Cash',
      balance: 5000,
      isJoint: false,
      ownerId: partner.id,
    },
    create: {
      id: 'account-partner-cash',
      name: 'Partner Cash',
      type: 'Cash',
      balance: 5000,
      isJoint: false,
      ownerId: partner.id,
    },
  })

  const now = new Date()
  const groceryAmounts = [650, 700, 680, 720]
  const entertainmentAmounts = [220, 240, 230, 250, 260, 245]
  const diningAmounts = [390, 410, 405, 430, 415, 425]

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const key = monthKey(month)

    const monthlyTransactions = [
      {
        id: `tx-assaf-salary-${key}`,
        amount: 20000,
        date: new Date(month.getFullYear(), month.getMonth(), 10),
        description: 'Monthly Salary',
        category: 'Salary',
        type: 'Income',
        ownership: 'Personal',
        accountId: checkingAccount.id,
        userId: assaf.id,
      },
      {
        id: `tx-partner-salary-${key}`,
        amount: 15000,
        date: new Date(month.getFullYear(), month.getMonth(), 12),
        description: 'Partner Salary',
        category: 'Salary',
        type: 'Income',
        ownership: 'Personal',
        accountId: partnerCash.id,
        userId: partner.id,
      },
      {
        id: `tx-rent-${key}`,
        amount: 5500,
        date: new Date(month.getFullYear(), month.getMonth(), 1),
        description: 'Monthly Rent',
        category: 'Housing',
        type: 'Expense',
        ownership: 'Joint',
        accountId: checkingAccount.id,
        userId: assaf.id,
      },
      {
        id: `tx-electricity-${key}`,
        amount: 350,
        date: new Date(month.getFullYear(), month.getMonth(), 15),
        description: 'Electricity Bill',
        category: 'Utilities',
        type: 'Expense',
        ownership: 'Joint',
        accountId: checkingAccount.id,
        userId: assaf.id,
      },
      {
        id: `tx-internet-${key}`,
        amount: 150,
        date: new Date(month.getFullYear(), month.getMonth(), 18),
        description: 'Internet & Phone',
        category: 'Utilities',
        type: 'Expense',
        ownership: 'Joint',
        accountId: checkingAccount.id,
        userId: assaf.id,
      },
      {
        id: `tx-assaf-gas-${key}`,
        amount: 400,
        date: new Date(month.getFullYear(), month.getMonth(), 20),
        description: 'Gas & Parking',
        category: 'Transportation',
        type: 'Expense',
        ownership: 'Personal',
        accountId: checkingAccount.id,
        userId: assaf.id,
      },
      {
        id: `tx-streaming-${key}`,
        amount: entertainmentAmounts[monthOffset],
        date: new Date(month.getFullYear(), month.getMonth(), 22),
        description: 'Streaming Services',
        category: 'Entertainment',
        type: 'Expense',
        ownership: 'Joint',
        accountId: creditCard.id,
        userId: assaf.id,
      },
      {
        id: `tx-dining-${key}`,
        amount: diningAmounts[monthOffset],
        date: new Date(month.getFullYear(), month.getMonth(), 25),
        description: 'Dining Out',
        category: 'Dining Out',
        type: 'Expense',
        ownership: 'Joint',
        accountId: creditCard.id,
        userId: partner.id,
      },
      {
        id: `tx-partner-shopping-${key}`,
        amount: 280,
        date: new Date(month.getFullYear(), month.getMonth(), 21),
        description: 'Partner Shopping',
        category: 'Shopping',
        type: 'Expense',
        ownership: 'Personal',
        accountId: partnerCash.id,
        userId: partner.id,
      },
    ]

    for (let week = 0; week < 4; week++) {
      monthlyTransactions.push({
        id: `tx-groceries-${key}-w${week + 1}`,
        amount: groceryAmounts[week],
        date: new Date(month.getFullYear(), month.getMonth(), 5 + week * 7),
        description: 'Weekly Groceries',
        category: 'Groceries',
        type: 'Expense',
        ownership: 'Joint',
        accountId: checkingAccount.id,
        userId: week % 2 === 0 ? assaf.id : partner.id,
      })
    }

    for (const tx of monthlyTransactions) {
      await prisma.transaction.upsert({
        where: { id: tx.id },
        update: tx,
        create: tx,
      })
    }
  }

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
      update: { limit: budget.limit },
      create: budget,
    })
  }

  const recurringStartDate = new Date(now)
  recurringStartDate.setDate(recurringStartDate.getDate() - 30)
  recurringStartDate.setHours(9, 0, 0, 0)

  const recurringDueDate = new Date(now)
  recurringDueDate.setDate(recurringDueDate.getDate() - 1)
  recurringDueDate.setHours(9, 0, 0, 0)

  const recurringFutureDate = new Date(now)
  recurringFutureDate.setDate(recurringFutureDate.getDate() + 10)
  recurringFutureDate.setHours(9, 0, 0, 0)

  await prisma.recurringTransaction.upsert({
    where: { id: 'recurring-assaf-gym' },
    update: {
      amount: 180,
      description: 'Gym Membership',
      category: 'Healthcare',
      type: 'Expense',
      ownership: 'Personal',
      frequency: 'Monthly',
      startDate: recurringStartDate,
      nextDueDate: recurringDueDate,
      isActive: true,
      accountId: checkingAccount.id,
      userId: assaf.id,
      endDate: null,
      lastProcessed: null,
    },
    create: {
      id: 'recurring-assaf-gym',
      amount: 180,
      description: 'Gym Membership',
      category: 'Healthcare',
      type: 'Expense',
      ownership: 'Personal',
      frequency: 'Monthly',
      startDate: recurringStartDate,
      nextDueDate: recurringDueDate,
      isActive: true,
      accountId: checkingAccount.id,
      userId: assaf.id,
      endDate: null,
      lastProcessed: null,
    },
  })

  await prisma.recurringTransaction.upsert({
    where: { id: 'recurring-partner-freelance' },
    update: {
      amount: 2500,
      description: 'Partner Freelance Retainer',
      category: 'Freelance',
      type: 'Income',
      ownership: 'Personal',
      frequency: 'Monthly',
      startDate: recurringStartDate,
      nextDueDate: recurringFutureDate,
      isActive: true,
      accountId: partnerCash.id,
      userId: partner.id,
      endDate: null,
      lastProcessed: null,
    },
    create: {
      id: 'recurring-partner-freelance',
      amount: 2500,
      description: 'Partner Freelance Retainer',
      category: 'Freelance',
      type: 'Income',
      ownership: 'Personal',
      frequency: 'Monthly',
      startDate: recurringStartDate,
      nextDueDate: recurringFutureDate,
      isActive: true,
      accountId: partnerCash.id,
      userId: partner.id,
      endDate: null,
      lastProcessed: null,
    },
  })

  const upcomingBillDate = new Date(now)
  upcomingBillDate.setDate(upcomingBillDate.getDate() + 2)
  upcomingBillDate.setHours(12, 0, 0, 0)

  const recurringBillDate = new Date(now)
  recurringBillDate.setDate(recurringBillDate.getDate() + 1)
  recurringBillDate.setHours(12, 0, 0, 0)

  await prisma.bill.upsert({
    where: { id: 'bill-internet' },
    update: {
      name: 'Internet Bill',
      amount: 120,
      dueDate: upcomingBillDate,
      category: 'Utilities',
      isPaid: false,
      paidDate: null,
      isRecurring: false,
      frequency: null,
      reminder: 3,
      notes: 'Monthly provider payment',
      userId: assaf.id,
    },
    create: {
      id: 'bill-internet',
      name: 'Internet Bill',
      amount: 120,
      dueDate: upcomingBillDate,
      category: 'Utilities',
      isPaid: false,
      paidDate: null,
      isRecurring: false,
      frequency: null,
      reminder: 3,
      notes: 'Monthly provider payment',
      userId: assaf.id,
    },
  })

  await prisma.bill.upsert({
    where: { id: 'bill-insurance' },
    update: {
      name: 'Car Insurance',
      amount: 340,
      dueDate: recurringBillDate,
      category: 'Insurance',
      isPaid: false,
      paidDate: null,
      isRecurring: true,
      frequency: 'Monthly',
      reminder: 7,
      notes: 'Recurring insurance payment',
      userId: assaf.id,
    },
    create: {
      id: 'bill-insurance',
      name: 'Car Insurance',
      amount: 340,
      dueDate: recurringBillDate,
      category: 'Insurance',
      isPaid: false,
      paidDate: null,
      isRecurring: true,
      frequency: 'Monthly',
      reminder: 7,
      notes: 'Recurring insurance payment',
      userId: assaf.id,
    },
  })

  await prisma.bill.upsert({
    where: { id: 'bill-partner-phone' },
    update: {
      name: 'Partner Phone',
      amount: 90,
      dueDate: upcomingBillDate,
      category: 'Phone',
      isPaid: false,
      paidDate: null,
      isRecurring: false,
      frequency: null,
      reminder: 2,
      notes: 'Partner personal bill',
      userId: partner.id,
    },
    create: {
      id: 'bill-partner-phone',
      name: 'Partner Phone',
      amount: 90,
      dueDate: upcomingBillDate,
      category: 'Phone',
      isPaid: false,
      paidDate: null,
      isRecurring: false,
      frequency: null,
      reminder: 2,
      notes: 'Partner personal bill',
      userId: partner.id,
    },
  })
}
