/**
 * Methods-of-measurement reference data, researched from public sources (November 2026).
 * Rules are short paraphrases (the standards themselves are copyright); each names its source so it can
 * be checked. Edit or extend everything in Admin → Methods of measurement.
 */
import { KENYA_ROADS_PAY_ITEMS } from './data/kenya-roads-pay-items'

const AAQS_SRC = 'AAQS Standard Method of Measuring Building Work for Africa, 2015 (paraphrased)'
const ROADS_SRC = 'Kenya Standard Specification for Road and Bridge Construction, 2023'
const CESMM_SRC = 'CivilQuants CESMM4 guides, 2026 (paraphrase; check against CESMM4)'
const SMMEA_SRC = 'QC 220 lecture summary of SMM for East Africa (check against the 2008 edition)'

export const EXTRA_STANDARDS = [
  {
    key: 'aaqs_2015', code: 'AAQS SMM (Africa)', name: 'Standard Method of Measuring Building Work for Africa', scope: 'building',
    edition: '1st edition, 2015', publisher: 'Africa Association of Quantity Surveyors (AAQS)',
    coverNote: 'Measured in accordance with the Standard Method of Measuring Building Work for Africa (AAQS, 1st edition, 2015).', sort: 3
  },
  {
    key: 'kenya_roads_2023', code: 'Roads Spec (Kenya)', name: 'Standard Specification for Road and Bridge Construction', scope: 'civil',
    edition: 'August 2023 (Works and Services Contracts Manual, Part 2)', publisher: 'Ministry of Roads and Transport, Kenya',
    coverNote: 'Measured and paid in accordance with the Standard Specification for Road and Bridge Construction (Ministry of Roads and Transport, 2023).', sort: 4
  }
]

/** AAQS 2015 trades in the order of the standard. Numbering is Kadiria's (the standard titles its trades without numbers). */
export const AAQS_SECTIONS: [code: string, title: string, guidance: string][] = [
  ['00', 'General instructions', 'Units, order of items and dimensions, net measurement, rounding, provisional quantities and sums, contingencies.'],
  ['01', 'Preliminaries', 'Information and general requirements and restrictions that affect the cost of the works.'],
  ['02', 'Demolitions', 'Demolition of structures, generally itemised.'],
  ['03', 'Alterations', 'Removals, alteration work, openings, building up openings, re-use of components, work in patches.'],
  ['04', 'Earthworks', 'Site clearance, excavation, carting away, working space, keeping excavations free of water, filling, compaction, weedkillers and insecticides.'],
  ['05', 'Lateral support', 'Removal of lateral support, ground anchors, rock bolts, planking, strutting and shoring, lateral support piling.'],
  ['06', 'Piling', 'Precast, steel, augered, driven and bored piles; sheet piling; cutting off and testing.'],
  ['07', 'Concrete, formwork and reinforcement', 'In situ concrete (m³), formwork (m²), bar reinforcement (t), fabric (m²), post-tensioning.'],
  ['08', 'Precast concrete', 'Precast components.'],
  ['09', 'Masonry', 'Brickwork, face brickwork, blockwork, paving, natural stonework, rubble walling, reinforcement.'],
  ['10', 'Waterproofing', 'Sheet, membrane, trowelled-on and liquid waterproofing; waterstops and joint sealants.'],
  ['11', 'Roof coverings, claddings, etc', 'Slates, tiles and shingles, thatch, profiled and flat sheeting, flashings.'],
  ['12', 'Carpentry and joinery', 'Structural timberwork, timber doors and windows, sundry joinery.'],
  ['13', 'Ceilings, partitions and access flooring', 'Suspended ceilings, partitions, access floors.'],
  ['14', 'Floor coverings, wall linings, etc', 'Floor coverings and wall linings.'],
  ['15', 'Ironmongery', 'Ironmongery to doors, windows and fittings.'],
  ['16', 'Structural steelwork', 'Steel members and connections.'],
  ['17', 'Metalwork', 'Steel and aluminium doors, windows, curtain walls, shopfronts and other metals.'],
  ['18', 'Plastering', 'Plaster and in situ finishes to floors, walls, columns, ceilings and beams.'],
  ['19', 'Tiling', 'Tiling to floors, walls, columns, ceilings and beams; beds and backings.'],
  ['20', 'Plumbing and drainage', 'Rainwater disposal, pipework, sanitary fittings, tanks and geysers, drainage.'],
  ['21', 'Electrical work', 'Electrical installations.'],
  ['22', 'Mechanical work', 'Mechanical installations.'],
  ['23', 'Glazing', 'Glass and glazing.'],
  ['24', 'Paintwork', 'Paint systems by surface and colour group.'],
  ['25', 'Paperhanging', 'Wall papers and similar.'],
  ['26', 'External work', 'Roadwork and parking, paving, stormwater channels, fencing, washing lines, landscaping.']
]

/** Sections of the 2023 Kenya road and bridge specification (Series 1000–9000). */
export const ROADS_SECTIONS: [code: string, title: string, guidance: string][] = [
  ['1100', 'Definitions and terms', 'Series 1000 · General'],
  ['1200', 'General requirements and provisions', 'Series 1000 · General'],
  ['1300', "Contractor's establishment on site and general obligations", 'Series 1000 · General'],
  ['1400', "Engineer's site establishment", 'Series 1000 · General'],
  ['1500', 'Accommodation of traffic', 'Series 1000 · General'],
  ['1600', 'Overhaul', 'Series 1000 · General'],
  ['1700', 'Testing of materials and workmanship', 'Series 1000 · General'],
  ['1750', 'Quality control', 'Series 1000 · General'],
  ['1800', 'Setting out and tolerances', 'Series 1000 · General'],
  ['1900', 'Standards and testing methods', 'Series 1000 · General'],
  ['2100', 'Drains', 'Series 2000 · Drainage'],
  ['2200', 'Prefabricated culverts', 'Series 2000 · Drainage'],
  ['2300', 'Concrete kerbing, channelling, chutes and linings for open drains', 'Series 2000 · Drainage'],
  ['2400', 'In situ concrete culverts', 'Series 2000 · Drainage'],
  ['2500', 'Pitching, stonework and protection against erosion', 'Series 2000 · Drainage'],
  ['2600', 'Gabions', 'Series 2000 · Drainage'],
  ['2700', 'Filter fabric and drainage composite', 'Series 2000 · Drainage'],
  ['3100', 'Clearing, grubbing and removal of topsoil', 'Series 3000 · Earthworks'],
  ['3200', 'Removal of existing structures', 'Series 3000 · Earthworks'],
  ['3300', 'Breaking up existing pavement layers', 'Series 3000 · Earthworks'],
  ['3400', 'Borrow pit and quarry acquisition and exploitation', 'Series 3000 · Earthworks'],
  ['3500', 'Selection, stockpiling and breaking down materials', 'Series 3000 · Earthworks'],
  ['3600', 'Earthworks; ground improvement, fill and subgrade treatment', 'Series 3000 · Earthworks'],
  ['3700', 'Rectification of earthworks and pavement layers outside permitted tolerances', 'Series 3000 · Earthworks'],
  ['4100', 'Pavement layers of natural gravel materials', 'Series 4000 · Natural, crushed stone and stabilised pavement layers'],
  ['4200', 'Stabilisation', 'Series 4000 · Natural, crushed stone and stabilised pavement layers'],
  ['4300', 'Crushed aggregate road sub-base and base', 'Series 4000 · Natural, crushed stone and stabilised pavement layers'],
  ['5100', 'Prime and curing membranes', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5200', 'Bituminous base course and asphalt concrete surfacing', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5300', 'General requirements for seals', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5400', 'Single surface dressings', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5500', 'Double surface dressings', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5600', 'Sand seals and slurry', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5700', 'Surfacing of bridge decks', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['5800', 'Treatment of surface defects, patching, edge-breaks and crack sealing', 'Series 5000 · Bituminous surface treatments, seals and pavement layers'],
  ['6100', 'Fixed formwork and paver laid concrete layers', 'Series 6000 · Concrete layers and modular paving'],
  ['6200', 'Segmental block paving layers', 'Series 6000 · Concrete layers and modular paving'],
  ['7100', 'Foundations for structures', 'Series 7000 · Structures'],
  ['7200', 'Falsework, formwork and concrete finish', 'Series 7000 · Structures'],
  ['7300', 'Steel reinforcement for structures', 'Series 7000 · Structures'],
  ['7400', 'Concrete for structures', 'Series 7000 · Structures'],
  ['7500', 'Prestressing', 'Series 7000 · Structures'],
  ['7600', 'No-fines concrete, joints, bearings, parapets and drainage for structures', 'Series 7000 · Structures'],
  ['7700', 'Structural steelwork', 'Series 7000 · Structures'],
  ['7800', 'Construction tolerances for structures', 'Series 7000 · Structures'],
  ['7900', 'Painting', 'Series 7000 · Structures'],
  ['8100', 'Marker and kilometre posts', 'Series 8000 · Ancillary roadworks'],
  ['8200', 'Guardrails', 'Series 8000 · Ancillary roadworks'],
  ['8300', 'Fencing', 'Series 8000 · Ancillary roadworks'],
  ['8400', 'Road signs', 'Series 8000 · Ancillary roadworks'],
  ['8500', 'Road markings', 'Series 8000 · Ancillary roadworks'],
  ['8600', 'Landscaping and grassing', 'Series 8000 · Ancillary roadworks'],
  ['8700', 'Finishing the road and road reserve and treating old roads', 'Series 8000 · Ancillary roadworks'],
  ['9100', 'Environmental protection and waste disposal', 'Series 9000 · Environmental, health, safety and social aspects'],
  ['9200', 'Occupational health and safety, HIV/AIDS and gender', 'Series 9000 · Environmental, health, safety and social aspects'],
  ['9300', 'Road safety awareness', 'Series 9000 · Environmental, health, safety and social aspects']
]

export interface SeedRule { standardKey: string, sectionCode: string, ref: string, item: string, unit: string, rule: string, source: string }
const r = (standardKey: string, source: string) => (sectionCode: string, ref: string, item: string, unit: string, rule: string): SeedRule => ({ standardKey, sectionCode, ref, item, unit, rule, source })
const aaqs = r('aaqs_2015', AAQS_SRC)
const roads = r('kenya_roads_2023', ROADS_SRC)
const cesmm = r('cesmm4', CESMM_SRC)
const smmea = r('smm_ea', SMMEA_SRC)

export const RULES: SeedRule[] = [
  // AAQS 2015: general instructions
  aaqs('00', 'GI 3', 'Units', '', 'Units used: ha, kg, kN, kW, m, m², m³, mm, No and t.'),
  aaqs('00', 'GI 4', 'Order of items', '', 'Work set out by trades in the order of the standard; within a trade by mass, volume, area, length, then number; then cheapest first.'),
  aaqs('00', 'GI 5', 'Order of dimensions', '', 'Horizontal across the line of sight, then horizontal along it, then vertical.'),
  aaqs('00', 'GI 6', 'Net measurement', '', 'Measured net as fixed in position: all voids deducted, no allowance for waste, passings or laps unless stated (laps go in descriptions).'),
  aaqs('00', 'GI 6', 'Dimensions', '', 'Each measurement taken to the nearest 10 mm: 5 mm and over counts as 10 mm, less is ignored.'),
  aaqs('00', 'GI 7', 'Fractional quantities', '', 'Quantities rounded to the nearest whole unit; two decimal places where fractions are significant.'),
  aaqs('00', 'GI 8', 'Provisional quantities', '', 'Work that cannot be accurately measured is described as provisional and remeasured.'),
  aaqs('00', 'GI 9', 'Provisional sums', '', 'A separate provisional sum for each class of work, with items for profit and for attendance.'),
  aaqs('00', 'GI 10', 'Contingencies', '', 'Contingencies, contract price adjustment and undeterminable costs go in the summary at the end of the bills.'),
  // AAQS 2015: earthworks
  aaqs('04', 'EW 2', 'Bulking', '', 'No allowance for bulking in disposal and carting away.'),
  aaqs('04', 'EW 3', 'Site clearance', 'm²', 'Clearing rubbish, vegetation and trees up to 200 mm girth by area; larger trees and stumps by number, girth stated in stages.'),
  aaqs('04', 'EW 5', 'Classification of material', 'm³', 'Excavation described in the easiest material; harder material given as extra over, separating only bulk and trenches/holes.'),
  aaqs('04', 'EW 6', 'Excavations', 'm³', 'Net voids formed per the drawings, not less than the base area of the structure × average depth; existing voids deducted.'),
  aaqs('04', 'EW 6', 'Depth stages', 'm³', 'Bulk, trench and hole excavations separated into successive 2 m depths from original or reduced ground level.'),
  aaqs('04', 'EW 8', 'Carting away', 'm³', 'Excavated material carted from site measured as extra over; dumping place and distance stated where prescribed.'),
  // AAQS 2015: concrete, formwork and reinforcement
  aaqs('07', 'CFR 1', 'Concrete', 'm³', 'Classified by compressive strength or mix; descriptions exclude formwork and reinforcement unless stated.'),
  aaqs('07', 'CFR 1', 'Voids in concrete', 'm³', 'No deduction for voids up to 0.1 m³, nor for pipes up to 200 mm diameter, reinforcement or conduit.'),
  aaqs('07', 'CFR 1', 'Separate components', 'm³', 'Concrete cast against excavated faces, post-tensioned or in sliding formwork given separately; nibs and kerbs go with their component.'),
  aaqs('07', 'CFR 10', 'Formwork', 'm²', 'Measured to the net surface of concrete supported; no deduction for openings up to 3 m² or at beam and column intersections.'),
  aaqs('07', 'CFR 10', 'Formwork to slab soffits', 'm²', 'Soffits of solid slabs over 250 mm thick given separately in 250 mm stages.'),
  aaqs('07', 'CFR 11–12', 'Formwork to walls and columns', 'm²', 'Grouped for heights up to 3.5 m above bearing level, then in 1.5 m stages.'),
  aaqs('07', 'CFR 14', 'Edges, risers and ends', 'm / m²', 'Up to 300 mm high or wide by length; wider by area.'),
  aaqs('07', 'CFR 18', 'Bar reinforcement', 't', 'Measured to designed lengths; each diameter separate; no allowance for rolling margin; stools included in the mass.'),
  aaqs('07', 'CFR 18', 'Long and shaped bars', 't', 'Bars 13–18 m long given separately, then in 1 m stages; deformed, curved and helical bars given separately.'),
  aaqs('07', 'CFR 18', 'Fabric reinforcement', 'm²', 'No deduction for openings up to 1 m²; fabric in cages given separately.'),
  // AAQS 2015: masonry
  aaqs('09', 'MAS 1', 'Classification', '', 'By unit material and quality, bond and mortar; separate items for underpinning, piers, walls, linings, chimneys, etc.'),
  aaqs('09', 'MAS 3–4', 'Mass work and piers', 'm³', 'No deduction for voids up to 0.1 m³.'),
  aaqs('09', 'MAS 5', 'Walls and linings', 'm²', 'No deduction for openings and recesses up to 0.5 m²; hollow-wall skins not measured separately, thicknesses stated.'),
  // AAQS 2015: roofing
  aaqs('11', 'RC', 'Profiled sheeting', 'm²', 'Roof coverings and claddings measured net on the undeveloped surface area.'),
  aaqs('11', 'RC', 'Ridges and hips', 'm', 'Ridges, hips and ornamental bands by length; ends and intersections by number.'),
  aaqs('11', 'RC', 'Thatch', 'm²', 'No deduction for openings up to 0.5 m²; main slopes kept separate from dormers and turrets.'),
  // AAQS 2015: finishes
  aaqs('18', 'PL 2', 'Plaster and in situ finishes', 'm²', 'Measured over the net area covered; no deduction for openings up to 0.5 m².'),
  aaqs('18', 'PL 1', 'Special plasterwork', 'm²', 'Patterned, sloping, ribbed and coffered work, work to falls and panels up to 2 m² given separately; circular work separately.'),
  aaqs('18', 'PL 2', 'Narrow widths', '', 'Finishes up to 300 mm wide described as narrow widths, without distinguishing components.'),
  aaqs('19', 'TI 3', 'Tiling', 'm²', 'Measured over the net area covered; no deduction for openings up to 0.1 m².'),
  aaqs('19', 'TI 1', 'Classification', '', 'By tile type and size, preparation and fixing; patterns, falls and panels up to 1 m² given separately.'),
  aaqs('19', 'TI 2', 'Beds and backings', '', 'Included in tiling descriptions; with adhesive fixing the bed is measured under Plastering.'),
  aaqs('24', 'PA 1', 'Classification', 'm²', 'By paint specification, preparation and surface (plaster, concrete, brick, wood, metal).'),
  aaqs('24', 'PA 3', 'Openings', 'm²', 'No deduction for openings up to 0.5 m²; columns and beams included with walls or ceilings.'),
  aaqs('24', 'PA 2', 'Colours', 'm²', 'Grouped as White, Pastel, Deep or Transparent; picked-out mouldings and multi-colour patterns separate.'),
  aaqs('20', 'PD 2', 'Pipe fittings', 'No', 'Extra over the pipe; fittings to pipes up to 30 mm grouped per diameter, larger ones per diameter and type.'),

  // CESMM4 (from a published guide)
  cesmm('A', '', 'Method-related charges', '', "Costs of the contractor's chosen methods (e.g. piling rig mobilisation, standing dewatering) are billed separately from measured work."),
  cesmm('E', '', 'General excavation', 'm³', 'Measured by maximum depth band (e.g. 2–5 m); each band priced separately.'),
  cesmm('E', '', 'Disposal', 'm³', 'Disposal of excavated material measured in m³.'),
  cesmm('E', '', 'Filling', 'm³', 'Filling with excavated or imported material in m³; geotextiles in m².'),
  cesmm('F', '', 'In situ concrete', 'm³', 'Measured in m³ with separate items by concrete grade (e.g. blinding and reinforced concrete).'),
  cesmm('G', '', 'Formwork', 'm²', 'Measured in m², classified by the face formed (e.g. vertical and battered faces).'),
  cesmm('G', '', 'Bar reinforcement', 't', 'In tonnes, with separate items by bar diameter and shape (straight or bent).'),
  cesmm('I', '', 'Pipes', 'm', 'By length, stating material and bore.'),
  cesmm('K', '', 'Manholes and chambers', 'nr', 'By number, with size and depth in the description.'),

  // SMM for East Africa (lecture summary)
  smmea('A', '', 'Dimensions', '', 'Work measured net as fixed in position, dimensions to the nearest 10 mm.'),
  smmea('D', '', 'Foundation trench excavation', 'm³', 'Measured in m³ stating the starting level (usually stripped level) and the maximum depth range.'),
  smmea('D', '', 'Existing voids', 'm³', 'Existing voids are deducted from excavation.'),

  // Kenya roads specification: measurement clauses
  roads('3600', '3610 / 36.01', 'Excavation to spoil: how measured', 'm³', 'Material measured in its original position by average end areas from levelled cross-sections taken before excavation; topsoil (31.01) and crossfill excluded.'),
  roads('7300', '7311 / 73.01', 'Steel reinforcement: how measured', 't', 'Tonne of steel in place per the drawings; welded fabric mass worked out from the mesh area used.'),
  roads('1200', '', 'Basis of payment', '', 'Work is measured and paid at the Bill of Quantities rates under the measurement and payment clause that ends each section.'),
  // Kenya roads specification: pay items
  ...KENYA_ROADS_PAY_ITEMS.map(([section, item, description, unit]) => roads(section, item, description, unit, 'Pay item'))
]

/** Laws, regulations, tender documents and specifications. Check currency before relying on figures. */
export const REFERENCES = [
  {
    key: 'ppada_2015', kind: 'law', title: 'Public Procurement and Asset Disposal Act, No. 33 of 2015', issuer: 'Parliament of Kenya', year: '2015',
    url: 'https://new.kenyalaw.org/akn/ke/act/2015/33/eng@2022-12-31',
    summary: 'Section 70: where works are procured, the tender documents must disclose the relevant drawings and bills of quantities. Bids are evaluated on the disclosed criteria; a bidder may not be disqualified merely for pricing a set percentage above or below the engineer\'s estimate.',
    relevance: 'Public works tenders: the BQ is part of the tender documents.', sort: 1
  },
  {
    key: 'ppadr_2020', kind: 'regulation', title: 'Public Procurement and Asset Disposal Regulations, 2020 (Legal Notice 69 of 2020)', issuer: 'National Treasury', year: '2020',
    url: 'https://new.kenyalaw.org/akn/ke/act/ln/2020/69/eng@2022-12-31',
    summary: 'Operationalise the Act (Gazette Supplement No. 53, 22 April 2020). Bills of quantities, specifications and drawings form part of the procurement documents; the accounting officer must ensure the estimate is realistic.',
    relevance: "Engineer's estimates and tender BQs for public entities.", sort: 2
  },
  {
    key: 'ppra_std', kind: 'template', title: 'PPRA Standard Tender Documents', issuer: 'Public Procurement Regulatory Authority', year: 'current',
    url: 'https://ppra.go.ke/standard-tender-documents/',
    summary: 'Standard tender documents for goods, works and services issued by the Authority for procuring entities.',
    relevance: 'Works tenders use these formats, including a priced Bill of Quantities.', sort: 3
  },
  {
    key: 'ppra_small_works', kind: 'template', title: 'Standard Tendering Document: Procurement of Works (Small Works)', issuer: 'Public Procurement Regulatory Authority', year: '',
    url: 'https://ppra.go.ke/?mdocs-file=1101',
    summary: 'Small-works tender format used by many counties; bidders return a priced Bill of Quantities with a rate for each item.',
    relevance: 'Typical format for county building and civil works tenders.', sort: 4
  },
  {
    key: 'ppoa_works_2007', kind: 'template', title: 'Standard Tender Document for Procurement of Works (2007)', issuer: 'Public Procurement Oversight Authority (now PPRA)', year: '2007',
    url: 'https://ppra.go.ke/?mdocs-file=1095',
    summary: 'Its conditions measure the works in accordance with the principles of the latest edition of the Civil Engineering Standard Method of Measurement, verifying quantities of work actually performed.',
    relevance: 'Shows CESMM as the measurement basis in government works contracts.', sort: 5
  },
  {
    key: 'ppra_works_manual_2009', kind: 'guide', title: 'Procurement Manual for Works (1st edition, April 2009)', issuer: 'Public Procurement Oversight Authority (now PPRA)', year: '2009',
    url: 'https://ppra.go.ke/?mdocs-file=2969',
    summary: 'Describes the tender document as the works requirements: technical specifications, plans and a bill of quantities or activity schedule.',
    relevance: 'How BQs fit into public works procurement.', sort: 6
  },
  {
    key: 'cap525', kind: 'law', title: 'Architects and Quantity Surveyors Act, Cap 525', issuer: 'Parliament of Kenya; Board of Registration of Architects and Quantity Surveyors (BORAQS)', year: '1934 (revised)',
    url: 'https://new.kenyalaw.org/akn/ke/act/1933/60/eng@2023-12-11',
    summary: 'Establishes BORAQS (1934) to register and regulate architects and quantity surveyors. Only registered persons may use "quantity surveyor" in their title or practice name. A 2023 Practitioners Bill proposes to replace the Act.',
    relevance: 'Who may describe themselves as a quantity surveyor when preparing a BQ.', sort: 7
  },
  {
    key: 'boraqs_register', kind: 'register', title: 'BORAQS online register of architects and quantity surveyors', issuer: 'BORAQS', year: 'current',
    url: 'https://boraqs.or.ke/',
    summary: 'Search a practitioner by name, registration number (Q prefix for quantity surveyors) or certificate serial to confirm active registration.',
    relevance: 'Check the QS named on a BQ.', sort: 8
  },
  {
    key: 'boraqs_fees_2023', kind: 'regulation', title: 'Scale of Fees and Conditions of Engagement for Architects and Quantity Surveyors (Legal Notice 133 of 2023)', issuer: 'BORAQS', year: '2023',
    url: 'https://boraqs.or.ke/wp-content/uploads/2023/09/Scale-of-Fees-and-Conditions-of-Engagement-For-Archs-QS-L.-N-133.pdf',
    summary: 'Gazetted fee scale and conditions of engagement for architects and quantity surveyors (Kenya Gazette Supplement No. 145, 28 August 2023).',
    relevance: 'Professional fees for preparing BQs.', sort: 9
  },
  {
    key: 'nca_act_2011', kind: 'law', title: 'National Construction Authority Act, No. 41 of 2011', issuer: 'National Construction Authority (NCA)', year: '2011',
    url: 'https://www.nca.go.ke/local-contractors',
    summary: 'Section 15: no one may carry on business as a contractor unless registered and licensed by the Authority. Building works categories (KES contract value): NCA1 unlimited, NCA2 500M, NCA3 300M, NCA4 200M, NCA5 100M, NCA6 50M, NCA7 20M, NCA8 10M (confirm current limits with NCA).',
    relevance: 'The BQ total decides which contractor categories may tender.', sort: 10
  },
  {
    key: 'roads_spec_2023', kind: 'specification', title: 'Standard Specification for Road and Bridge Construction (Works and Services Contracts Manual, Part 2)', issuer: 'Ministry of Roads and Transport', year: '2023',
    url: 'https://kenha.co.ke/wp-content/uploads/2023/08/Kenya-WSCM-Part-23-Specification-for-Road-and-Bridge-Construction-and-BoQ-2nd-Draft_Rev-3_07-08-23.pdf',
    summary: 'Updated national road and bridge specification in Series 1000–9000. Each section ends with a measurement and payment clause listing pay items and units.',
    relevance: 'Measurement basis for road, drainage and bridge BQs (Kadiria standard: Kenya Roads Spec).', sort: 11
  },
  {
    key: 'roads_spec_1986', kind: 'specification', title: 'Standard Specification for Road and Bridge Construction, 1986 edition', issuer: 'Ministry of Transport and Communications', year: '1986',
    url: '',
    summary: 'Earlier national road specification, still cited in many tenders. Work is measured and paid at BQ rates under each section\'s measurement and payment clause; compliance with general clauses is not paid separately.',
    relevance: 'Check which edition a road contract names.', sort: 12
  },
  {
    key: 'smm_ea_2008_ref', kind: 'standard', title: 'SMM for East Africa, 2nd edition (2008)', issuer: 'Architectural Association of Kenya, Quantity Surveyors Chapter', year: '2008',
    url: 'https://goldberry.co.ke/newsroom/standard-method-of-measurement-eastern-africa',
    summary: 'Launched 1 July 2008 and sanctioned by EAIA, IQSK, BORAQS, JBC, AAQS, TIQS and UIQS. Added external drainage, water reticulation, landscaping and road works to the building standard.',
    relevance: 'Default building standard in Kadiria.', sort: 13
  },
  {
    key: 'aaqs_2015_ref', kind: 'standard', title: 'Standard Method of Measuring Building Work for Africa, 1st edition (2015)', issuer: 'Africa Association of Quantity Surveyors (AAQS)', year: '2015',
    url: 'https://aaqs.org/standard-method/',
    summary: 'Prepared from 2013 taking into account the methods used in East Africa (Kenya, Tanzania, Uganda), Mauritius, Nigeria, South Africa and Zambia, with Kenyan input on the AAQS committee; based on the ASAQS Standard System.',
    relevance: 'Pan-African building standard increasingly used in the region.', sort: 14
  },
  {
    key: 'cesmm4_ref', kind: 'standard', title: 'CESMM4: Civil Engineering Standard Method of Measurement', issuer: 'Institution of Civil Engineers (ICE)', year: '2012',
    url: 'https://www.designingbuildings.co.uk/wiki/CESMM4',
    summary: '26 work classes A–Z; each class sets how work is divided into items, described, its units and the measurement rules.',
    relevance: 'Civil engineering BQs; named in the 2007 government works tender document.', sort: 15
  }
]

/** Library item → AAQS 2015 trade. */
export const AAQS_REFS: Record<string, string> = {
  'PRE-010': '01', 'PRE-020': '01', 'PRE-030': '01', 'PRE-040': '01', 'PRE-050': '01', 'PRE-060': '01', 'PRE-070': '01',
  'SUB-010': '04', 'SUB-020': '04', 'SUB-030': '04', 'SUB-040': '04', 'SUB-100': '04', 'SUB-110': '04', 'SUB-600': '04',
  'SUB-200': '07', 'SUB-210': '07', 'SUB-220': '07', 'SUB-300': '07', 'SUB-400': '07', 'SUB-620': '07', 'SUB-630': '07',
  'SUB-610': '10', 'SUB-500': '09', 'SUB-510': '09',
  'SUP-100': '07', 'SUP-110': '07', 'SUP-200': '07', 'SUP-300': '07', 'SUP-400': '07', 'SUP-410': '07', 'SUP-420': '07', 'SUP-600': '07',
  'SUP-500': '09', 'SUP-505': '09', 'SUP-510': '09',
  'ROF-100': '12', 'ROF-110': '11', 'ROF-120': '12', 'ROF-130': '20',
  'DW-100': '17', 'DW-110': '17', 'DW-200': '12', 'DW-210': '17',
  'FIN-100': '18', 'FIN-110': '18', 'FIN-200': '18', 'FIN-210': '19', 'FIN-300': '13', 'FIN-400': '24', 'FIN-410': '24', 'FIN-420': '24',
  'SER-100': '21', 'SER-200': '20', 'SER-300': '20', 'SER-400': '20',
  'EXT-100': '26', 'EXT-110': '09', 'EXT-120': '26',
  'PRO-110': '00', 'PRO-120': '00', 'PRO-130': '00', 'PRO-140': '00'
}

/** Library item → Kenya road specification section (only where the specification covers the work). */
export const ROADS_REFS: Record<string, string> = {
  'SUB-010': '3100', 'SUB-020': '3600', 'SUB-030': '3600', 'SUB-040': '3600',
  'SUB-200': '7400', 'SUB-210': '7400', 'SUB-220': '7400', 'SUB-630': '7400', 'SUP-100': '7400', 'SUP-110': '7400', 'SUP-200': '7400', 'SUP-600': '7400',
  'SUB-300': '7300', 'SUB-620': '7300', 'SUP-300': '7300',
  'SUB-400': '7200', 'SUP-400': '7200', 'SUP-410': '7200', 'SUP-420': '7200',
  'FIN-400': '7900', 'FIN-410': '7900', 'FIN-420': '7900',
  'SER-300': '2100', 'EXT-100': '6200', 'EXT-110': '8300', 'EXT-120': '8600',
  'PRE-050': '1800', 'PRO-140': '3600'
}
