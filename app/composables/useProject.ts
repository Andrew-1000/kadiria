export interface BqItem {
  id: string
  billId: string
  section: string
  description: string
  unit: string
  quantity: number
  rate: number
  itemType: 'measured' | 'provisional' | 'pc_sum' | 'lump_sum'
  source: string
  libraryCode: string | null
  calcSnapshot: null | { module?: { name: string }, materials?: { label: string, quantity: number, unit: string, amount: number | null }[], materialsTotal?: number }
  notes: string
  sort: number
}

export interface BqBill {
  id: string
  templateKey: string | null
  number: number
  title: string
  notes: string
  provisional: boolean
  sort: number
  items: BqItem[]
}

export interface ProjectDetail {
  id: string
  ownerId: string
  lineageId: string
  revision: number
  name: string
  client: string
  siteAddress: string
  preparedBy: string
  locationId: number | null
  buildingTypeKey: string | null
  finishKey: string | null
  currency: string
  status: 'draft' | 'submitted' | 'approved' | 'issued'
  params: Record<string, unknown> & { floorAreas?: number[] }
  prerequisites: Record<string, string>
  assumptions: string
  exclusions: string
  contingencyPercent: number
  vatPercent: number
  createdAt: string
  updatedAt: string
  location: { id: number, name: string } | null
  bills: BqBill[]
  summary: { billTotals: { id: string, number: number, title: string, total: number }[], subtotal: number, contingency: number, beforeVat: number, vat: number, grandTotal: number }
  readiness: { percent: number, level: string, missing: { key: string, label: string, ifMissing: string }[] }
  documents: { id: string, revision: number, issuedAt: string, grandTotal: number, projectId: string }[]
}

export function itemTotal(item: { quantity: number, rate: number }) {
  return Math.round((Number(item.quantity) || 0) * (Number(item.rate) || 0) * 100) / 100
}
