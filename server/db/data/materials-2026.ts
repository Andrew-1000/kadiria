import type { SeedMaterial } from '../seed-data'

/**
 * Additional materials from published Kenyan 2026 price guides. Price = middle of the quoted range;
 * the source names the guide and the range. Indicative: confirm with suppliers, and update prices in
 * Admin → Materials & prices. Items whose unit wasn't stated in the source are left out.
 */
const JH = (range: string) => `JengaHub Nairobi price list, Mar 2026 (KES ${range})`
const BMM = (price: string) => `Buy More Mall price list, Sep 2026 (KES ${price})`
const AAL = (range: string) => `Aalis Studios interior finishes guide, Mar 2026 (KES ${range})`

const CC = (range: string) => `CarbonCube hardware guide, Oct 2026 (KES ${range})`
const AS = (range: string) => `Aspax Construction materials costs, 2026 (KES ${range})`
const FL = (range: string) => `Fundi Link materials prices, Aug 2026 (KES ${range})`
const BMW = (price: string) => `Buy More Mall wiring price list, Sep 2026 (KES ${price})`

export const MORE_MATERIALS: SeedMaterial[] = [
  // Binders & aggregates
  { key: 'cement_32_5', name: 'Cement 32.5N', size: '50 kg bag', unit: 'bag', category: 'Binders & aggregates', price: 775, source: JH('700–850') },
  { key: 'plaster_sand', name: 'Plaster sand (fine)', size: 'per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 2400, source: JH('2,000–2,800') },
  { key: 'ballast_12', name: 'Ballast ½″ (12 mm)', size: 'per tonne', unit: 'tonne', category: 'Binders & aggregates', price: 2800, source: JH('2,400–3,200') },
  { key: 'waterproof_cement', name: 'Waterproof cement', size: 'per kg', unit: 'kg', category: 'Waterproofing & treatment', price: 135, source: BMM('120–150 per kg') },

  // Walling
  { key: 'block_100', name: 'Concrete block', size: '4″ (100 mm)', unit: 'piece', category: 'Walling', price: 38, source: JH('30–45') },
  { key: 'interlocking_block', name: 'Interlocking soil-cement block (ISSB)', size: 'standard', unit: 'piece', category: 'Walling', price: 65, source: JH('50–80') },
  { key: 'clay_brick', name: 'Clay brick', size: 'standard', unit: 'piece', category: 'Walling', price: 20, source: JH('15–25') },

  // Reinforcement
  { key: 'r10', name: 'R10 mild steel bar', size: '10 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 850, source: BMM('850') },
  { key: 'brc_a193', name: 'BRC mesh A193', size: '2.4 × 1.2 m sheet', unit: 'sheet', category: 'Reinforcement', price: 1800, source: JH('1,600–2,000') },

  // Timber, boards and formwork
  { key: 'plywood_12', name: 'Plywood 12 mm', size: '4 × 8 ft (1.22 × 2.44 m)', unit: 'sheet', category: 'Timber', price: 2600, source: JH('2,200–3,000') },
  { key: 'plywood_18', name: 'Plywood 18 mm (formwork / joinery)', size: '4 × 8 ft (1.22 × 2.44 m)', unit: 'sheet', category: 'Timber', price: 3850, source: JH('3,200–4,500') },
  { key: 'blockboard', name: 'Blockboard', size: '4 × 8 ft', unit: 'sheet', category: 'Timber', price: 3200, source: BMM('3,200') },
  { key: 'treated_pole_10ft', name: 'Treated timber pole', size: '10 ft (3 m)', unit: 'piece', category: 'Formwork & propping', price: 650, source: JH('500–800') },

  // Roofing
  { key: 'clay_roof_tile', name: 'Clay roofing tile', size: 'standard', unit: 'piece', category: 'Roofing', price: 115, source: JH('80–150') },
  { key: 'concrete_roof_tile', name: 'Concrete roofing tile', size: 'standard', unit: 'piece', category: 'Roofing', price: 80, source: JH('60–100') },
  { key: 'decra_classic', name: 'Stone-coated steel roofing tile, classic profile', size: 'per tile panel', unit: 'piece', category: 'Roofing', price: 750, source: BMM('750') },
  { key: 'decra_shingle', name: 'Stone-coated steel roofing tile, shingle profile', size: 'per tile panel', unit: 'piece', category: 'Roofing', price: 800, source: BMM('800') },
  { key: 'gutter_pvc_m', name: 'PVC gutter', size: 'per metre', unit: 'm', category: 'Roofing', price: 500, source: JH('400–600') },

  // Doors, windows & ironmongery
  { key: 'door_hollow_core', name: 'Hollow-core interior flush door', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 7000, source: AAL('5,000–9,000') },
  { key: 'door_solid_flush', name: 'Solid-core flush door, MDF skin', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 17000, source: AAL('12,000–22,000') },
  { key: 'door_engineered', name: 'Engineered timber door, painted or veneered', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 40000, source: AAL('25,000–55,000') },
  { key: 'door_steel_single', name: 'Steel security door, single, with frame and locks', size: 'single', unit: 'piece', category: 'Doors, windows & ironmongery', price: 20000, source: BMM('20,000') },
  { key: 'door_steel_double', name: 'Steel security door, double, with frame and locks', size: 'double', unit: 'piece', category: 'Doors, windows & ironmongery', price: 27000, source: BMM('27,000') },
  { key: 'window_steel', name: 'Steel window, powder-coated', size: 'standard, per m²', unit: 'm²', category: 'Doors, windows & ironmongery', price: 5500, source: AAL('4,000–7,000 per m²') },
  { key: 'window_aluminium', name: 'Aluminium window', size: 'standard, per m²', unit: 'm²', category: 'Doors, windows & ironmongery', price: 11000, source: AAL('8,000–14,000 per m²') },
  { key: 'lever_handle_set', name: 'Door lever handle set with mortise lock', size: 'brass / chrome', unit: 'set', category: 'Doors, windows & ironmongery', price: 4250, source: AAL('2,500–6,000') },

  // Plumbing & sanitary
  { key: 'ppr_20_m', name: 'PPR pipe', size: '20 mm (½″), per metre', unit: 'm', category: 'Plumbing', price: 100, source: JH('80–120 per m') },
  { key: 'ppr_25_m', name: 'PPR pipe', size: '25 mm (¾″), per metre', unit: 'm', category: 'Plumbing', price: 150, source: JH('120–180 per m') },
  { key: 'wc_close_coupled', name: 'WC suite, close-coupled (local brand)', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 13000, source: AAL('8,000–18,000') },
  { key: 'wash_basin', name: 'Wash hand basin with pedestal', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 8500, source: AAL('5,000–12,000') },
  { key: 'basin_mixer', name: 'Basin mixer tap (standard)', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 8000, source: AAL('5,000–35,000; standard range') },
  { key: 'manhole_cover_450', name: 'Manhole cover', size: '18 × 18 in (450 × 450 mm)', unit: 'piece', category: 'Plumbing', price: 950, source: BMM('900–1,000') },
  { key: 'manhole_cover_450x600', name: 'Manhole cover', size: '18 × 24 in (450 × 600 mm)', unit: 'piece', category: 'Plumbing', price: 1550, source: BMM('1,550') },

  // Electrical
  { key: 'cable_1_5_m', name: 'Single-core cable', size: '1.5 mm², per metre', unit: 'm', category: 'Electrical', price: 50, source: BMM('50 per m') },
  { key: 'cable_2_5_m', name: 'Power cable', size: '2.5 mm², per metre', unit: 'm', category: 'Electrical', price: 75, source: JH('60–90 per m') },
  { key: 'conduit_20', name: 'PVC conduit', size: '20 mm, per metre', unit: 'm', category: 'Electrical', price: 40, source: JH('30–50 per m') },
  { key: 'switch_box', name: 'Switch box (single)', size: 'flush', unit: 'piece', category: 'Electrical', price: 30, source: BMM('30') },
  { key: 'switch_twin', name: 'Twin switch', size: 'linear', unit: 'piece', category: 'Electrical', price: 350, source: BMM('350') },

  // Finishes
  { key: 'porcelain_50', name: 'Porcelain floor tile', size: '50 × 50 cm', unit: 'm²', category: 'Finishes', price: 1070, source: AAL('1,070') },
  { key: 'porcelain_60', name: 'Porcelain floor tile', size: '60 × 60 cm', unit: 'm²', category: 'Finishes', price: 1250, source: AAL('1,250') },
  { key: 'porcelain_60x120', name: 'Large-format porcelain tile', size: '60 × 120 cm', unit: 'm²', category: 'Finishes', price: 1830, source: AAL('1,460–2,200') },
  { key: 'wall_tile_30x60', name: 'Wall tile', size: '30 × 60 cm', unit: 'm²', category: 'Finishes', price: 1500, source: AAL('1,200–1,800') },
  { key: 'spc_vinyl', name: 'SPC vinyl plank flooring (waterproof)', size: 'click-lock', unit: 'm²', category: 'Finishes', price: 1800, source: AAL('1,200–2,400') },
  { key: 'engineered_wood_floor', name: 'Engineered hardwood flooring', size: '8–12 mm, click-lock', unit: 'm²', category: 'Finishes', price: 4150, source: AAL('2,800–5,500') },
  { key: 'gypsum_c_channel', name: 'Gypsum ceiling C-channel', size: '60 mm × 3 m', unit: 'length', category: 'Finishes', price: 330, source: AAL('280–380') },
  { key: 'drywall_screws', name: 'Drywall screws', size: 'box of 1,000', unit: 'box', category: 'Hardware & fixings', price: 725, source: AAL('450–1,000') },
  { key: 'joint_compound', name: 'Gypsum joint compound', size: '25 kg bag', unit: 'bag', category: 'Finishes', price: 1750, source: AAL('1,500–2,000') },
  { key: 'pu_cornice', name: 'PU cornice', size: 'per metre', unit: 'm', category: 'Finishes', price: 275, source: AAL('150–400') },

  // Waterproofing
  { key: 'polythene_12kg', name: 'Polythene sheeting roll (DPM)', size: '12 kg roll', unit: 'roll', category: 'Waterproofing & treatment', price: 1400, source: BMM('1,400') },
  { key: 'polythene_25kg', name: 'Polythene sheeting roll (DPM)', size: '25 kg roll', unit: 'roll', category: 'Waterproofing & treatment', price: 2900, source: BMM('2,900') },

  // ---- Second batch (CarbonCube, Aspax, Fundi Link, Buy More Mall wiring list) ----
  // Aggregates & steel
  { key: 'sand_lorry_7t', name: 'River sand, lorry load', size: '7 tonnes, delivered (Nairobi area)', unit: 'load', category: 'Binders & aggregates', price: 21000, source: FL('18,000–24,000') },
  { key: 'y32', name: 'Y32 high-yield bar', size: '32 mm × 12 m', unit: 'bar', category: 'Reinforcement', price: 9950, source: CC('7,660–12,250') },
  { key: 'binding_wire_25kg', name: 'Binding wire', size: '25 kg roll', unit: 'roll', category: 'Reinforcement', price: 4075, source: CC('3,800–4,350') },
  { key: 'hoop_iron_20kg', name: 'Hoop iron', size: '20 kg roll', unit: 'roll', category: 'Walling', price: 3125, source: CC('3,000–3,250') },
  { key: 'nails_50kg', name: 'Wire nails, bulk', size: '50 kg (2½–6 in)', unit: 'bag', category: 'Hardware & fixings', price: 7750, source: CC('7,500–8,000') },

  // Roofing & insulation
  { key: 'sheet_resincot_g30', name: 'Coloured corrugated sheet (Resincot) G30', size: 'per metre length', unit: 'm', category: 'Roofing', price: 540, source: CC('520–560 per m') },
  { key: 'sheet_box_g30', name: 'Box profile sheet G30', size: 'per metre length', unit: 'm', category: 'Roofing', price: 521, source: CC('430–612 per m') },
  { key: 'sheet_box_g28', name: 'Box profile sheet G28 (smooth)', size: 'per metre length', unit: 'm', category: 'Roofing', price: 875, source: CC('837–912 per m') },
  { key: 'sheet_versatile_g30', name: 'Tile-profile (versatile) sheet G30', size: 'per metre length', unit: 'm', category: 'Roofing', price: 680, source: CC('630–730 per m') },
  { key: 'sheet_versatile_g28', name: 'Tile-profile (versatile) sheet G28', size: 'per metre length', unit: 'm', category: 'Roofing', price: 900, source: CC('842–958 per m') },
  { key: 'sheet_box_g26', name: 'Industrial box profile sheet G26', size: 'per metre length', unit: 'm', category: 'Roofing', price: 1150, source: CC('1,100–1,200 per m') },
  { key: 'ridge_flashing_2m', name: 'Ridge, valley or flashing', size: '2 m piece', unit: 'piece', category: 'Roofing', price: 525, source: CC('450–600') },
  { key: 'pu_roof_panel', name: 'PU insulated roof panel', size: 'per sheet', unit: 'sheet', category: 'Roofing', price: 14850, source: AS('14,700–15,000') },
  { key: 'insulation_polystyrene', name: 'Polystyrene insulation panel', size: 'wall / roof', unit: 'm²', category: 'Roofing', price: 1150, source: AS('800–1,500 per m²') },
  { key: 'insulation_fibreglass', name: 'Fibreglass ceiling insulation', size: 'per m²', unit: 'm²', category: 'Roofing', price: 750, source: AS('500–1,000 per m²') },

  // Waterproofing
  { key: 'torch_on_membrane', name: 'APP torch-on waterproofing membrane', size: '4 mm, 10 × 1 m roll', unit: 'roll', category: 'Waterproofing & treatment', price: 6500, source: CC('6,500, estimate') },
  { key: 'bitumen_coating_20l', name: 'Bitumen coating (foundations)', size: '20 L bucket', unit: 'bucket', category: 'Waterproofing & treatment', price: 3000, source: AS('2,000–4,000') },
  { key: 'waterproof_admix_25l', name: 'Waterproofing admixture for concrete and mortar', size: '25 L', unit: 'can', category: 'Waterproofing & treatment', price: 7000, source: CC('6,500–7,500, Sika-1') },
  { key: 'integral_waterproofer_20l', name: 'Integral liquid waterproofer', size: '20 L', unit: 'can', category: 'Waterproofing & treatment', price: 4900, source: CC('4,800–5,000, Dr Fixit Pidiproof LW+') },
  { key: 'sbr_latex_20l', name: 'SBR latex bonding and waterproofing agent', size: '20 L', unit: 'can', category: 'Waterproofing & treatment', price: 13000, source: CC('13,000') },

  // Paints by tin (Crown list prices)
  { key: 'silk_emulsion_4l', name: 'Silk vinyl emulsion, brilliant white', size: '4 L tin', unit: 'tin', category: 'Finishes', price: 3255, source: CC('3,255') },
  { key: 'silk_emulsion_20l', name: 'Silk vinyl emulsion, brilliant white', size: '20 L tin', unit: 'tin', category: 'Finishes', price: 16268, source: CC('16,268') },
  { key: 'exterior_emulsion_20l', name: 'Exterior emulsion', size: '20 L tin', unit: 'tin', category: 'Finishes', price: 15086, source: CC('2,870 for 4 L to 15,086 for 20 L, Permaplast') },
  { key: 'undercoat_4l', name: 'Universal undercoat', size: '4 L tin', unit: 'tin', category: 'Finishes', price: 2585, source: CC('2,585') },
  { key: 'undercoat_20l', name: 'Universal undercoat', size: '20 L tin', unit: 'tin', category: 'Finishes', price: 16255, source: CC('16,255') },
  { key: 'gloss_1l', name: 'Super gloss enamel, brilliant white', size: '1 L tin', unit: 'tin', category: 'Finishes', price: 1089, source: CC('1,089') },
  { key: 'gloss_4l', name: 'Super gloss enamel, brilliant white', size: '4 L tin', unit: 'tin', category: 'Finishes', price: 3729, source: CC('3,729') },
  { key: 'gloss_20l', name: 'Super gloss enamel, brilliant white', size: '20 L tin', unit: 'tin', category: 'Finishes', price: 18638, source: CC('18,638') },

  // Plumbing & sanitary
  { key: 'ppr_20', name: 'PPR pipe PN16', size: '20 mm (½″) × 4 m', unit: 'piece', category: 'Plumbing', price: 260, source: CC('220–300 per 4 m') },
  { key: 'ppr_32', name: 'PPR pipe PN16', size: '32 mm (1″) × 4 m', unit: 'piece', category: 'Plumbing', price: 550, source: CC('500–600 per 4 m') },
  { key: 'water_tank_1000', name: 'Plastic water tank', size: '1,000 L', unit: 'piece', category: 'Plumbing', price: 6500, source: CC('4,500–8,500') },
  { key: 'water_tank_2000', name: 'Plastic water tank', size: '1,500–2,000 L', unit: 'piece', category: 'Plumbing', price: 11125, source: CC('8,250–14,000') },
  { key: 'water_tank_3000', name: 'Plastic water tank', size: '3,000 L', unit: 'piece', category: 'Plumbing', price: 16500, source: CC('14,500–18,500') },
  { key: 'water_tank_8000', name: 'Plastic water tank', size: '8,000 L', unit: 'piece', category: 'Plumbing', price: 43750, source: CC('32,500–55,000') },
  { key: 'water_tank_10000', name: 'Plastic water tank', size: '10,000 L', unit: 'piece', category: 'Plumbing', price: 62750, source: CC('45,500–80,000') },
  { key: 'kitchen_sink_single', name: 'Stainless steel kitchen sink, single bowl', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 8500, source: AS('5,000–12,000') },
  { key: 'kitchen_sink_double', name: 'Stainless steel kitchen sink, double bowl', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 17500, source: AS('10,000–25,000') },
  { key: 'shower_basic', name: 'Shower set, basic', size: 'supply only', unit: 'piece', category: 'Plumbing', price: 5500, source: AS('3,000–8,000') },
  { key: 'instant_shower', name: 'Instant electric shower heater', size: 'standard', unit: 'piece', category: 'Plumbing', price: 2200, source: BMW('2,200') },

  // Electrical
  { key: 'cable_4_m', name: 'Power cable', size: '4 mm², per metre', unit: 'm', category: 'Electrical', price: 150, source: AS('120–180 per m') },
  { key: 'cable_6_m', name: 'Power cable', size: '6 mm², per metre', unit: 'm', category: 'Electrical', price: 215, source: AS('180–250 per m') },
  { key: 'twin_earth_1_0_m', name: 'Twin and earth cable', size: '1.0 mm², per metre', unit: 'm', category: 'Electrical', price: 80, source: BMW('80 per m') },
  { key: 'consumer_unit_4way', name: 'Consumer unit (distribution board)', size: '4-way', unit: 'piece', category: 'Electrical', price: 2150, source: BMW('2,000–2,300') },
  { key: 'mcb', name: 'Miniature circuit breaker (MCB)', size: 'single pole', unit: 'piece', category: 'Electrical', price: 2000, source: AS('1,000–3,000 each') },
  { key: 'switch_single', name: 'Single switch', size: 'one-way', unit: 'piece', category: 'Electrical', price: 175, source: BMW('150–200') },
  { key: 'led_bulb', name: 'LED bulb', size: '7–10 W', unit: 'piece', category: 'Electrical', price: 550, source: AS('300–800 each') },
  { key: 'bulb_holder', name: 'Bulb holder (batten)', size: 'standard', unit: 'piece', category: 'Electrical', price: 100, source: BMW('80–150') },
  { key: 'ceiling_light', name: 'Ceiling light fitting, standard', size: 'supply only', unit: 'piece', category: 'Electrical', price: 3250, source: AS('1,500–5,000') },
  { key: 'conduit_bend_20', name: 'Conduit bend', size: '20 mm (½″)', unit: 'piece', category: 'Electrical', price: 20, source: BMW('20') },

  // Doors & windows
  { key: 'door_hardwood_external', name: 'External door, hardwood (mahogany)', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 47500, source: AS('35,000–60,000') },
  { key: 'door_softwood_external', name: 'External door, softwood', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 22500, source: AS('15,000–30,000') },
  { key: 'door_panel_internal', name: 'Internal panel door', size: 'standard leaf', unit: 'piece', category: 'Doors, windows & ironmongery', price: 18500, source: AS('12,000–25,000') },
  { key: 'window_aluminium_pc', name: 'Aluminium window, powder-coated', size: 'per m²', unit: 'm²', category: 'Doors, windows & ironmongery', price: 15000, source: AS('12,000–18,000 per m²') },
  { key: 'window_cypress', name: 'Timber window, cypress', size: 'per m²', unit: 'm²', category: 'Doors, windows & ironmongery', price: 14000, source: AS('10,000–18,000 per m²') },
  { key: 'window_mahogany', name: 'Timber window, mahogany', size: 'per m²', unit: 'm²', category: 'Doors, windows & ironmongery', price: 20000, source: AS('15,000–25,000 per m²') },

  // Boards & ceilings
  { key: 'gypsum_board_mr', name: 'Gypsum board, moisture-resistant', size: '8 × 4 ft', unit: 'sheet', category: 'Finishes', price: 775, source: AS('650–900') },
  { key: 'gypsum_board_fr', name: 'Gypsum board, fire-resistant', size: '8 × 4 ft', unit: 'sheet', category: 'Finishes', price: 950, source: AS('800–1,100') },
  { key: 'tng_ceiling', name: 'Tongue-and-groove timber ceiling boards', size: 'per m²', unit: 'm²', category: 'Finishes', price: 1250, source: AS('1,000–1,500 per m²') },
  { key: 'hardboard', name: 'Hardboard', size: 'standard sheet', unit: 'sheet', category: 'Timber', price: 1150, source: AS('800–1,500') },
  { key: 'flooring_board_6x1', name: 'Timber flooring board 6 in × 1 in', size: '12 ft piece', unit: 'piece', category: 'Timber', price: 575, source: FL('450–700') }
]
