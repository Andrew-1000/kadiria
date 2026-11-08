import { z } from 'zod'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

const text = (max = 200) => z.string().trim().min(1).max(max)
const optText = (max = 2000) => z.string().trim().max(max)
const nonNeg = z.coerce.number().min(0).max(1e9)
const pct = z.coerce.number().min(-100).max(1000)
const key = z.string().trim().regex(/^[a-z0-9_]{1,60}$/, 'Use lowercase letters, digits and underscores')

interface RefTable {
  label: string
  table: PgTable
  pk: PgColumn
  pkType: 'int' | 'text'
  orderBy: PgColumn[]
  create: z.ZodObject
  /** Columns that may not be changed after creation. */
  immutable?: string[]
  /** If false, rows cannot be created/deleted from the admin (code-defined rows). */
  allowCreateDelete?: boolean
}

const t = tables

export const REF_TABLES: Record<string, RefTable> = {
  countries: {
    label: 'Countries', table: t.countries, pk: t.countries.code, pkType: 'text', orderBy: [t.countries.sort],
    create: z.object({ code: z.string().trim().regex(/^[A-Z]{2}$/), name: text(), currency: z.string().trim().regex(/^[A-Z]{3}$/), vatPercent: pct.default(16), active: z.boolean().default(true), sort: z.coerce.number().int().default(0) }),
    immutable: ['code']
  },
  tiers: {
    label: 'Rate tiers', table: t.rateTiers, pk: t.rateTiers.id, pkType: 'int', orderBy: [t.rateTiers.sort],
    create: z.object({ countryCode: z.string().regex(/^[A-Z]{2}$/), key, label: text(), sort: z.coerce.number().int().default(0) })
  },
  locations: {
    label: 'Locations', table: t.locations, pk: t.locations.id, pkType: 'int', orderBy: [t.locations.tierId, t.locations.sort],
    create: z.object({ tierId: z.coerce.number().int().positive(), name: text(), adjustmentPercent: pct.default(0), active: z.boolean().default(true), sort: z.coerce.number().int().default(0) })
  },
  finishes: {
    label: 'Finish levels', table: t.finishLevels, pk: t.finishLevels.key, pkType: 'text', orderBy: [t.finishLevels.sort],
    create: z.object({ key, label: text(), description: optText().default(''), labourPercent: pct, sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  building_types: {
    label: 'Building types', table: t.buildingTypes, pk: t.buildingTypes.key, pkType: 'text', orderBy: [t.buildingTypes.sort],
    create: z.object({ key, label: text(), description: optText().default(''), factor: z.coerce.number().min(0.1).max(10), defaultFloors: z.coerce.number().int().min(1).max(100), minFloors: z.coerce.number().int().min(1).max(100), maxFloors: z.coerce.number().int().min(1).max(100), active: z.boolean().default(true), sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  addons: {
    label: 'Estimate add-ons', table: t.estimateAddons, pk: t.estimateAddons.key, pkType: 'text', orderBy: [t.estimateAddons.sort],
    create: z.object({ key, label: text(), description: optText().default(''), percent: pct, enabledByDefault: z.boolean().default(true), sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  elements: {
    label: 'Element split', table: t.elementSplits, pk: t.elementSplits.key, pkType: 'text', orderBy: [t.elementSplits.sort],
    create: z.object({ key, label: text(), percent: pct, sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  materials: {
    label: 'Materials', table: t.materials, pk: t.materials.id, pkType: 'int', orderBy: [t.materials.category, t.materials.sort],
    create: z.object({ key, name: text(), unit: text(24), category: text().default('General'), size: optText(120).default(''), kind: z.enum(['material', 'hire']).default('material'), description: optText().default(''), active: z.boolean().default(true), sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  mixes: {
    label: 'Mix designs', table: t.mixDesigns, pk: t.mixDesigns.id, pkType: 'int', orderBy: [t.mixDesigns.sort],
    create: z.object({ key, name: text(), kind: z.enum(['concrete', 'mortar']), cement: z.coerce.number().positive(), sand: z.coerce.number().min(0), ballast: z.coerce.number().min(0).default(0), description: optText().default(''), active: z.boolean().default(true), sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  bill_templates: {
    label: 'Standard bills', table: t.billTemplates, pk: t.billTemplates.key, pkType: 'text', orderBy: [t.billTemplates.sort],
    create: z.object({ key, number: z.coerce.number().int().min(1), title: text(), description: optText().default(''), sort: z.coerce.number().int().default(0) }),
    immutable: ['key']
  },
  library: {
    label: 'BQ library', table: t.libraryItems, pk: t.libraryItems.id, pkType: 'int', orderBy: [t.libraryItems.billKey, t.libraryItems.sort],
    create: z.object({
      code: z.string().trim().regex(/^[A-Z0-9-]{2,20}$/, 'Code like SUB-100'), billKey: key, section: optText(120).default(''), description: text(500), unit: text(24),
      rate: nonNeg, itemType: z.enum(['measured', 'provisional', 'pc_sum', 'lump_sum']), driver: z.string().default('none'), factor: z.coerce.number().min(0).max(1e6).default(1),
      finishSensitive: z.boolean().default(false), includeByDefault: z.boolean().default(true), active: z.boolean().default(true), sort: z.coerce.number().int().default(0),
      methods: z.string().trim().regex(/^[a-z0-9_,s]*$/, 'Method keys separated by commas, e.g. masonry,issb').max(200).default('')
    })
  },
  methods: {
    label: 'Construction methods', table: t.constructionMethods, pk: t.constructionMethods.key, pkType: 'text', orderBy: [t.constructionMethods.sort],
    create: z.object({
      key, label: text(120), description: optText(600).default(''), factor: z.coerce.number().min(0.1).max(5).default(1),
      maxFloors: z.coerce.number().int().min(1).max(100).default(20), source: optText(600).default(''), active: z.boolean().default(true), sort: z.coerce.number().int().default(0)
    }),
    immutable: ['key']
  },
  standards: {
    label: 'Measurement standards', table: t.measurementStandards, pk: t.measurementStandards.key, pkType: 'text', orderBy: [t.measurementStandards.sort],
    create: z.object({
      key, code: text(60), name: text(200), scope: z.enum(['building', 'civil']), edition: optText(80).default(''), publisher: optText(160).default(''),
      coverNote: optText(400).default(''), active: z.boolean().default(true), sort: z.coerce.number().int().default(0)
    }),
    immutable: ['key']
  },
  rules: {
    label: 'Measurement rules', table: t.measurementRules, pk: t.measurementRules.id, pkType: 'int', orderBy: [t.measurementRules.standardKey, t.measurementRules.sectionCode, t.measurementRules.sort],
    create: z.object({
      standardKey: key, sectionCode: z.string().trim().regex(/^[A-Z0-9.]{1,8}$/), ref: optText(40).default(''), item: text(300), unit: optText(24).default(''),
      rule: optText(1000).default(''), source: optText(300).default(''), sort: z.coerce.number().int().default(0)
    })
  },
  item_refs: {
    label: 'Library measurement references', table: t.libraryMeasureRefs, pk: t.libraryMeasureRefs.id, pkType: 'int', orderBy: [t.libraryMeasureRefs.standardKey, t.libraryMeasureRefs.libraryCode],
    create: z.object({ libraryCode: z.string().trim().regex(/^[A-Z0-9-]{2,20}$/), standardKey: key, sectionCode: z.string().trim().regex(/^[A-Z0-9.]{1,8}$/) })
  },
  references: {
    label: 'Policies & references', table: t.measurementReferences, pk: t.measurementReferences.key, pkType: 'text', orderBy: [t.measurementReferences.sort],
    create: z.object({
      key, title: text(300), kind: z.enum(['law', 'regulation', 'template', 'specification', 'standard', 'register', 'guide']), issuer: optText(200).default(''), year: optText(40).default(''),
      url: z.union([z.literal(''), z.string().trim().url().max(500)]).default(''), summary: optText(1500).default(''), relevance: optText(400).default(''), sort: z.coerce.number().int().default(0)
    }),
    immutable: ['key']
  },
  sections: {
    label: 'Measurement sections', table: t.measurementSections, pk: t.measurementSections.id, pkType: 'int', orderBy: [t.measurementSections.standardKey, t.measurementSections.sort],
    create: z.object({ standardKey: key, code: z.string().trim().regex(/^[A-Z0-9.]{1,8}$/, 'Code like D or 4.2'), title: text(160), guidance: optText(600).default(''), sort: z.coerce.number().int().default(0) })
  },
  constants: {
    label: 'Calculator constants', table: t.calcConstants, pk: t.calcConstants.key, pkType: 'text', orderBy: [t.calcConstants.sort],
    create: z.object({ key, label: text(), value: z.coerce.number().min(0).max(1e9), unit: optText(24).default(''), groupName: text().default('General'), description: optText().default(''), sort: z.coerce.number().int().default(0) }),
    immutable: ['key'], allowCreateDelete: false
  },
  flags: {
    label: 'Feature switches', table: t.featureFlags, pk: t.featureFlags.key, pkType: 'text', orderBy: [t.featureFlags.sort],
    create: z.object({ key, label: text(), description: optText().default(''), category: text().default('system'), enabled: z.boolean(), sort: z.coerce.number().int().default(0) }),
    immutable: ['key', 'category'], allowCreateDelete: false
  },
  modules: {
    label: 'Calculator modules', table: t.calcModules, pk: t.calcModules.key, pkType: 'text', orderBy: [t.calcModules.sort],
    create: z.object({ key, enabled: z.boolean(), sort: z.coerce.number().int().default(0), defaults: z.record(z.string(), z.union([z.number(), z.string()])).default({}) }),
    immutable: ['key'], allowCreateDelete: false
  }
}

export function getRefTable(name: string | undefined): RefTable {
  const def = name ? REF_TABLES[name] : undefined
  if (!def) notFound('Table')
  return def
}

export function parsePk(def: RefTable, raw: string | undefined): string | number {
  if (!raw) notFound()
  if (def.pkType === 'int') {
    const n = Number(raw)
    if (!Number.isInteger(n) || n <= 0) notFound()
    return n
  }
  return decodeURIComponent(raw)
}
