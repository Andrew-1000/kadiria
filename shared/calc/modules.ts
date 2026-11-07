import { M_TO_FT, MaterialList, binderMaterials, constant, findMix, mixLabel, num, round } from './core'
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
const plantSelect: InputDef = { key: 'plant', label: 'Concrete mixing', type: 'select', default: 'mixer', options: [{ label: 'Mixer & poker vibrator (hire)', value: 'mixer' }, { label: 'Hand mixing', value: 'hand' }] }
const wallUnitSelect: InputDef = { key: 'unitType', label: 'Walling units', type: 'select', default: 'stone', options: [{ label: 'Machine-cut stone', value: 'stone' }, { label: 'Concrete blocks', value: 'block' }] }

function result(lines: ResultLine[], list: MaterialList, ctx: { constants: Record<string, number> }, bqLines: BqLine[], warnings: string[] = []): ModuleResult {
  return { lines: lines.map(l => ({ ...l, value: round(l.value, 3) })), materials: list.finish(ctx.constants), bqLines: bqLines.map(b => ({ ...b, quantity: round(b.quantity, 2) })), warnings }
}

function requirePositive(warnings: string[], values: Record<string, number>) {
  for (const [label, v] of Object.entries(values)) if (!(v > 0)) warnings.push(`${label} must be greater than zero.`)
}

const DEFINITIONS: ModuleDef[] = [
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
      'Blinding (t) = Area × Blinding thickness × 1.6 t/m³ (sand or murram)',
      'Plate compactor hire (days) = Area ÷ 200 m² per day'
    ],
    inputs: [
      n('area', 'Ground floor slab area', 'm²', undefined, { required: true }),
      n('thickness', 'Hardcore thickness', 'm', 0.2),
      n('blinding', 'Blinding thickness', 'm', 0.05),
      { key: 'blindingMaterial', label: 'Blinding material', type: 'select', default: 'murram', options: [{ label: 'Murram', value: 'murram' }, { label: 'River sand', value: 'sand' }] },
      { key: 'compaction', label: 'Compaction', type: 'select', default: 'compactor', options: [{ label: 'Plate compactor (hire)', value: 'compactor' }, { label: 'Hand rammed', value: 'hand' }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), T = num(i, 'thickness')
      requirePositive(w, { Area: A, Thickness: T })
      const compacted = A * T
      const loose = compacted * constant(ctx.constants, 'hardcore_compaction_factor')
      const list = new MaterialList(ctx.wastagePercent)
      list.add('hardcore', 'Hardcore', 'tonne', loose * constant(ctx.constants, 'hardcore_density'))
      const blindTonnes = A * num(i, 'blinding') * constant(ctx.constants, 'sand_density')
      if (i.blindingMaterial === 'sand') list.add('sand', 'River sand', 'tonne', blindTonnes)
      else list.add('murram', 'Murram', 'tonne', blindTonnes)
      const compactorDays = i.compaction === 'hand' ? 0 : Math.ceil(A / Math.max(1, constant(ctx.constants, 'compactor_m2_per_day')))
      if (compactorDays) list.addHire('hire_compactor', 'Plate compactor hire', 'day', compactorDays)
      return result([
        { label: 'Compacted volume', value: compacted, unit: 'm³', emphasis: true },
        { label: 'Loose volume', value: loose, unit: 'm³' },
        ...(compactorDays ? [{ label: 'Compactor hire', value: compactorDays, unit: 'days' }] : [])
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
      'Formwork = No. × 2 × (L + W) × Depth',
      'Formwork timber = Area × (22 ft of 6″×1″ + 10 ft of 2″×2″) ÷ 3 uses'
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
      list.addFormwork(formwork, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Bars per base', value: barsAlongL + barsAlongW, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork to sides', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Concrete work', description: `Reinforced concrete (${mixLabel(mix)}) in column bases`, unit: 'm³', quantity: wet, libraryCode: 'SUB-220', carriesMaterialCost: true },
        { billKey: 'substructure', section: 'Reinforcement', description: 'High yield steel bar reinforcement to column bases', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUB-300' },
        { billKey: 'substructure', section: 'Formwork', description: 'Sawn formwork to vertical sides of column bases', unit: 'm²', quantity: formwork, libraryCode: 'SUB-400', materials: ['timber_6x1', 'timber_2x2', 'wire_nails'] }
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
      'DPC = Wall length; rolls = Length ÷ 30 m'
    ],
    inputs: [
      n('length', 'Wall length', 'm', undefined, { required: true }),
      n('height', 'Height (footing to DPC)', 'm', 1.0),
      n('thickness', 'Wall thickness', 'm', 0.2),
      mortarMix('m14'),
      wallUnitSelect
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
      n('cover', 'Concrete cover', 'm', 0.025, { group: 'Reinforcement' }),
      plantSelect
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
      list.addFormwork(formwork, ctx.constants)
      if (i.plant !== 'hand') list.addConcretePlant(wet, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Links', value: linkCount, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Concrete frame', description: `Reinforced concrete (${mixLabel(mix)}) in columns`, unit: 'm³', quantity: wet, libraryCode: 'SUP-100', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield and mild steel reinforcement to columns', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to sides of columns', unit: 'm²', quantity: formwork, libraryCode: 'SUP-400', materials: ['timber_6x1', 'timber_2x2', 'wire_nails'] }
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
      { key: 'soffit', label: 'Formwork to soffit', type: 'select', default: 1, options: [{ label: 'Yes (suspended)', value: 1 }, { label: 'No (on wall / ground)', value: 0 }] },
      plantSelect
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
      list.addFormwork(formwork, ctx.constants)
      if (i.plant !== 'hand') list.addConcretePlant(wet, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Links', value: linkCount, unit: 'nr' },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Concrete frame', description: `Reinforced concrete (${mixLabel(mix)}) in beams`, unit: 'm³', quantity: wet, libraryCode: 'SUP-110', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield and mild steel reinforcement to beams', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to sides and soffits of beams', unit: 'm²', quantity: formwork, libraryCode: 'SUP-410', materials: ['timber_6x1', 'timber_2x2', 'wire_nails'] }
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
      'Termiticide (L) = Area × 50 ml concentrate per m² (1% mix at 5 L/m²)',
      'Mixer & poker hire (days) = Volume ÷ 10 m³ per day'
    ],
    inputs: [
      n('area', 'Slab area', 'm²', undefined, { required: true }),
      n('thickness', 'Thickness', 'm', 0.15),
      concreteMix('c20'),
      { key: 'mesh', label: 'Mesh reinforcement', type: 'select', default: 'brc_a142', options: [{ label: 'BRC A142', value: 'brc_a142' }, { label: 'BRC A98', value: 'brc_a98' }, { label: 'None', value: 'none' }] },
      plantSelect
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
      list.add('termiticide', 'Anti-termite chemical (concentrate)', 'L', A * constant(ctx.constants, 'termiticide_ml_per_m2') / 1000)
      if (i.plant !== 'hand') list.addConcretePlant(wet, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Slab area', value: A, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'substructure', section: 'Ground floor slab', description: 'Anti-termite soil treatment to surfaces of hardcore', unit: 'm²', quantity: A, libraryCode: 'SUB-600', materials: ['termiticide'] },
        { billKey: 'substructure', section: 'Ground floor slab', description: '1000 gauge polythene damp proof membrane laid on blinded hardcore', unit: 'm²', quantity: A, libraryCode: 'SUB-610', materials: ['dpm'] },
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
      'Formwork = Soffit area + Edge perimeter × Thickness',
      'Props = Area × 0.8 per m², hired for 21 days (or bluegum poles bought)'
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
      n('topCoverage', 'Top steel coverage', '%', 40, { group: 'Reinforcement', step: 1, max: 100, help: 'Share of the slab with top (hogging) steel over supports' }),
      { key: 'propping', label: 'Propping', type: 'select', default: 'steel', options: [{ label: 'Steel props (hire)', value: 'steel' }, { label: 'Bluegum poles (buy)', value: 'bluegum' }] },
      plantSelect
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
      list.addFormwork(formwork, ctx.constants)
      list.addProps(A, ctx.constants, String(i.propping ?? 'steel'))
      if (i.plant !== 'hand') list.addConcretePlant(wet, ctx.constants)
      return result([
        { label: 'Concrete volume', value: wet, unit: 'm³', emphasis: true },
        { label: 'Reinforcement weight', value: list.steelKg, unit: 'kg' },
        { label: 'Steel per m²', value: A > 0 ? list.steelKg / A : 0, unit: 'kg/m²' },
        { label: 'Formwork', value: formwork, unit: 'm²' }
      ], list, ctx, [
        { billKey: 'superstructure', section: 'Upper floors', description: `${round(T * 1000, 0)} mm reinforced concrete (${mixLabel(mix)}) suspended floor slab`, unit: 'm³', quantity: wet, libraryCode: 'SUP-200', carriesMaterialCost: true },
        { billKey: 'superstructure', section: 'Reinforcement', description: 'High yield steel bar reinforcement to suspended slab', unit: 'kg', quantity: list.steelKg, libraryCode: 'SUP-300' },
        { billKey: 'superstructure', section: 'Formwork', description: 'Sawn formwork to soffit and edges of suspended slab, including props', unit: 'm²', quantity: formwork, libraryCode: 'SUP-420', materials: ['timber_6x1', 'timber_2x2', 'wire_nails', 'hire_steel_prop', 'bluegum_pole'] }
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
      mortarMix('m14'),
      wallUnitSelect
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
  },
  {
    key: 'roofing',
    name: 'Roofing (Timber Trusses & Mabati)',
    short: 'Roofing',
    description: 'Pitched roof on cypress timber trusses: rafters, ties, struts, purlins and wall plates in standard sizes priced per foot, with iron sheets, ridge, nails, fascia and gutters.',
    billKey: 'roofing',
    icon: 'i-lucide-house',
    formula: [
      'Roof area = (Length + 2·overhang) × (Width + 2·overhang) ÷ cos(pitch)',
      'Trusses = Length ÷ spacing + 1; each = 2 rafters + tie (4″×2″) + struts (3″×2″)',
      'Purlins (3″×2″) = rows per slope × 2 × roof length; wall plates (4″×2″) = 2 × length',
      'Timber ft = metres × 3.28; sheets (m) = Roof area ÷ 0.76 m cover × 1.08 laps',
      'Fascia (9″×1″) = eaves + barge lengths; gutters = 2 × roof length ÷ 4 m'
    ],
    inputs: [
      n('length', 'Building length', 'm', undefined, { required: true }),
      n('width', 'Building width (span)', 'm', undefined, { required: true }),
      n('overhang', 'Eaves overhang', 'm', 0.6),
      n('pitch', 'Roof pitch', '°', 25, { step: 1, max: 45 }),
      n('trussSpacing', 'Truss spacing', 'm', 1.2, { group: 'Timber' }),
      n('purlinSpacing', 'Purlin spacing', 'm', 0.9, { group: 'Timber' }),
      { key: 'sheet', label: 'Roofing sheets', type: 'select', default: 'sheet_g28', options: [{ label: 'Pre-painted G28 (longer life)', value: 'sheet_g28' }, { label: 'Pre-painted G30 (economy)', value: 'sheet_g30' }] },
      { key: 'gutters', label: 'Gutters', type: 'select', default: 1, options: [{ label: 'UPVC gutters & downpipes', value: 1 }, { label: 'None', value: 0 }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const c = ctx.constants
      const L = num(i, 'length'), B = num(i, 'width'), o = num(i, 'overhang')
      const pitch = Math.min(60, Math.max(5, num(i, 'pitch', 25))) * Math.PI / 180
      requirePositive(w, { 'Building length': L, 'Building width': B })
      const span = B + 2 * o
      const roofLen = L + 2 * o
      const rafter = (span / 2) / Math.cos(pitch)
      const rise = (B / 2) * Math.tan(pitch)
      const roofArea = roofLen * span / Math.cos(pitch)
      const spacing = Math.max(0.3, num(i, 'trussSpacing', 1.2))
      const trusses = Math.floor(L / spacing) + 1
      const rafterM = trusses * 2 * rafter
      const tieM = trusses * B
      const strutM = trusses * (rise + 2 * 0.45 * rafter)
      const purlinRows = Math.ceil(rafter / Math.max(0.3, num(i, 'purlinSpacing', 0.9))) + 1
      const purlinM = 2 * purlinRows * roofLen
      const wallPlateM = 2 * L
      const fasciaM = 2 * roofLen + 4 * rafter
      const list = new MaterialList(ctx.wastagePercent)
      const ft = (m: number) => m * M_TO_FT
      list.add('timber_4x2', 'Cypress 4″ × 2″: rafters, ties, wall plates', 'ft', ft(rafterM + tieM + wallPlateM))
      list.add('timber_3x2', 'Cypress 3″ × 2″: struts and purlins', 'ft', ft(strutM + purlinM))
      list.add('timber_9x1', 'Cypress 9″ × 1″ fascia & barge boards', 'ft', ft(fasciaM))
      const structuralFt = ft(rafterM + tieM + wallPlateM + strutM + purlinM + fasciaM)
      list.add('timber_preservative', 'Timber preservative', 'L', structuralFt / 100 * constant(c, 'preservative_l_per_100ft'))
      list.add('wire_nails', 'Wire nails (truss assembly)', 'kg', trusses * constant(c, 'truss_nails_kg'))
      const sheetKey = String(i.sheet ?? 'sheet_g28')
      list.add(sheetKey, `${sheetKey === 'sheet_g30' ? 'G30' : 'G28'} pre-painted iron sheets`, 'm', roofArea / constant(c, 'sheet_cover_width') * constant(c, 'sheet_lap_factor'))
      list.add('ridge_cap', 'Ridge cap', 'm', roofLen)
      list.add('roofing_nails', 'Roofing nails', 'kg', roofArea * constant(c, 'roofing_nails_kg_per_m2'))
      const gutters = num(i, 'gutters', 1) > 0
      if (gutters) {
        list.add('gutter_pvc', 'UPVC gutter (4 m)', 'piece', 2 * roofLen / 4)
        list.add('downpipe_pvc', 'UPVC downpipe (3 m)', 'piece', Math.max(2, Math.ceil(L / 8)) * 2)
      }
      return result([
        { label: 'Roof slope area', value: roofArea, unit: 'm²', emphasis: true },
        { label: 'Trusses', value: trusses, unit: 'nr' },
        { label: 'Rafter length', value: rafter, unit: 'm' },
        { label: 'Total timber', value: structuralFt, unit: 'ft' }
      ], list, ctx, [
        { billKey: 'roofing', section: 'Roof structure', description: `Treated cypress timber roof trusses at ${round(spacing, 2)} m centres, purlins and wall plates (${trusses} trusses)`, unit: 'm²', quantity: roofArea, libraryCode: 'ROF-100', carriesMaterialCost: true, materials: ['timber_4x2', 'timber_3x2', 'timber_preservative', 'wire_nails'] },
        { billKey: 'roofing', section: 'Roof covering', description: `Pre-painted ${sheetKey === 'sheet_g30' ? 'gauge 30' : 'gauge 28'} roofing sheets fixed to purlins, including ridges`, unit: 'm²', quantity: roofArea, libraryCode: 'ROF-110', materials: [sheetKey, 'ridge_cap', 'roofing_nails'] },
        { billKey: 'roofing', section: 'Eaves & rainwater goods', description: '25 × 225 mm treated cypress fascia and barge boards', unit: 'm', quantity: fasciaM, libraryCode: 'ROF-120', materials: ['timber_9x1'] },
        ...(gutters ? [{ billKey: 'roofing', section: 'Eaves & rainwater goods', description: 'UPVC gutters and downpipes complete with fittings', unit: 'm', quantity: 2 * roofLen, libraryCode: 'ROF-130', materials: ['gutter_pvc', 'downpipe_pvc'] }] : [])
      ], w)
    }
  },
  {
    key: 'tiling',
    name: 'Floor & Wall Tiling',
    short: 'Tiling',
    description: 'Ceramic tiles fixed with cement-based adhesive and grouted, for floors, bathrooms and kitchens.',
    billKey: 'finishes',
    icon: 'i-lucide-grid-3x3',
    formula: [
      'Tiles (m²) = Area (+ wastage)',
      'Adhesive (bags) = Area ÷ 4.5 m² per 25 kg bag',
      'Grout (kg) = Area × 0.4 kg/m²'
    ],
    inputs: [
      n('area', 'Area to tile', 'm²', undefined, { required: true }),
      n('skirting', 'Tile skirting length', 'm', 0, { help: 'Optional: perimeter skirting, 100 mm high' }),
      { key: 'surface', label: 'Surface', type: 'select', default: 'floor', options: [{ label: 'Floor tiling', value: 'floor' }, { label: 'Wall tiling', value: 'wall' }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const c = ctx.constants
      const A = num(i, 'area')
      requirePositive(w, { Area: A })
      const tileArea = A + num(i, 'skirting') * 0.1
      const list = new MaterialList(ctx.wastagePercent)
      list.add('ceramic_tile', 'Ceramic tiles', 'm²', tileArea)
      list.add('tile_adhesive', 'Tile adhesive (25 kg)', 'bag', tileArea / Math.max(0.5, constant(c, 'adhesive_m2_per_bag')))
      list.add('tile_grout', 'Tile grout', 'kg', tileArea * constant(c, 'grout_kg_per_m2'))
      const wall = i.surface === 'wall'
      return result([
        { label: 'Tiled area incl. skirting', value: tileArea, unit: 'm²', emphasis: true }
      ], list, ctx, [
        { billKey: 'finishes', section: wall ? 'Wall finishes' : 'Floor finishes', description: `Ceramic ${wall ? 'wall' : 'floor'} tiles fixed with cement-based adhesive and grouted`, unit: 'm²', quantity: A, libraryCode: 'FIN-210', carriesMaterialCost: true }
      ], w)
    }
  },
  {
    key: 'painting',
    name: 'Painting & Decoration',
    short: 'Painting',
    description: 'Emulsion to internal walls and ceilings or weathercoat to external render, over an undercoat.',
    billKey: 'finishes',
    icon: 'i-lucide-paintbrush',
    formula: [
      'Paint (L) = Area × Coats ÷ 10 m² per litre per coat',
      'Undercoat (L) = Area ÷ 8 m² per litre (one coat)'
    ],
    inputs: [
      n('area', 'Area to paint', 'm²', undefined, { required: true }),
      n('coats', 'Finishing coats', 'nr', 2, { step: 1, max: 5 }),
      { key: 'surface', label: 'Surface', type: 'select', default: 'internal', options: [{ label: 'Internal walls & ceilings (emulsion)', value: 'internal' }, { label: 'External render (weathercoat)', value: 'external' }] },
      { key: 'undercoat', label: 'Undercoat', type: 'select', default: 1, options: [{ label: 'One coat of undercoat', value: 1 }, { label: 'None', value: 0 }] }
    ],
    compute(i, ctx) {
      const w: string[] = []
      const c = ctx.constants
      const A = num(i, 'area'), coats = Math.max(1, Math.round(num(i, 'coats', 2)))
      requirePositive(w, { Area: A })
      const external = i.surface === 'external'
      const paintL = A * coats / Math.max(1, constant(c, 'paint_m2_per_l'))
      const list = new MaterialList(ctx.wastagePercent)
      list.add(external ? 'weathercoat' : 'emulsion_paint', external ? 'Exterior weathercoat' : 'Emulsion paint', 'L', paintL)
      if (num(i, 'undercoat', 1) > 0) list.add('undercoat', 'Undercoat', 'L', A / Math.max(1, constant(c, 'undercoat_m2_per_l')))
      return result([
        { label: 'Area', value: A, unit: 'm²', emphasis: true },
        { label: 'Finishing paint', value: paintL, unit: 'L' }
      ], list, ctx, [
        { billKey: 'finishes', section: 'Decoration', description: external ? `Undercoat and ${coats} coats weathercoat paint to external render` : `Undercoat and ${coats} coats emulsion paint to plastered walls and ceilings`, unit: 'm²', quantity: A, libraryCode: external ? 'FIN-420' : 'FIN-400', carriesMaterialCost: true }
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
  const block = i.unitType === 'block'
  const unitKey = `${block ? 'block' : 'stone'}_${T <= 0.16 ? 150 : 200}`
  list.add(unitKey, `${block ? 'Concrete block' : 'Machine-cut stone'} ${Math.round(T * 1000)} mm`, 'piece', stones)
  if (foundation) list.add('dpc_roll', `Bituminous DPC roll (${constant(ctx.constants, 'dpc_roll_length')} m)`, 'roll', L / Math.max(1, constant(ctx.constants, 'dpc_roll_length')))
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
    { billKey, section, description: `${Math.round(T * 1000)} mm thick ${block ? 'concrete block' : 'machine-cut stone'} walling bedded and jointed in cement-sand (${mixLabel(mix)}) mortar${foundation ? ' (foundation walling to DPC)' : ''}`, unit: 'm²', quantity: area, libraryCode: code, carriesMaterialCost: true }
  ]
  if (foundation) bq.push({ billKey, section, description: '200 mm wide bituminous felt damp proof course', unit: 'm', quantity: L, libraryCode: 'SUB-510', materials: ['dpc_roll'] })
  else bq.push({ billKey, section, description: '20 gauge × 32 mm hoop iron walling reinforcement in alternate courses', unit: 'm', quantity: hoop, libraryCode: 'SUP-510', materials: ['hoop_iron'] })
  return result(lines, list, ctx, bq, w)
}

/**
 * Elements in the order they are built on site, with where each one sits in the construction
 * process. Users step through them one after another ("next on site").
 */
const SITE_SEQUENCE: { key: string, stage: string, onSite: string }[] = [
  { key: 'excavation', stage: 'Foundations', onSite: 'After the building is set out on the ground, trenches are dug to foundation depth. Surplus soil is carted away; good soil is kept for backfilling.' },
  { key: 'blinding', stage: 'Foundations', onSite: 'A thin layer of lean concrete is poured at the bottom of the trench so footings sit on a clean, level base and the steel keeps its concrete cover.' },
  { key: 'strip_footing', stage: 'Foundations', onSite: 'A reinforced concrete strip is cast on the blinding under every load-bearing wall. It spreads the weight of the building into the ground.' },
  { key: 'column_bases', stage: 'Foundations', onSite: 'Where the structure has columns, a reinforced pad is cast under each one, usually at the same time as the strip footings.' },
  { key: 'foundation_walling', stage: 'Foundations', onSite: 'Stone walling is built up from the footing to damp-proof-course (DPC) level and capped with a DPC to stop rising damp.' },
  { key: 'hardcore', stage: 'Foundations', onSite: 'Inside the foundation walls the ground is filled with compacted hardcore and blinded with murram or sand, ready to carry the floor slab.' },
  { key: 'ground_slab', stage: 'Foundations', onSite: 'Anti-termite treatment, a polythene DPM and mesh are laid and the ground floor slab is cast. This completes the substructure.' },
  { key: 'columns', stage: 'Superstructure', onSite: 'The frame begins: column steel is fixed, boxed in formwork and concreted, one storey at a time.' },
  { key: 'walling', stage: 'Superstructure', onSite: 'Walls are built from slab level between the columns, with hoop iron in alternate courses and openings left for doors and windows.' },
  { key: 'beams', stage: 'Superstructure', onSite: 'Ring beams and lintels are cast over the walls and openings to tie the structure together and carry the floor or roof above.' },
  { key: 'suspended_slab', stage: 'Superstructure', onSite: 'For storeyed buildings the upper floor slab is cast on propped formwork; the columns-walls-beams cycle then repeats for the next floor.' },
  { key: 'roofing', stage: 'Roofing', onSite: 'Once the ring beam has cured, wall plates are fixed and treated timber trusses lifted into place, braced and tied down; purlins, sheets, ridges, fascia and gutters follow.' },
  { key: 'plaster', stage: 'Finishes', onSite: 'After roofing, first-fix services and door/window frames, walls are plastered inside and rendered outside, ready for painting.' },
  { key: 'tiling', stage: 'Finishes', onSite: 'When plaster and screeds have dried, floors, bathrooms and kitchen splashbacks are tiled, then grouted and cleaned.' },
  { key: 'painting', stage: 'Finishes', onSite: 'Decoration comes last: an undercoat on dry plaster, then finishing coats inside and weathercoat outside, after second-fix electrics and plumbing.' }
]

export const MODULES: ModuleDef[] = SITE_SEQUENCE.map((s) => {
  const def = DEFINITIONS.find(d => d.key === s.key)
  if (!def) throw new Error(`Unknown module in site sequence: ${s.key}`)
  return { ...def, stage: s.stage, onSite: s.onSite }
})

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.key, m])) as Record<string, ModuleDef>

/** Default input values for a module, with admin overrides applied. */
export function moduleDefaults(def: ModuleDef, overrides: Record<string, number | string> = {}): Record<string, number | string | undefined> {
  return Object.fromEntries(def.inputs.map(input => [input.key, overrides[input.key] ?? input.default]))
}
