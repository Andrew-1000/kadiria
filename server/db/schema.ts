import { sql } from 'drizzle-orm'
import {
  pgTable, pgEnum, text, integer, serial, boolean, numeric, jsonb, timestamp, date, uuid,
  uniqueIndex, index
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum('user_role', ['admin', 'professional', 'member'])
export const projectStatus = pgEnum('project_status', ['draft', 'submitted', 'approved', 'issued'])
export const itemType = pgEnum('bq_item_type', ['measured', 'provisional', 'pc_sum', 'lump_sum'])
export const mixKind = pgEnum('mix_kind', ['concrete', 'mortar'])

const money = (name: string) => numeric(name, { precision: 14, scale: 2, mode: 'number' })
const qty = (name: string) => numeric(name, { precision: 14, scale: 3, mode: 'number' })
const pct = (name: string) => numeric(name, { precision: 6, scale: 2, mode: 'number' })
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('member'),
  organisation: text('organisation').notNull().default(''),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [uniqueIndex('users_email_idx').on(sql`lower(${t.email})`)])

/** Server-to-server keys used by the company website to read/toggle features. */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: createdAt()
})

/* ------------------------------------------------------------------ */
/* System configuration (admin back-office)                            */
/* ------------------------------------------------------------------ */

/** On/off switches the admin (or the website, via API key) controls. */
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('system'),
  enabled: boolean('enabled').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedAt: updatedAt()
})

/** Engineering constants used by the calculators (voids factor, densities...). */
export const calcConstants = pgTable('calc_constants', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  value: numeric('value', { precision: 14, scale: 5, mode: 'number' }).notNull(),
  unit: text('unit').notNull().default(''),
  groupName: text('group_name').notNull().default('General'),
  description: text('description').notNull().default(''),
  sort: integer('sort').notNull().default(0),
  updatedAt: updatedAt()
})

/** Free-form JSON settings, e.g. embed origins. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updatedAt()
})

/* ------------------------------------------------------------------ */
/* Geography & cost-per-m² rates                                       */
/* ------------------------------------------------------------------ */

export const countries = pgTable('countries', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').notNull(),
  vatPercent: pct('vat_percent').notNull().default(16),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Rate band, e.g. "Nairobi", "Other urban", "Rural / semi-urban". */
export const rateTiers = pgTable('rate_tiers', {
  id: serial('id').primaryKey(),
  countryCode: text('country_code').notNull().references(() => countries.code, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  label: text('label').notNull(),
  sort: integer('sort').notNull().default(0)
}, t => [uniqueIndex('rate_tiers_country_key_idx').on(t.countryCode, t.key)])

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  tierId: integer('tier_id').notNull().references(() => rateTiers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** Location-specific adjustment on top of the tier rate, e.g. +10 for Westlands. */
  adjustmentPercent: pct('adjustment_percent').notNull().default(0),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

export const finishLevels = pgTable('finish_levels', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
  labourPercent: pct('labour_percent').notNull(),
  sort: integer('sort').notNull().default(0)
})

/** Effective-dated cost per m² band for a tier and finish (append-only). */
export const costRates = pgTable('cost_rates', {
  id: serial('id').primaryKey(),
  tierId: integer('tier_id').notNull().references(() => rateTiers.id, { onDelete: 'cascade' }),
  finishKey: text('finish_key').notNull().references(() => finishLevels.key, { onDelete: 'cascade' }),
  minRate: money('min_rate').notNull(),
  maxRate: money('max_rate').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  note: text('note').notNull().default(''),
  recordedAt: createdAt()
}, t => [index('cost_rates_lookup_idx').on(t.tierId, t.finishKey, t.effectiveFrom)])

export const buildingTypes = pgTable('building_types', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
  /** Multiplier on the cost per m² (structure complexity). */
  factor: numeric('factor', { precision: 6, scale: 3, mode: 'number' }).notNull().default(1),
  defaultFloors: integer('default_floors').notNull().default(1),
  minFloors: integer('min_floors').notNull().default(1),
  maxFloors: integer('max_floors').notNull().default(1),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** How a house is built: masonry, ISSB, timber frame, light-gauge steel / prefab, 3D-printed. */
export const constructionMethods = pgTable('construction_methods', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
  /** Multiplier on the cost per m² relative to stone / block masonry (1.000). */
  factor: numeric('factor', { precision: 6, scale: 3, mode: 'number' }).notNull().default(1),
  /** Usual maximum number of storeys for this method (warning only). */
  maxFloors: integer('max_floors').notNull().default(20),
  /** Where the factor comes from. */
  source: text('source').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Percent add-ons for the homeowner estimator (fees, approvals, contingency). */
export const estimateAddons = pgTable('estimate_addons', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
  percent: pct('percent').notNull(),
  enabledByDefault: boolean('enabled_by_default').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Elemental split of construction cost shown in the estimator breakdown. */
export const elementSplits = pgTable('element_splits', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  percent: pct('percent').notNull(),
  sort: integer('sort').notNull().default(0)
})

/* ------------------------------------------------------------------ */
/* Materials, prices & mixes                                           */
/* ------------------------------------------------------------------ */

export const materials = pgTable('materials', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  category: text('category').notNull().default('General'),
  /** Nominal size / specification, e.g. 4″ × 2″ (100 × 50 mm), 25 kg, 2.4 × 4.8 m. */
  size: text('size').notNull().default(''),
  /** 'material' is bought; 'hire' is plant or equipment priced per unit of time (e.g. per day). */
  kind: text('kind').notNull().default('material'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Effective-dated price. locationId NULL = national default. */
export const materialPrices = pgTable('material_prices', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  locationId: integer('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  price: money('price').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  source: text('source').notNull().default(''),
  recordedAt: createdAt()
}, t => [index('material_prices_lookup_idx').on(t.materialId, t.locationId, t.effectiveFrom)])

export const mixDesigns = pgTable('mix_designs', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  kind: mixKind('kind').notNull(),
  cement: numeric('cement', { precision: 6, scale: 2, mode: 'number' }).notNull(),
  sand: numeric('sand', { precision: 6, scale: 2, mode: 'number' }).notNull(),
  ballast: numeric('ballast', { precision: 6, scale: 2, mode: 'number' }).notNull().default(0),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Material quantification modules (blinding, columns...). Logic lives in code; admin controls availability and default inputs. */
export const calcModules = pgTable('calc_modules', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  defaults: jsonb('defaults').$type<Record<string, number | string>>().notNull().default({}),
  updatedAt: updatedAt()
})

/* ------------------------------------------------------------------ */
/* BQ library (standard bills and work items with indicative rates)    */
/* ------------------------------------------------------------------ */

export const billTemplates = pgTable('bill_templates', {
  key: text('key').primaryKey(),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  sort: integer('sort').notNull().default(0)
})

export const libraryItems = pgTable('library_items', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  billKey: text('bill_key').notNull().references(() => billTemplates.key, { onDelete: 'cascade' }),
  section: text('section').notNull().default(''),
  description: text('description').notNull(),
  unit: text('unit').notNull(),
  /** Indicative rate, Nairobi / standard finish baseline. */
  rate: money('rate').notNull().default(0),
  itemType: itemType('item_type').notNull().default('measured'),
  /** Quantity driver used by the BQ wizard (see shared/calc/bq.ts). */
  driver: text('driver').notNull().default('none'),
  factor: numeric('factor', { precision: 12, scale: 4, mode: 'number' }).notNull().default(1),
  finishSensitive: boolean('finish_sensitive').notNull().default(false),
  includeByDefault: boolean('include_by_default').notNull().default(true),
  /** Construction methods this item applies to, comma-separated (e.g. 'masonry,issb'); empty = all. */
  methods: text('methods').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/* ------------------------------------------------------------------ */
/* Methods of measurement (SMM for building, CESMM for civil works)    */
/* ------------------------------------------------------------------ */

/** A standard method of measurement a BQ can be prepared under. */
export const measurementStandards = pgTable('measurement_standards', {
  key: text('key').primaryKey(),
  /** Short name shown in lists, e.g. 'SMM (East Africa)'. */
  code: text('code').notNull(),
  name: text('name').notNull(),
  /** 'building' (SMM) or 'civil' (CESMM): decides which library reference is shown. */
  scope: text('scope').notNull().default('building'),
  edition: text('edition').notNull().default(''),
  publisher: text('publisher').notNull().default(''),
  /** Sentence printed on the BQ cover, e.g. "Measured in accordance with …". */
  coverNote: text('cover_note').notNull().default(''),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
})

/** Sections / work classes of a standard, e.g. SMM 'D Excavation and earthwork', CESMM 'E Earthworks'. */
export const measurementSections = pgTable('measurement_sections', {
  id: serial('id').primaryKey(),
  standardKey: text('standard_key').notNull().references(() => measurementStandards.key, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  title: text('title').notNull(),
  /** What it covers and how it is measured (units, key rules). */
  guidance: text('guidance').notNull().default(''),
  sort: integer('sort').notNull().default(0)
}, t => [uniqueIndex('measurement_sections_std_code_idx').on(t.standardKey, t.code)])

/** Measurement rules of a standard: what is measured, in which unit, and how. Paraphrased, with the source. */
export const measurementRules = pgTable('measurement_rules', {
  id: serial('id').primaryKey(),
  standardKey: text('standard_key').notNull().references(() => measurementStandards.key, { onDelete: 'cascade' }),
  sectionCode: text('section_code').notNull(),
  /** Clause or pay item reference in the standard, e.g. 'GI 6' or '36.01'. */
  ref: text('ref').notNull().default(''),
  item: text('item').notNull(),
  unit: text('unit').notNull().default(''),
  rule: text('rule').notNull().default(''),
  source: text('source').notNull().default(''),
  sort: integer('sort').notNull().default(0)
}, t => [index('measurement_rules_std_idx').on(t.standardKey, t.sectionCode)])

/** Which section of each standard a library item is measured under. */
export const libraryMeasureRefs = pgTable('library_measure_refs', {
  id: serial('id').primaryKey(),
  libraryCode: text('library_code').notNull().references(() => libraryItems.code, { onDelete: 'cascade', onUpdate: 'cascade' }),
  standardKey: text('standard_key').notNull().references(() => measurementStandards.key, { onDelete: 'cascade' }),
  sectionCode: text('section_code').notNull()
}, t => [uniqueIndex('library_measure_refs_idx').on(t.libraryCode, t.standardKey)])

/** Laws, regulations, tender documents and specifications that govern BQs and measurement in Kenya. */
export const measurementReferences = pgTable('measurement_references', {
  key: text('key').primaryKey(),
  title: text('title').notNull(),
  /** law | regulation | template | specification | standard | register | guide */
  kind: text('kind').notNull().default('guide'),
  issuer: text('issuer').notNull().default(''),
  year: text('year').notNull().default(''),
  url: text('url').notNull().default(''),
  summary: text('summary').notNull().default(''),
  /** Why it matters for a BQ */
  relevance: text('relevance').notNull().default(''),
  sort: integer('sort').notNull().default(0)
})

/* ------------------------------------------------------------------ */
/* Projects & Bills of Quantities                                      */
/* ------------------------------------------------------------------ */

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  lineageId: uuid('lineage_id').notNull(),
  revision: integer('revision').notNull().default(1),
  previousProjectId: uuid('previous_project_id'),
  name: text('name').notNull(),
  client: text('client').notNull().default(''),
  siteAddress: text('site_address').notNull().default(''),
  preparedBy: text('prepared_by').notNull().default(''),
  locationId: integer('location_id').references(() => locations.id, { onDelete: 'set null' }),
  buildingTypeKey: text('building_type_key').references(() => buildingTypes.key, { onDelete: 'set null' }),
  finishKey: text('finish_key').references(() => finishLevels.key, { onDelete: 'set null' }),
  currency: text('currency').notNull().default('KES'),
  /** Method of measurement the BQ is prepared under (measurement_standards.key). */
  measurementStandard: text('measurement_standard').notNull().default('smm_ea'),
  /** How the building is built (construction_methods.key). */
  constructionMethod: text('construction_method').notNull().default('masonry'),
  status: projectStatus('status').notNull().default('draft'),
  params: jsonb('params').$type<Record<string, unknown>>().notNull().default({}),
  prerequisites: jsonb('prerequisites').$type<Record<string, string>>().notNull().default({}),
  assumptions: text('assumptions').notNull().default(''),
  exclusions: text('exclusions').notNull().default(''),
  contingencyPercent: pct('contingency_percent').notNull().default(5),
  vatPercent: pct('vat_percent').notNull().default(16),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, t => [index('projects_owner_idx').on(t.ownerId, t.updatedAt), index('projects_lineage_idx').on(t.lineageId)])

export const projectBills = pgTable('project_bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  templateKey: text('template_key'),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  provisional: boolean('provisional').notNull().default(false),
  sort: integer('sort').notNull().default(0)
}, t => [index('project_bills_project_idx').on(t.projectId, t.sort)])

export const projectItems = pgTable('project_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  billId: uuid('bill_id').notNull().references(() => projectBills.id, { onDelete: 'cascade' }),
  section: text('section').notNull().default(''),
  description: text('description').notNull(),
  unit: text('unit').notNull(),
  quantity: qty('quantity').notNull().default(0),
  rate: money('rate').notNull().default(0),
  itemType: itemType('item_type').notNull().default('measured'),
  source: text('source').notNull().default('manual'),
  libraryCode: text('library_code'),
  calcSnapshot: jsonb('calc_snapshot'),
  notes: text('notes').notNull().default(''),
  sort: integer('sort').notNull().default(0),
  createdAt: createdAt()
}, t => [index('project_items_bill_idx').on(t.billId, t.sort)])

/** Immutable snapshot of an issued BQ revision. */
export const issuedDocuments = pgTable('issued_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
  lineageId: uuid('lineage_id').notNull(),
  revision: integer('revision').notNull(),
  issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
  snapshot: jsonb('snapshot').notNull(),
  grandTotal: money('grand_total').notNull(),
  issuedAt: createdAt()
}, t => [uniqueIndex('issued_documents_rev_idx').on(t.lineageId, t.revision)])

/* ------------------------------------------------------------------ */
/* Leads & audit                                                       */
/* ------------------------------------------------------------------ */

/** Homeowner estimate requests ("send me a detailed BQ"). */
export const estimateRequests = pgTable('estimate_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  message: text('message').notNull().default(''),
  inputs: jsonb('inputs').notNull(),
  result: jsonb('result').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: createdAt()
})

/** Contact, consultation and plan enquiries sent from the company websites. */
export const siteEnquiries = pgTable('site_enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Which website sent it (its site key). */
  site: text('site').notNull().default('website'),
  /** consultation | plan | contact | quote */
  kind: text('kind').notNull().default('contact'),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  subject: text('subject').notNull().default(''),
  message: text('message').notNull().default(''),
  /** Plan reference when the enquiry is about a plan for sale. */
  planRef: text('plan_ref').notNull().default(''),
  status: text('status').notNull().default('new'),
  createdAt: createdAt()
}, t => [index('site_enquiries_created_idx').on(t.createdAt)])

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: text('actor_name'),
  projectId: uuid('project_id'),
  action: text('action').notNull(),
  details: jsonb('details').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('audit_events_at_idx').on(t.at)])
