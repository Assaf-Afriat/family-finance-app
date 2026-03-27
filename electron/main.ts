import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import * as db from './database'

const isDev = process.env.NODE_ENV !== 'production'
const isTestMode = process.env.FAMILY_FINANCE_TEST_MODE === '1'

function buildTransactionsCSV(transactions: Array<{
  amount: number
  date: string | Date
  description: string
  category: string
  type: string
  ownership: string
}>) {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Ownership', 'Amount']
  const rows = transactions.map((transaction) => [
    new Date(transaction.date).toISOString().split('T')[0],
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.ownership,
    transaction.amount.toString(),
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    if (!isTestMode) {
      mainWindow.webContents.openDevTools()
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// IPC Handlers
function setupIpcHandlers() {
  // Users
  ipcMain.handle('db:getUsers', async () => {
    return db.getUsers()
  })

  ipcMain.handle('db:getUser', async (_, id: string) => {
    return db.getUser(id)
  })

  ipcMain.handle('db:createUser', async (_, data: { name: string; avatar?: string }) => {
    return db.createUser(data)
  })

  ipcMain.handle('db:updateUser', async (_, id: string, data: { name: string; avatar?: string }) => {
    return db.updateUser(id, data)
  })

  ipcMain.handle('db:deleteUser', async (_, id: string) => {
    return db.deleteUser(id)
  })

  // Accounts
  ipcMain.handle('db:getAccounts', async (_, userId: string) => {
    return db.getAccounts(userId)
  })

  ipcMain.handle('db:createAccount', async (_, data) => {
    return db.createAccount(data)
  })

  ipcMain.handle('db:updateAccountBalance', async (_, id: string, balance: number) => {
    return db.updateAccountBalance(id, balance)
  })

  ipcMain.handle('db:updateAccount', async (_, id: string, data) => {
    return db.updateAccount(id, data)
  })

  // Transactions
  ipcMain.handle('db:getTransactions', async (_, filters) => {
    return db.getTransactions(filters)
  })

  ipcMain.handle('db:createTransaction', async (_, data) => {
    return db.createTransaction(data)
  })

  ipcMain.handle('db:updateTransaction', async (_, id: string, data) => {
    return db.updateTransaction(id, { ...data, date: new Date(data.date) })
  })

  ipcMain.handle('db:deleteTransaction', async (_, id: string) => {
    return db.deleteTransaction(id)
  })

  ipcMain.handle('db:createTransfer', async (_, data) => {
    return db.createTransfer({
      ...data,
      date: new Date(data.date),
    })
  })

  // Budgets
  ipcMain.handle('db:getBudgets', async (_, userId: string, month?: number, year?: number) => {
    return db.getBudgets(userId, month, year)
  })

  ipcMain.handle('db:createOrUpdateBudget', async (_, data) => {
    return db.createOrUpdateBudget(data)
  })

  ipcMain.handle('db:deleteBudget', async (_, id: string) => {
    return db.deleteBudget(id)
  })

  // Categories
  ipcMain.handle('db:getCategories', async (_, type?: string) => {
    return db.getCategories(type)
  })

  ipcMain.handle('db:createCategory', async (_, data) => {
    return db.createCategory(data)
  })

  ipcMain.handle('db:updateCategory', async (_, id: string, data) => {
    return db.updateCategory(id, data)
  })

  ipcMain.handle('db:deleteCategory', async (_, id: string) => {
    return db.deleteCategory(id)
  })

  // Recurring Transactions
  ipcMain.handle('db:getRecurringTransactions', async (_, userId?: string) => {
    return db.getRecurringTransactions(userId)
  })

  ipcMain.handle('db:createRecurringTransaction', async (_, data) => {
    return db.createRecurringTransaction({
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    })
  })

  ipcMain.handle('db:updateRecurringTransaction', async (_, id: string, data) => {
    return db.updateRecurringTransaction(id, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    })
  })

  ipcMain.handle('db:deleteRecurringTransaction', async (_, id: string) => {
    return db.deleteRecurringTransaction(id)
  })

  ipcMain.handle('db:processRecurringTransactions', async (_, userId: string) => {
    return db.processRecurringTransactions(userId)
  })

  // Dashboard
  ipcMain.handle('db:getDashboardStats', async (_, userId: string, startDate: string, endDate: string) => {
    return db.getDashboardStats(userId, new Date(startDate), new Date(endDate))
  })

  ipcMain.handle('db:getMonthlyTrends', async (_, userId: string, months?: number) => {
    return db.getMonthlyTrends(userId, months)
  })

  // Bills
  ipcMain.handle('db:getBills', async (_, userId: string) => {
    return db.getBills(userId)
  })

  ipcMain.handle('db:createBill', async (_, data) => {
    return db.createBill({
      ...data,
      dueDate: new Date(data.dueDate),
    })
  })

  ipcMain.handle('db:updateBill', async (_, id: string, data) => {
    return db.updateBill(id, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      paidDate: data.paidDate ? new Date(data.paidDate) : data.paidDate,
    })
  })

  ipcMain.handle('db:deleteBill', async (_, id: string) => {
    return db.deleteBill(id)
  })

  ipcMain.handle('db:markBillPaid', async (_, id: string) => {
    return db.markBillPaid(id)
  })

  ipcMain.handle('db:getUpcomingBills', async (_, userId: string, days?: number) => {
    return db.getUpcomingBills(userId, days)
  })

  ipcMain.handle('db:getOverdueBills', async (_, userId: string) => {
    return db.getOverdueBills(userId)
  })

  // Backup and Restore
  ipcMain.handle('db:exportTransactionsCsv', async (_, userId: string, targetPath?: string) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    let filePath = targetPath

    if (!filePath) {
      if (!mainWindow) return { success: false, error: 'No window' }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Transactions',
        defaultPath: `transactions-${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      filePath = result.filePath
    }

    try {
      const transactions = await db.getTransactions({ userId })
      fs.writeFileSync(filePath, buildTransactionsCSV(transactions), 'utf8')
      return { success: true, path: filePath, rowCount: transactions.length }
    } catch (error) {
      console.error('CSV export failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:backupDatabase', async (_, targetPath?: string) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    let filePath = targetPath

    if (!filePath) {
      if (!mainWindow) return { success: false, error: 'No window' }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Database',
        defaultPath: `family-finance-backup-${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database', extensions: ['db'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      filePath = result.filePath
    }

    try {
      await db.backupDatabase(filePath)
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Backup failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:restoreDatabase', async (_, sourcePath?: string) => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    let filePath = sourcePath

    if (!filePath) {
      if (!mainWindow) return { success: false, error: 'No window' }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Restore Database',
        filters: [{ name: 'Database', extensions: ['db'] }],
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      filePath = result.filePaths[0]
    }

    try {
      await db.restoreDatabase(filePath)
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Restore failed:', error)
      return { success: false, error: String(error) }
    }
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', async () => {
  await db.closeDatabase()
})
