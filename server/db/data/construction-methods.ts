/**
 * Construction methods for houses, the BQ library items specific to each, and which existing items only
 * apply to some methods. Factors are relative to stone / block masonry and are editable in the admin.
 */
export const CONSTRUCTION_METHODS = [
  {
    key: 'masonry', label: 'Stone / block masonry', sort: 1, factor: 1, maxFloors: 20,
    description: 'Machine-cut stone or concrete block walls on strip foundations, with a reinforced concrete frame. The usual Kenyan method and the basis of all rates.',
    source: 'Baseline (all cost-per-m² rates are for masonry).'
  },
  {
    key: 'issb', label: 'Interlocking soil blocks (ISSB)', sort: 2, factor: 0.92, maxFloors: 2,
    description: 'Interlocking stabilised soil blocks made near site and laid with little or no mortar. Cheaper walling; usually up to two storeys.',
    source: 'Walling saving about 40% (2012 comparison KES 500 vs 850 per m²; government and vendor claims 30–50%: Nation, allAfrica, Makiga). Walls ≈ a fifth of house cost → about 8% overall.'
  },
  {
    key: 'timber_frame', label: 'Timber frame', sort: 3, factor: 0.9, maxFloors: 2,
    description: 'Treated cypress stud walls on a slab or raised floor, sheathed, insulated, clad in timber boards and lined with gypsum. No concrete frame or plaster.',
    source: 'Builders report 20–30% below stone (marketing claim, ProBuilders Kenya / Aalis Studios); 10% used to allow for termite treatment (+20–30% on timber) and finishes.'
  },
  {
    key: 'lgs_prefab', label: 'Light-gauge steel / prefab', sort: 4, factor: 1, maxFloors: 3,
    description: 'Factory-made light-gauge steel frames or prefabricated panels, clad in boards and lined with gypsum. Fast to erect.',
    source: 'No reliable Kenyan whole-house comparison found (LGS roof framing ≈ treated timber, KES 1,100–1,500 per m²). Set to masonry parity: adjust from supplier quotes.'
  },
  {
    key: '3d_printed', label: '3D-printed walls', sort: 5, factor: 1, maxFloors: 1,
    description: 'Walls printed on site in cementitious mortar by a specialist (in Kenya, 14Trees / Holcim at Mvule Gardens, Kilifi). Walls of a 2-bedroom house print in about 18 hours.',
    source: '14Trees: about KES 40,000 per m², "the same as a conventional building with similar characteristics", aiming for 20% savings (The Africa Report, Freethink).'
  }
]

type Lib = [code: string, bill: string, section: string, description: string, unit: string, rate: number, type: 'measured' | 'provisional' | 'pc_sum' | 'lump_sum', driver: string, factor: number, finishSensitive: boolean, includeByDefault: boolean, methods: string]

/**
 * Method-specific BQ library items. Timber rates are built up from Kadiria material prices + 35% labour
 * (see each comment); ISSB at about 60% of the stone rate; LGS and 3D-printed rates are indicative.
 */
export const METHOD_LIBRARY: Lib[] = [
  // ISSB: 0.6 × stone walling rate (2012 per-m² comparison)
  ['SUP-520', 'superstructure', 'Walling', '220 mm interlocking stabilised soil block (ISSB) external walling, dry-stacked with grouted reinforced cores', 'm²', 1450, 'measured', 'ext_wall_area', 1, false, true, 'issb'],
  ['SUP-525', 'superstructure', 'Walling', '140 mm interlocking stabilised soil block (ISSB) internal walling', 'm²', 1200, 'measured', 'int_wall_area', 1, false, true, 'issb'],
  // Timber frame: 4×2 studs at 600 mm with plates and noggins ≈ 10.3 ft/m² × KES 42 + nails and preservative ≈ 585, + 35%
  ['SUP-530', 'superstructure', 'Timber frame', 'Treated cypress 4″ × 2″ stud wall framing at 600 mm centres to external walls, including sole and head plates, noggins and bracing', 'm²', 800, 'measured', 'ext_wall_area', 1, false, true, 'timber_frame'],
  // 3×2 studs ≈ 10.3 ft/m² × KES 32 + fixings ≈ 380, + 35%
  ['SUP-535', 'superstructure', 'Timber frame', 'Treated cypress 3″ × 2″ stud partitions at 600 mm centres, including plates and noggins', 'm²', 520, 'measured', 'int_wall_area', 1, false, true, 'timber_frame'],
  // 12 mm plywood KES 2,600 / 2.98 m² + 5% + fixings ≈ 945, + 35%
  ['SUP-540', 'superstructure', 'Timber frame', '12 mm plywood sheathing to external stud walls, including breather membrane', 'm²', 1280, 'measured', 'ext_wall_area', 1, false, true, 'timber_frame'],
  // 6×1 boards at ~140 mm cover ≈ 23.4 ft/m² × KES 45 + nails and preservative ≈ 1,135, + 35%
  ['SUP-550', 'superstructure', 'Timber frame', 'Treated cypress 6″ × 1″ weatherboard cladding to external walls', 'm²', 1530, 'measured', 'ext_wall_area', 1, true, true, 'timber_frame'],
  // Fibreglass insulation KES 750 per m², + 35%
  ['SUP-555', 'superstructure', 'Timber frame', 'Insulation between studs to external walls', 'm²', 1000, 'measured', 'ext_wall_area', 1, false, true, 'timber_frame,lgs_prefab'],
  // Gypsum board KES 750 / 2.98 m² + screws and jointing ≈ 330, + 35% (per side)
  ['FIN-120', 'finishes', 'Wall finishes', '9 mm gypsum board lining to stud walls, screwed, taped and jointed', 'm²', 450, 'measured', 'plaster_area', 1, false, true, 'timber_frame,lgs_prefab'],
  // Timber preservative KES 650/L at ~8 m²/L × 2 coats ≈ 165, + 35%
  ['FIN-430', 'finishes', 'Decoration', 'Two coats exterior wood stain / preservative to timber cladding', 'm²', 220, 'measured', 'ext_wall_area', 1, true, true, 'timber_frame'],
  // LGS: ≈ LGS roof framing rate KES 1,100–1,500 per m² (indicative)
  ['SUP-560', 'superstructure', 'Light-gauge steel frame', 'Light-gauge steel wall framing to external and internal walls, supplied and erected (indicative; confirm with LGS supplier)', 'm²', 1300, 'measured', 'wall_area', 1, false, true, 'lgs_prefab'],
  // External board cladding ≈ sheathing + paint (indicative)
  ['SUP-565', 'superstructure', 'Light-gauge steel frame', 'External cladding boards (fibre-cement or similar) to steel frame, jointed and painted (indicative)', 'm²', 1700, 'measured', 'ext_wall_area', 1, true, true, 'lgs_prefab'],
  // 3D-printed: 14Trees cost ≈ conventional → masonry walling rate (indicative)
  ['SUP-570', 'superstructure', 'Printed walling', '3D-printed cementitious walling, specialist subcontract including printing, reinforcement in cavities and cavity fill (indicative)', 'm²', 2300, 'measured', 'wall_area', 1, false, true, '3d_printed']
]

/** Existing library items that only apply to some methods. */
export const LIBRARY_METHODS: Record<string, string> = {
  'SUP-500': 'masonry', 'SUP-505': 'masonry', 'SUP-510': 'masonry',
  'SUP-100': 'masonry,issb,3d_printed', 'SUP-110': 'masonry,issb,3d_printed',
  // Concrete frame and upper-floor slab: not part of timber or light-gauge steel houses
  'SUP-200': 'masonry,issb,3d_printed', 'SUP-300': 'masonry,issb,3d_printed', 'SUP-400': 'masonry,issb,3d_printed', 'SUP-410': 'masonry,issb,3d_printed', 'SUP-420': 'masonry,issb,3d_printed',
  'FIN-100': 'masonry,issb,3d_printed', 'FIN-110': 'masonry,issb,3d_printed', 'FIN-420': 'masonry,issb,3d_printed'
}

/** Method items' references under each method of measurement. */
export const METHOD_LIBRARY_REFS: Record<string, { smm_ea: string, cesmm4: string, aaqs_2015: string }> = {
  'SUP-520': { smm_ea: 'G', cesmm4: 'U', aaqs_2015: '09' }, 'SUP-525': { smm_ea: 'G', cesmm4: 'U', aaqs_2015: '09' },
  'SUP-530': { smm_ea: 'K', cesmm4: 'O', aaqs_2015: '12' }, 'SUP-535': { smm_ea: 'K', cesmm4: 'O', aaqs_2015: '12' },
  'SUP-540': { smm_ea: 'K', cesmm4: 'O', aaqs_2015: '12' }, 'SUP-550': { smm_ea: 'K', cesmm4: 'O', aaqs_2015: '12' },
  'SUP-555': { smm_ea: 'K', cesmm4: 'Z', aaqs_2015: '13' }, 'FIN-120': { smm_ea: 'R', cesmm4: 'Z', aaqs_2015: '13' },
  'FIN-430': { smm_ea: 'T', cesmm4: 'V', aaqs_2015: '24' }, 'SUP-560': { smm_ea: 'M', cesmm4: 'M', aaqs_2015: '16' },
  'SUP-565': { smm_ea: 'N', cesmm4: 'Z', aaqs_2015: '11' }, 'SUP-570': { smm_ea: 'F', cesmm4: 'F', aaqs_2015: '07' }
}
