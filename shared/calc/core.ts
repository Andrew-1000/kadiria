import type { Constants, MaterialQty, Mix, ModuleInputs } from './types'

/** Default engineering constants. The admin can override every one of them (calc_constants table). */
export const DEFAULT_CONSTANTS: Constants = {
  concrete_dry_factor: 1.54,
  mortar_dry_factor: 1.33,
  cement_bag_volume: 0.035,
  cement_bag_kg: 50,
  sand_density: 1.6,
  ballast_density: 1.65,
  hardcore_density: 1.8,
  hardcore_compaction_factor: 1.15,
  excavation_bulking_factor: 1.25,
  steel_lap_factor: 1.1,
  rebar_length: 12,
  binding_wire_kg_per_tonne: 10,
  brc_sheet_area: 11.52,
  brc_lap_factor: 1.15,
  dpm_lap_factor: 1.1,
  stone_length: 0.4,
  stone_height: 0.2,
  mortar_joint: 0.012,
  bq_labour_uplift_percent: 30
}

export function round(value: number, places = 2): number {
  const f = 10 ** places
  return Math.round((value + Number.EPSILON) * f) / f
}

export function num(inputs: ModuleInputs, key: string, fallback = 0): number {
  const v = Number(inputs[key])
  return Number.isFinite(v) ? v : fallback
}

export function constant(c: Constants, key: string): number {
  const v = c[key]
  return Number.isFinite(v) ? (v as number) : (DEFAULT_CONSTANTS[key] ?? 0)
}

export function findMix(mixes: Mix[], key: string | number | undefined, kind: Mix['kind']): Mix {
  const found = mixes.find(m => m.key === key && m.kind === kind) ?? mixes.find(m => m.kind === kind)
  if (found) return found
  return kind === 'concrete'
    ? { key: 'c15', name: '1:2:4', kind, cement: 1, sand: 2, ballast: 4 }
    : { key: 'm14', name: '1:4', kind, cement: 1, sand: 4, ballast: 0 }
}

export function mixLabel(mix: Mix): string {
  return mix.kind === 'concrete' ? `${mix.cement}:${mix.sand}:${mix.ballast}` : `${mix.cement}:${mix.sand}`
}

/** Mass of a deformed/plain bar in kg per metre (d in mm): d² / 162. */
export function barMassPerMetre(diameterMm: number): number {
  return (diameterMm * diameterMm) / 162
}

export interface BinderBreakdown { dryVolume: number, cementBags: number, sandTonnes: number, ballastTonnes: number }

/** Cement / sand / ballast for a wet volume of concrete or mortar. */
export function binderMaterials(wetVolume: number, mix: Mix, c: Constants): BinderBreakdown {
  const dryFactor = constant(c, mix.kind === 'concrete' ? 'concrete_dry_factor' : 'mortar_dry_factor')
  const dryVolume = wetVolume * dryFactor
  const parts = mix.cement + mix.sand + (mix.kind === 'concrete' ? mix.ballast : 0)
  if (parts <= 0) return { dryVolume, cementBags: 0, sandTonnes: 0, ballastTonnes: 0 }
  return {
    dryVolume,
    cementBags: (dryVolume * mix.cement / parts) / constant(c, 'cement_bag_volume'),
    sandTonnes: (dryVolume * mix.sand / parts) * constant(c, 'sand_density'),
    ballastTonnes: mix.kind === 'concrete' ? (dryVolume * mix.ballast / parts) * constant(c, 'ballast_density') : 0
  }
}

/**
 * Accumulates material quantities, applies wastage and rounds to purchasable units
 * (bags, bars, sheets and pieces are rounded up; bulk materials to 2 dp).
 */
export class MaterialList {
  private items = new Map<string, MaterialQty>()
  constructor(private wastagePercent: number) {}

  add(materialKey: string, label: string, unit: string, netQuantity: number) {
    if (!(netQuantity > 0)) return
    const existing = this.items.get(materialKey)
    if (existing) existing.netQuantity += netQuantity
    else this.items.set(materialKey, { materialKey, label, unit, netQuantity, quantity: 0 })
  }

  addBinder(b: BinderBreakdown) {
    this.add('cement', 'Cement (50 kg bags)', 'bag', b.cementBags)
    this.add('sand', 'River sand', 'tonne', b.sandTonnes)
    this.add('ballast', 'Ballast (20 mm)', 'tonne', b.ballastTonnes)
  }

  /** Adds reinforcement by total bar length; converts to 12 m bars. */
  addBars(diameterMm: number, totalLength: number, c: Constants, prefix: 'Y' | 'R' = 'Y') {
    if (!(totalLength > 0) || !(diameterMm > 0)) return
    const length = totalLength * constant(c, 'steel_lap_factor')
    const bars = length / constant(c, 'rebar_length')
    const key = `${prefix.toLowerCase()}${diameterMm}`
    this.add(key, `${prefix}${diameterMm} bars (${constant(c, 'rebar_length')} m)`, 'bar', bars)
    const kg = length * barMassPerMetre(diameterMm)
    this.steelKg += kg
  }

  steelKg = 0

  finish(c: Constants): MaterialQty[] {
    if (this.steelKg > 0) {
      this.add('binding_wire', 'Binding wire', 'kg', this.steelKg / 1000 * constant(c, 'binding_wire_kg_per_tonne'))
    }
    const factor = 1 + this.wastagePercent / 100
    const wholeUnits = new Set(['bag', 'bar', 'sheet', 'piece', 'nr', 'roll', 'kg'])
    return [...this.items.values()].map(item => {
      const gross = item.netQuantity * factor
      return {
        ...item,
        netQuantity: round(item.netQuantity, 3),
        quantity: wholeUnits.has(item.unit) ? Math.ceil(gross - 1e-9) : round(gross, 2)
      }
    })
  }
}
