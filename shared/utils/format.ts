export function formatMoney(value: number | null | undefined, currency = 'KES', fraction = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${currency} ${value.toLocaleString('en-KE', { minimumFractionDigits: fraction, maximumFractionDigits: fraction })}`
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-KE', { maximumFractionDigits: digits })
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  measured: 'Measured',
  provisional: 'Provisional sum',
  pc_sum: 'Prime cost sum',
  lump_sum: 'Lump sum'
}

export const STATUS_LABELS: Record<string, { label: string, color: 'neutral' | 'warning' | 'info' | 'success' }> = {
  draft: { label: 'Draft', color: 'neutral' },
  submitted: { label: 'In review', color: 'warning' },
  approved: { label: 'Approved', color: 'info' },
  issued: { label: 'Issued', color: 'success' }
}
