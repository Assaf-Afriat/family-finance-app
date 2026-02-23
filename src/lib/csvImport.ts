interface ParsedTransaction {
  date: string
  description: string
  category: string
  type: 'Income' | 'Expense'
  ownership: 'Personal' | 'Joint'
  amount: number
}

interface ImportResult {
  success: boolean
  transactions: ParsedTransaction[]
  errors: string[]
  skipped: number
}

export function parseCSV(content: string): ImportResult {
  const lines = content.trim().split('\n')
  const transactions: ParsedTransaction[] = []
  const errors: string[] = []
  let skipped = 0

  if (lines.length < 2) {
    return { success: false, transactions: [], errors: ['CSV file is empty or has no data rows'], skipped: 0 }
  }

  const header = lines[0].toLowerCase()
  const hasHeader = header.includes('date') || header.includes('amount') || header.includes('description')
  const startIndex = hasHeader ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      skipped++
      continue
    }

    try {
      const values = parseCSVLine(line)
      
      if (values.length < 4) {
        errors.push(`Line ${i + 1}: Not enough columns (expected at least 4)`)
        skipped++
        continue
      }

      const [dateStr, description, category, typeStr, ownershipStr, amountStr] = values

      const date = parseDate(dateStr)
      if (!date) {
        errors.push(`Line ${i + 1}: Invalid date format "${dateStr}"`)
        skipped++
        continue
      }

      const amount = parseFloat(amountStr?.replace(/[^0-9.-]/g, '') || values[values.length - 1]?.replace(/[^0-9.-]/g, ''))
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Line ${i + 1}: Invalid amount`)
        skipped++
        continue
      }

      const type = normalizeType(typeStr || (amount > 0 ? 'Income' : 'Expense'))
      const ownership = normalizeOwnership(ownershipStr || 'Personal')

      transactions.push({
        date,
        description: description || 'Imported transaction',
        category: category || 'Other',
        type,
        ownership,
        amount: Math.abs(amount),
      })
    } catch (err) {
      errors.push(`Line ${i + 1}: Parse error`)
      skipped++
    }
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors: errors.slice(0, 10),
    skipped,
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  const cleaned = dateStr.trim().replace(/"/g, '')
  
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  ]

  for (const format of formats) {
    const match = cleaned.match(format)
    if (match) {
      let year: string, month: string, day: string
      
      if (format === formats[0]) {
        [, year, month, day] = match
      } else {
        [, day, month, year] = match
      }

      const date = new Date(`${year}-${month}-${day}`)
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`
      }
    }
  }

  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

function normalizeType(type: string): 'Income' | 'Expense' {
  const lower = type.toLowerCase().trim()
  if (lower.includes('income') || lower.includes('credit') || lower === 'in') {
    return 'Income'
  }
  return 'Expense'
}

function normalizeOwnership(ownership: string): 'Personal' | 'Joint' {
  const lower = ownership.toLowerCase().trim()
  if (lower.includes('joint') || lower.includes('shared')) {
    return 'Joint'
  }
  return 'Personal'
}
