/*
 * Reference data for a fresh installation. Everything here is editable in the Admin back-office;
 * the seed only inserts rows that do not exist yet, so admin changes are never overwritten.
 *
 * Material prices are indicative Nairobi market figures for 2026 compiled from public price
 * guides (cement ~KES 750–850/bag, river sand KES 1,800–3,500/t, ballast KES 1,300–2,500/t,
 * Y12 12 m bar ~KES 1,400–1,750). Admins should replace them with supplier quotes.
 */

export const FEATURE_FLAGS = [
  { key: 'cost_estimator', label: 'Construction Cost Calculator', description: 'Public cost-per-m² estimator for homeowners.', category: 'calculator', enabled: true, sort: 1 },
  { key: 'material_calculators', label: 'Material Quantification Modules', description: 'Public element calculators (blinding, footings, columns, walling...). Individual modules can be switched off under Calculators.', category: 'calculator', enabled: true, sort: 2 },
  { key: 'bq_projects', label: 'BQ Projects', description: 'Signed-in users can draft full Bills of Quantities.', category: 'system', enabled: true, sort: 3 },
  { key: 'public_registration', label: 'Public sign-up', description: 'Allow anyone to create an account (as a member). When off, only admins can add users.', category: 'system', enabled: true, sort: 4 },
  { key: 'estimate_requests', label: 'Estimate lead capture', description: 'Show "Request a detailed BQ" on the cost calculator and store the requests.', category: 'system', enabled: true, sort: 5 },
  { key: 'embed', label: 'Embedding on external websites', description: 'Allow /embed pages to be framed by the origins listed under Integration.', category: 'integration', enabled: true, sort: 6 }
]

export const CONSTANTS = [
  { key: 'concrete_dry_factor', label: 'Concrete dry volume factor', value: 1.54, unit: '×', groupName: 'Concrete & mortar', description: 'Wet → dry volume (voids + shrinkage).', sort: 1 },
  { key: 'mortar_dry_factor', label: 'Mortar / plaster dry volume factor', value: 1.33, unit: '×', groupName: 'Concrete & mortar', description: '', sort: 2 },
  { key: 'cement_bag_volume', label: 'Volume of one cement bag', value: 0.035, unit: 'm³', groupName: 'Concrete & mortar', description: '50 kg ÷ 1,440 kg/m³ ≈ 0.035 m³.', sort: 3 },
  { key: 'cement_bag_kg', label: 'Cement bag mass', value: 50, unit: 'kg', groupName: 'Concrete & mortar', description: '', sort: 4 },
  { key: 'sand_density', label: 'Sand bulk density', value: 1.6, unit: 't/m³', groupName: 'Densities', description: '', sort: 10 },
  { key: 'ballast_density', label: 'Ballast bulk density', value: 1.65, unit: 't/m³', groupName: 'Densities', description: '', sort: 11 },
  { key: 'hardcore_density', label: 'Hardcore bulk density', value: 1.8, unit: 't/m³', groupName: 'Densities', description: '', sort: 12 },
  { key: 'hardcore_compaction_factor', label: 'Hardcore compaction factor', value: 1.15, unit: '×', groupName: 'Earthworks', description: 'Loose volume needed per compacted m³.', sort: 20 },
  { key: 'excavation_bulking_factor', label: 'Excavated soil bulking factor', value: 1.25, unit: '×', groupName: 'Earthworks', description: '', sort: 21 },
  { key: 'steel_lap_factor', label: 'Reinforcement laps & bends allowance', value: 1.1, unit: '×', groupName: 'Reinforcement', description: '', sort: 30 },
  { key: 'rebar_length', label: 'Stock bar length', value: 12, unit: 'm', groupName: 'Reinforcement', description: '', sort: 31 },
  { key: 'binding_wire_kg_per_tonne', label: 'Binding wire per tonne of steel', value: 10, unit: 'kg/t', groupName: 'Reinforcement', description: '', sort: 32 },
  { key: 'brc_sheet_area', label: 'BRC mesh sheet area', value: 11.52, unit: 'm²', groupName: 'Reinforcement', description: '2.4 m × 4.8 m sheet.', sort: 33 },
  { key: 'brc_lap_factor', label: 'BRC mesh lap allowance', value: 1.15, unit: '×', groupName: 'Reinforcement', description: '', sort: 34 },
  { key: 'dpm_lap_factor', label: 'DPM lap allowance', value: 1.1, unit: '×', groupName: 'Walling & membranes', description: '', sort: 40 },
  { key: 'stone_length', label: 'Machine-cut stone length', value: 0.4, unit: 'm', groupName: 'Walling & membranes', description: '', sort: 41 },
  { key: 'stone_height', label: 'Machine-cut stone height', value: 0.2, unit: 'm', groupName: 'Walling & membranes', description: '', sort: 42 },
  { key: 'mortar_joint', label: 'Mortar joint thickness', value: 0.012, unit: 'm', groupName: 'Walling & membranes', description: '', sort: 43 },
  { key: 'bq_labour_uplift_percent', label: 'Labour & overheads on calculator material cost', value: 30, unit: '%', groupName: 'BQ pricing', description: 'Used when a calculator result is pushed into a BQ and no library rate exists.', sort: 50 }
]

export const COUNTRIES = [{ code: 'KE', name: 'Kenya', currency: 'KES', vatPercent: 16, active: true, sort: 1 }]

export const TIERS = [
  { key: 'nairobi', label: 'Nairobi rates', sort: 1, locations: [['Nairobi Central', 0], ['Westlands / Lavington', 10]] },
  { key: 'urban', label: 'Other urban rates', sort: 2, locations: [['Kiambu / Thika', 0], ['Nakuru', 0], ['Eldoret', 0], ['Kisumu', 0], ['Mombasa / Coast', 5], ['Machakos / Athi River', 0]] },
  { key: 'rural', label: 'Rural / semi-urban rates', sort: 3, locations: [['Kericho', 0], ['Nyeri', 0], ['Kisii', 0], ['Kakamega', 0], ['Bungoma', 0], ['Kitui', 3], ['Isiolo', 8]] }
] as const

export const FINISHES = [
  { key: 'low', label: 'Low-cost', description: 'Basic finishing', labourPercent: 20, sort: 1 },
  { key: 'standard', label: 'Standard', description: 'Mid-range finishing', labourPercent: 25, sort: 2 },
  { key: 'luxury', label: 'High-end / Luxury', description: 'Premium materials and fittings', labourPercent: 30, sort: 3 }
]

/** 2026 Kenya market rates per m² (tier → finish → [min, max]). */
export const COST_RATES: Record<string, Record<string, [number, number]>> = {
  nairobi: { low: [28000, 35000], standard: [38000, 55000], luxury: [60000, 100000] },
  urban: { low: [22000, 28000], standard: [32000, 45000], luxury: [55000, 85000] },
  rural: { low: [18000, 24000], standard: [26000, 38000], luxury: [45000, 70000] }
}

export const BUILDING_TYPES = [
  { key: 'bungalow', label: 'Bungalow', description: 'Single storey. Typical 3BR is 100–150 m².', factor: 1, defaultFloors: 1, minFloors: 1, maxFloors: 1, sort: 1 },
  { key: 'maisonette', label: 'Maisonette', description: '2–3 storeys. Family homes with upper floors.', factor: 1, defaultFloors: 2, minFloors: 2, maxFloors: 3, sort: 2 },
  { key: 'apartment', label: 'Apartment Block', description: 'Multi-unit. Ground + several upper floors.', factor: 1.05, defaultFloors: 4, minFloors: 2, maxFloors: 20, sort: 3 }
]

export const ADDONS = [
  { key: 'contingency', label: 'Contingency', description: 'Allowance for unforeseen costs and price changes.', percent: 5, enabledByDefault: true, sort: 1 },
  { key: 'professional_fees', label: 'Professional fees', description: 'Architect, quantity surveyor and structural engineer.', percent: 8, enabledByDefault: false, sort: 2 },
  { key: 'approvals', label: 'Approvals & statutory fees', description: 'County approval, NCA and NEMA.', percent: 2, enabledByDefault: false, sort: 3 }
]

export const ELEMENTS = [
  { key: 'substructure', label: 'Substructure (foundations)', percent: 15, sort: 1 },
  { key: 'frame_walling', label: 'Frame & walling', percent: 25, sort: 2 },
  { key: 'roofing', label: 'Roofing', percent: 12, sort: 3 },
  { key: 'doors_windows', label: 'Doors & windows', percent: 10, sort: 4 },
  { key: 'finishes', label: 'Finishes', percent: 18, sort: 5 },
  { key: 'services', label: 'Electrical & plumbing', percent: 15, sort: 6 },
  { key: 'external', label: 'External works', percent: 5, sort: 7 }
]

/** [key, name, unit, category, national price KES] */
export const MATERIALS: [string, string, string, string, number][] = [
  ['cement', 'Cement 42.5N (50 kg bag)', 'bag', 'Binders & aggregates', 780],
  ['sand', 'River sand', 'tonne', 'Binders & aggregates', 2500],
  ['ballast', 'Ballast 20 mm', 'tonne', 'Binders & aggregates', 2000],
  ['hardcore', 'Hardcore', 'tonne', 'Binders & aggregates', 1400],
  ['stone_200', 'Machine-cut stone 200 mm (9")', 'piece', 'Walling', 75],
  ['stone_150', 'Machine-cut stone 150 mm (6")', 'piece', 'Walling', 60],
  ['hoop_iron', 'Hoop iron 20 g × 32 mm', 'm', 'Walling', 30],
  ['r6', 'R6 mild steel bar (12 m)', 'bar', 'Reinforcement', 320],
  ['r8', 'R8 mild steel bar (12 m)', 'bar', 'Reinforcement', 560],
  ['y8', 'Y8 high-yield bar (12 m)', 'bar', 'Reinforcement', 600],
  ['y10', 'Y10 high-yield bar (12 m)', 'bar', 'Reinforcement', 880],
  ['y12', 'Y12 high-yield bar (12 m)', 'bar', 'Reinforcement', 1550],
  ['y16', 'Y16 high-yield bar (12 m)', 'bar', 'Reinforcement', 2750],
  ['y20', 'Y20 high-yield bar (12 m)', 'bar', 'Reinforcement', 4300],
  ['y25', 'Y25 high-yield bar (12 m)', 'bar', 'Reinforcement', 6700],
  ['binding_wire', 'Binding wire', 'kg', 'Reinforcement', 250],
  ['brc_a142', 'BRC mesh A142 (2.4 × 4.8 m)', 'sheet', 'Reinforcement', 5800],
  ['brc_a98', 'BRC mesh A98 (2.4 × 4.8 m)', 'sheet', 'Reinforcement', 4300],
  ['dpm', 'Polythene DPM 1000 gauge', 'm²', 'Membranes', 90]
]

/** Example location overrides: [location name, material key, price]. */
export const LOCATION_PRICES: [string, string, number][] = [
  ['Mombasa / Coast', 'cement', 760],
  ['Mombasa / Coast', 'sand', 2200],
  ['Kisumu', 'sand', 2000],
  ['Isiolo', 'cement', 880],
  ['Isiolo', 'ballast', 2600]
]

export const MIXES = [
  { key: 'c10', name: 'Class 10 (1:3:6) — blinding', kind: 'concrete' as const, cement: 1, sand: 3, ballast: 6, sort: 1 },
  { key: 'c15', name: 'Class 15 (1:2:4) — foundations', kind: 'concrete' as const, cement: 1, sand: 2, ballast: 4, sort: 2 },
  { key: 'c20', name: 'Class 20 (1:1.5:3) — structural', kind: 'concrete' as const, cement: 1, sand: 1.5, ballast: 3, sort: 3 },
  { key: 'c25', name: 'Class 25 (1:1:2) — high strength', kind: 'concrete' as const, cement: 1, sand: 1, ballast: 2, sort: 4 },
  { key: 'm13', name: 'Mortar 1:3', kind: 'mortar' as const, cement: 1, sand: 3, ballast: 0, sort: 10 },
  { key: 'm14', name: 'Mortar 1:4', kind: 'mortar' as const, cement: 1, sand: 4, ballast: 0, sort: 11 },
  { key: 'm16', name: 'Mortar 1:6', kind: 'mortar' as const, cement: 1, sand: 6, ballast: 0, sort: 12 }
]

export const BILLS = [
  { key: 'preliminaries', number: 1, title: 'Preliminaries & General Items', description: 'Site establishment, insurances, temporary services and general obligations.' },
  { key: 'substructure', number: 2, title: 'Substructure', description: 'Everything up to and including the ground floor slab and DPC.' },
  { key: 'superstructure', number: 3, title: 'Superstructure', description: 'Frame, upper floors, staircases and walling.' },
  { key: 'roofing', number: 4, title: 'Roofing', description: 'Roof structure, coverings and rainwater goods.' },
  { key: 'doors_windows', number: 5, title: 'Doors & Windows', description: 'Windows, doors, frames, glazing and ironmongery.' },
  { key: 'finishes', number: 6, title: 'Finishes', description: 'Wall, floor and ceiling finishes and decoration.' },
  { key: 'services', number: 7, title: 'Services', description: 'Electrical, plumbing and drainage installations.' },
  { key: 'external', number: 8, title: 'External Works', description: 'Paving, fencing, landscaping and external drainage.' },
  { key: 'provisional', number: 9, title: 'Provisional & Prime Cost Sums', description: 'Sums for work or nominated supplies not yet fully defined.' }
]

type Lib = [code: string, bill: string, section: string, description: string, unit: string, rate: number, type: 'measured' | 'provisional' | 'pc_sum' | 'lump_sum', driver: string, factor: number, finishSensitive: boolean, includeByDefault: boolean]

/** Indicative Nairobi / standard-finish rates (KES), 2026. */
export const LIBRARY: Lib[] = [
  ['PRE-010', 'preliminaries', 'General items', 'Site establishment: hoarding, site office, stores and sanitary facilities, maintain and clear on completion', 'Sum', 450, 'lump_sum', 'total_floor_area', 1, false, true],
  ['PRE-020', 'preliminaries', 'General items', 'Contractor\'s all-risk and public liability insurances', 'Sum', 150, 'lump_sum', 'total_floor_area', 1, false, true],
  ['PRE-030', 'preliminaries', 'General items', 'Water and electricity for the works', 'Sum', 200, 'lump_sum', 'total_floor_area', 1, false, true],
  ['PRE-040', 'preliminaries', 'General items', 'Site security and watchman for the duration of the works', 'Sum', 250, 'lump_sum', 'total_floor_area', 1, false, true],
  ['PRE-050', 'preliminaries', 'General items', 'Setting out the works and establishing levels', 'Sum', 60000, 'lump_sum', 'lump', 1, false, true],

  ['SUB-010', 'substructure', 'Excavation & earthworks', 'Clear site of bushes, shrubs and grass and strip top soil average 150 mm deep', 'm²', 120, 'measured', 'footprint_area', 1.5, false, true],
  ['SUB-020', 'substructure', 'Excavation & earthworks', 'Excavate foundation trench not exceeding 1.5 m deep from stripped level', 'm³', 650, 'measured', 'trench_volume', 1, false, true],
  ['SUB-030', 'substructure', 'Excavation & earthworks', 'Load and cart away surplus excavated material to approved tip', 'm³', 750, 'measured', 'trench_volume', 0.75, false, true],
  ['SUB-040', 'substructure', 'Excavation & earthworks', 'Return, fill and ram selected excavated material around foundations', 'm³', 350, 'measured', 'trench_volume', 0.4, false, true],
  ['SUB-100', 'substructure', 'Hardcore & blinding', '200 mm thick approved hardcore filling, well compacted in layers', 'm²', 950, 'measured', 'footprint_area', 1, false, true],
  ['SUB-110', 'substructure', 'Hardcore & blinding', '50 mm murram / sand blinding to hardcore surfaces', 'm²', 180, 'measured', 'footprint_area', 1, false, true],
  ['SUB-200', 'substructure', 'Concrete work', '50 mm thick plain concrete (1:3:6) blinding under strip footings', 'm²', 780, 'measured', 'foundation_length', 0.6, false, true],
  ['SUB-210', 'substructure', 'Concrete work', 'Reinforced concrete (1:2:4) in strip footings', 'm³', 18500, 'measured', 'foundation_length', 0.12, false, true],
  ['SUB-220', 'substructure', 'Concrete work', 'Reinforced concrete (1:1.5:3) in column bases', 'm³', 19500, 'measured', 'none', 1, false, false],
  ['SUB-300', 'substructure', 'Reinforcement', 'High yield steel bar reinforcement to foundations, cut, bent and fixed', 'kg', 175, 'measured', 'foundation_length', 4.5, false, true],
  ['SUB-400', 'substructure', 'Formwork', 'Sawn formwork to vertical sides of column bases', 'm²', 850, 'measured', 'none', 1, false, false],
  ['SUB-500', 'substructure', 'Foundation walling', '200 mm thick machine-cut stone foundation walling in cement-sand (1:4) mortar', 'm²', 2600, 'measured', 'foundation_length', 1, false, true],
  ['SUB-510', 'substructure', 'Foundation walling', '200 mm wide bituminous felt damp proof course', 'm', 180, 'measured', 'foundation_length', 1, false, true],
  ['SUB-600', 'substructure', 'Ground floor slab', 'Anti-termite soil treatment to surfaces of hardcore', 'm²', 220, 'measured', 'footprint_area', 1, false, true],
  ['SUB-610', 'substructure', 'Ground floor slab', '1000 gauge polythene damp proof membrane laid on blinded hardcore', 'm²', 160, 'measured', 'footprint_area', 1, false, true],
  ['SUB-620', 'substructure', 'Ground floor slab', 'A142 BRC fabric mesh reinforcement with 200 mm laps', 'm²', 650, 'measured', 'footprint_area', 1, false, true],
  ['SUB-630', 'substructure', 'Ground floor slab', '150 mm reinforced concrete (1:1.5:3) ground floor slab', 'm³', 17500, 'measured', 'footprint_area', 0.15, false, true],

  ['SUP-100', 'superstructure', 'Concrete frame', 'Reinforced concrete (1:1.5:3) in columns', 'm³', 22000, 'measured', 'total_floor_area', 0.012, false, true],
  ['SUP-110', 'superstructure', 'Concrete frame', 'Reinforced concrete (1:1.5:3) in ring beams and lintels', 'm³', 21000, 'measured', 'wall_area', 0.012, false, true],
  ['SUP-200', 'superstructure', 'Upper floors', '150 mm reinforced concrete (1:1.5:3) suspended floor slab', 'm³', 21000, 'measured', 'upper_floor_area', 0.15, false, true],
  ['SUP-300', 'superstructure', 'Reinforcement', 'High yield and mild steel reinforcement to frame and slabs', 'kg', 175, 'measured', 'total_floor_area', 12, false, true],
  ['SUP-400', 'superstructure', 'Formwork', 'Sawn formwork to sides of columns', 'm²', 950, 'measured', 'total_floor_area', 0.2, false, true],
  ['SUP-410', 'superstructure', 'Formwork', 'Sawn formwork to sides and soffits of beams', 'm²', 950, 'measured', 'wall_area', 0.06, false, true],
  ['SUP-420', 'superstructure', 'Formwork', 'Sawn formwork to soffit and edges of suspended slab, including props', 'm²', 1100, 'measured', 'upper_floor_area', 1, false, true],
  ['SUP-500', 'superstructure', 'Walling', '200 mm thick machine-cut stone external walling in cement-sand (1:4) mortar', 'm²', 2400, 'measured', 'ext_wall_area', 1, false, true],
  ['SUP-505', 'superstructure', 'Walling', '150 mm thick machine-cut stone internal walling in cement-sand (1:4) mortar', 'm²', 2000, 'measured', 'int_wall_area', 1, false, true],
  ['SUP-510', 'superstructure', 'Walling', '20 gauge × 32 mm hoop iron walling reinforcement in alternate courses', 'm', 30, 'measured', 'wall_area', 2.4, false, true],
  ['SUP-600', 'superstructure', 'Staircases', 'Reinforced concrete staircase complete with formwork and reinforcement', 'nr', 350000, 'measured', 'none', 1, false, false],

  ['ROF-100', 'roofing', 'Roof structure', 'Treated cypress timber roof trusses, purlins and wall plates', 'm²', 1800, 'measured', 'roof_area', 1, false, true],
  ['ROF-110', 'roofing', 'Roof covering', 'Pre-painted gauge 28 roofing sheets fixed to purlins, including ridges', 'm²', 1600, 'measured', 'roof_area', 1, true, true],
  ['ROF-120', 'roofing', 'Eaves & rainwater goods', '25 × 225 mm treated fascia board, primed and painted', 'm', 850, 'measured', 'ext_perimeter', 1, false, true],
  ['ROF-130', 'roofing', 'Eaves & rainwater goods', 'PVC gutters and downpipes complete with fittings', 'm', 1100, 'measured', 'ext_perimeter', 1, false, true],

  ['DW-100', 'doors_windows', 'Windows', 'Steel casement windows including glazing and fixing', 'm²', 9500, 'measured', 'window_area', 1, true, true],
  ['DW-110', 'doors_windows', 'Windows', 'Mild steel burglar-proofing to windows', 'm²', 3500, 'measured', 'window_area', 1, false, true],
  ['DW-200', 'doors_windows', 'Doors', 'Solid panel door with hardwood frame, ironmongery and finish', 'nr', 28000, 'measured', 'doors', 1, true, true],
  ['DW-210', 'doors_windows', 'Doors', 'Steel main entrance door with frame and security lock', 'nr', 65000, 'measured', 'lump', 1, true, true],

  ['FIN-100', 'finishes', 'Wall finishes', '15 mm thick cement-sand (1:4) plaster to internal walls', 'm²', 650, 'measured', 'plaster_area', 1, false, true],
  ['FIN-110', 'finishes', 'External finishes', '20 mm thick cement-sand (1:4) render to external walls', 'm²', 750, 'measured', 'ext_wall_area', 1, false, true],
  ['FIN-200', 'finishes', 'Floor finishes', '40 mm cement-sand (1:3) floor screed', 'm²', 900, 'measured', 'total_floor_area', 1, false, true],
  ['FIN-210', 'finishes', 'Floor finishes', 'Ceramic floor tiles bedded on screed, including skirting', 'm²', 2800, 'measured', 'total_floor_area', 1, true, true],
  ['FIN-300', 'finishes', 'Ceiling finishes', 'Gypsum board ceiling on timber/metal brandering', 'm²', 2200, 'measured', 'total_floor_area', 1, true, true],
  ['FIN-400', 'finishes', 'Decoration', 'Three coats emulsion paint to plastered walls', 'm²', 380, 'measured', 'plaster_area', 1, true, true],
  ['FIN-410', 'finishes', 'Decoration', 'Three coats emulsion paint to ceilings', 'm²', 380, 'measured', 'total_floor_area', 1, true, true],
  ['FIN-420', 'finishes', 'Decoration', 'Two coats weathercoat paint to external render', 'm²', 450, 'measured', 'ext_wall_area', 1, true, true],

  ['SER-100', 'services', 'Electrical', 'Electrical installation: wiring, conduits, switches, sockets, DB and light fittings', 'Sum', 2500, 'provisional', 'total_floor_area', 1, true, true],
  ['SER-200', 'services', 'Plumbing', 'Plumbing installation: hot and cold water supply and sanitary pipework', 'Sum', 2200, 'provisional', 'total_floor_area', 1, true, true],
  ['SER-300', 'services', 'Drainage', 'Foul drainage including manholes and septic tank / sewer connection', 'Sum', 250000, 'provisional', 'lump', 1, false, true],
  ['SER-400', 'services', 'Water storage', 'Supply and install water storage tanks and booster pump', 'Sum', 120000, 'pc_sum', 'lump', 1, false, true],

  ['EXT-100', 'external', 'Paving', '80 mm concrete paving blocks on sand bed to driveway', 'm²', 2200, 'measured', 'none', 1, false, false],
  ['EXT-110', 'external', 'Boundary', 'Stone perimeter wall 2.4 m high including foundations', 'm', 9000, 'measured', 'none', 1, false, false],
  ['EXT-120', 'external', 'Landscaping', 'Landscaping, top soil and grassing', 'Sum', 150000, 'provisional', 'lump', 1, false, true],

  ['PRO-110', 'provisional', 'Prime cost sums', 'Kitchen fittings (nominated supplier)', 'Sum', 250000, 'pc_sum', 'lump', 1, true, true],
  ['PRO-120', 'provisional', 'Prime cost sums', 'Sanitary fittings (nominated supplier)', 'Sum', 600, 'pc_sum', 'total_floor_area', 1, true, true],
  ['PRO-130', 'provisional', 'Provisional sums', 'Statutory approvals, NCA and NEMA fees', 'Sum', 150000, 'provisional', 'lump', 1, false, false],
  ['PRO-140', 'provisional', 'Provisional sums', 'Excavation in rock and dewatering (to be remeasured)', 'Sum', 100000, 'provisional', 'lump', 1, false, false]
]
