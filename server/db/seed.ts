import 'dotenv/config'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as s from './schema'
import * as d from './seed-data'
import * as m from './seed-measurement'
import { MODULES } from '../../shared/calc/modules'
import { connectionOptions } from './connection'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env).')
const client = postgres(url, connectionOptions(url, 1))
const db = drizzle(client, { schema: s })
const EFFECTIVE = '2026-01-01'

await db.insert(s.featureFlags).values(d.FEATURE_FLAGS).onConflictDoNothing()
await db.insert(s.calcConstants).values(d.CONSTANTS).onConflictDoNothing()
await db.insert(s.settings).values({ key: 'embed_allowed_origins', value: [] }).onConflictDoNothing()
await db.insert(s.countries).values(d.COUNTRIES).onConflictDoNothing()
await db.insert(s.finishLevels).values(d.FINISHES).onConflictDoNothing()
await db.insert(s.buildingTypes).values(d.BUILDING_TYPES).onConflictDoNothing()
await db.insert(s.estimateAddons).values(d.ADDONS).onConflictDoNothing()
await db.insert(s.elementSplits).values(d.ELEMENTS).onConflictDoNothing()
await db.insert(s.mixDesigns).values(d.MIXES).onConflictDoNothing()
await db.insert(s.billTemplates).values(d.BILLS.map((b, i) => ({ ...b, sort: i + 1 }))).onConflictDoNothing()
await db.insert(s.calcModules).values(MODULES.map((m, i) => ({ key: m.key, enabled: true, sort: i + 1, defaults: {} }))).onConflictDoNothing()

// Tiers, locations and their cost-per-m² bands
for (const tier of d.TIERS) {
  await db.insert(s.rateTiers).values({ countryCode: 'KE', key: tier.key, label: tier.label, sort: tier.sort }).onConflictDoNothing()
  const [row] = await db.select().from(s.rateTiers).where(and(eq(s.rateTiers.countryCode, 'KE'), eq(s.rateTiers.key, tier.key)))
  if (!row) continue
  const existing = await db.select({ name: s.locations.name }).from(s.locations).where(eq(s.locations.tierId, row.id))
  const names = new Set(existing.map(e => e.name))
  let sort = 1
  for (const [name, adjustmentPercent] of tier.locations) {
    if (!names.has(name)) await db.insert(s.locations).values({ tierId: row.id, name, adjustmentPercent, sort })
    sort++
  }
  const hasRates = await db.select({ id: s.costRates.id }).from(s.costRates).where(eq(s.costRates.tierId, row.id)).limit(1)
  if (!hasRates.length) {
    for (const [finishKey, [minRate, maxRate]] of Object.entries(d.COST_RATES[tier.key] ?? {})) {
      await db.insert(s.costRates).values({ tierId: row.id, finishKey, minRate, maxRate, effectiveFrom: EFFECTIVE, note: '2026 Kenya market rates (seed)' })
    }
  }
}

// Materials and prices
let added = 0
for (const [i, { key, name, size, unit, category, kind, price, source }] of d.MATERIALS.entries()) {
  const inserted = await db.insert(s.materials).values({ key, name, size, unit, category, kind: kind ?? 'material', sort: i + 1 }).onConflictDoNothing().returning({ id: s.materials.id })
  if (inserted.length) added++
  const [m] = await db.select().from(s.materials).where(eq(s.materials.key, key))
  if (!m) continue
  const priced = await db.select({ id: s.materialPrices.id }).from(s.materialPrices).where(and(eq(s.materialPrices.materialId, m.id), isNull(s.materialPrices.locationId))).limit(1)
  if (!priced.length) await db.insert(s.materialPrices).values({ materialId: m.id, price, effectiveFrom: EFFECTIVE, source })
}
if (added) console.log(`✔ ${added} new material(s) added to the catalogue`)
for (const [locationName, key, price] of d.LOCATION_PRICES) {
  const [loc] = await db.select().from(s.locations).where(eq(s.locations.name, locationName))
  const [m] = await db.select().from(s.materials).where(eq(s.materials.key, key))
  if (!loc || !m) continue
  const priced = await db.select({ id: s.materialPrices.id }).from(s.materialPrices).where(and(eq(s.materialPrices.materialId, m.id), eq(s.materialPrices.locationId, loc.id))).limit(1)
  if (!priced.length) await db.insert(s.materialPrices).values({ materialId: m.id, locationId: loc.id, price, effectiveFrom: EFFECTIVE, source: 'Seed: regional example' })
}

// BQ library
await db.insert(s.libraryItems).values(d.LIBRARY.map(([code, billKey, section, description, unit, rate, itemType, driver, factor, finishSensitive, includeByDefault], i) => ({
  code, billKey, section, description, unit, rate, itemType, driver, factor, finishSensitive, includeByDefault, sort: i + 1
}))).onConflictDoNothing()

// Methods of measurement: standards, sections, rules, library references and policies (add-only)
await db.insert(s.measurementStandards).values([...d.STANDARDS, ...m.EXTRA_STANDARDS]).onConflictDoNothing()
const sectionRows = ([['smm_ea', d.SMM_SECTIONS], ['cesmm4', d.CESMM_SECTIONS], ['aaqs_2015', m.AAQS_SECTIONS], ['kenya_roads_2023', m.ROADS_SECTIONS]] as const)
  .flatMap(([standardKey, list]) => list.map(([code, title, guidance], i) => ({ standardKey, code, title, guidance, sort: i + 1 })))
await db.insert(s.measurementSections).values(sectionRows).onConflictDoNothing()
// Rules: only for standards that have none yet (so admin edits and deletions are kept)
let rulesAdded = 0
for (const key of [...new Set(m.RULES.map(r => r.standardKey))]) {
  const [existing] = await db.select({ id: s.measurementRules.id }).from(s.measurementRules).where(eq(s.measurementRules.standardKey, key)).limit(1)
  if (existing) continue
  const rows = m.RULES.filter(r => r.standardKey === key).map((r, i) => ({ ...r, sort: i + 1 }))
  for (let i = 0; i < rows.length; i += 100) await db.insert(s.measurementRules).values(rows.slice(i, i + 100))
  rulesAdded += rows.length
}
if (rulesAdded) console.log(`✔ ${rulesAdded} measurement rule(s) added`)
// Library item references for every standard (existing references are left as they are)
const refRows = [
  ...Object.entries(d.LIBRARY_REFS).flatMap(([code, [smm, cesmm]]) => [{ libraryCode: code, standardKey: 'smm_ea', sectionCode: smm }, { libraryCode: code, standardKey: 'cesmm4', sectionCode: cesmm }]),
  ...Object.entries(m.AAQS_REFS).map(([code, sec]) => ({ libraryCode: code, standardKey: 'aaqs_2015', sectionCode: sec })),
  ...Object.entries(m.ROADS_REFS).map(([code, sec]) => ({ libraryCode: code, standardKey: 'kenya_roads_2023', sectionCode: sec }))
]
const libraryCodes = new Set((await db.select({ code: s.libraryItems.code }).from(s.libraryItems)).map(x => x.code))
const refsAdded = await db.insert(s.libraryMeasureRefs).values(refRows.filter(r => libraryCodes.has(r.libraryCode))).onConflictDoNothing().returning({ id: s.libraryMeasureRefs.id })
if (refsAdded.length) console.log(`✔ ${refsAdded.length} library measurement reference(s) added`)
const refsDocs = await db.insert(s.measurementReferences).values(m.REFERENCES).onConflictDoNothing().returning({ key: s.measurementReferences.key })
if (refsDocs.length) console.log(`✔ ${refsDocs.length} policy / reference document(s) added`)


// First administrator (same scrypt format as nuxt-auth-utils' hashPassword)
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (email && password) {
  const [existing] = await db.select().from(s.users).where(sql`lower(${s.users.email}) = lower(${email})`)
  if (!existing) {
    const { hashPassword } = await import('./password')
    await db.insert(s.users).values({ email, name: 'Administrator', role: 'admin', passwordHash: await hashPassword(password) })
    console.log(`✔ Admin user created: ${email}`)
  }
} else {
  console.log('ℹ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set; no admin user created.')
}

console.log('✔ Seed complete')
await client.end()
