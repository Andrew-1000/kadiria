<script setup lang="ts">
import { readiness } from '#shared/calc/bq'

/*
 * Public pages for journey stages 4–6 (draft, review, tender). They keep visitors inside the
 * journey's tabbed layout, explain the stage, and lead into the signed-in tools. Signed-in users
 * also see their own BQs that are at this stage.
 */
const SLUGS = { draft: 'bq', review: 'review', tender: 'build' } as const
type Slug = keyof typeof SLUGS

const route = useRoute()
const slug = String(route.params.key) as Slug
if (!(slug in SLUGS)) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const stageKey = SLUGS[slug]
const stage = journeyStage(stageKey)
useSeoMeta({ title: `${stage.title} | Davecore BQ` })

const { loggedIn, user } = useUserSession()
const answers = usePrereqAnswers()
const answered = computed(() => Object.keys(answers.value).length > 0)
const score = computed(() => readiness(answers.value))
const signIn = (path: string) => loggedIn.value ? path : `/login?redirect=${encodeURIComponent(path)}`
const reviewer = computed(() => user.value?.role === 'admin' || user.value?.role === 'professional')

interface Row { id: string, name: string, client: string, status: string, revision: number, currency: string, updatedAt: string, grandTotal: number }
const { data: projects, execute } = useFetch<Row[]>('/api/projects', { server: false, immediate: false, default: () => [] })
onMounted(() => { if (loggedIn.value) execute() })
const statuses: Record<Slug, string[]> = { draft: ['draft'], review: ['submitted', 'approved'], tender: ['issued'] }
const mine = computed(() => (projects.value ?? []).filter(p => statuses[slug].includes(p.status)).slice(0, 6))

const BILLS = [
  ['1', 'Preliminaries & General Items', 'Site setup, insurances, water, power, security'],
  ['2', 'Substructure', 'Excavation to ground floor slab and DPC'],
  ['3', 'Superstructure', 'Frame, upper floors, stairs and walling'],
  ['4', 'Roofing', 'Trusses, covering, fascia and gutters'],
  ['5', 'Doors & Windows', 'Frames, glazing, ironmongery, grilles'],
  ['6', 'Finishes', 'Plaster, screeds, tiles, ceilings, paint'],
  ['7', 'Services', 'Electrical, plumbing and drainage'],
  ['8', 'External Works', 'Paving, fencing, landscaping'],
  ['9', 'Provisional & PC Sums', 'Allowances for items not yet defined']
]
const WIZARD = [
  { icon: 'i-lucide-list-checks', title: 'Documents', text: 'Tell the wizard what you have (stage 2). Missing items become provisional sums and written assumptions.' },
  { icon: 'i-lucide-map-pin', title: 'Project', text: 'Client, site, town and finish level set the regional rate level.' },
  { icon: 'i-lucide-ruler', title: 'Building', text: 'Floor areas, storey height, doors and windows measure the first draft.' },
  { icon: 'i-lucide-file-spreadsheet', title: 'Draft & refine', text: 'All nine bills are drafted with rates; edit lines, add library items or calculator results.' }
]
const WORKFLOW = [
  { status: 'draft', label: 'Draft', who: 'Author (member or professional)', text: 'Measured and priced; freely editable.' },
  { status: 'submitted', label: 'In review', who: 'Submitted by the author', text: 'Locked while a professional checks it. Can be returned to draft with changes.' },
  { status: 'approved', label: 'Approved', who: 'Professional or administrator', text: 'Quantities and rates accepted; ready to issue.' },
  { status: 'issued', label: 'Issued', who: 'Professional or administrator', text: 'Saved as a permanent numbered revision. Changes need a new revision.' }
]
const CHECKS = [
  'Quantities agree with the drawings and the building parameters',
  'Rates suit the location, finish level and current material prices',
  'Provisional and prime cost sums are reasonable and clearly described',
  'Assumptions and exclusions match what the client actually asked for',
  'Contingency and VAT are set correctly on the grand summary'
]
const USES = [
  { icon: 'i-lucide-gavel', title: 'Tendering', text: 'Contractors price the same issued BQ, so their offers can be compared line by line.' },
  { icon: 'i-lucide-handshake', title: 'Contract sum', text: 'The accepted priced BQ becomes the contract figure and the basis for any changes.' },
  { icon: 'i-lucide-receipt', title: 'Valuations & payments', text: 'Work done on site is measured against BQ items to value interim payments.' },
  { icon: 'i-lucide-git-branch-plus', title: 'Variations', text: 'Changes on site are priced from BQ rates and recorded as a new revision.' }
]
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-8">
    <JourneyGuide :stage="stageKey" compact />

    <header>
      <p class="text-[10px] uppercase tracking-[0.25em] text-muted">
        Stage {{ stage.no }} · {{ stage.title }}
      </p>
      <h1 class="font-display text-3xl font-bold text-highlighted mt-1">
        <template v-if="slug === 'draft'">
          Turn your project into a Bill of Quantities
        </template>
        <template v-else-if="slug === 'review'">
          Check it, approve it, issue it
        </template>
        <template v-else>
          Put the BQ to work on site
        </template>
      </h1>
      <p class="mt-2 text-muted max-w-3xl">
        {{ stage.what }}
      </p>
    </header>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
      <div class="space-y-6">
        <!-- Stage 4: draft -->
        <template v-if="slug === 'draft'">
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              How the BQ wizard drafts it
            </h2>
            <ol class="mt-4 grid sm:grid-cols-2 gap-4">
              <li v-for="(w, i) in WIZARD" :key="w.title" class="flex gap-3">
                <span class="size-8 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center font-mono text-sm font-bold">{{ i + 1 }}</span>
                <div>
                  <p class="font-medium text-highlighted">
                    <UIcon :name="w.icon" class="align-[-2px] text-primary" /> {{ w.title }}
                  </p>
                  <p class="text-sm text-muted mt-0.5">
                    {{ w.text }}
                  </p>
                </div>
              </li>
            </ol>
          </section>
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              What you get: nine standard bills and a grand summary
            </h2>
            <div class="mt-4 grid sm:grid-cols-3 gap-2">
              <div v-for="[n, t, d] in BILLS" :key="t" class="rounded-md border border-default px-3 py-2">
                <p class="text-sm font-medium">
                  <span class="font-mono text-primary">{{ n }}</span> {{ t }}
                </p>
                <p class="text-xs text-muted">
                  {{ d }}
                </p>
              </div>
            </div>
            <p class="mt-3 text-xs text-muted">
              Each line is described, measured (unit × quantity) and priced (rate → amount). The summary adds contingency and VAT. Export to print/PDF or Excel at any time.
            </p>
          </section>
        </template>

        <!-- Stage 5: review -->
        <template v-else-if="slug === 'review'">
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              The review workflow
            </h2>
            <ol class="mt-4 grid sm:grid-cols-4 gap-3">
              <li v-for="(w, i) in WORKFLOW" :key="w.status" class="relative rounded-md border border-default p-3">
                <UBadge :color="STATUS_LABELS[w.status]?.color" variant="subtle" :label="w.label" />
                <p class="mt-2 text-sm">
                  {{ w.text }}
                </p>
                <p class="mt-1 text-xs text-dimmed">
                  {{ w.who }}
                </p>
                <UIcon v-if="i < WORKFLOW.length - 1" name="i-lucide-arrow-right" class="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-dimmed bg-default" />
              </li>
            </ol>
          </section>
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              What a reviewer checks
            </h2>
            <ul class="mt-3 space-y-2">
              <li v-for="c in CHECKS" :key="c" class="flex gap-2 text-sm">
                <UIcon name="i-lucide-circle-check" class="size-4 mt-0.5 text-success shrink-0" /> {{ c }}
              </li>
            </ul>
            <p class="mt-3 text-xs text-muted">
              Members can submit a BQ for review; professionals and administrators approve and issue.
              <template v-if="loggedIn">
                You are signed in as {{ reviewer ? 'a reviewer: you can approve and issue' : 'a member: a professional will review your BQ' }}.
              </template>
            </p>
          </section>
        </template>

        <!-- Stage 6: tender & build -->
        <template v-else>
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              How an issued BQ is used
            </h2>
            <div class="mt-4 grid sm:grid-cols-2 gap-4">
              <div v-for="u in USES" :key="u.title" class="flex gap-3">
                <span class="size-9 shrink-0 rounded-lg bg-primary/10 grid place-items-center"><UIcon :name="u.icon" class="size-5 text-primary" /></span>
                <div>
                  <p class="font-medium text-highlighted">
                    {{ u.title }}
                  </p>
                  <p class="text-sm text-muted mt-0.5">
                    {{ u.text }}
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section class="rounded-lg border border-default bg-default p-5">
            <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Documents you can hand out
            </h2>
            <ul class="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
              <li class="rounded-md border border-default p-3">
                <UIcon name="i-lucide-printer" class="text-primary" /> <b>Print / PDF</b><p class="text-xs text-muted mt-1">
                  Formal BQ with cover, preambles, every bill and the grand summary.
                </p>
              </li>
              <li class="rounded-md border border-default p-3">
                <UIcon name="i-lucide-sheet" class="text-primary" /> <b>Excel (CSV)</b><p class="text-xs text-muted mt-1">
                  For contractors to price, or for your own analysis.
                </p>
              </li>
              <li class="rounded-md border border-default p-3">
                <UIcon name="i-lucide-history" class="text-primary" /> <b>Revisions</b><p class="text-xs text-muted mt-1">
                  Every issue is kept, so you can see what changed and when.
                </p>
              </li>
            </ul>
          </section>
        </template>
      </div>

      <!-- Side panel: action + your BQs at this stage -->
      <aside class="lg:sticky lg:top-20 space-y-4">
        <div class="rounded-lg border border-default bg-default p-4">
          <template v-if="slug === 'draft'">
            <p class="text-[10px] uppercase tracking-widest text-dimmed">
              Your readiness
            </p>
            <template v-if="answered">
              <p class="font-mono text-2xl font-bold mt-1">
                {{ score.percent }}%
              </p>
              <p class="text-sm">
                {{ score.level }}
              </p>
            </template>
            <p v-else class="text-sm text-muted mt-1">
              Not checked yet.
            </p>
            <UButton class="mt-2" size="xs" color="neutral" variant="link" :label="answered ? 'Review your documents' : 'Check your documents first'" to="/prepare" trailing-icon="i-lucide-arrow-right" />
            <UButton block class="mt-3" icon="i-lucide-sparkles" :label="loggedIn ? 'Start the BQ wizard' : 'Sign in to start a BQ'" :to="signIn('/projects/new')" />
          </template>
          <template v-else>
            <p class="text-sm text-muted">
              {{ slug === 'review' ? 'Submit, approve and issue BQs from the project editor.' : 'Print and export issued BQs from the project editor.' }}
            </p>
            <UButton block class="mt-3" icon="i-lucide-folder-kanban" :label="loggedIn ? 'Open my BQ projects' : 'Sign in to your projects'" :to="signIn('/projects')" />
          </template>
          <p v-if="!loggedIn" class="mt-2 text-[11px] text-dimmed">
            BQ projects are saved to your account, so you'll be asked to sign in (or create a free account).
          </p>
        </div>

        <div v-if="loggedIn" class="rounded-lg border border-default bg-default">
          <p class="px-4 py-2.5 border-b border-default text-[10px] uppercase tracking-widest text-dimmed">
            Your BQs {{ slug === 'draft' ? 'in draft' : slug === 'review' ? 'in review' : 'issued' }}
          </p>
          <ul class="divide-y divide-default">
            <li v-for="p in mine" :key="p.id" class="px-4 py-2.5">
              <NuxtLink :to="`/projects/${p.id}`" class="block hover:text-primary">
                <p class="text-sm font-medium truncate">
                  {{ p.name }}
                </p>
                <p class="text-xs text-muted flex justify-between gap-2">
                  <span>Rev {{ p.revision }} · {{ STATUS_LABELS[p.status]?.label }}</span>
                  <span class="font-mono">{{ formatMoney(p.grandTotal, p.currency) }}</span>
                </p>
              </NuxtLink>
              <div v-if="slug === 'tender'" class="mt-1 flex gap-3 text-xs">
                <NuxtLink :to="`/projects/${p.id}/print`" target="_blank" class="text-primary">Print / PDF</NuxtLink>
                <a :href="`/api/projects/${p.id}/export.csv`" class="text-primary">Excel</a>
              </div>
            </li>
            <li v-if="!mine.length" class="px-4 py-4 text-sm text-muted">
              None yet.
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <JourneyNext v-if="slug !== 'tender'" :stage="stageKey" />
    <section v-else class="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <span class="size-10 shrink-0 rounded-lg bg-primary text-inverted grid place-items-center"><UIcon name="i-lucide-flag" class="size-5" /></span>
      <p class="flex-1 text-sm">
        That's the full journey. Planning another building? Start again with a cost estimate.
      </p>
      <UButton to="/estimate" trailing-icon="i-lucide-arrow-right" label="New cost estimate" />
    </section>
  </UContainer>
</template>
