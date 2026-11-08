import { round } from './core'

export type BqItemType = 'measured' | 'provisional' | 'pc_sum' | 'lump_sum'

/* ------------------------------------------------------------------ */
/* Prerequisites: what you need before a reliable BQ can be drafted    */
/* ------------------------------------------------------------------ */

export type PrereqStatus = 'have' | 'partial' | 'missing'

export interface Prerequisite {
  key: string
  label: string
  why: string
  /** What the BQ does when this is not available. */
  ifMissing: string
  weight: number
  essential: boolean
}

export const PREREQUISITES: Prerequisite[] = [
  { key: 'architectural', label: 'Architectural drawings', why: 'Floor plans, sections and elevations give the dimensions everything else is measured from.', ifMissing: 'Quantities are approximated from floor areas only; the whole BQ is an order-of-cost estimate.', weight: 25, essential: true },
  { key: 'structural', label: 'Structural drawings & bar bending schedule', why: 'Foundation sizes, concrete grades and reinforcement come from the engineer.', ifMissing: 'Substructure and the concrete frame are marked PROVISIONAL and remeasured on site.', weight: 20, essential: true },
  { key: 'formwork', label: 'Formwork & propping scheme', why: 'Formwork (shuttering) is the temporary timber, plywood or steel mould that holds wet concrete for bases, columns, beams and slabs until it hardens; props hold up beam and slab soffits. The scheme sets the system, how often it is reused and how long props are hired.', ifMissing: 'Formwork is priced on standard allowances (sawn timber reused 3 times, steel props hired about 21 days per slab) and the formwork items are marked PROVISIONAL.', weight: 5, essential: false },
  { key: 'site', label: 'Site survey / soil report', why: 'Ground conditions decide excavation depth, rock, water and foundation type.', ifMissing: 'Excavation assumes normal soil; rock and dewatering are excluded / provisional.', weight: 15, essential: false },
  { key: 'specification', label: 'Specification / finishes schedule', why: 'Describes material quality: tiles, joinery, sanitary ware, paint systems.', ifMissing: 'Finishes and fittings are priced to the selected finish level.', weight: 15, essential: false },
  { key: 'services', label: 'Electrical & plumbing (MEP) designs', why: 'Services are measured from engineer layouts.', ifMissing: 'Electrical, plumbing and drainage are included as Provisional Sums.', weight: 15, essential: false },
  { key: 'approvals', label: 'Approvals & statutory requirements', why: 'County approval, NCA registration and NEMA requirements affect preliminaries.', ifMissing: 'A Provisional Sum is included for statutory approvals, NCA and NEMA fees.', weight: 10, essential: false }
]

export function readiness(statuses: Record<string, string | undefined>) {
  let score = 0
  const total = PREREQUISITES.reduce((s, p) => s + p.weight, 0)
  const missing: Prerequisite[] = []
  for (const p of PREREQUISITES) {
    const s = statuses[p.key] as PrereqStatus | undefined
    if (s === 'have') score += p.weight
    else if (s === 'partial') score += p.weight / 2
    if (s !== 'have') missing.push(p)
  }
  const percent = Math.round(score / total * 100)
  const level = percent >= 85 ? 'Tender-ready' : percent >= 55 ? 'Detailed estimate' : 'Order-of-cost estimate'
  return { percent, level, missing }
}

/* ------------------------------------------------------------------ */
/* Quantity drivers used to generate a first-draft BQ                 */
/* ------------------------------------------------------------------ */

export interface ProjectParams {
  floorAreas: number[]
  wallHeight: number
  /** External perimeter of the ground floor; estimated from footprint when 0. */
  perimeter: number
  foundationDepth: number
  /** Metres of internal wall per m² of floor area. */
  internalWallRatio: number
  doors: number
  windows: number
  /** Average window area (m²). */
  windowSize: number
  roofOverhang: number
  /** Slope factor (1.0 flat, ~1.15 for 30° pitch). */
  roofPitchFactor: number
}

export const DEFAULT_PARAMS: ProjectParams = {
  floorAreas: [120],
  wallHeight: 3.0,
  perimeter: 0,
  foundationDepth: 1.0,
  internalWallRatio: 0.35,
  doors: 8,
  windows: 10,
  windowSize: 1.8,
  roofOverhang: 0.6,
  roofPitchFactor: 1.15
}

export const DRIVERS: Record<string, string> = {
  none: 'Not auto-measured (enter manually)',
  lump: 'Lump sum (1 item)',
  footprint_area: 'Ground floor footprint (m²)',
  total_floor_area: 'Total floor area (m²)',
  upper_floor_area: 'Upper floors area (m²)',
  ext_perimeter: 'External perimeter (m)',
  foundation_length: 'Foundation wall length (m)',
  trench_volume: 'Trench excavation volume (m³)',
  ext_wall_area: 'External wall area, less openings (m²)',
  int_wall_area: 'Internal wall area (m²)',
  wall_area: 'All walling, less openings (m²)',
  plaster_area: 'Internal plaster area (m²)',
  roof_area: 'Roof slope area (m²)',
  window_area: 'Window area (m²)',
  doors: 'Number of doors',
  windows: 'Number of windows',
  floors: 'Number of floors'
}

export function computeDrivers(p: ProjectParams): Record<string, number> {
  const floors = p.floorAreas.filter(a => a > 0)
  const footprint = floors[0] ?? 0
  const totalFloor = floors.reduce((s, a) => s + a, 0)
  const perimeter = p.perimeter > 0 ? p.perimeter : 4 * Math.sqrt(footprint) * 1.15
  const openings = p.windows * p.windowSize + p.doors * 0.5 * 1.9 // external doors ≈ half of all doors
  const extWall = Math.max(0, perimeter * p.wallHeight * floors.length - openings)
  const intWallLength = totalFloor * p.internalWallRatio
  const intWall = Math.max(0, intWallLength * p.wallHeight - p.doors * 0.5 * 1.9 * 2)
  const groundIntWalls = footprint * p.internalWallRatio
  const foundationLength = perimeter + groundIntWalls
  return {
    none: 0,
    lump: 1,
    floors: floors.length,
    footprint_area: round(footprint, 2),
    total_floor_area: round(totalFloor, 2),
    upper_floor_area: round(totalFloor - footprint, 2),
    ext_perimeter: round(perimeter, 2),
    foundation_length: round(foundationLength, 2),
    trench_volume: round(foundationLength * 0.6 * p.foundationDepth, 2),
    ext_wall_area: round(extWall, 2),
    int_wall_area: round(intWall, 2),
    wall_area: round(extWall + intWall, 2),
    plaster_area: round(intWall * 2 + extWall, 2),
    roof_area: round((footprint + perimeter * p.roofOverhang) * p.roofPitchFactor, 2),
    window_area: round(p.windows * p.windowSize, 2),
    doors: p.doors,
    windows: p.windows
  }
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */

export interface ItemLike { quantity: number, rate: number }

export function itemAmount(item: ItemLike): number {
  return round((Number(item.quantity) || 0) * (Number(item.rate) || 0))
}

export interface BillLike<I extends ItemLike = ItemLike> { id: string, number: number, title: string, items: I[] }

export function bqSummary<I extends ItemLike>(bills: BillLike<I>[], contingencyPercent: number, vatPercent: number) {
  const billTotals = bills.map(b => ({ id: b.id, number: b.number, title: b.title, total: round(b.items.reduce((s, i) => s + itemAmount(i), 0)) }))
  const subtotal = round(billTotals.reduce((s, b) => s + b.total, 0))
  const contingency = round(subtotal * contingencyPercent / 100)
  const beforeVat = round(subtotal + contingency)
  const vat = round(beforeVat * vatPercent / 100)
  return { billTotals, subtotal, contingency, beforeVat, vat, grandTotal: round(beforeVat + vat) }
}
