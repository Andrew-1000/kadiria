import type { SeedMaterial } from '../seed-data'

/**
 * Additional materials from published Kenyan 2026 price guides. Price = middle of the quoted range;
 * the source names the guide and the range. Indicative: confirm with suppliers, and update prices in
 * Admin → Materials & prices. Items whose unit wasn't stated in the source are left out.
 */
const JH = (range: string) => `JengaHub Nairobi price list, Mar 2026 (KES ${range})`
const BMM = (price: string) => `Buy More Mall price list, Sep 2026 (KES ${price})`
const AAL = (range: string) => `Aalis Studios interior finishes guide, Mar 2026 (KES ${range})`

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
  { key: 'polythene_25kg', name: 'Polythene sheeting roll (DPM)', size: '25 kg roll', unit: 'roll', category: 'Waterproofing & treatment', price: 2900, source: BMM('2,900') }
]
