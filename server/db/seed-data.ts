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
  { key: 'bq_labour_uplift_percent', label: 'Labour & overheads on calculator material cost', value: 30, unit: '%', groupName: 'BQ pricing', description: 'Used when a calculator result is pushed into a BQ and no library rate exists.', sort: 50 },
  // Formwork & propping
  { key: 'formwork_board_ft_per_m2', label: 'Formwork boards (6″×1″) per m²', value: 22, unit: 'ft/m²', groupName: 'Formwork & propping', description: '1 m² ÷ 150 mm board width ≈ 6.6 m ≈ 22 ft.', sort: 60 },
  { key: 'formwork_batten_ft_per_m2', label: 'Formwork battens (2″×2″) per m²', value: 10, unit: 'ft/m²', groupName: 'Formwork & propping', description: 'Studs and walings holding the boards.', sort: 61 },
  { key: 'formwork_reuses', label: 'Uses of sawn formwork timber', value: 3, unit: 'uses', groupName: 'Formwork & propping', description: 'Timber is reused this many times; quantities are divided by it.', sort: 62 },
  { key: 'formwork_nails_kg_per_m2', label: 'Nails per m² of formwork', value: 0.15, unit: 'kg/m²', groupName: 'Formwork & propping', description: '', sort: 63 },
  { key: 'props_per_m2', label: 'Props per m² of slab soffit', value: 0.8, unit: 'nr/m²', groupName: 'Formwork & propping', description: 'About 1.1 m spacing each way.', sort: 64 },
  { key: 'props_hire_days', label: 'Prop hire period per slab', value: 21, unit: 'days', groupName: 'Formwork & propping', description: 'Props stay until the slab can carry itself (about 3 weeks).', sort: 65 },
  // Plant
  { key: 'mixer_m3_per_day', label: 'Concrete mixer output', value: 10, unit: 'm³/day', groupName: 'Plant', description: '350 L mixer, one shift.', sort: 70 },
  { key: 'compactor_m2_per_day', label: 'Plate compactor output', value: 200, unit: 'm²/day', groupName: 'Plant', description: 'Hardcore in layers.', sort: 71 },
  // Treatment
  { key: 'termiticide_ml_per_m2', label: 'Termiticide concentrate per m²', value: 50, unit: 'ml/m²', groupName: 'Treatment', description: '1% emulsion applied at 5 L of mix per m² of soil (chlorpyrifos type).', sort: 80 },
  { key: 'dpc_roll_length', label: 'DPC roll length', value: 30, unit: 'm', groupName: 'Treatment', description: '', sort: 81 },
  // Roofing
  { key: 'sheet_cover_width', label: 'Corrugated sheet cover width', value: 0.76, unit: 'm', groupName: 'Roofing', description: 'Effective width after side laps.', sort: 90 },
  { key: 'sheet_lap_factor', label: 'Roof sheet end-lap allowance', value: 1.08, unit: '×', groupName: 'Roofing', description: '', sort: 91 },
  { key: 'roofing_nails_kg_per_m2', label: 'Roofing nails per m² of roof', value: 0.08, unit: 'kg/m²', groupName: 'Roofing', description: '', sort: 92 },
  { key: 'truss_nails_kg', label: 'Nails per roof truss', value: 1.2, unit: 'kg', groupName: 'Roofing', description: '', sort: 93 },
  { key: 'preservative_l_per_100ft', label: 'Timber preservative per 100 ft of timber', value: 1.5, unit: 'L', groupName: 'Roofing', description: 'Brush-applied, two coats.', sort: 94 },
  // Finishes
  { key: 'paint_m2_per_l', label: 'Paint coverage per coat', value: 10, unit: 'm²/L', groupName: 'Finishes', description: 'On smooth plaster.', sort: 100 },
  { key: 'undercoat_m2_per_l', label: 'Undercoat coverage', value: 8, unit: 'm²/L', groupName: 'Finishes', description: '', sort: 101 },
  { key: 'adhesive_m2_per_bag', label: 'Tile adhesive coverage', value: 4.5, unit: 'm²/bag', groupName: 'Finishes', description: '25 kg bag with a 6 mm notched trowel.', sort: 102 },
  { key: 'grout_kg_per_m2', label: 'Grout per m² of tiling', value: 0.4, unit: 'kg/m²', groupName: 'Finishes', description: '', sort: 103 }
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

export interface SeedMaterial {
  key: string
  name: string
  size: string
  unit: string
  category: string
  kind?: 'material' | 'hire'
  price: number
  source: string
}

const G = 'Seed: 2026 Nairobi market guides'
const IND = 'Indicative, confirm with suppliers'

/**
 * National default prices (KES). Sources: Jenga Hub, Fundi Link, Beyond Forest, BHD and Aspax 2026
 * price guides; Oak Timber Suppliers (timber per foot); Goldline / Smart Builders (mabati per metre);
 * pest-control retailers (termiticide); Beyond Forest, Tinga Works, Monolith Africa (plant hire);
 * Builders Store / Buy More Mall (gypsum, PPR, cable). Items marked "indicative" had no firm source.
 */
export const MATERIALS: SeedMaterial[] = [
  // Binders & aggregates
  { key: 'cement', name: 'Cement 42.5N', size: '50 kg bag', unit: 'bag', category: 'Binders & aggregates', price: 780, source: G },
  { key: 'sand', name: 'River sand', size: 'per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 2500, source: G },
  { key: 'ballast', name: 'Ballast', size: '20 mm, per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 2000, source: G },
  { key: 'hardcore', name: 'Hardcore', size: 'per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 1400, source: G },
  { key: 'murram', name: 'Murram', size: 'per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 1500, source: 'Jenga Hub 2026 (KES 1,200–1,800/t)' },
  { key: 'water', name: 'Water for construction (bowser delivered)', size: 'per m³ (1,000 L)', unit: 'm³', category: 'Binders & aggregates', price: 600, source: IND },
  // Walling
  { key: 'stone_200', name: 'Machine-cut stone', size: '9″ (200 mm) × 400 mm face', unit: 'piece', category: 'Walling', price: 75, source: G },
  { key: 'stone_150', name: 'Machine-cut stone', size: '6″ (150 mm) × 400 mm face', unit: 'piece', category: 'Walling', price: 60, source: G },
  { key: 'block_200', name: 'Concrete block', size: '9″ (200 mm) × 400 × 200 mm', unit: 'piece', category: 'Walling', price: 70, source: IND },
  { key: 'block_150', name: 'Concrete block', size: '6″ (150 mm) × 400 × 200 mm', unit: 'piece', category: 'Walling', price: 55, source: 'Jenga Hub / Goldstay 2026 (KES 35–65)' },
  { key: 'hoop_iron', name: 'Hoop iron', size: '20 gauge × 32 mm', unit: 'm', category: 'Walling', price: 30, source: G },
  // Reinforcement
  { key: 'r6', name: 'R6 mild steel bar', size: '6 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 320, source: G },
  { key: 'r8', name: 'R8 mild steel bar', size: '8 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 560, source: G },
  { key: 'y8', name: 'Y8 high-yield bar', size: '8 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 600, source: G },
  { key: 'y10', name: 'Y10 high-yield bar', size: '10 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 880, source: G },
  { key: 'y12', name: 'Y12 high-yield bar', size: '12 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 1550, source: G },
  { key: 'y16', name: 'Y16 high-yield bar', size: '16 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 2750, source: G },
  { key: 'y20', name: 'Y20 high-yield bar', size: '20 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 4300, source: G },
  { key: 'y25', name: 'Y25 high-yield bar', size: '25 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 6700, source: G },
  { key: 'binding_wire', name: 'Binding wire', size: 'per kg (20–25 kg rolls)', unit: 'kg', category: 'Reinforcement', price: 250, source: 'Carboncube / Jenga Hub 2026 (KES 3,600–6,000 per roll)' },
  { key: 'brc_a142', name: 'BRC mesh A142', size: '2.4 × 4.8 m sheet', unit: 'sheet', category: 'Reinforcement', price: 5800, source: G },
  { key: 'brc_a98', name: 'BRC mesh A98', size: '2.4 × 4.8 m sheet', unit: 'sheet', category: 'Reinforcement', price: 4300, source: G },
  // Waterproofing & treatment
  { key: 'dpm', name: 'Polythene DPM', size: '1000 gauge', unit: 'm²', category: 'Waterproofing & treatment', price: 90, source: G },
  { key: 'dpc_roll', name: 'Bituminous felt DPC', size: '200 mm × 30 m roll', unit: 'roll', category: 'Waterproofing & treatment', price: 2500, source: 'BHD / Buy More Mall 2026 (KES 1,200–4,500)' },
  { key: 'termiticide', name: 'Anti-termite chemical (chlorpyrifos 480 g/L, e.g. Gladiator)', size: '1 L concentrate, used at 1%', unit: 'L', category: 'Waterproofing & treatment', price: 5900, source: 'Pest-control retailers 2026 (Gladiator 1 L)' },
  { key: 'timber_preservative', name: 'Timber preservative (Solignum / creosote type)', size: 'per litre', unit: 'L', category: 'Waterproofing & treatment', price: 650, source: IND },
  // Timber (cypress, per running foot)
  { key: 'timber_2x2', name: 'Cypress timber', size: '2″ × 2″ (50 × 50 mm)', unit: 'ft', category: 'Timber', price: 30, source: 'Beyond Forest / Randtech 2026 (KES 23–35/ft)' },
  { key: 'timber_3x2', name: 'Cypress timber', size: '3″ × 2″ (75 × 50 mm)', unit: 'ft', category: 'Timber', price: 32, source: 'Oak Timber Suppliers (KES 28/ft) – Randtech (KES 43/ft)' },
  { key: 'timber_4x2', name: 'Cypress timber', size: '4″ × 2″ (100 × 50 mm)', unit: 'ft', category: 'Timber', price: 42, source: 'Oak Timber (KES 38/ft), Jenga Hub (KES 35–50/ft)' },
  { key: 'timber_6x2', name: 'Cypress timber', size: '6″ × 2″ (150 × 50 mm)', unit: 'ft', category: 'Timber', price: 70, source: 'Oak Timber (KES 75/ft), Jenga Hub (KES 55–75/ft)' },
  { key: 'timber_6x1', name: 'Cypress boards', size: '6″ × 1″ (150 × 25 mm)', unit: 'ft', category: 'Timber', price: 45, source: 'Beyond Forest 2026 (KES 50–80/ft across species)' },
  { key: 'timber_8x1', name: 'Cypress fascia board', size: '8″ × 1″ (200 × 25 mm)', unit: 'ft', category: 'Timber', price: 60, source: IND },
  { key: 'timber_9x1', name: 'Cypress fascia board', size: '9″ × 1″ (225 × 25 mm)', unit: 'ft', category: 'Timber', price: 70, source: IND },
  { key: 'bluegum_pole', name: 'Bluegum (eucalyptus) prop pole', size: '3–4 m, 75–100 mm', unit: 'piece', category: 'Formwork & propping', price: 300, source: IND },
  // Hardware & fixings
  { key: 'wire_nails', name: 'Wire nails (assorted 2″–6″)', size: 'per kg', unit: 'kg', category: 'Hardware & fixings', price: 250, source: 'Carboncube / Aspax 2026 (KES 150–400/kg)' },
  { key: 'roofing_nails', name: 'Roofing nails (umbrella head)', size: 'per kg', unit: 'kg', category: 'Hardware & fixings', price: 300, source: IND },
  // Roofing
  { key: 'sheet_g30', name: 'Pre-painted corrugated sheet G30', size: 'per metre length, 0.76 m cover', unit: 'm', category: 'Roofing', price: 600, source: 'Goldline (KES 520/m), Smart Builders (KES 610/m)' },
  { key: 'sheet_g28', name: 'Pre-painted corrugated sheet G28', size: 'per metre length, 0.76 m cover', unit: 'm', category: 'Roofing', price: 700, source: 'Goldline (KES 650/m), Smart Builders (KES 730/m)' },
  { key: 'ridge_cap', name: 'Ridge cap (pre-painted)', size: 'per metre', unit: 'm', category: 'Roofing', price: 450, source: IND },
  { key: 'gutter_pvc', name: 'UPVC gutter', size: '4 m length', unit: 'piece', category: 'Roofing', price: 1700, source: 'Mabati Yetu (KES 1,600–1,800)' },
  { key: 'downpipe_pvc', name: 'UPVC downpipe', size: '3 m length', unit: 'piece', category: 'Roofing', price: 1200, source: IND },
  // Finishes
  { key: 'emulsion_paint', name: 'Emulsion paint (vinyl silk / matt)', size: 'per litre (20 L tins)', unit: 'L', category: 'Finishes', price: 500, source: 'Aspax / Carboncube 2026 (KES 300–800/L)' },
  { key: 'undercoat', name: 'Undercoat / primer', size: 'per litre', unit: 'L', category: 'Finishes', price: 420, source: IND },
  { key: 'weathercoat', name: 'Exterior weathercoat paint', size: 'per litre', unit: 'L', category: 'Finishes', price: 700, source: IND },
  { key: 'ceramic_tile', name: 'Ceramic floor tiles', size: '40 × 40 cm', unit: 'm²', category: 'Finishes', price: 1100, source: 'DLG / Beyond Forest 2026 (KES 950–1,300/m²)' },
  { key: 'tile_adhesive', name: 'Tile adhesive (cement based)', size: '25 kg bag', unit: 'bag', category: 'Finishes', price: 1200, source: 'Jiji listings (KES 1,000–1,400 per 25 kg)' },
  { key: 'tile_grout', name: 'Tile grout', size: 'per kg', unit: 'kg', category: 'Finishes', price: 250, source: IND },
  { key: 'gypsum_board', name: 'Gypsum ceiling board', size: '9 mm, 4 × 8 ft', unit: 'sheet', category: 'Finishes', price: 750, source: 'Builders Store 2026 (Hada 9 mm)' },
  // Plumbing & electrical
  { key: 'ppr_25', name: 'PPR pipe PN16', size: '25 mm (¾″) × 4 m', unit: 'piece', category: 'Plumbing', price: 320, source: 'Builders Store (KES 320 per 4 m)' },
  { key: 'pvc_110', name: 'PVC waste pipe', size: '110 mm (4″)', unit: 'piece', category: 'Plumbing', price: 2700, source: 'Aqua Hub Kenya' },
  { key: 'water_tank_5000', name: 'Plastic water storage tank', size: '5,000 L', unit: 'piece', category: 'Plumbing', price: 35000, source: IND },
  { key: 'cable_1_0', name: 'Twin & earth cable', size: '1.0 mm², 100 m roll', unit: 'roll', category: 'Electrical', price: 6600, source: 'Buy More Mall 2026' },
  { key: 'cable_2_5', name: 'Power cable', size: '2.5 mm², 100 m roll', unit: 'roll', category: 'Electrical', price: 13500, source: 'Buy More Mall 2026' },
  // Plant & equipment hire (priced per unit of time)
  { key: 'hire_steel_prop', name: 'Adjustable steel prop (Acrow) hire', size: '1.8–3.3 m', unit: 'prop-day', category: 'Plant & equipment hire', kind: 'hire', price: 15, source: 'Indicative; Monolith Africa lists KES 180 per prop (period not stated)' },
  { key: 'hire_scaffold', name: 'Scaffolding hire (H-frame set)', size: 'per frame set', unit: 'set-day', category: 'Plant & equipment hire', kind: 'hire', price: 300, source: 'Beyond Forest 2026 (KES 200–500/day)' },
  { key: 'hire_mixer', name: 'Concrete mixer hire', size: '350 L, diesel', unit: 'day', category: 'Plant & equipment hire', kind: 'hire', price: 5500, source: 'Beyond Forest / Tinga Works (KES 5,000–7,000/day)' },
  { key: 'hire_poker', name: 'Poker vibrator hire', size: 'petrol, with needle', unit: 'day', category: 'Plant & equipment hire', kind: 'hire', price: 1250, source: 'Market rate KES 1,000–1,500/day' },
  { key: 'hire_compactor', name: 'Plate compactor hire', size: 'Wacker type', unit: 'day', category: 'Plant & equipment hire', kind: 'hire', price: 4000, source: 'Market rate KES 3,000–5,000/day' },
  { key: 'hire_roller', name: 'Compactor roller hire', size: 'ride-on', unit: 'day', category: 'Plant & equipment hire', kind: 'hire', price: 25000, source: 'Construction Kenya 2026' }
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
  ['PRE-060', 'preliminaries', 'Plant & equipment', 'Scaffolding hire, erection and dismantling for walling and finishes', 'Sum', 150, 'lump_sum', 'ext_wall_area', 1, false, true],
  ['PRE-070', 'preliminaries', 'Plant & equipment', 'Concrete mixer, poker vibrator and plate compactor hire for the works', 'Sum', 120, 'lump_sum', 'total_floor_area', 1, false, true],

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

/* ------------------------------------------------------------------ */
/* Methods of measurement                                              */
/* ------------------------------------------------------------------ */

export const STANDARDS = [
  {
    key: 'smm_ea', code: 'SMM (East Africa)', name: 'Standard Method of Measurement of Building Works for East Africa', scope: 'building',
    edition: '2nd edition, 2008', publisher: 'Architectural Association of Kenya, Quantity Surveyors Chapter',
    coverNote: 'Measured generally in accordance with the Standard Method of Measurement of Building Works for East Africa (2nd edition, 2008).', sort: 1
  },
  {
    key: 'cesmm4', code: 'CESMM4', name: 'Civil Engineering Standard Method of Measurement, fourth edition', scope: 'civil',
    edition: '4th edition, 2012', publisher: 'Institution of Civil Engineers (ICE)',
    coverNote: 'Measured in accordance with the Civil Engineering Standard Method of Measurement, fourth edition (CESMM4).', sort: 2
  }
]

/**
 * SMM for East Africa: sections in the order of the 2008 edition's contents. Letters are assigned in
 * that order (Excavation and earthwork = D, as in the edition); check them against your copy and
 * correct them in Admin → Measurement standards if they differ.
 */
export const SMM_SECTIONS: [code: string, title: string, guidance: string][] = [
  ['A', 'General rules', 'Units, classification and descriptions. Work is measured net as fixed in position; dimensions to the nearest 10 mm.'],
  ['B', 'Preliminaries', 'Contract conditions, site establishment, plant, supervision, insurances; prime cost and provisional sums.'],
  ['C', 'Demolitions and alterations', 'Demolishing structures, cutting openings, making good; generally itemised.'],
  ['D', 'Excavation and earthwork', 'Site clearance (m²), excavation in stated maximum depth stages from stated starting level (m³), disposal, filling and hardcore (m³ or m² stating thickness), anti-termite treatment.'],
  ['E', 'Piling', 'Piles by number and length, stating type and size.'],
  ['F', 'Concrete work', 'Concrete by mix and location (m³), formwork to stated surfaces (m²), reinforcement bars (kg) and fabric (m²), membranes.'],
  ['G', 'Walling', 'Stone, block and brick walling stating thickness (m²); damp-proof courses (m); walling reinforcement (m).'],
  ['H', 'Underpinning', 'Excavation, concrete and walling to underpin existing foundations.'],
  ['I', 'Asphalt work', 'Tanking, roofing and paving in asphalt (m²).'],
  ['J', 'Roofing', 'Roof coverings, ridges, flashings (m² / m); rainwater goods where not under plumbing.'],
  ['K', 'Carpentry', 'Structural timber: trusses, purlins, wall plates, fascias (m / nr).'],
  ['L', 'Joinery', 'Doors, frames, windows, fittings in timber (nr / m²).'],
  ['M', 'Structural steelwork', 'Steel frames and members (tonnes), stating sections.'],
  ['N', 'Metalwork', 'Steel windows and doors, burglar-proofing, balustrades (nr / m²).'],
  ['O', 'Plumbing and engineering installations', 'Water supply, sanitary pipework, rainwater goods, tanks (m / nr).'],
  ['P', 'Mechanical engineering installations', 'Heating, ventilation and other mechanical services.'],
  ['Q', 'Electrical installations', 'Wiring, conduits, switches, sockets, distribution boards and fittings (points / nr).'],
  ['R', 'Floor, wall and ceiling finishings', 'Plaster, render, screeds, tiling and ceilings, stating thickness and surface (m²).'],
  ['S', 'Glazing', 'Glass by type and thickness (m²).'],
  ['T', 'Painting and decorating', 'Paint systems to stated surfaces (m²), stating number of coats.'],
  ['U', 'Drainage', 'Pipes in trenches (m), manholes, septic tanks and soakaways (nr).'],
  ['V', 'Landscaping', 'Topsoil, grassing and planting (m² / nr).'],
  ['W', 'Roadworks', 'Pavings, kerbs and road layers (m² / m).'],
  ['X', 'Fencing', 'Fences, gates and boundary walls (m / nr).']
]

/** CESMM4 work classes (Institution of Civil Engineers). */
export const CESMM_SECTIONS: [code: string, title: string, guidance: string][] = [
  ['A', 'General items', 'Contractual and specified requirements, method-related charges, provisional sums and prime cost items.'],
  ['B', 'Ground investigation', 'Trial pits, boreholes, samples, tests.'],
  ['C', 'Geotechnical and other specialist processes', 'Grouting, diaphragm walls, ground anchors, drainage of the ground.'],
  ['D', 'Demolition and site clearance', 'General clearance (ha), trees, stumps, buildings and other structures.'],
  ['E', 'Earthworks', 'Excavation, dredging, filling, disposal and landscaping (m³ / m²).'],
  ['F', 'In situ concrete', 'Provision of concrete by grade (m³) and placing by member type (m³).'],
  ['G', 'Concrete ancillaries', 'Formwork (m²), reinforcement (tonnes / m² of fabric), joints, post-tensioning, finishes.'],
  ['H', 'Precast concrete', 'Beams, slabs, units (nr / m).'],
  ['I', 'Pipework – pipes', 'Pipes by material, diameter and trench depth (m).'],
  ['J', 'Pipework – fittings and valves', 'Bends, junctions, valves (nr).'],
  ['K', 'Pipework – manholes and pipework ancillaries', 'Manholes, chambers, gullies, French drains (nr / m).'],
  ['L', 'Pipework – supports and protection, ancillaries to laying and excavation', 'Extras to excavation, beds, surrounds, supports.'],
  ['M', 'Structural metalwork', 'Fabrication and erection of members (tonnes).'],
  ['N', 'Miscellaneous metalwork', 'Stairways, handrails, ladders, gratings, doors and frames (nr / m / tonnes).'],
  ['O', 'Timber', 'Components, decking and fittings (m / m²).'],
  ['P', 'Piles', 'Bored, driven and sheet piles (nr / m).'],
  ['Q', 'Piling ancillaries', 'Cutting off, testing, backfilling empty bores.'],
  ['R', 'Roads and pavings', 'Sub-base, bases, surfacing, kerbs, road markings (m² / m).'],
  ['S', 'Rail track', 'Track foundations, laying and supply.'],
  ['T', 'Tunnels', 'Excavation, linings and support.'],
  ['U', 'Brickwork, blockwork and masonry', 'Walls and facings by thickness (m²); surface features.'],
  ['V', 'Painting', 'Paint systems to stated surfaces (m²).'],
  ['W', 'Waterproofing', 'Damp proofing, tanking, roofing, protective layers (m²).'],
  ['X', 'Miscellaneous work', 'Fences, gates, drainage to structures, rock filling, landscaping.'],
  ['Y', 'Sewer and water main renovation and ancillary works', 'Renovation and preparation of existing sewers and mains.'],
  ['Z', 'Simple building works incidental to civil engineering works', 'Carpentry, joinery, insulation, windows, doors, finishes and services in small buildings.']
]

/** Library item → [SMM section, CESMM class]. */
export const LIBRARY_REFS: Record<string, [smm: string, cesmm: string]> = {
  'PRE-010': ['B', 'A'], 'PRE-020': ['B', 'A'], 'PRE-030': ['B', 'A'], 'PRE-040': ['B', 'A'], 'PRE-050': ['B', 'A'], 'PRE-060': ['B', 'A'], 'PRE-070': ['B', 'A'],
  'SUB-010': ['D', 'D'], 'SUB-020': ['D', 'E'], 'SUB-030': ['D', 'E'], 'SUB-040': ['D', 'E'], 'SUB-100': ['D', 'E'], 'SUB-110': ['D', 'E'],
  'SUB-200': ['F', 'F'], 'SUB-210': ['F', 'F'], 'SUB-220': ['F', 'F'], 'SUB-300': ['F', 'G'], 'SUB-400': ['F', 'G'],
  'SUB-500': ['G', 'U'], 'SUB-510': ['G', 'W'], 'SUB-600': ['D', 'X'], 'SUB-610': ['F', 'W'], 'SUB-620': ['F', 'G'], 'SUB-630': ['F', 'F'],
  'SUP-100': ['F', 'F'], 'SUP-110': ['F', 'F'], 'SUP-200': ['F', 'F'], 'SUP-300': ['F', 'G'], 'SUP-400': ['F', 'G'], 'SUP-410': ['F', 'G'], 'SUP-420': ['F', 'G'],
  'SUP-500': ['G', 'U'], 'SUP-505': ['G', 'U'], 'SUP-510': ['G', 'U'], 'SUP-600': ['F', 'F'],
  'ROF-100': ['K', 'O'], 'ROF-110': ['J', 'Z'], 'ROF-120': ['K', 'O'], 'ROF-130': ['O', 'Z'],
  'DW-100': ['N', 'N'], 'DW-110': ['N', 'N'], 'DW-200': ['L', 'Z'], 'DW-210': ['N', 'N'],
  'FIN-100': ['R', 'Z'], 'FIN-110': ['R', 'Z'], 'FIN-200': ['R', 'Z'], 'FIN-210': ['R', 'Z'], 'FIN-300': ['R', 'Z'], 'FIN-400': ['T', 'V'], 'FIN-410': ['T', 'V'], 'FIN-420': ['T', 'V'],
  'SER-100': ['Q', 'Z'], 'SER-200': ['O', 'Z'], 'SER-300': ['U', 'K'], 'SER-400': ['O', 'Z'],
  'EXT-100': ['W', 'R'], 'EXT-110': ['G', 'U'], 'EXT-120': ['V', 'X'],
  'PRO-110': ['B', 'A'], 'PRO-120': ['B', 'A'], 'PRO-130': ['B', 'A'], 'PRO-140': ['B', 'A']
}
