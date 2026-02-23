import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatILS } from './currency'

interface ReportData {
  period: string
  generatedAt: string
  userName: string
  summary: {
    totalIncome: number
    totalExpenses: number
    netSavings: number
    savingsRate: number
  }
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>
  incomeByCategory: Array<{ category: string; amount: number; percentage: number }>
  transactions: Array<{
    date: string
    description: string
    category: string
    type: string
    amount: number
  }>
}

export function generateMonthlyReportPDF(data: ReportData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Family Finance', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Monthly Financial Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Period: ${data.period}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text(`Generated: ${data.generatedAt}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text(`User: ${data.userName}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Summary Section
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Summary', 14, yPos)
  yPos += 8

  const summaryData = [
    ['Total Income', formatILS(data.summary.totalIncome)],
    ['Total Expenses', formatILS(data.summary.totalExpenses)],
    ['Net Savings', formatILS(data.summary.netSavings)],
    ['Savings Rate', `${data.summary.savingsRate.toFixed(1)}%`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Amount']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Expenses by Category
  if (data.expensesByCategory.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Expenses by Category', 14, yPos)
    yPos += 8

    const expenseData = data.expensesByCategory.map((item) => [
      item.category,
      formatILS(item.amount),
      `${item.percentage.toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount', 'Percentage']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 14, right: 14 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Income by Category
  if (data.incomeByCategory.length > 0) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Income by Category', 14, yPos)
    yPos += 8

    const incomeData = data.incomeByCategory.map((item) => [
      item.category,
      formatILS(item.amount),
      `${item.percentage.toFixed(1)}%`,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount', 'Percentage']],
      body: incomeData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 14, right: 14 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Transactions Table
  if (data.transactions.length > 0) {
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Details', 14, yPos)
    yPos += 8

    const transactionData = data.transactions.slice(0, 50).map((t) => [
      t.date,
      t.description.substring(0, 30),
      t.category,
      t.type,
      formatILS(t.amount),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const fileName = `financial-report-${data.period.replace(/\s/g, '-').toLowerCase()}.pdf`
  doc.save(fileName)
}
