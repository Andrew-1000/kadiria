import { MaterialList, binderMaterials, constant, findMix, mixLabel, num, round } from './core'
import type { InputDef, ModuleDef, ModuleResult, ResultLine, BqLine } from './types'

/*
 * Material quantification modules, following common Kenyan site practice.
 * Every number that is a convention (voids factor, densities, bar length, stone size)
 * comes from ctx.constants so the admin can tune it without a code change.
 */

const BAR_OPTIONS = [6, 8, 10, 12, 16, 20, 25].map(d => ({ label: `${d} mm`, value: d }))

const bar = (key: string, label: string, def: number, group = 'Reinforcement'): InputDef =>
  ({ key, label, type: 'bar', default: def, options: BAR_OPTIONS, group })
const n = (key: string, label: string, unit: string, def: number | undefined, extra: Partial<InputDef> = {}): InputDef =>
  ({ key, label, unit, type: 'number', default: def, min: 0, step: unit === 'nr' ? 1 : 0.01, ...extra })
const concreteMix = (def: string): InputDef => ({ key: 'mix', label: 'Mix ratio', type: 'mix', mixKind: 'concrete', default: def })
const mortarMix = (def: string): InputDef => ({ key: 'mix', label: 'Mortar mix', type: 'mix', mixKind: 'mortar', default: def })

function result(lines: ResultLine[], list: MaterialList, ctx: { constants: Record<string, number> }, bqLines: BqLine[], warnings: string[] = []): ModuleResult {
  return { lines: lines.map(l => ({ ...l, value: round(l.value, 3) })), materials: list.finish(ctx.constants), bqLines: bqLines.map(b => ({ ...b, quantity: round(b.quantity, 2) })), warnings }
}

function requirePositive(warnings: string[], values: Record<string, number>) {
  for (const [label, v] of Object.entries(values)) if (!(v > 0)) warnings.push(`${label} must be greater than zero.`)
}

export const MODULES: ModuleDef[] = [
  {
    key: 'excavation',
    name: 'Excavation',
    short: 'Excavation',
    description: 'Site clearance and trench excavation for strip foundations, with cart-away of surplus soil.',
    billKey: 'substructure',
    icon: 'i-lucide-shovel',
    formula: [
      'Site clearance = Site area (m²)',
      'Excavation = Trench length × Width × Depth',
      'Cart away = Excavation × Bulking factor × Disposal %',
      'Backfill = Excavation − Disposal (compacted)'
    ],
    inputs: [
      n('siteArea', 'Site clearance area', 'm²', 0, { help: 'Area stripped of vegetation / top soil' }),
      n('length', 'Trench length (perimeter + internal walls)', 'm', undefined, { required: true }),
      n('width', 'Trench width', 'm', 0.6),
      n('depth', 'Average depth', 'm', 1.0),
      n('disposalPercent', 'Soil carted away', '%', 60, { step: 1, max: 100 })
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), W = num(i, 'width'), D = num(i, 'depth')
      requirePositive(w, { 'Trench length': L, Width: W, Depth: D })
      const volume = L * W * D
      const disposal = volume * num(i, 'disposalPercent') / 100
      const bulked = disposal * constant(ctx.constants, 'excavation_bulking_factor')
      const backfill = Math.max(0, volume - disposal)
      const list = new MaterialList(ctx.wastagePercent)
      return result([
        { label: 'Site clearance', value: num(i, 'siteArea'), unit: 'm²' },
        { label: 'Trench excavation', value: volume, unit: 'm³', emphasis: true },
        { label: 'Cart away (bulked)', value: bulked, unit: 'm³' },
        { label: 'Backfill & compact', value: backfill, unit: 'm³' }
      ], list, ctx, [
        ...(num(i, 'siteArea') > 0 ? [{ billKey: 'substructure', section: 'Excavation & earthworks', description: 'Clear site of bushes, shrubs and grass and strip top soil average 150 mm deep', unit: 'm²', quantity: num(i, 'siteArea'), libraryCode: 'SUB-010' }] : []),
        { billKey: 'substructure', section: 'Excavation & earthworks', description: `Excavate foundation trench not exceeding ${round(D, 2)} m deep from stripped level`, unit: 'm³', quantity: volume, libraryCode: 'SUB-020' },
        { billKey: 'substructure', section: 'Excavation & earthworks', description: 'Load and cart away surplus excavated material to approved tip', unit: 'm³', quantity: bulked, libraryCode: 'SUB-030' },
        { billKey: 'substructure', section: 'Excavation & earthworks', description: 'Return, fill and ram selected excavated material around foundations', unit: 'm³', quantity: backfill, libraryCode: 'SUB-040' }
      ], w)
    }
  },
  {
    key: 'hardcore',
    name: 'Hardcore Filling',
    short: 'Hardcore',
    description: 'Hardcore filling under ground floor slab, blinded with murram/sand and compacted in layers.',
    billKey: 'substructure',
    icon: 'i-lucide-mountain',
    formula: [
      'Compacted volume = Area × Thickness',
      'Loose volume = Compacted × Compaction factor',
      'Hardcore (t) = Loose volume × Hardcore density',
      'Blinding sand (t) = Area × Blinding thickness × Sand density'
    ],
    inputs: [
      n('area', 'Ground floor slab area', 'm²', undefined, { required: true }),
      n('thickness', 'Hardcore thickness', 'm', 0.2),
      n('blinding', 'Sand / murram blinding thickness', 'm', 0.05)
    ],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), T = num(i, 'thickness')
      requirePositive(w, { Area: A, Thickness: T })
      const compacted = A * T
      const loose = compacted * constant(ctx.constants, 'hardcore_compaction_factor')
      const list = new MaterialList(ctx.wastagePercent)
      list.add('hardcore', 'Hardcore', 'tonne', loose * constant(ctx.constants, 'hardcore_density'))
      list.add('sand', 'River sand', 'tonne', A * num(i, 'blinding') * constant(ctx.constants, 'sand_density'))
      return result([
        { label: 'Compacted volume', value: compacted, unit: 'm³', emphasis: true },
        { label: 'Loose volume', value: loose, unit: 'm³' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Hardcore & blinding', description: `${round(T * 1000, 0)} mm thick approved hardcore filling, well compacted in layers`, unit: 'm²', quantity: A, libraryCode: 'SUB-100', carriesMaterialCost: true },
        ...(num(i, 'blinding') > 0 ? [{ billKey: 'substructure', section: 'Hardcore & blinding', description: `${round(num(i, 'blinding') * 1000, 0)} mm murram / sand blinding to hardcore surfaces`, unit: 'm²', quantity: A, libraryCode: 'SUB-110' }] : [])
      ], w)
    }
  },
  {
    key: 'blinding',
    name: 'Blinding Concrete',
    short: 'Blinding',
    description: 'Thin concrete layer beneath strip footings (typically mix 1:3:6, 50 mm).',
    billKey: 'substructure',
    icon: 'i-lucide-layers',
    formula: [
      'Wet Volume = Perimeter × Width × Thickness',
      'Dry Volume = Wet Volume × 1.54 (voids factor)',
      'Cement Bags = (Dry Vol × C / (C+S+B)) / 0.035 m³ per bag',
      'Sand (t) = (Dry Vol × S / (C+S+B)) × 1.6 t/m³',
      'Ballast (t) = (Dry Vol × B / (C+S+B)) × 1.65 t/m³'
    ],
    inputs: [
      n('perimeter', 'Perimeter', 'm', undefined, { required: true }),
      n('width', 'Width', 'm', 0.6),
      n('thickness', 'Thickness', 'm', 0.05),
      concreteMix('c10')
    ],
    compute(i, ctx) {
      const w: string[] = []
      const P = num(i, 'perimeter'), W = num(i, 'width'), T = num(i, 'thickness')
      requirePositive(w, { Perimeter: P, Width: W, Thickness: T })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const wet = P * W * T
      const b = binderMaterials(wet, mix, ctx.constants)
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(b)
      return result([
        { label: 'Wet volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Dry volume', value: b.dryVolume, unit: 'm³' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Concrete work', description: `${round(T * 1000, 0)} mm thick plain concrete (${mixLabel(mix)}) blinding under strip footings`, unit: 'm²', quantity: P * W, libraryCode: 'SUB-200', carriesMaterialCost: true }
      ], w)
    }
  },
  {
    key: 'strip_footing',
    name: 'Strip Footing',
    short: 'Strip Footing',
    description: 'Continuous reinforced concrete footing under load-bearing walls.',
    billKey: 'substructure',
    icon: 'i-lucide-rectangle-horizontal',
    formula: [
      'Wet Volume = Length × Width × Thickness',
      'Longitudinal steel = No. of bars × Length',
      'Distribution bars = (Length / Spacing + 1) × (Width − 2 × Cover)',
      'Steel ordered = Total length × Lap factor ÷ 12 m bars'
    ],
    inputs: [
      n('length', 'Footing length', 'm', undefined, { required: true }),
      n('width', 'Width', 'm', 0.6),
      n('thickness', 'Thickness', 'm', 0.2),
      concreteMix('c15'),
      n('longBars', 'Longitudinal bars', 'nr', 3, { group: 'Reinforcement', step: 1 }),
      bar('longDia', 'Longitudinal bar size', 12),
      bar('distDia', 'Distribution bar size', 10),
      n('distSpacing', 'Distribution spacing', 'm', 0.2, { group: 'Reinforcement' }),
      n('cover', 'Concrete cover', 'm', 0.05, { group: 'Reinforcement' })
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), W = num(i, 'width'), T = num(i, 'thickness')
      requirePositive(w, { Length: L, Width: W, Thickness: T })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const wet = L * W * T
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      const longLen = num(i, 'longBars') * L
      const spacing = num(i, 'distSpacing')
      const distCount = spacing > 0 ? Math.floor(L / spacing) + 1 : 0
      const distLen = distCount * Math.max(0, W - 2 * num(i, 'cover'))
      list.addBars(num(i, 'longDia'), longLen, ctx.constants)
      list.addBars(num(i, 'distDia'), distLen, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Longitudinal steel', value: longLen, unit: 'm' },
        { label: 'Distribution bars', value: distCount, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Concrete work', description: `Reinforced concrete (${mixLabel(mix)}) in strip footings`, unit: 'm³', quantity: wet, libraryCode: 'SUB-210', carriesMaterialCost: true },
        { billKey: 'substructure', section: 'Reinforcement', description: 'High yield steel bar reinforcement to strip footings, cut, bent and fixed', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUB-300' }
      ], w)
    }
  },
  {
    key: 'column_bases',
    name: 'Column Bases (Pad Footings)',
    short: 'Column Bases',
    description: 'Isolated reinforced pad footings under columns, with a mesh of bars both ways.',
    billKey: 'substructure',
    icon: 'i-lucide-square',
    formula: [
      'Wet Volume = No. of bases × Length × Width × Depth',
      'Bars each way = (Side − 2 × Cover) / Spacing + 1',
      'Bar length = Opposite side − 2 × Cover',
      'Formwork = No. × 2 × (L + W) × Depth'
    ],
    inputs: [
      n('count', 'Number of bases', 'nr', undefined, { required: true, step: 1 }),
      n('length', 'Base length', 'm', 1.2),
      n('width', 'Base width', 'm', 1.2),
      n('depth', 'Base depth', 'm', 0.3),
      concreteMix('c20'),
      bar('barDia', 'Mesh bar size', 12),
      n('spacing', 'Bar spacing', 'm', 0.15, { group: 'Reinforcement' }),
      n('cover', 'Concrete cover', 'm', 0.05, { group: 'Reinforcement' })
    ],
    compute(i, ctx) {
      const w: string[] = []
      const N = Math.round(num(i, 'count')), L = num(i, 'length'), W = num(i, 'width'), D = num(i, 'depth')
      requirePositive(w, { 'Number of bases': N, Length: L, Width: W, Depth: D })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const c = num(i, 'cover'), s = num(i, 'spacing')
      const wet = N * L * W * D
      const barsAlongL = s > 0 ? Math.floor(Math.max(0, W - 2 * c) / s) + 1 : 0
      const barsAlongW = s > 0 ? Math.floor(Math.max(0, L - 2 * c) / s) + 1 : 0
      const steelLen = N * (barsAlongL * Math.max(0, L - 2 * c) + barsAlongW * Math.max(0, W - 2 * c))
      const formwork = N * 2 * (L + W) * D
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      list.addBars(num(i, 'barDia'), steelLen, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Bars per base', value: barsAlongL + barsAlongW, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork to sides', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Concrete work', description: `Reinforced concrete (${mixLabel(mix)}) in column bases`, unit: 'm³', quantity: wet, libraryCode: 'SUB-220', carriesMaterialCost: true },
        { billKey: 'substructure', section: 'Reinforcement', description: 'High yield steel bar reinforcement to column bases', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUB-300' },
        { billKey: 'substructure', section: 'Formwork', description: 'Sawn formwork to vertical sides of column bases', unit: 'm²', quantity: formwork, libraryCode: 'SUB-400' }
      ], w)
    }
  },
  {
    key: 'foundation_walling',
    name: 'Foundation Stone Walling',
    short: 'Foundation Stone',
    description: 'Machine-cut stone walling from footing to DPC level, bedded in cement-sand mortar.',
    billKey: 'substructure',
    icon: 'i-lucide-brick-wall',
    formula: [
      'Wall area = Length × Height',
      'Stones / m² = 1 / ((Stone L + Joint) × (Stone H + Joint))',
      'Mortar (wet) = Area × Thickness − Stones × Stone volume',
      'Mortar dry = Wet × 1.33; split by mix ratio',
      'DPC = Wall length'
    ],
    inputs: [
      n('length', 'Wall length', 'm', undefined, { required: true }),
      n('height', 'Height (footing to DPC)', 'm', 1.0),
      n('thickness', 'Wall thickness', 'm', 0.2),
      mortarMix('m14')
    ],
    compute: (i, ctx) => walling(i, ctx, 'substructure', 'Foundation walling', 'SUB-500', true)
  },
  {
    key: 'columns',
    name: 'Columns',
    short: 'Columns',
    description: 'Reinforced concrete columns with main bars and links (stirrups).',
    billKey: 'superstructure',
    icon: 'i-lucide-columns-3',
    formula: [
      'Wet Volume = No. × Width × Depth × Height',
      'Main steel = No. × Bars × (Height + Lap)',
      'Links = (Height / Spacing + 1) × 2 × ((b − 2c) + (d − 2c)) + hooks',
      'Formwork = No. × 2 × (b + d) × Height'
    ],
    inputs: [
      n('count', 'Number of columns', 'nr', undefined, { required: true, step: 1 }),
      n('width', 'Width (b)', 'm', 0.23),
      n('depth', 'Depth (d)', 'm', 0.23),
      n('height', 'Height per column', 'm', 3.0),
      concreteMix('c20'),
      n('mainBars', 'Main bars per column', 'nr', 4, { group: 'Reinforcement', step: 1 }),
      bar('mainDia', 'Main bar size', 12),
      bar('linkDia', 'Link size', 8),
      n('linkSpacing', 'Link spacing', 'm', 0.2, { group: 'Reinforcement' }),
      n('cover', 'Concrete cover', 'm', 0.025, { group: 'Reinforcement' })
    ],
    compute(i, ctx) {
      const w: string[] = []
      const N = Math.round(num(i, 'count')), b = num(i, 'width'), d = num(i, 'depth'), H = num(i, 'height')
      requirePositive(w, { 'Number of columns': N, Width: b, Depth: d, Height: H })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const c = num(i, 'cover'), s = num(i, 'linkSpacing')
      const wet = N * b * d * H
      const mainLen = N * num(i, 'mainBars') * H
      const linkCount = s > 0 ? N * (Math.floor(H / s) + 1) : 0
      const linkLen = linkCount * (2 * (Math.max(0, b - 2 * c) + Math.max(0, d - 2 * c)) + 0.15)
      const formwork = N * 2 * (b + d) * H
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      list.addBars(num(i, 'mainDia'), mainLen, ctx.constants)
      list.addBars(num(i, 'linkDia'), linkLen, ctx.constants, num(i, 'linkDia') <= 8 ? 'R' : 'Y')
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Links', value: linkCount, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Concrete frame', description: `Reinforced concrete (${mixLabel(mix)}) in columns`, unit: 'm³', quantity: wet, libraryCode: 'SUP-100', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield and mild steel reinforcement to columns', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to sides of columns', unit: 'm²', quantity: formwork, libraryCode: 'SUP-400' }
      ], w)
    }
  },
  {
    key: 'beams',
    name: 'Beams (Ground / Ring Beams)',
    short: 'Beams',
    description: 'Reinforced concrete ground beams, lintels and ring beams.',
    billKey: 'superstructure',
    icon: 'i-lucide-minus',
    formula: [
      'Wet Volume = Length × Width × Depth',
      'Main steel = (Top + Bottom bars) × Length',
      'Links = (Length / Spacing + 1) × 2 × ((b − 2c) + (d − 2c)) + hooks',
      'Formwork = Length × (2 × Depth + Width)  (sides + soffit)'
    ],
    inputs: [
      n('length', 'Total beam length', 'm', undefined, { required: true }),
      n('width', 'Width (b)', 'm', 0.2),
      n('depth', 'Depth (d)', 'm', 0.3),
      concreteMix('c20'),
      n('topBars', 'Top bars', 'nr', 2, { group: 'Reinforcement', step: 1 }),
      n('bottomBars', 'Bottom bars', 'nr', 2, { group: 'Reinforcement', step: 1 }),
      bar('mainDia', 'Main bar size', 12),
      bar('linkDia', 'Link size', 8),
      n('linkSpacing', 'Link spacing', 'm', 0.2, { group: 'Reinforcement' }),
      n('cover', 'Concrete cover', 'm', 0.025, { group: 'Reinforcement' }),
      { key: 'soffit', label: 'Formwork to soffit', type: 'select', default: 1, options: [{ label: 'Yes (suspended)', value: 1 }, { label: 'No (on wall / ground)', value: 0 }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), b = num(i, 'width'), d = num(i, 'depth')
      requirePositive(w, { Length: L, Width: b, Depth: d })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const c = num(i, 'cover'), s = num(i, 'linkSpacing')
      const wet = L * b * d
      const mainLen = (num(i, 'topBars') + num(i, 'bottomBars')) * L
      const linkCount = s > 0 ? Math.floor(L / s) + 1 : 0
      const linkLen = linkCount * (2 * (Math.max(0, b - 2 * c) + Math.max(0, d - 2 * c)) + 0.15)
      const formwork = L * (2 * d + (num(i, 'soffit', 1) ? b : 0))
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      list.addBars(num(i, 'mainDia'), mainLen, ctx.constants)
      list.addBars(num(i, 'linkDia'), linkLen, ctx.constants, num(i, 'linkDia') <= 8 ? 'R' : 'Y')
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Links', value: linkCount, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Concrete frame', description: `Reinforced concrete (${mixLabel(mix)}) in beams`, unit: 'm³', quantity: wet, libraryCode: 'SUP-110', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield and mild steel reinforcement to beams', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to sides and soffits of beams', unit: 'm²', quantity: formwork, libraryCode: 'SUP-410' }
      ], w)
    }
  },
  {
    key: 'ground_slab',
    name: 'Ground Floor Slab',
    short: 'Ground Slab',
    description: 'Concrete ground slab on hardcore with DPM, anti-termite treatment and BRC mesh.',
    billKey: 'substructure',
    icon: 'i-lucide-grid-2x2',
    formula: [
      'Wet Volume = Area × Thickness',
      'BRC sheets = Area × Lap factor ÷ Sheet area (2.4 × 4.8 m)',
      'DPM = Area × Lap factor',
      'Anti-termite treatment = Area'
    ],
    inputs: [
      n('area', 'Slab area', 'm²', undefined, { required: true }),
      n('thickness', 'Thickness', 'm', 0.15),
      concreteMix('c20'),
      { key: 'mesh', label: 'Mesh reinforcement', type: 'select', default: 'brc_a142', options: [{ label: 'BRC A142', value: 'brc_a142' }, { label: 'BRC A98', value: 'brc_a98' }, { label: 'None', value: 'none' }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), T = num(i, 'thickness')
      requirePositive(w, { Area: A, Thickness: T })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const wet = A * T
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      const mesh = String(i.mesh ?? 'brc_a142')
      if (mesh !== 'none') list.add(mesh, `${mesh === 'brc_a98' ? 'BRC A98' : 'BRC A142'} mesh (2.4 × 4.8 m)`, 'sheet', A * constant(ctx.constants, 'brc_lap_factor') / constant(ctx.constants, 'brc_sheet_area'))
      list.add('dpm', 'Polythene DPM (1000 gauge)', 'm²', A * constant(ctx.constants, 'dpm_lap_factor'))
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Slab area', value: A, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Ground floor slab', description: 'Anti-termite soil treatment to surfaces of hardcore', unit: 'm²', quantity: A, libraryCode: 'SUB-600' },
        { billKey: 'substructure', section: 'Ground floor slab', description: '1000 gauge polythene damp proof membrane laid on blinded hardcore', unit: 'm²', quantity: A, libraryCode: 'SUB-610' },
        ...(mesh !== 'none' ? [{ billKey: 'substructure', section: 'Ground floor slab', description: `${mesh === 'brc_a98' ? 'A98' : 'A142'} BRC fabric mesh reinforcement with 200 mm laps`, unit: 'm²', quantity: A, libraryCode: 'SUB-620' }] : []),
        { billKey: 'substructure', section: 'Ground floor slab', description: `${round(T * 1000, 0)} mm reinforced concrete (${mixLabel(mix)}) ground floor slab`, unit: 'm³', quantity: wet, libraryCode: 'SUB-630', carriesMaterialCost: true }
      ], w)
    }
  },
  {
    key: 'suspended_slab',
    name: 'Suspended Slab',
    short: 'Suspended Slab',
    description: 'Reinforced concrete upper floor slab with bottom bars both ways, top bars and soffit formwork.',
    billKey: 'superstructure',
    icon: 'i-lucide-panel-top',
    formula: [
      'Wet Volume = Area × Thickness',
      'Bottom bars = 2 × Area / Spacing (both ways)',
      'Top bars = 2 × Area / Top spacing × Top coverage %',
      'Formwork = Soffit area + Edge perimeter × Thickness'
    ],
    inputs: [
      n('area', 'Slab area', 'm²', undefined, { required: true }),
      n('perimeter', 'Slab edge perimeter', 'm', 0),
      n('thickness', 'Thickness', 'm', 0.15),
      concreteMix('c20'),
      bar('bottomDia', 'Bottom bar size', 12),
      n('bottomSpacing', 'Bottom bar spacing', 'm', 0.15, { group: 'Reinforcement' }),
      bar('topDia', 'Top bar size', 10),
      n('topSpacing', 'Top bar spacing', 'm', 0.2, { group: 'Reinforcement' }),
      n('topCoverage', 'Top steel coverage', '%', 40, { group: 'Reinforcement', step: 1, max: 100, help: 'Share of the slab with top (hogging) steel over supports' })
    ],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), T = num(i, 'thickness')
      requirePositive(w, { Area: A, Thickness: T })
      const mix = findMix(ctx.mixes, i.mix, 'concrete')
      const wet = A * T
      const bs = num(i, 'bottomSpacing'), ts = num(i, 'topSpacing')
      const bottomLen = bs > 0 ? 2 * A / bs : 0
      const topLen = ts > 0 ? 2 * A / ts * num(i, 'topCoverage') / 100 : 0
      const formwork = A + num(i, 'perimeter') * T
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(binderMaterials(wet, mix, ctx.constants))
      list.addBars(num(i, 'bottomDia'), bottomLen, ctx.constants)
      list.addBars(num(i, 'topDia'), topLen, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Steel per m²', value: A > 0 ? list.steelKg / A : 0, unit: 'kg/m²' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Upper floors', description: `${round(T * 1000, 0)} mm reinforced concrete (${mixLabel(mix)}) suspended floor slab`, unit: 'm³', quantity: wet, libraryCode: 'SUP-200', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield steel bar reinforcement to suspended slab', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to soffit and edges of suspended slab, including props', unit: 'm²', quantity: formwork, libraryCode: 'SUP-420' }
      ], w)
    }
  },
  {
    key: 'walling',
    name: 'Walling (Superstructure)',
    short: 'Walling',
    description: 'Machine-cut stone or block walling above DPC, less openings, with hoop iron every alternate course.',
    billKey: 'superstructure',
    icon: 'i-lucide-brick-wall',
    formula: [
      'Net area = Length × Height − Openings',
      'Stones / m² = 1 / ((Stone L + Joint) × (Stone H + Joint))',
      'Mortar (wet) = Net area × Thickness − Stones × Stone volume',
      'Hoop iron = Length × Courses ÷ 2'
    ],
    inputs: [
      n('length', 'Total wall length', 'm', undefined, { required: true }),
      n('height', 'Wall height', 'm', 3.0),
      n('openings', 'Openings (doors & windows)', 'm²', 0),
      n('thickness', 'Wall thickness', 'm', 0.2),
      mortarMix('m14')
    ],
    compute: (i, ctx) => walling(i, ctx, 'superstructure', 'Walling', 'SUP-500', false)
  },
  {
    key: 'plaster',
    name: 'Plaster & Render',
    short: 'Plaster',
    description: 'Cement-sand plaster to internal walls or render to external walls.',
    billKey: 'finishes',
    icon: 'i-lucide-paint-roller',
    formula: [
      'Wet Volume = Area × Thickness',
      'Dry Volume = Wet × 1.33',
      'Cement Bags = (Dry × C / (C+S)) / 0.035',
      'Sand (t) = (Dry × S / (C+S)) × 1.6'
    ],
    inputs: [
      n('area', 'Wall area', 'm²', undefined, { required: true }),
      n('thickness', 'Thickness', 'm', 0.015),
      mortarMix('m14'),
      { key: 'location', label: 'Surface', type: 'select', default: 'internal', options: [{ label: 'Internal plaster', value: 'internal' }, { label: 'External render', value: 'external' }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), T = num(i, 'thickness')
      requirePositive(w, { Area: A, Thickness: T })
      const mix = findMix(ctx.mixes, i.mix, 'mortar')
      const wet = A * T
      const b = binderMaterials(wet, mix, ctx.constants)
      const list = new MaterialList(ctx.wastagePercent)
      list.addBinder(b)
      const external = i.location === 'external'
      return result([
        { label: 'Wet volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Dry volume', value: b.dryVolume, unit: 'm³' }
      ], list, ctx, [
        { billKey: 'finishes', section: external ? 'External finishes' : 'Wall finishes', description: `${round(T * 1000, 0)} mm thick cement-sand (${mixLabel(mix)}) ${external ? 'render to external walls' : 'plaster to internal walls'}`, unit: 'm²', quantity: A, libraryCode: external ? 'FIN-110' : 'FIN-100', carriesMaterialCost: true }
      ], w)
    }
  }
]

function walling(i: Parameters<ModuleDef['compute']>[0], ctx: Parameters<ModuleDef['compute']>[1], billKey: string, section: string, code: string, foundation: boolean): ModuleResult {
  const w: string[] = []
  const L = num(i, 'length'), H = num(i, 'height'), T = num(i, 'thickness')
  requirePositive(w, { Length: L, Height: H, Thickness: T })
  const gross = L * H
  const openings = foundation ? 0 : num(i, 'openings')
  if (openings > gross) w.push('Openings exceed the gross wall area.')
  const area = Math.max(0, gross - openings)
  const sl = constant(ctx.constants, 'stone_length'), sh = constant(ctx.constants, 'stone_height'), j = constant(ctx.constants, 'mortar_joint')
  const perM2 = 1 / ((sl + j) * (sh + j))
  const stones = area * perM2
  const mortarWet = Math.max(0, area * T - stones * sl * sh * T)
  const mix = findMix(ctx.mixes, i.mix, 'mortar')
  const list = new MaterialList(ctx.wastagePercent)
  const stoneKey = T <= 0.16 ? 'stone_150' : 'stone_200'
  list.add(stoneKey, `Machine-cut stone ${Math.round(T * 1000)} mm`, 'piece', stones)
  list.addBinder(binderMaterials(mortarWet, mix, ctx.constants))
  const courses = Math.floor(H / (sh + j))
  const hoop = foundation ? 0 : L * Math.ceil(courses / 2)
  list.add('hoop_iron', 'Hoop iron (20 g × 32 mm)', 'm', hoop)
  const lines: ResultLine[] = [
    { label: 'Net wall area', value: area, unit: 'm²', emphasis: true },
    { label: 'Stones per m²', value: perM2, unit: 'nr' },
    { label: 'Mortar (wet)', value: mortarWet, unit: 'm³' }
  ]
  if (!foundation) lines.push({ label: 'Courses', value: courses, unit: 'nr' })
  const bq: BqLine[] = [
    { billKey, section, description: `${Math.round(T * 1000)} mm thick machine-cut stone walling bedded and jointed in cement-sand (${mixLabel(mix)}) mortar${foundation ? ' (foundation walling to DPC)' : ''}`, unit: 'm²', quantity: area, libraryCode: code, carriesMaterialCost: true }
  ]
  if (foundation) bq.push({ billKey, section, description: '200 mm wide bituminous felt damp proof course', unit: 'm', quantity: L, libraryCode: 'SUB-510' })
  else bq.push({ billKey, section, description: '20 gauge × 32 mm hoop iron walling reinforcement in alternate courses', unit: 'm', quantity: hoop, libraryCode: 'SUP-510' })
  return result(lines, list, ctx, bq, w)
}

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.key, m])) as Record<string, ModuleDef>

/** Default input values for a module, with admin overrides applied. */
export function moduleDefaults(def: ModuleDef, overrides: Record<string, number | string> = {}): Record<string, number | string | undefined> {
  return Object.fromEntries(def.inputs.map(input => [input.key, overrides[input.key] ?? input.default]))
}
