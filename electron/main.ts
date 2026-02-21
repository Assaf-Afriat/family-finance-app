import { app, BrowserWindow, ipcMain } from 'electron'
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

  // Transactions
  ipcMain.handle('db:getTransactions', async (_, filters) => {
    return db.getTransactions(filters)
  })

  ipcMain.handle('db:createTransaction', async (_, data) => {
    return db.createTransaction(data)
  })

  ipcMain.handle('db:deleteTransaction', async (_, id: string) => {
    return db.deleteTransaction(id)
  })

  // Budgets
  ipcMain.handle('db:getBudgets', async (_, userId: string, month?: number, year?: number) => {
    return db.getBudgets(userId, month, year)
  })

  ipcMain.handle('db:createOrUpdateBudget', async (_, data) => {
    return db.createOrUpdateBudget(data)
  })

  // Categories
  ipcMain.handle('db:getCategories', async (_, type?: string) => {
    return db.getCategories(type)
  })

  // Dashboard
  ipcMain.handle('db:getDashboardStats', async (_, userId: string, startDate: string, endDate: string) => {
    return db.getDashboardStats(userId, new Date(startDate), new Date(endDate))
  })

  ipcMain.handle('db:getMonthlyTrends', async (_, userId: string, months?: number) => {
    return db.getMonthlyTrends(userId, months)
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
