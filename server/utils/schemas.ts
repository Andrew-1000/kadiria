import { z } from 'zod'

const prereqStatus = z.enum(['have', 'partial', 'missing'])

export const paramsSchema = z.object({
  floorAreas: z.array(z.coerce.number().min(0).max(100000)).min(1).max(100),
  wallHeight: z.coerce.number().min(2).max(10).default(3),
  perimeter: z.coerce.number().min(0).max(100000).default(0),
  foundationDepth: z.coerce.number().min(0.3).max(10).default(1),
  internalWallRatio: z.coerce.number().min(0).max(2).default(0.35),
  doors: z.coerce.number().int().min(0).max(10000).default(8),
  windows: z.coerce.number().int().min(0).max(10000).default(10),
  windowSize: z.coerce.number().min(0).max(100).default(1.8),
  roofOverhang: z.coerce.number().min(0).max(3).default(0.6),
  roofPitchFactor: z.coerce.number().min(1).max(2).default(1.15)
})

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(160),
  client: z.string().trim().max(160).default(''),
  siteAddress: z.string().trim().max(300).default(''),
  preparedBy: z.string().trim().max(160).default(''),
  locationId: z.coerce.number().int().positive().nullable().default(null),
  buildingTypeKey: z.string().nullable().default(null),
  finishKey: z.string().nullable().default(null),
  currency: z.string().regex(/^[A-Z]{3}$/).default('KES'),
  measurementStandard: z.string().trim().regex(/^[a-z0-9_]{1,60}$/).default('smm_ea'),
  params: paramsSchema.optional(),
  prerequisites: z.record(z.string(), prereqStatus).default({}),
  contingencyPercent: z.coerce.number().min(0).max(50).default(5),
  vatPercent: z.coerce.number().min(0).max(50).default(16),
  generate: z.boolean().default(true)
})

export const projectUpdateSchema = projectSchema.omit({ generate: true }).partial().extend({
  assumptions: z.string().max(5000).optional(),
  exclusions: z.string().max(5000).optional()
})

export const itemSchema = z.object({
  billId: z.string().uuid(),
  section: z.string().trim().max(120).default(''),
  description: z.string().trim().min(1, 'Description is required').max(1000),
  unit: z.string().trim().min(1, 'Unit is required').max(24),
  quantity: z.coerce.number().min(0).max(1e9),
  rate: z.coerce.number().min(0).max(1e10),
  itemType: z.enum(['measured', 'provisional', 'pc_sum', 'lump_sum']).default('measured'),
  notes: z.string().max(2000).default('')
})

export const itemUpdateSchema = itemSchema.partial().extend({ sort: z.coerce.number().int().optional() })

export const billSchema = z.object({
  title: z.string().trim().min(1).max(160),
  number: z.coerce.number().int().min(1).max(999).optional(),
  notes: z.string().max(2000).default(''),
  provisional: z.boolean().default(false)
})
