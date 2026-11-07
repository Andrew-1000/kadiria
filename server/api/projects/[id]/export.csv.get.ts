import { itemAmount } from '#shared/calc/bq'

const cell = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Spreadsheet-friendly export of the full BQ with collection summary. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user)
  const d = await projectDetail(project)
  const rows: unknown[][] = [
    ['Bill of Quantities', d.name], ['Client', d.client], ['Site', d.siteAddress], ['Revision', d.revision], ['Currency', d.currency], [],
    ['Bill', 'Item', 'Section', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount', 'Type']
  ]
  for (const bill of d.bills) {
    bill.items.forEach((item, idx) => rows.push([
      `${bill.number}. ${bill.title}`, `${bill.number}.${idx + 1}`, item.section, item.description, item.unit, item.quantity, item.rate, itemAmount(item), item.itemType
    ]))
  }
  rows.push([], ['GRAND SUMMARY'])
  for (const b of d.summary.billTotals) rows.push([`Bill ${b.number}`, b.title, '', '', '', '', '', b.total])
  rows.push(['', 'Sub-total', '', '', '', '', '', d.summary.subtotal])
  rows.push(['', `Contingency (${d.contingencyPercent}%)`, '', '', '', '', '', d.summary.contingency])
  rows.push(['', `VAT (${d.vatPercent}%)`, '', '', '', '', '', d.summary.vat])
  rows.push(['', 'GRAND TOTAL', '', '', '', '', '', d.summary.grandTotal])
  const filename = `${d.name.replace(/[^\w-]+/g, '_')}_BQ_rev${d.revision}.csv`
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')
})
