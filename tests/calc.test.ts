import { describe, it, expect } from 'vitest'
import { MODULE_MAP, moduleDefaults } from '../shared/calc/modules'
import { DEFAULT_CONSTANTS, barMassPerMetre } from '../shared/calc/core'
import { autoRate, estimate } from '../shared/calc/estimator'
import { bqSummary, computeDrivers, DEFAULT_PARAMS, readiness } from '../shared/calc/bq'
import type { Mix } from '../shared/calc/types'

const mixes: Mix[] = [
  { key: 'c10', name: '1:3:6', kind: 'concrete', cement: 1, sand: 3, ballast: 6 },
  { key: 'c15', name: '1:2:4', kind: 'concrete', cement: 1, sand: 2, ballast: 4 },
  { key: 'c20', name: '1:1.5:3', kind: 'concrete', cement: 1, sand: 1.5, ballast: 3 },
  { key: 'm14', name: '1:4', kind: 'mortar', cement: 1, sand: 4, ballast: 0 }
]
const ctx = (wastagePercent = 0) => ({ constants: DEFAULT_CONSTANTS, mixes, wastagePercent })
const mat = (r: ReturnType<typeof MODULE_MAP.blinding.compute>, key: string) => r.materials.find(m => m.materialKey === key)

describe('blinding module (matches the documented formula)', () => {
  it('computes wet/dry volume and binder split for 1:3:6', () => {
    const def = MODULE_MAP.blinding!
    const r = def.compute({ ...moduleDefaults(def), perimeter: 45 }, ctx())
    expect(r.lines[0]!.value).toBeCloseTo(1.35, 3)          // 45 × 0.6 × 0.05
    expect(r.lines[1]!.value).toBeCloseTo(2.079, 3)         // × 1.54
    expect(mat(r, 'cement')!.netQuantity).toBeCloseTo(5.94, 2) // 2.079 / 10 / 0.035
    expect(mat(r, 'cement')!.quantity).toBe(6)
    expect(mat(r, 'sand')!.netQuantity).toBeCloseTo(0.998, 3)
    expect(mat(r, 'ballast')!.netQuantity).toBeCloseTo(2.058, 3)
    expect(r.warnings).toEqual([])
  })
  it('applies wastage and rounds bags up', () => {
    const def = MODULE_MAP.blinding!
    const r = def.compute({ ...moduleDefaults(def), perimeter: 45 }, ctx(5))
    expect(mat(r, 'cement')!.quantity).toBe(7) // 6.237 → 7
  })
  it('warns on missing perimeter', () => {
    const def = MODULE_MAP.blinding!
    expect(def.compute(moduleDefaults(def), ctx()).warnings.length).toBeGreaterThan(0)
  })
})

describe('reinforcement', () => {
  it('uses d²/162 bar mass', () => {
    expect(barMassPerMetre(12)).toBeCloseTo(0.889, 3)
  })
  it('columns: 4 × Y12 × 3 m per column plus R8 links', () => {
    const def = MODULE_MAP.columns!
    const r = def.compute({ ...moduleDefaults(def), count: 10 }, ctx())
    const y12 = mat(r, 'y12')!
    expect(y12.netQuantity).toBeCloseTo(10 * 4 * 3 * 1.1 / 12, 3)
    expect(mat(r, 'r8')).toBeTruthy()
    expect(mat(r, 'binding_wire')).toBeTruthy()
  })
})

describe('walling', () => {
  it('computes stones per m² for 400×200 stone with 12 mm joints', () => {
    const def = MODULE_MAP.walling!
    const r = def.compute({ ...moduleDefaults(def), length: 10, height: 3, openings: 5 }, ctx())
    expect(r.lines[0]!.value).toBeCloseTo(25, 3)
    expect(r.lines[1]!.value).toBeCloseTo(1 / (0.412 * 0.212), 2)
    expect(mat(r, 'stone_200')!.quantity).toBe(Math.ceil(25 / (0.412 * 0.212)))
  })
})

describe('estimator', () => {
  it('auto rate is the band midpoint (Nairobi standard = 46,500)', () => {
    expect(autoRate({ minRate: 38000, maxRate: 55000 }, 0, 1)).toBe(46500)
  })
  it('adds labour and add-ons and checks budget', () => {
    const r = estimate({
      floorAreas: [200, 200, 200, 200], ratePerM2: 46500, band: { minRate: 38000, maxRate: 55000 },
      labourPercent: 25, buildingFactor: 1, locationAdjustmentPercent: 0,
      addons: [{ key: 'fees', label: 'Fees', percent: 10 }],
      elements: [{ key: 'a', label: 'A', percent: 60 }, { key: 'b', label: 'B', percent: 40 }],
      budget: 50_000_000
    })
    expect(r.totalArea).toBe(800)
    expect(r.materials).toBe(37_200_000)
    expect(r.labour).toBe(9_300_000)
    expect(r.total).toBe(51_150_000)
    expect(r.budget!.withinBudget).toBe(false)
    expect(r.elements[0]!.amount).toBe(27_900_000)
  })
})

describe('BQ', () => {
  it('summary adds contingency then VAT', () => {
    const s = bqSummary([{ id: '1', number: 1, title: 'A', items: [{ quantity: 10, rate: 1000 }] }], 5, 16)
    expect(s.subtotal).toBe(10000)
    expect(s.contingency).toBe(500)
    expect(s.vat).toBe(1680)
    expect(s.grandTotal).toBe(12180)
  })
  it('derives drivers from floor areas', () => {
    const d = computeDrivers({ ...DEFAULT_PARAMS, floorAreas: [100, 100] })
    expect(d.footprint_area).toBe(100)
    expect(d.total_floor_area).toBe(200)
    expect(d.ext_perimeter).toBeCloseTo(46, 1)
  })
  it('scores readiness', () => {
    expect(readiness({ architectural: 'have', structural: 'have', site: 'have', specification: 'have', services: 'have', approvals: 'have' }).percent).toBe(100)
    expect(readiness({}).level).toBe('Order-of-cost estimate')
  })
})
