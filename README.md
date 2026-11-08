# Kadiria

**Kadiria** (Swahili for "estimate, work out the cost") is a standalone **Nuxt 4 + Vue 3 + PostgreSQL** product for construction cost estimation, material quantification and professional Bills of Quantities in Kenya.

It runs as its own service. Company websites plug it in by embedding its calculators, calling its JSON API, or switching features on and off with an API key.

| Audience | What they get |
| --- | --- |
| Homeowners | **Construction Cost Calculator**: location + house type + floor areas + finish → total, range, labour, add-ons, budget check, elemental breakdown, "request a detailed BQ" |
| Fundis / site staff | **Material Quantification Modules** (15): excavation, hardcore, blinding, strip footing, column bases, foundation walling, columns, beams, ground slab, suspended slab, walling, roofing, plaster, tiling, painting, with formulas shown and materials priced for the location |
| QS / contractors / developers | **BQ projects**: a prerequisites-first wizard drafts the standard Kenyan bills (Preliminaries → Provisional & PC Sums); inline editing, library items, calculator → BQ, contingency + VAT summary, review → approve → issue workflow with immutable revisions, print/PDF and CSV |
| Admin | **Back-office** for feature switches, locations and cost-per-m² bands, materials and effective-dated prices, mix designs, engineering constants, module defaults, the BQ library, users, leads, website integration and the audit log |

## Stack

- **Nuxt 4** (Vue 3, Nitro server routes) with **Nuxt UI v4** (Tailwind CSS v4) for the interface
- **PostgreSQL** via **Drizzle ORM** (`postgres` driver), with SQL migrations in `server/db/migrations`
- **nuxt-auth-utils** for sealed-cookie sessions and scrypt password hashing
- **zod** validation on every API input
- Calculation engine in `shared/calc/` (pure TypeScript, used by both browser and server, unit-tested with Vitest)

## Getting started

Requires Node.js 20+ and PostgreSQL 14+.

```powershell
npm install

# 1. Configure the environment
copy .env.example .env      # then edit: choose a password for the kadiria user in DATABASE_URL,
                            # set NUXT_SESSION_PASSWORD (32+ chars) and SEED_ADMIN_*

# 2. Create the database user + database from DATABASE_URL
#    (asks once for your PostgreSQL "postgres" superuser password; it is not stored)
npm run db:create

# 3. Create tables and load Kenyan reference data + first admin
npm run db:setup

# 4. Run
npm run dev                 # http://localhost:3000
```

If the dev server prints **"Kadiria cannot use the database"**, it tells you which step is missing (placeholder password, wrong password, missing database or missing tables).

Forgot the `postgres` superuser password? Temporarily set `host all all 127.0.0.1/32 trust` in `pg_hba.conf` (in the PostgreSQL data folder), restart the PostgreSQL service, run `ALTER USER postgres PASSWORD 'new-password';` in psql, then restore the original line and restart again.

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, then open **Admin back-office**. The seed only inserts missing rows, so re-running it never overwrites admin changes.

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `preview` | Develop, build and preview production |
| `npm test` | Calculation-engine unit tests |
| `npm run typecheck` | Type-check app, server and shared code |
| `npm run db:generate` | Generate a migration after editing `server/db/schema.ts` |
| `npm run db:migrate` / `db:seed` / `db:setup` | Apply migrations / seed / both |
| `npm run db:studio` | Browse the database (Drizzle Studio) |
| `npm run db:admin` | Create an admin, or reset an admin's password (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) |

## Deploying: Netlify + Supabase

Kadiria runs on **Netlify**, which deploys automatically on every push to `main`. Its database is a dedicated **Supabase** project. Don't share the project with a website that uses Supabase's public API.

**1. Database (Supabase)**

1. Create a new project at <https://supabase.com>, e.g. `kadiria`, in the Frankfurt region. Save the database password.
2. Click **Connect** (top of the dashboard) and copy two connection strings:
   - **Transaction pooler** (port `6543`), for Netlify.
   - **Session pooler** (port `5432`), for running migrations from your computer.
3. From this folder, create the tables, reference data and first admin:
   ```powershell
   $env:DATABASE_URL = "<session pooler string, with your password>"
   $env:SEED_ADMIN_EMAIL = "you@example.com"; $env:SEED_ADMIN_PASSWORD = "<a strong password>"
   npm run db:setup
   ```
   Migration `0004_hardening` removes Supabase's public API roles (`anon`, `authenticated`) from every table and turns on row-level security. Kadiria connects directly and never uses that API.

**2. App (Netlify)**

1. Push this repo to GitHub. In Netlify, choose **Add new project → Import an existing project → GitHub** and pick the repo. The build settings come from `netlify.toml`.
2. Under **Site configuration → Environment variables**, add:
   - `DATABASE_URL`: the transaction pooler string (port `6543`), with your password.
   - `NUXT_SESSION_PASSWORD`: 32+ random characters.
3. Deploy. Then sign in, and under **Admin → Website integration**:
   - add each website that embeds Kadiria (e.g. `https://andrew-1000.github.io`);
   - set the **Name printed on documents**.

The connection code (`server/db/connection.ts`) turns on SSL for Supabase, disables prepared statements on the transaction pooler and keeps connections low on serverless hosts.

## How the admin drives accuracy

- **Cost per m²**: effective-dated min–max bands per *rate tier* (Nairobi / other urban / rural) and *finish*. The calculator uses the band midpoint × location adjustment × building-type factor. History is kept.
- **Material prices**: effective-dated national prices, with optional per-location overrides. Every module result is priced from them.
- **Engineering constants**: voids factors (1.54 concrete / 1.33 mortar), bag volume, densities, lap allowance, stone size and joint, BRC sheet area and more. Formulas read these at run time.
- **Module defaults** and **on/off switches** per module.
- **BQ library**: standard items with a *quantity driver* (e.g. foundation length × 0.12 = m³ strip footing) and a Nairobi / standard baseline rate, scaled by location tier and finish level when a BQ is drafted.

## The BQ wizard: "what you need first"

Before drafting, the user records which documents they have (architectural drawings, structural drawings/BBS, site/soil report, specification, MEP designs, approvals). The readiness score sets the estimate class (order-of-cost → detailed → tender-ready), and the draft adapts to what is missing:

- No structural drawings → Substructure and Superstructure bills are marked **All Provisional**
- No soil report → a provisional sum for rock excavation and dewatering
- No MEP designs → services as **Provisional Sums**
- Approvals pending → a provisional sum for statutory fees

Every gap is written into the BQ's assumptions.

## Integrating with company websites

1. **Admin → Website integration**: add the website origin (e.g. `https://www.example.co.ke`).
2. Embed: `<iframe src="https://kadiria.example.com/embed/estimate">` and `/embed/calculators?module=blinding`. `frame-ancestors` only allows approved origins.
3. Or call the public API (CORS for approved origins): `GET /api/public/features`, `GET /api/public/config`, `POST /api/public/estimate`, `POST /api/public/modules/{key}`.
4. Create an **API key**. The website's admin can then switch calculators on/off server-to-server:
   `PUT /api/integration/features/cost_estimator {"enabled": false}` or `PUT /api/integration/features/module:blinding {...}` with `Authorization: Bearer kdr_...`. Older `dvk_` keys still work.

## Roles

| Role | Can |
| --- | --- |
| `member` | Use calculators, create own BQs, submit them for review |
| `professional` | The above, plus approve and issue BQs |
| `admin` | Everything, including the back-office and all projects |

## Project layout

```
app/            Vue pages, layouts, components (Nuxt UI)
server/api/     REST endpoints: public/, auth/, projects/, admin/, integration/
server/db/      Drizzle schema, migrations, seed data
server/utils/   DB access, config/price resolution, BQ generator, guards
shared/calc/    Calculation engine (modules, estimator, BQ drivers & totals)
tests/          Vitest unit tests
```

## Notes and limits

- Rates and prices in the seed are indicative 2026 Kenyan market figures from public price guides. Replace them with your own supplier quotes and surveys.
- PDF output uses the browser's print / Save as PDF on the print view, which has BQ-style page breaks.
