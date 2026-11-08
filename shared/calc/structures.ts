import { MaterialList, binderMaterials, findMix, num, round } from './core'
import { MODULE_MAP } from './modules'
import type { BqLine, InputDef, MaterialQty, ModuleContext, ModuleInputs, ResultLine } from './types'

/*
 * Other structures: boundary walls, latrines, septic tanks, soak pits, fences, paving, tank stands,
 * sheds, and standalone plumbing and electrical installations. Each is assembled from parts: runs of
 * the material calculator modules (same formulas and constants) plus a few extra items. Each part
 * keeps its own materials and BQ lines, so pricing never counts a material twice.
 */

export interface StructurePart {
  label: string
  lines: ResultLine[]
  materials: MaterialQty[]
  bqLines: BqLine[]
}

export interface StructureResult {
  summary: ResultLine[]
  parts: StructurePart[]
  warnings: string[]
}

export interface StructureDef {
  key: string
  name: string
  short: string
  group: 'Site & external works' | 'Sanitation' | 'Small buildings' | 'Services'
  icon: string
  description: string
  inputs: InputDef[]
  compute: (inputs: ModuleInputs, ctx: ModuleContext) => StructureResult
}

const n = (key: string, label: string, unit: string, def: number, extra: Partial<InputDef> = {}): InputDef =>
  ({ key, label, unit, type: 'number', default: def, min: 0, step: unit === 'nr' ? 1 : 0.05, ...extra })
const sel = (key: string, label: string, def: string, options: [string, string][]): InputDef =>
  ({ key, label, type: 'select', default: def, options: options.map(([value, label]) => ({ value, label })) })

const TANKS: [string, string][] = [['none', 'No tank'], ['water_tank_1000', '1,000 L'], ['water_tank_2000', '2,000 L'], ['water_tank_3000', '3,000 L'], ['water_tank_5000', '5,000 L'], ['water_tank_8000', '8,000 L'], ['water_tank_10000', '10,000 L']]
const WALL_UNITS: [string, string][] = [['stone', 'Machine-cut stone'], ['block', 'Concrete blocks']]

/** Run a calculator module with its defaults plus overrides, optionally relabelling its BQ lines. */
function run(key: string, label: string, overrides: ModuleInputs, ctx: ModuleContext, relabel?: (l: BqLine) => Partial<BqLine>, warnings?: string[]): StructurePart {
  const def = MODULE_MAP[key]
  if (!def) throw new Error(`Unknown module ${key}`)
  const defaults = Object.fromEntries(def.inputs.map(i => [i.key, i.default]))
  const r = def.compute({ ...defaults, ...overrides }, ctx)
  if (warnings) warnings.push(...r.warnings)
  return { label, lines: r.lines, materials: r.materials, bqLines: relabel ? r.bqLines.map(l => ({ ...l, ...relabel(l) })) : r.bqLines }
}

/** A part built directly from a material list. */
function custom(label: string, ctx: ModuleContext, build: (list: MaterialList) => { lines?: ResultLine[], bqLines: BqLine[] }): StructurePart {
  const list = new MaterialList(ctx.wastagePercent)
  const out = build(list)
  return { label, lines: (out.lines ?? []).map(l => ({ ...l, value: round(l.value, 3) })), materials: list.finish(ctx.constants), bqLines: out.bqLines.map(b => ({ ...b, quantity: round(b.quantity, 2) })) }
}

/** Reinforced concrete slab (cast on formwork when suspended), bars both ways. */
function rcSlab(label: string, ctx: ModuleContext, o: { area: number, thickness: number, dia: number, spacing: number, formwork: boolean, billKey: string, description: string }): StructurePart {
  return custom(label, ctx, (list) => {
    const mix = findMix(ctx.mixes, 'c20', 'concrete')
    const wet = o.area * o.thickness
    list.addBinder(binderMaterials(wet, mix, ctx.constants))
    const side = Math.sqrt(Math.max(o.area, 0))
    const barsEachWay = Math.ceil(side / o.spacing) + 1
    list.addBars(o.dia, 2 * barsEachWay * side, ctx.constants)
    if (o.formwork) list.addFormwork(o.area, ctx.constants)
    return {
      lines: [{ label: `${label}: concrete`, value: wet, unit: 'm³', emphasis: true }],
      bqLines: [{ billKey: o.billKey, section: 'Concrete work', description: `${o.description}, ${Math.round(o.thickness * 1000)} mm reinforced concrete (1:1.5:3) with Y${o.dia} bars at ${Math.round(o.spacing * 1000)} mm both ways${o.formwork ? ', including formwork' : ''}`, unit: 'm³', quantity: wet, carriesMaterialCost: true }]
    }
  })
}

/** One BQ line carrying a set of supplied items (fixtures, doors, gates, tanks…). */
function supply(label: string, ctx: ModuleContext, billKey: string, section: string, items: { key: string, label: string, unit: string, qty: number, line: string }[]): StructurePart {
  return custom(label, ctx, (list) => {
    const lines: BqLine[] = []
    for (const it of items.filter(x => x.qty > 0)) {
      list.add(it.key, it.label, it.unit, it.qty)
      lines.push({ billKey, section, description: it.line, unit: it.unit === 'piece' ? 'nr' : it.unit, quantity: it.qty, materials: [it.key], carriesMaterialCost: lines.length === 0 })
    }
    return { bqLines: lines }
  })
}

export const STRUCTURES: StructureDef[] = [
  {
    key: 'boundary_wall',
    name: 'Boundary wall & gate',
    short: 'Boundary wall',
    group: 'Site & external works',
    icon: 'i-lucide-brick-wall',
    description: 'Stone or block perimeter wall on a strip footing, with an optional gate opening and render.',
    inputs: [
      n('length', 'Wall length', 'm', 60, { required: true }),
      n('height', 'Height above ground', 'm', 2.4),
      n('thickness', 'Wall thickness', 'm', 0.2),
      sel('unitType', 'Walling units', 'stone', WALL_UNITS),
      n('foundationDepth', 'Foundation depth', 'm', 0.6),
      sel('gate', 'Gate', 'vehicle', [['none', 'No gate'], ['pedestrian', 'Pedestrian gate (1.0 m)'], ['vehicle', 'Vehicle gate (3.6 m)'], ['both', 'Vehicle + pedestrian']]),
      sel('finish', 'Finish', 'fair', [['fair', 'Fair-faced (no render)'], ['render', 'Rendered and painted both sides']])
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), H = num(i, 'height'), D = num(i, 'foundationDepth'), T = num(i, 'thickness')
      if (!(L > 0)) w.push('Wall length must be greater than zero.')
      const gate = String(i.gate)
      const gateArea = (gate === 'vehicle' || gate === 'both' ? 3.6 * H : 0) + (gate === 'pedestrian' || gate === 'both' ? 1.0 * Math.min(H, 2.1) : 0)
      const parts: StructurePart[] = [
        run('excavation', 'Excavation', { length: L, width: 0.6, depth: D, disposalPercent: 30, siteArea: 0 }, ctx, undefined, w),
        run('blinding', 'Blinding', { perimeter: L, width: 0.6 }, ctx, undefined, w),
        run('strip_footing', 'Strip footing', { length: L, width: 0.6, thickness: 0.2 }, ctx, undefined, w),
        run('foundation_walling', 'Foundation walling', { length: L, height: D, thickness: T, unitType: i.unitType }, ctx, undefined, w),
        run('walling', 'Wall above ground', { length: L, height: H, openings: gateArea, thickness: T, unitType: i.unitType }, ctx, l => ({ billKey: 'external', section: 'Boundary wall' }), w)
      ]
      if (i.finish === 'render') {
        const area = 2 * Math.max(0, L * H - gateArea)
        parts.push(run('plaster', 'Render both sides', { area, thickness: 0.015, location: 'external' }, ctx, l => ({ billKey: 'external', section: 'Boundary wall' }), w))
        parts.push(run('painting', 'Paint both sides', { area, surface: 'external' }, ctx, l => ({ billKey: 'external', section: 'Boundary wall' }), w))
      }
      const gates = [
        ...(gate === 'vehicle' || gate === 'both' ? [{ key: 'gate_vehicle', label: 'Steel vehicle gate (3.6 m) with posts', unit: 'piece', qty: 1, line: 'Supply and fix steel vehicle gate, 3.6 m wide, complete with posts, hinges and lock' }] : []),
        ...(gate === 'pedestrian' || gate === 'both' ? [{ key: 'gate_pedestrian', label: 'Steel pedestrian gate (1.0 m)', unit: 'piece', qty: 1, line: 'Supply and fix steel pedestrian gate, 1.0 m wide, complete with hinges and lock' }] : [])
      ]
      if (gates.length) parts.push(supply('Gates', ctx, 'external', 'Gates', gates))
      return { summary: [{ label: 'Wall length', value: L, unit: 'm', emphasis: true }, { label: 'Wall area above ground', value: round(L * H - gateArea, 2), unit: 'm²' }], parts, warnings: w }
    }
  },
  {
    key: 'pit_latrine',
    name: 'Pit / VIP latrine',
    short: 'Pit latrine',
    group: 'Sanitation',
    icon: 'i-lucide-toilet',
    description: 'Ventilated improved pit latrine: excavated pit with lining, reinforced squatting slab, cubicles, roof, doors and vent pipes.',
    inputs: [
      n('doors', 'Number of cubicles (doors)', 'nr', 2, { min: 1, max: 10 }),
      n('pitDepth', 'Pit depth', 'm', 4),
      n('pitWidth', 'Pit width', 'm', 1.5),
      sel('lining', 'Pit lining', 'full', [['full', 'Stone lining, full depth'], ['collar', 'Top 1 m collar only (stable ground)']]),
      sel('walls', 'Cubicle walls', 'stone', [['stone', 'Machine-cut stone'], ['block', 'Concrete blocks'], ['sheet', 'Iron sheets on timber frame']]),
      n('wallHeight', 'Cubicle height', 'm', 2.2)
    ],
    compute(i, ctx) {
      const w: string[] = []
      const doors = Math.max(1, Math.round(num(i, 'doors'))), D = num(i, 'pitDepth'), PW = num(i, 'pitWidth'), H = num(i, 'wallHeight')
      const PL = doors * 1.2 + 0.2
      const perimeter = 2 * (PL + PW)
      const slabArea = (PL + 0.4) * (PW + 0.4)
      const parts: StructurePart[] = [
        run('excavation', 'Pit excavation', { length: PL + 0.4, width: PW + 0.4, depth: D, disposalPercent: 100, siteArea: slabArea * 2 }, ctx, l => ({ section: 'Pit' }), w),
        run('foundation_walling', 'Pit lining', { length: perimeter, height: i.lining === 'collar' ? 1 : D, thickness: 0.15, unitType: 'stone' }, ctx, l => ({ section: 'Pit', description: `150 mm machine-cut stone pit lining in cement-sand mortar, ${i.lining === 'collar' ? 'top 1 m collar' : 'full depth with open vertical joints below 1 m (honeycomb)'}` }), w),
        rcSlab('Squatting slab', ctx, { area: slabArea, thickness: 0.1, dia: 10, spacing: 0.15, formwork: true, billKey: 'substructure', description: `Squatting slab over pit with ${doors} drop hole${doors > 1 ? 's' : ''}` })
      ]
      const wallLength = perimeter + (doors - 1) * PW
      const openings = doors * 0.8 * 2.0
      if (i.walls === 'sheet') {
        parts.push(custom('Cubicles (iron sheet)', ctx, (list) => {
          const area = Math.max(0, wallLength * H - openings)
          list.add('timber_3x2', 'Timber 3″ × 2″ frame (treated)', 'ft', (wallLength * 3 + (Math.ceil(wallLength / 0.6) + 1) * H) * 3.2808)
          list.add('sheet_g30', 'Corrugated sheet G30 (cladding)', 'm', area / 0.76)
          list.add('roofing_nails', 'Roofing nails', 'kg', area * 0.08)
          return { bqLines: [{ billKey: 'superstructure', section: 'Cubicles', description: 'Gauge 30 corrugated iron sheet cubicle walls on treated 3″ × 2″ timber frame', unit: 'm²', quantity: area, carriesMaterialCost: true }] }
        }))
      }
      else {
        parts.push(run('walling', 'Cubicle walls', { length: wallLength, height: H, openings, thickness: 0.15, unitType: i.walls }, ctx, l => ({ section: 'Cubicles' }), w))
      }
      parts.push(custom('Roof', ctx, (list) => {
        const area = (PL + 0.6) * (PW + 0.6) * 1.05
        list.add('sheet_g30', 'Corrugated sheet G30 (roof)', 'm', area / 0.76 * 1.08)
        list.add('timber_3x2', 'Timber 3″ × 2″ purlins (treated)', 'ft', (Math.ceil((PW + 0.6) / 0.9) + 1) * (PL + 0.6) * 3.2808)
        list.add('roofing_nails', 'Roofing nails', 'kg', area * 0.08)
        return { bqLines: [{ billKey: 'roofing', section: 'Roof', description: 'Mono-pitch roof: gauge 30 corrugated iron sheets on treated 3″ × 2″ purlins', unit: 'm²', quantity: area, carriesMaterialCost: true }] }
      }))
      parts.push(supply('Doors and vent pipes', ctx, 'doors_windows', 'Doors and vents', [
        { key: 'door_hollow_core', label: 'Cubicle door with frame', unit: 'piece', qty: doors, line: 'Cubicle door with frame, hinges and bolt' },
        { key: 'pvc_110', label: 'PVC 110 mm vent pipe', unit: 'piece', qty: doors, line: '110 mm PVC vent pipe with fly screen, one per pit compartment (VIP)' }
      ]))
      return { summary: [{ label: 'Pit volume', value: round(PL * PW * D, 2), unit: 'm³', emphasis: true }, { label: 'Cubicles', value: doors, unit: 'nr' }], parts, warnings: w }
    }
  },
  {
    key: 'septic_tank',
    name: 'Septic tank',
    short: 'Septic tank',
    group: 'Sanitation',
    icon: 'i-lucide-container',
    description: 'Two-chamber reinforced septic tank: excavation, base slab, stone walls with baffle, internal render and cover slab with manholes.',
    inputs: [
      n('length', 'Internal length', 'm', 2.4),
      n('width', 'Internal width', 'm', 1.2),
      n('depth', 'Liquid depth', 'm', 1.5)
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), W = num(i, 'width'), D = num(i, 'depth')
      const ext = (L + 0.4) * (W + 0.4)
      const wallH = D + 0.3
      const parts: StructurePart[] = [
        run('excavation', 'Excavation', { length: L + 0.8, width: W + 0.8, depth: D + 0.6, disposalPercent: 70, siteArea: 0 }, ctx, undefined, w),
        run('blinding', 'Blinding', { perimeter: L + 0.8, width: W + 0.8 }, ctx, undefined, w),
        rcSlab('Base slab', ctx, { area: ext, thickness: 0.15, dia: 12, spacing: 0.2, formwork: false, billKey: 'substructure', description: 'Septic tank base slab' }),
        run('walling', 'Walls and baffle', { length: 2 * (L + W) + W, height: wallH, openings: 0, thickness: 0.2, unitType: 'stone' }, ctx, l => ({ billKey: 'substructure', section: 'Tank walls' }), w),
        run('plaster', 'Internal render', { area: 2 * (L + W) * wallH + 2 * W * wallH + L * W, thickness: 0.02, location: 'internal' }, ctx, l => ({ billKey: 'substructure', section: 'Tank walls', description: '20 mm cement-sand (1:3) render to tank walls, baffle and floor, steel-trowelled' }), w),
        rcSlab('Cover slab', ctx, { area: ext, thickness: 0.15, dia: 10, spacing: 0.15, formwork: true, billKey: 'substructure', description: 'Septic tank cover slab with two manhole openings' }),
        supply('Manhole covers', ctx, 'substructure', 'Covers', [{ key: 'manhole_cover_450', label: 'Manhole cover 450 × 450 mm', unit: 'piece', qty: 2, line: 'Supply and fix 450 × 450 mm manhole cover and frame' }])
      ]
      return { summary: [{ label: 'Liquid capacity', value: round(L * W * D, 2), unit: 'm³', emphasis: true }, { label: 'Liquid capacity', value: round(L * W * D * 1000), unit: 'L' }], parts, warnings: w }
    }
  },
  {
    key: 'soak_pit',
    name: 'Soak pit',
    short: 'Soak pit',
    group: 'Sanitation',
    icon: 'i-lucide-circle-dot',
    description: 'Square soak pit with honeycomb stone lining and reinforced cover slab, for septic tank effluent or grey water.',
    inputs: [n('size', 'Internal size (square)', 'm', 1.5), n('depth', 'Depth', 'm', 3)],
    compute(i, ctx) {
      const w: string[] = []
      const S = num(i, 'size'), D = num(i, 'depth')
      const parts: StructurePart[] = [
        run('excavation', 'Excavation', { length: S + 0.4, width: S + 0.4, depth: D, disposalPercent: 100, siteArea: 0 }, ctx, undefined, w),
        run('foundation_walling', 'Honeycomb lining', { length: 4 * (S + 0.15), height: D, thickness: 0.15, unitType: 'stone' }, ctx, l => ({ section: 'Soak pit', description: '150 mm machine-cut stone honeycomb lining (open vertical joints) to soak pit' }), w),
        rcSlab('Cover slab', ctx, { area: (S + 0.4) ** 2, thickness: 0.1, dia: 10, spacing: 0.15, formwork: true, billKey: 'substructure', description: 'Soak pit cover slab with manhole opening' }),
        supply('Manhole cover', ctx, 'substructure', 'Covers', [{ key: 'manhole_cover_450', label: 'Manhole cover 450 × 450 mm', unit: 'piece', qty: 1, line: 'Supply and fix 450 × 450 mm manhole cover and frame' }])
      ]
      return { summary: [{ label: 'Soak pit volume', value: round(S * S * D, 2), unit: 'm³', emphasis: true }], parts, warnings: w }
    }
  },
  {
    key: 'fence',
    name: 'Fence',
    short: 'Fence',
    group: 'Site & external works',
    icon: 'i-lucide-fence',
    description: 'Chain-link or barbed-wire fence on treated timber posts set in concrete.',
    inputs: [
      n('length', 'Fence length', 'm', 100, { required: true }),
      sel('type', 'Fence type', 'chainlink', [['chainlink', 'Chain link mesh'], ['barbed', 'Barbed wire strands']]),
      n('strands', 'Barbed wire strands (or top strands over chain link)', 'nr', 3, { max: 12 }),
      n('postSpacing', 'Post spacing', 'm', 3)
    ],
    compute(i, ctx) {
      const L = num(i, 'length'), sp = Math.max(1, num(i, 'postSpacing')), strands = Math.round(num(i, 'strands'))
      const posts = Math.ceil(L / sp) + 1
      const chain = i.type === 'chainlink'
      const parts: StructurePart[] = [
        custom('Posts', ctx, (list) => {
          list.add('treated_pole_10ft', 'Treated timber post (10 ft)', 'piece', posts)
          list.addBinder(binderMaterials(posts * 0.3 * 0.3 * 0.6, findMix(ctx.mixes, 'c15', 'concrete'), ctx.constants))
          return { lines: [{ label: 'Posts', value: posts, unit: 'nr', emphasis: true }], bqLines: [{ billKey: 'external', section: 'Fencing', description: `Treated timber fence posts at ${sp} m centres, 600 mm into 300 × 300 mm concrete footings`, unit: 'nr', quantity: posts, carriesMaterialCost: true }] }
        }),
        custom('Fencing', ctx, (list) => {
          if (chain) list.add('chain_link_m', 'Chain link mesh, 1.8 m high', 'm', L)
          if (strands > 0) list.add('barbed_wire_m', 'Barbed wire', 'm', L * strands)
          list.add('binding_wire', 'Tie wire', 'kg', L * 0.05)
          return { bqLines: [{ billKey: 'external', section: 'Fencing', description: chain ? `1.8 m chain-link fencing${strands ? ` with ${strands} strands of barbed wire over` : ''}, fixed to posts` : `${strands} strands of barbed wire fixed to posts`, unit: 'm', quantity: L, carriesMaterialCost: true }] }
        })
      ]
      return { summary: [{ label: 'Fence length', value: L, unit: 'm', emphasis: true }, { label: 'Posts', value: posts, unit: 'nr' }], parts, warnings: [] }
    }
  },
  {
    key: 'paving',
    name: 'Paving / driveway',
    short: 'Paving',
    group: 'Site & external works',
    icon: 'i-lucide-grid-3x3',
    description: 'Cabro (concrete block) paving on hardcore and a sand bed, with precast kerbs.',
    inputs: [n('area', 'Paved area', 'm²', 80, { required: true }), n('kerbs', 'Kerb length (edges)', 'm', 36)],
    compute(i, ctx) {
      const w: string[] = []
      const A = num(i, 'area'), K = num(i, 'kerbs')
      const parts: StructurePart[] = [
        run('excavation', 'Reduce level', { length: A, width: 1, depth: 0.25, disposalPercent: 100, siteArea: A }, ctx, l => ({ billKey: 'external', section: 'Paving' }), w),
        run('hardcore', 'Hardcore and sand bed', { area: A, thickness: 0.15, blinding: 0.05 }, ctx, l => ({ billKey: 'external', section: 'Paving' }), w),
        { label: 'Cabro blocks', lines: [], materials: [], bqLines: [{ billKey: 'external', section: 'Paving', description: '80 mm concrete paving blocks (cabro) on sand bed, joints filled with sand, compacted', unit: 'm²', quantity: A, libraryCode: 'EXT-100' }] }
      ]
      if (K > 0) parts.push(supply('Kerbs', ctx, 'external', 'Paving', [{ key: 'kerb_precast_m', label: 'Precast concrete kerb', unit: 'm', qty: K, line: 'Precast concrete kerbs bedded and haunched in concrete' }]))
      return { summary: [{ label: 'Paved area', value: A, unit: 'm²', emphasis: true }], parts, warnings: w }
    }
  },
  {
    key: 'tank_stand',
    name: 'Water tank stand',
    short: 'Tank stand',
    group: 'Site & external works',
    icon: 'i-lucide-cylinder',
    description: 'Reinforced concrete tank tower: four columns on pad bases, tie and ring beams, and a top slab; optionally with the tank.',
    inputs: [n('height', 'Platform height', 'm', 3), n('side', 'Platform size (square)', 'm', 2), sel('tank', 'Tank', 'water_tank_5000', TANKS)],
    compute(i, ctx) {
      const w: string[] = []
      const H = num(i, 'height'), S = num(i, 'side')
      const parts: StructurePart[] = [
        run('excavation', 'Excavation for bases', { length: 4, width: 1.2, depth: 1.0, disposalPercent: 30, siteArea: (S + 1) ** 2 }, ctx, undefined, w),
        run('column_bases', 'Column bases', { count: 4, length: 1.0, width: 1.0, depth: 0.3 }, ctx, undefined, w),
        run('columns', 'Columns', { count: 4, height: H + 0.8 }, ctx, undefined, w),
        run('beams', 'Tie and ring beams', { length: 8 * S }, ctx, undefined, w),
        run('suspended_slab', 'Top slab', { area: S * S, perimeter: 4 * S, thickness: 0.15 }, ctx, undefined, w)
      ]
      const tank = String(i.tank)
      if (tank !== 'none') parts.push(supply('Tank', ctx, 'services', 'Water storage', [{ key: tank, label: `Plastic water tank ${TANKS.find(t => t[0] === tank)?.[1] ?? ''}`, unit: 'piece', qty: 1, line: `Supply and install ${TANKS.find(t => t[0] === tank)?.[1] ?? ''} plastic water tank on the stand` }]))
      return { summary: [{ label: 'Platform', value: S * S, unit: 'm²', emphasis: true }, { label: 'Height', value: H, unit: 'm' }], parts, warnings: w }
    }
  },
  {
    key: 'shed',
    name: 'Store / shed',
    short: 'Store / shed',
    group: 'Small buildings',
    icon: 'i-lucide-warehouse',
    description: 'Small single-room building: foundations, floor slab, walls, trussed iron-sheet roof, door and window.',
    inputs: [
      n('length', 'Length', 'm', 4), n('width', 'Width', 'm', 3), n('wallHeight', 'Wall height', 'm', 2.7),
      sel('walls', 'Walls', 'stone', [['stone', 'Machine-cut stone'], ['block', 'Concrete blocks'], ['sheet', 'Iron sheets on timber frame']]),
      n('doors', 'Doors', 'nr', 1), n('windowArea', 'Window area', 'm²', 1.2)
    ],
    compute(i, ctx) {
      const w: string[] = []
      const L = num(i, 'length'), W = num(i, 'width'), H = num(i, 'wallHeight'), doors = Math.round(num(i, 'doors')), win = num(i, 'windowArea')
      const P = 2 * (L + W)
      const parts: StructurePart[] = [
        run('excavation', 'Excavation', { length: P, width: 0.6, depth: 0.6, disposalPercent: 50, siteArea: (L + 2) * (W + 2) }, ctx, undefined, w),
        run('blinding', 'Blinding', { perimeter: P, width: 0.6 }, ctx, undefined, w),
        run('strip_footing', 'Strip footing', { length: P, width: 0.6, thickness: 0.2 }, ctx, undefined, w),
        run('foundation_walling', 'Foundation walling', { length: P, height: 0.6, thickness: 0.2, unitType: i.walls === 'block' ? 'block' : 'stone' }, ctx, undefined, w),
        run('hardcore', 'Hardcore', { area: L * W, thickness: 0.15 }, ctx, undefined, w),
        run('ground_slab', 'Floor slab', { area: L * W, thickness: 0.1 }, ctx, undefined, w)
      ]
      const openings = doors * 0.9 * 2.1 + win
      if (i.walls === 'sheet') {
        parts.push(custom('Walls (iron sheet)', ctx, (list) => {
          const area = Math.max(0, P * H - openings)
          list.add('timber_3x2', 'Timber 3″ × 2″ frame (treated)', 'ft', (P * 3 + (Math.ceil(P / 0.6) + 1) * H) * 3.2808)
          list.add('sheet_g30', 'Corrugated sheet G30 (cladding)', 'm', area / 0.76)
          list.add('roofing_nails', 'Roofing nails', 'kg', area * 0.08)
          return { bqLines: [{ billKey: 'superstructure', section: 'Walls', description: 'Gauge 30 corrugated iron sheet walls on treated 3″ × 2″ timber frame', unit: 'm²', quantity: area, carriesMaterialCost: true }] }
        }))
      }
      else parts.push(run('walling', 'Walls', { length: P, height: H, openings, thickness: 0.2, unitType: i.walls }, ctx, undefined, w))
      parts.push(run('roofing', 'Roof', { length: L, width: W, overhang: 0.5, pitch: 15 }, ctx, undefined, w))
      parts.push(supply('Door and window', ctx, 'doors_windows', 'Doors and windows', [
        { key: 'door_steel_single', label: 'Steel door with frame and lock', unit: 'piece', qty: doors, line: 'Steel door with frame and lock' },
        { key: 'window_steel', label: 'Steel window', unit: 'm²', qty: win, line: 'Steel window, glazed' }
      ]))
      return { summary: [{ label: 'Floor area', value: L * W, unit: 'm²', emphasis: true }], parts, warnings: w }
    }
  },
  {
    key: 'plumbing',
    name: 'Plumbing installation',
    short: 'Plumbing',
    group: 'Services',
    icon: 'i-lucide-droplets',
    description: 'Water supply and drainage for a house or block: sanitary fittings, PPR supply pipework, uPVC drainage, tank and inspection chamber covers.',
    inputs: [
      n('wcs', 'WCs', 'nr', 2), n('basins', 'Wash basins', 'nr', 2), n('sinks', 'Kitchen sinks', 'nr', 1), n('showers', 'Showers', 'nr', 2), n('taps', 'Outside taps', 'nr', 1),
      n('runPerPoint', 'Supply pipe per point', 'm', 6), n('drainRun', 'Drainage pipe run', 'm', 30), n('chambers', 'Inspection chambers', 'nr', 3),
      sel('tank', 'Storage tank', 'water_tank_3000', TANKS)
    ],
    compute(i, ctx) {
      const c = (k: string) => Math.max(0, Math.round(num(i, k)))
      const points = c('wcs') + c('basins') + c('sinks') + c('showers') + c('taps')
      const supplyRun = points * num(i, 'runPerPoint')
      const tank = String(i.tank)
      const parts: StructurePart[] = [
        supply('Sanitary fittings', ctx, 'services', 'Sanitary fittings', [
          { key: 'wc_close_coupled', label: 'WC suite, close-coupled', unit: 'piece', qty: c('wcs'), line: 'Close-coupled WC suite with seat and cistern, connected' },
          { key: 'wash_basin', label: 'Wash hand basin with pedestal', unit: 'piece', qty: c('basins'), line: 'Wash hand basin with pedestal, connected' },
          { key: 'basin_mixer', label: 'Basin mixer tap', unit: 'piece', qty: c('basins'), line: 'Basin mixer tap' },
          { key: 'kitchen_sink_single', label: 'Stainless steel kitchen sink', unit: 'piece', qty: c('sinks'), line: 'Stainless steel single-bowl kitchen sink, connected' },
          { key: 'shower_basic', label: 'Shower set', unit: 'piece', qty: c('showers'), line: 'Shower set, connected' }
        ]),
        custom('Pipework', ctx, (list) => {
          list.add('ppr_25', 'PPR pipe 25 mm × 4 m', 'piece', supplyRun / 4)
          list.add('pvc_110', 'PVC 110 mm drainage pipe (6 m)', 'piece', num(i, 'drainRun') / 6)
          return {
            lines: [{ label: 'Supply pipework', value: supplyRun, unit: 'm', emphasis: true }],
            bqLines: [
              { billKey: 'services', section: 'Pipework', description: '25 mm PPR hot and cold water supply pipework with fittings, chased and fixed', unit: 'm', quantity: supplyRun, materials: ['ppr_25'], carriesMaterialCost: true },
              { billKey: 'services', section: 'Pipework', description: '110 mm uPVC soil and waste drainage pipework laid to falls, including bedding', unit: 'm', quantity: num(i, 'drainRun'), materials: ['pvc_110'] }
            ]
          }
        }),
        supply('Storage and chambers', ctx, 'services', 'Water storage and drainage', [
          ...(tank !== 'none' ? [{ key: tank, label: `Plastic water tank ${TANKS.find(t => t[0] === tank)?.[1] ?? ''}`, unit: 'piece', qty: 1, line: `Supply and install ${TANKS.find(t => t[0] === tank)?.[1] ?? ''} plastic water tank with connections` }] : []),
          { key: 'manhole_cover_450', label: 'Inspection chamber cover 450 × 450 mm', unit: 'piece', qty: c('chambers'), line: 'Inspection chamber cover and frame, 450 × 450 mm (chamber walls measured separately)' }
        ])
      ]
      return { summary: [{ label: 'Plumbing points', value: points, unit: 'nr', emphasis: true }], parts, warnings: [] }
    }
  },
  {
    key: 'electrical',
    name: 'Electrical installation',
    short: 'Electrical',
    group: 'Services',
    icon: 'i-lucide-zap',
    description: 'Wiring for a house or block: lighting and socket points in conduit, cooker circuit, consumer units and breakers.',
    inputs: [
      n('lights', 'Lighting points', 'nr', 12), n('sockets', '13 A socket points', 'nr', 10), sel('cooker', 'Cooker point', 'yes', [['yes', 'Yes'], ['no', 'No']]),
      n('lightRun', 'Cable run per lighting point', 'm', 8), n('socketRun', 'Cable run per socket point', 'm', 10),
      n('lightsPerCircuit', 'Lighting points per circuit', 'nr', 8, { min: 1 }), n('socketsPerCircuit', 'Socket points per circuit', 'nr', 6, { min: 1 })
    ],
    compute(i, ctx) {
      const lights = Math.max(0, Math.round(num(i, 'lights'))), sockets = Math.max(0, Math.round(num(i, 'sockets')))
      const cooker = i.cooker === 'yes'
      const circuits = Math.ceil(lights / Math.max(1, num(i, 'lightsPerCircuit'))) + Math.ceil(sockets / Math.max(1, num(i, 'socketsPerCircuit'))) + (cooker ? 1 : 0)
      const units = Math.max(1, Math.ceil(circuits / 4))
      const lightRun = lights * num(i, 'lightRun'), socketRun = sockets * num(i, 'socketRun')
      const parts: StructurePart[] = [
        custom('Lighting points', ctx, (list) => {
          list.add('cable_1_5_m', '1.5 mm² single-core cable (3 cores per run)', 'm', lightRun * 3)
          list.add('conduit_20', '20 mm PVC conduit', 'm', lightRun)
          list.add('conduit_bend_20', '20 mm conduit bend', 'piece', lights * 2)
          list.add('switch_single', 'Single switch', 'piece', lights)
          list.add('switch_box', 'Switch box', 'piece', lights)
          list.add('bulb_holder', 'Bulb holder', 'piece', lights)
          list.add('led_bulb', 'LED bulb', 'piece', lights)
          return { bqLines: [{ billKey: 'services', section: 'Electrical', description: 'Lighting point complete: 1.5 mm² cable in 20 mm conduit, switch, holder and LED lamp', unit: 'nr', quantity: lights, carriesMaterialCost: true }] }
        }),
        custom('Socket points', ctx, (list) => {
          list.add('cable_2_5_m', '2.5 mm² cable (3 cores per run)', 'm', socketRun * 3)
          list.add('conduit_20', '20 mm PVC conduit', 'm', socketRun)
          list.add('switch_box', 'Socket box', 'piece', sockets)
          list.add('socket_13a', '13 A switched socket outlet', 'piece', sockets)
          return { bqLines: [{ billKey: 'services', section: 'Electrical', description: '13 A switched socket outlet point complete: 2.5 mm² cable in 20 mm conduit', unit: 'nr', quantity: sockets, carriesMaterialCost: true }] }
        }),
        custom('Distribution', ctx, (list) => {
          list.add('consumer_unit_4way', 'Consumer unit, 4-way', 'piece', units)
          list.add('mcb', 'Miniature circuit breaker', 'piece', circuits)
          if (cooker) list.add('cable_6_m', '6 mm² cable for cooker circuit', 'm', 3 * 12)
          return {
            lines: [{ label: 'Circuits', value: circuits, unit: 'nr', emphasis: true }],
            bqLines: [{ billKey: 'services', section: 'Electrical', description: `Consumer unit${units > 1 ? 's' : ''} with ${circuits} MCB${circuits === 1 ? '' : 's'}${cooker ? ', including cooker circuit' : ''}, connected and tested`, unit: 'nr', quantity: units, carriesMaterialCost: true }]
          }
        })
      ]
      return { summary: [{ label: 'Points', value: lights + sockets + (cooker ? 1 : 0), unit: 'nr', emphasis: true }, { label: 'Circuits', value: circuits, unit: 'nr' }], parts, warnings: [] }
    }
  }
]

export const STRUCTURE_MAP: Record<string, StructureDef> = Object.fromEntries(STRUCTURES.map(s => [s.key, s]))

/** Structures as plain data for the client (no compute functions). */
export const STRUCTURE_LIST = STRUCTURES.map(({ compute: _c, ...rest }) => rest)
