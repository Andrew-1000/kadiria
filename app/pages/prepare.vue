<script setup lang="ts">
import { PREREQUISITES, readiness, type PrereqStatus } from '#shared/calc/bq'

useSeoMeta({ title: 'Prepare documents | Kadiria' })
const { loggedIn } = useUserSession()
const answers = usePrereqAnswers()

/** Who normally produces each document in a Kenyan building project. */
const WHO: Record<string, string> = {
  architectural: 'Registered architect',
  structural: 'Structural engineer',
  formwork: 'Structural engineer or contractor (temporary works)',
  site: 'Land surveyor / geotechnical engineer',
  specification: 'Architect or quantity surveyor',
  services: 'Electrical & plumbing (MEP) engineers',
  approvals: 'County planning office, NCA and NEMA (usually through your architect)'
}

const options: { value: PrereqStatus, label: string, color: 'success' | 'warning' | 'error' }[] = [
  { value: 'have', label: 'Have it', color: 'success' },
  { value: 'partial', label: 'Partly', color: 'warning' },
  { value: 'missing', label: 'Not yet', color: 'error' }
]
const status = (key: string): PrereqStatus | undefined => answers.value[key]
function setStatus(key: string, value: PrereqStatus) {
  answers.value = { ...answers.value, [key]: value }
}
const answered = computed(() => PREREQUISITES.filter(p => answers.value[p.key]).length)
const score = computed(() => readiness(answers.value))
const wizardLink = computed(() => loggedIn.value ? '/projects/new' : '/login?redirect=/projects/new')
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-8">
    <JourneyGuide stage="prepare" compact />

    <div class="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
      <section>
        <p class="text-[10px] uppercase tracking-[0.25em] text-muted">
          Kadiria · Document check
        </p>
        <h1 class="font-display text-3xl font-bold text-highlighted mt-1">
          What do you have ready?
        </h1>
        <p class="mt-2 text-muted max-w-2xl">
          A Bill of Quantities is measured from these documents. Mark what you have; nothing is lost if something is missing. The BQ simply treats it as a provisional sum or a written assumption until it is ready.
        </p>

        <ol class="mt-6 space-y-3">
          <li v-for="(p, i) in PREREQUISITES" :key="p.key" class="rounded-lg border border-default bg-default p-4">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div class="flex gap-3">
                <span class="font-mono text-xs text-dimmed pt-1 w-5">{{ String(i + 1).padStart(2, '0') }}</span>
                <div>
                  <p class="font-medium text-highlighted">
                    {{ p.label }}
                    <UBadge v-if="p.essential" size="sm" variant="subtle" color="primary" label="Essential" class="ms-1 align-middle" />
                  </p>
                  <p class="text-sm text-muted mt-1">
                    {{ p.why }}
                  </p>
                  <p class="text-xs text-dimmed mt-1">
                    <UIcon name="i-lucide-user-round" class="align-[-2px]" /> Prepared by: {{ WHO[p.key] ?? '—' }}
                  </p>
                </div>
              </div>
              <div class="flex gap-1 shrink-0 sm:ps-0 ps-8" role="radiogroup" :aria-label="p.label">
                <UButton
                  v-for="o in options"
                  :key="o.value"
                  size="xs"
                  :label="o.label"
                  role="radio"
                  :aria-checked="status(p.key) === o.value"
                  :color="status(p.key) === o.value ? o.color : 'neutral'"
                  :variant="status(p.key) === o.value ? 'solid' : 'outline'"
                  @click="setStatus(p.key, o.value)"
                />
              </div>
            </div>
            <p v-if="status(p.key) && status(p.key) !== 'have'" class="mt-2 ms-8 text-xs text-warning">
              <UIcon name="i-lucide-info" class="align-[-2px]" /> In your BQ: {{ p.ifMissing }}
            </p>
          </li>
        </ol>
      </section>

      <!-- Readiness -->
      <aside class="lg:sticky lg:top-20 rounded-lg border border-default bg-default">
        <div class="p-4 border-b border-default">
          <p class="text-[10px] uppercase tracking-widest text-dimmed">
            Readiness
          </p>
          <p class="font-mono text-3xl font-bold mt-1" :class="score.percent >= 85 ? 'text-success' : score.percent >= 55 ? 'text-warning' : 'text-error'">
            {{ score.percent }}%
          </p>
          <p class="text-sm font-medium">
            {{ answered ? score.level : 'Answer the checklist' }}
          </p>
          <UProgress :model-value="score.percent" size="sm" class="mt-3" :color="score.percent >= 85 ? 'success' : score.percent >= 55 ? 'warning' : 'error'" />
          <p class="mt-2 text-xs text-muted">
            {{ answered }} of {{ PREREQUISITES.length }} answered.
          </p>
        </div>
        <dl class="p-4 text-xs space-y-2 border-b border-default">
          <div>
            <dt class="font-medium">
              Order-of-cost estimate (below 55%)
            </dt>
            <dd class="text-muted">
              Good for budgeting and early decisions.
            </dd>
          </div>
          <div>
            <dt class="font-medium">
              Detailed estimate (55–84%)
            </dt>
            <dd class="text-muted">
              Most quantities measured; some provisional sums.
            </dd>
          </div>
          <div>
            <dt class="font-medium">
              Tender-ready (85% and above)
            </dt>
            <dd class="text-muted">
              Contractors can price it with confidence.
            </dd>
          </div>
        </dl>
        <div class="p-4 space-y-2">
          <UButton block icon="i-lucide-file-spreadsheet" label="Start a BQ with these answers" :to="wizardLink" />
          <p class="text-[11px] text-dimmed">
            Your answers carry into the BQ wizard, so you won't be asked twice.
          </p>
        </div>
      </aside>
    </div>

    <JourneyNext
      stage="prepare"
      hint="While documents are being prepared, you can already work out materials element by element, in the order they are built on site."
    />
  </UContainer>
</template>
