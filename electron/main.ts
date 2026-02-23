import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import * as db from './database'

const isDev = process.env.NODE_ENV !== 'production'

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
    mainWindow.webContents.openDevTools()
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
  ipcMain.handle('db:getAccounts', async (_, userId?: string) => {
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
  ipcMain.handle('db:backupDatabase', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return { success: false, error: 'No window' }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup Database',
      defaultPath: `family-finance-backup-${new Date().toISOString().split('T')[0]}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }

    try {
      await db.backupDatabase(result.filePath)
      return { success: true, path: result.filePath }
    } catch (error) {
      console.error('Backup failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:restoreDatabase', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return { success: false, error: 'No window' }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Restore Database',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    try {
      await db.restoreDatabase(result.filePaths[0])
      return { success: true, path: result.filePaths[0] }
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
