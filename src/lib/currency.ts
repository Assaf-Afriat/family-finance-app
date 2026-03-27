export function formatILS(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatILSCompact(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `ILS ${(amount / 1000000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1000) {
    return `ILS ${(amount / 1000).toFixed(1)}K`
  }
  return formatILS(amount)
}

export function parseILS(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}
