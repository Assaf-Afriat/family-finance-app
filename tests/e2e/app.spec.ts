import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { resetDatabase } from '../../prisma/testDb'

const workspacePath = 'C:\\Engineer Life OS\\family-finance-app'

function createTestDbPath() {
  return path.resolve(
    workspacePath,
    'prisma',
    `family-finance.e2e-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  )
}

function createArtifactPath(extension: string) {
  return path.resolve(
    workspacePath,
    'prisma',
    `family-finance.artifact-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  )
}

async function launchApp(testDbPath: string) {
  await resetDatabase(testDbPath)

  const app = await electron.launch({
    args: ['.'],
    cwd: workspacePath,
    env: {
      ...process.env,
      FAMILY_FINANCE_DB_PATH: testDbPath,
      FAMILY_FINANCE_TEST_MODE: '1',
    },
  })

  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  return { app, page }
}

async function selectProfile(page: Page, userId: string) {
  await page.getByTestId(`profile-card-${userId}`).click()
  await expect(page.getByTestId('nav-dashboard')).toBeVisible()
}

async function setTestOverride(page: Page, key: string, value: string) {
  await page.evaluate(([overrideKey, overrideValue]) => {
    const targetWindow = window as Window & {
      __codexTestOverrides?: Record<string, string>
    }
    targetWindow.__codexTestOverrides = {
      ...(targetWindow.__codexTestOverrides || {}),
      [overrideKey]: overrideValue,
    }
  }, [key, value] as const)
}

function numericText(value: string | null) {
  return (value || '').replace(/\D/g, '')
}

test.describe('Family Finance Electron app', () => {
  let app: ElectronApplication
  let page: Page
  let testDbPath: string
  let artifactPaths: string[]

  test.beforeEach(async () => {
    artifactPaths = []
    testDbPath = createTestDbPath()
    const launched = await launchApp(testDbPath)
    app = launched.app
    page = launched.page
  })

  test.afterEach(async () => {
    if (app) {
      await app.close()
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
    if (testDbPath) {
      fs.rmSync(testDbPath, { force: true })
      fs.rmSync(`${testDbPath}-journal`, { force: true })
    }
    for (const artifactPath of artifactPaths) {
      fs.rmSync(artifactPath, { force: true })
      fs.rmSync(`${artifactPath}-journal`, { force: true })
    }
  })

  test('keeps personal data isolated by active profile', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-transactions').click()

    await expect(page.getByText('Monthly Salary').first()).toBeVisible()
    await expect(page.getByText('Monthly Rent').first()).toBeVisible()
    await expect(page.getByText('Partner Salary')).toHaveCount(0)
    await expect(page.getByText('Partner Shopping')).toHaveCount(0)
  })

  test('can add a transaction and refresh the list', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-transactions').click()
    await page.getByTestId('add-transaction-button').click()

    await page.getByTestId('transaction-amount-input').fill('123')
    await page.getByTestId('transaction-category-trigger').click()
    await page.getByTestId('transaction-category-option-groceries').click()
    await page.getByTestId('transaction-description-input').fill('E2E Added Transaction')
    await page.getByTestId('transaction-date-input').fill('2026-03-15')
    await page.getByTestId('transaction-submit-button').click()

    await expect(page.getByText('Transaction added')).toBeVisible()
    await expect(page.getByText('E2E Added Transaction')).toBeVisible()
  })

  test('can transfer between accounts', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-accounts').click()
    await page.getByTestId('transfer-button').click()

    await page.getByTestId('transfer-from-account-trigger').click()
    await page.getByTestId('transfer-from-account-option-account-checking').click()
    await page.getByTestId('transfer-to-account-trigger').click()
    await page.getByTestId('transfer-to-account-option-account-savings').click()
    await page.getByTestId('transfer-amount-input').fill('200')
    await page.getByTestId('transfer-description-input').fill('E2E transfer')
    await page.getByTestId('transfer-submit-button').click()

    await expect(page.getByText('Transfer completed successfully')).toBeVisible()
  })

  test('processes recurring transactions and marks a bill paid', async () => {
    await selectProfile(page, 'user-assaf')

    await page.getByTestId('nav-recurring').click()
    await page.getByTestId('process-recurring-button').click()
    await page.getByTestId('nav-transactions').click()
    await expect(page.getByText('Gym Membership').first()).toBeVisible()

    await page.getByTestId('nav-bills').click()
    await page.getByTestId('mark-bill-paid-bill-internet').click()
    await expect(page.getByText(/Bill marked as paid/i)).toBeVisible()
  })

  test('exports csv, imports valid rows, and skips invalid rows from settings', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-settings').click()

    const exportPath = createArtifactPath('csv')
    artifactPaths.push(exportPath)
    await setTestOverride(page, 'exportCsv', exportPath)
    await page.getByTestId('settings-export-button').click()

    await expect.poll(() => fs.existsSync(exportPath)).toBe(true)
    expect(fs.readFileSync(exportPath, 'utf8')).toContain('Monthly Salary')

    await page.getByTestId('settings-import-button').click()
    await page.getByTestId('settings-import-file-input').setInputFiles({
      name: 'transactions.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        [
          'Date,Description,Category,Type,Ownership,Amount',
          '2026-03-17,Imported Valid Row,Groceries,Expense,Personal,88',
          'bad-date,Imported Invalid Row,Other,Expense,Personal,42',
        ].join('\n')
      ),
    })

    await expect(page.getByText('Imported Valid Row')).toHaveCount(0)
    await page.getByTestId('nav-transactions').click()
    await expect(page.getByText('Imported Valid Row')).toBeVisible()
  })

  test('backup and restore returns the UI to the backed-up state', async () => {
    await selectProfile(page, 'user-assaf')

    const backupPath = createArtifactPath('db')
    artifactPaths.push(backupPath)

    await page.getByTestId('nav-settings').click()
    await setTestOverride(page, 'backupDb', backupPath)
    await page.getByTestId('settings-backup-button').click()
    await expect.poll(() => fs.existsSync(backupPath)).toBe(true)

    await page.getByTestId('nav-transactions').click()
    await page.getByTestId('add-transaction-button').click()
    await page.getByTestId('transaction-amount-input').fill('77')
    await page.getByTestId('transaction-category-trigger').click()
    await page.getByTestId('transaction-category-option-groceries').click()
    await page.getByTestId('transaction-description-input').fill('Backup Restore Marker')
    await page.getByTestId('transaction-date-input').fill('2026-03-18')
    await page.getByTestId('transaction-submit-button').click()
    await expect(page.getByText('Backup Restore Marker')).toBeVisible()

    await page.getByTestId('nav-settings').click()
    await setTestOverride(page, 'restoreDb', backupPath)
    await page.getByTestId('settings-restore-button').click()

    await page.getByTestId('nav-transactions').click()
    await expect(page.getByText('Backup Restore Marker')).toHaveCount(0)
  })

  test('reports reflect the active profile totals', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-reports').click()

    const assafIncome = numericText(await page.getByTestId('reports-total-income').textContent())
    expect(assafIncome.startsWith('120000')).toBe(true)
  })

  test('reports change when a different profile is active', async () => {
    await selectProfile(page, 'user-partner')
    await page.getByTestId('nav-reports').click()

    const partnerIncome = numericText(await page.getByTestId('reports-total-income').textContent())
    expect(partnerIncome.startsWith('90000')).toBe(true)
  })

  test('category changes appear in transaction and recurring forms', async () => {
    await selectProfile(page, 'user-assaf')
    await page.getByTestId('nav-settings').click()
    await page.getByTestId('add-category-button').click()
    await page.getByTestId('category-name-input').fill('Pet Care')
    await page.getByTestId('category-submit-button').click()
    await expect(page.getByTestId('category-badge-pet-care')).toBeVisible()

    await page.getByTestId('nav-transactions').click()
    await page.getByTestId('add-transaction-button').click()
    await page.getByTestId('transaction-category-trigger').click()
    await expect(page.getByTestId('transaction-category-option-pet-care')).toBeVisible()
    await page.getByTestId('transaction-category-option-pet-care').click()
    await page.keyboard.press('Escape')

    await page.getByTestId('nav-recurring').click()
    await page.getByTestId('add-recurring-button').click()
    await page.getByTestId('recurring-category-trigger').click()
    await expect(page.getByTestId('recurring-category-option-pet-care')).toBeVisible()
  })
})
