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
    const all = { architectural: 'have', structural: 'have', formwork: 'have', site: 'have', specification: 'have', services: 'have', approvals: 'have' }
    expect(readiness(all).percent).toBe(100)
    // Without a formwork scheme the BQ is still tender-ready (formwork priced on standard allowances)
    const noFormwork = readiness({ ...all, formwork: 'missing' })
    expect(noFormwork.percent).toBe(95)
    expect(noFormwork.level).toBe('Tender-ready')
    expect(noFormwork.missing.map(p => p.key)).toEqual(['formwork'])
    expect(readiness({}).level).toBe('Order-of-cost estimate')
  })
})

describe('construction sequence', () => {
  it('lists the elements in site order, each with its stage and on-site explanation', async () => {
    const { MODULES } = await import('../shared/calc/modules')
    expect(MODULES.map(m => m.key)).toEqual([
      'excavation', 'blinding', 'strip_footing', 'column_bases', 'foundation_walling', 'hardcore',
      'ground_slab', 'columns', 'walling', 'beams', 'suspended_slab', 'roofing', 'plaster', 'tiling', 'painting'
    ])
    for (const m of MODULES) {
      expect(m.stage).toBeTruthy()
      expect((m.onSite ?? '').length).toBeGreaterThan(40)
    }
  })
  it('journey stages are numbered 1..6 and each links to a tool', async () => {
    const { JOURNEY, nextStage, stageForStatus } = await import('../shared/utils/journey')
    expect(JOURNEY.map(s => s.no)).toEqual([1, 2, 3, 4, 5, 6])
    expect(nextStage('plan')?.key).toBe('prepare')
    expect(nextStage('build')).toBeNull()
    expect(stageForStatus('submitted')).toBe('review')
    expect(stageForStatus('issued')).toBe('build')
  })
})

describe('extended materials', () => {
  const m = (r: { materials: { materialKey: string, quantity: number, netQuantity: number }[] }, key: string) => r.materials.find(x => x.materialKey === key)

  it('columns add formwork timber per foot, nails and mixer/poker hire', () => {
    const def = MODULE_MAP.columns!
    const r = def.compute({ ...moduleDefaults(def), count: 10 }, ctx(5))
    const formwork = 10 * 2 * (0.23 + 0.23) * 3 // 27.6 m²
    expect(m(r, 'timber_6x1')!.netQuantity).toBeCloseTo(formwork * 22 / 3, 1)
    expect(m(r, 'timber_2x2')!.netQuantity).toBeCloseTo(formwork * 10 / 3, 1)
    expect(m(r, 'wire_nails')).toBeTruthy()
    expect(m(r, 'hire_mixer')!.quantity).toBe(1) // 1.59 m³ → 1 day
    expect(m(r, 'hire_poker')!.quantity).toBe(1)
    const formworkLine = r.bqLines.find(l => l.libraryCode === 'SUP-400')!
    expect(formworkLine.materials).toContain('timber_6x1')
  })

  it('hand mixing drops the plant hire', () => {
    const def = MODULE_MAP.columns!
    const r = def.compute({ ...moduleDefaults(def), count: 10, plant: 'hand' }, ctx())
    expect(m(r, 'hire_mixer')).toBeUndefined()
  })

  it('suspended slab hires steel props without wastage, or buys bluegum poles', () => {
    const def = MODULE_MAP.suspended_slab!
    const steel = def.compute({ ...moduleDefaults(def), area: 100 }, ctx(10))
    expect(m(steel, 'hire_steel_prop')!.quantity).toBe(80 * 21) // 0.8 props/m² × 21 days, no wastage
    const poles = def.compute({ ...moduleDefaults(def), area: 100, propping: 'bluegum' }, ctx(0))
    expect(m(poles, 'bluegum_pole')!.quantity).toBe(80)
    expect(m(poles, 'hire_steel_prop')).toBeUndefined()
  })

  it('ground slab adds termiticide concentrate at 50 ml/m² routed to the anti-termite line', () => {
    const def = MODULE_MAP.ground_slab!
    const r = def.compute({ ...moduleDefaults(def), area: 120 }, ctx(0))
    expect(m(r, 'termiticide')!.quantity).toBeCloseTo(6, 2)
    expect(r.bqLines.find(l => l.libraryCode === 'SUB-600')!.materials).toEqual(['termiticide'])
  })

  it('foundation walling adds DPC rolls; walling can use concrete blocks', () => {
    const fw = MODULE_MAP.foundation_walling!
    const r = fw.compute({ ...moduleDefaults(fw), length: 65 }, ctx(0))
    expect(m(r, 'dpc_roll')!.quantity).toBe(3) // 65 m ÷ 30 m
    const w = MODULE_MAP.walling!
    const blocks = w.compute({ ...moduleDefaults(w), length: 10, thickness: 0.15, unitType: 'block' }, ctx(0))
    expect(m(blocks, 'block_150')).toBeTruthy()
    expect(m(blocks, 'stone_150')).toBeUndefined()
  })

  it('hardcore uses murram blinding and plate compactor hire by default', () => {
    const def = MODULE_MAP.hardcore!
    const r = def.compute({ ...moduleDefaults(def), area: 250 }, ctx(0))
    expect(m(r, 'murram')).toBeTruthy()
    expect(m(r, 'hire_compactor')!.quantity).toBe(2) // 250 m² ÷ 200 m²/day
  })

  it('roofing: trusses, timber per foot and sheets for a 12 × 8 m house at 25°', () => {
    const def = MODULE_MAP.roofing!
    const r = def.compute({ ...moduleDefaults(def), length: 12, width: 8 }, ctx(0))
    expect(r.lines[0]!.value).toBeCloseTo(134.0, 0) // 13.2 × 9.2 ÷ cos 25°
    expect(r.lines[1]!.value).toBe(11) // trusses
    expect(m(r, 'timber_4x2')!.netQuantity).toBeCloseTo(733.8, 0) // (rafters + ties + wall plates) m × 3.28
    expect(m(r, 'sheet_g28')!.netQuantity).toBeCloseTo(190.4, 0) // area ÷ 0.76 × 1.08
    expect(m(r, 'ridge_cap')!.netQuantity).toBeCloseTo(13.2, 2)
    expect(m(r, 'gutter_pvc')!.quantity).toBe(7) // 26.4 m ÷ 4 m
    expect(r.warnings).toEqual([])
  })

  it('tiling and painting quantities', () => {
    const t = MODULE_MAP.tiling!
    const tr = t.compute({ ...moduleDefaults(t), area: 45 }, ctx(0))
    expect(m(tr, 'tile_adhesive')!.quantity).toBe(10) // 45 ÷ 4.5
    expect(m(tr, 'tile_grout')!.quantity).toBe(18) // 45 × 0.4
    const p = MODULE_MAP.painting!
    const pr = p.compute({ ...moduleDefaults(p), area: 200 }, ctx(0))
    expect(m(pr, 'emulsion_paint')!.quantity).toBeCloseTo(40, 2) // 200 × 2 coats ÷ 10
    expect(m(pr, 'undercoat')!.quantity).toBeCloseTo(25, 2) // 200 ÷ 8
  })
})
