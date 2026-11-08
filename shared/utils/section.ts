/**
 * Section A–A of a typical building: foundation, floor, wall and roof. One shape set per
 * construction element (matching the material calculator modules), with the position of its
 * numbered bubble. Drawn on a 640 × 360 view box. Used by the interactive materials takeoff and
 * by the stage drawings in reports.
 */
export interface SectionPart {
  key: string
  /** SVG path data */
  shapes: string[]
  /** Centre of the numbered bubble */
  bubble: [number, number]
  /** Where the leader line from the bubble touches the element */
  anchor: [number, number]
  /** How it is drawn: solid fill (default), hatching, stone courses, or a dashed outline only */
  kind?: 'fill' | 'hatch' | 'stones' | 'thin'
}

export const SECTION_VIEWBOX = '0 0 640 360'
/** Ground level on the drawing (y) */
export const SECTION_GROUND_Y = 220

export const SECTION_PARTS: SectionPart[] = [
  { key: 'excavation', shapes: ['M 60 220 L 60 332 L 200 332 L 200 220'], bubble: [34, 300], anchor: [60, 300], kind: 'thin' },
  { key: 'blinding', shapes: ['M 70 322 h 120 v 8 h -120 Z'], bubble: [226, 346], anchor: [190, 326] },
  { key: 'strip_footing', shapes: ['M 76 292 h 108 v 30 h -108 Z'], bubble: [226, 306], anchor: [184, 306] },
  { key: 'foundation_walling', shapes: ['M 106 206 h 48 v 86 h -48 Z'], bubble: [34, 246], anchor: [106, 246], kind: 'stones' },
  { key: 'hardcore', shapes: ['M 154 206 h 352 v 22 h -352 Z'], bubble: [330, 252], anchor: [330, 228], kind: 'hatch' },
  { key: 'ground_slab', shapes: ['M 100 194 h 460 v 12 h -460 Z'], bubble: [600, 200], anchor: [560, 200] },
  { key: 'column_bases', shapes: ['M 470 284 h 90 v 28 h -90 Z'], bubble: [600, 298], anchor: [560, 298] },
  { key: 'columns', shapes: ['M 506 96 h 20 v 98 h -20 Z', 'M 506 206 h 20 v 78 h -20 Z'], bubble: [600, 140], anchor: [526, 140] },
  { key: 'walling', shapes: ['M 112 96 h 36 v 98 h -36 Z'], bubble: [34, 146], anchor: [112, 146], kind: 'stones' },
  { key: 'plaster', shapes: ['M 106 96 h 6 v 98 h -6 Z', 'M 148 96 h 6 v 98 h -6 Z'], bubble: [226, 170], anchor: [154, 170] },
  { key: 'beams', shapes: ['M 106 82 h 420 v 14 h -420 Z'], bubble: [330, 120], anchor: [330, 96] },
  { key: 'suspended_slab', shapes: ['M 90 68 h 480 v 14 h -480 Z'], bubble: [600, 75], anchor: [570, 75] },
  { key: 'roofing', shapes: ['M 70 52 L 330 8 L 590 52 Z'], bubble: [440, 22], anchor: [400, 28] },
  { key: 'tiling', shapes: ['M 160 189 h 340 v 5 h -340 Z'], bubble: [420, 168], anchor: [420, 189] },
  { key: 'painting', shapes: ['M 154 96 h 4 v 93 h -4 Z'], bubble: [226, 128], anchor: [158, 128] }
]
