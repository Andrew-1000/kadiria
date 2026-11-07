/**
 * Creates (or updates) the application role and database described by DATABASE_URL.
 * Connects once as a PostgreSQL superuser; the superuser password is prompted for
 * (or read from PGSUPERPASSWORD) and never stored.
 *
 *   npm run db:create
 */
import 'dotenv/config'
import { createInterface } from 'node:readline'
import postgres from 'postgres'

const raw = process.env.DATABASE_URL
if (!raw) throw new Error('DATABASE_URL is not set (copy .env.example to .env).')
const url = new URL(raw)
const appUser = decodeURIComponent(url.username)
const appPassword = decodeURIComponent(url.password)
const appDb = url.pathname.replace(/^\//, '')
if (!appUser || !appDb) throw new Error('DATABASE_URL must include a user and database name.')
if (!appPassword || /CHANGE-ME/i.test(appPassword)) {
  console.error('✖ Choose a real password for the app user in DATABASE_URL in .env (replace CHANGE-ME), then re-run.')
  process.exit(1)
}
if (!/^[a-z_][a-z0-9_]*$/i.test(appUser) || !/^[a-z_][a-z0-9_]*$/i.test(appDb)) {
  throw new Error('User and database names may only contain letters, digits and underscores.')
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const out = rl as unknown as { _writeToOutput: (s: string) => void, output: NodeJS.WriteStream }
    let prompted = false
    out._writeToOutput = (s: string) => {
      if (!prompted) { out.output.write(s); prompted = true }
    }
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer) })
  })
}

const superUser = process.env.PGSUPERUSER || 'postgres'
const superPassword = process.env.PGSUPERPASSWORD ?? await askHidden(`Password for PostgreSQL superuser "${superUser}" at ${url.hostname}:${url.port || 5432}: `)

const admin = postgres({ host: url.hostname, port: Number(url.port || 5432), user: superUser, password: superPassword, database: 'postgres', max: 1, onnotice: () => {} })
try {
  const [role] = await admin`select 1 from pg_roles where rolname = ${appUser}`
  if (role) {
    await admin.unsafe(`alter role "${appUser}" with login password ${quote(appPassword)}`)
    console.log(`✔ Role "${appUser}" exists; password updated to match .env`)
  }
  else {
    await admin.unsafe(`create role "${appUser}" with login password ${quote(appPassword)}`)
    console.log(`✔ Role "${appUser}" created`)
  }
  const [db] = await admin`select 1 from pg_database where datname = ${appDb}`
  if (db) console.log(`✔ Database "${appDb}" already exists`)
  else {
    await admin.unsafe(`create database "${appDb}" owner "${appUser}"`)
    console.log(`✔ Database "${appDb}" created`)
  }
  console.log('\nNext: npm run db:setup   (tables + reference data + first admin)')
}
catch (e) {
  const code = (e as { code?: string }).code
  if (code === '28P01') console.error(`✖ Wrong password for superuser "${superUser}".`)
  else console.error('✖', (e as Error).message)
  process.exitCode = 1
}
finally {
  await admin.end()
}

function quote(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}
