<script setup lang="ts">
/*
 * The building guide: all six construction stages as a vertical timeline, with the chosen stage
 * explained in plain language (what is done, the steps, who you need, what you get, how long it
 * takes, a tip) and a drawing of the house at that point. Switching stages replaces the history
 * entry, so "Back" always returns to wherever the visitor came from.
 */
const route = useRoute()
const keys = JOURNEY.map(s => s.key) as string[]
const raw = String(route.params.key ?? 'plan')
if (!keys.includes(raw)) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const stage = computed(() => journeyStage(String(route.params.key ?? 'plan') as JourneyStage['key']))
const prev = computed(() => prevStage(stage.value.key))
const next = computed(() => nextStage(stage.value.key))
useSeoMeta({ title: () => `Step ${stage.value.no}: ${stage.value.title} | Kadiria` })

const { loggedIn } = useUserSession()
const { data: config } = await useBqConfig()
const flags = computed(() => config.value?.flags ?? {} as Record<string, boolean>)
const goBack = useGoBack('/')

/** The tool that helps with each stage; the public only gets the two calculators. */
const action = computed<{ label: string, to: string, icon: string } | null>(() => {
  const s = stage.value
  if (s.key === 'plan' && flags.value.cost_estimator !== false) return { label: 'Estimate my build', to: '/estimate', icon: 'i-lucide-calculator' }
  if (s.key === 'quantify' && flags.value.material_calculators !== false) return { label: 'Calculate materials', to: '/calculators', icon: 'i-lucide-boxes' }
  if (!loggedIn.value) return null
  if (s.key === 'prepare') return { label: 'Check your documents', to: '/prepare', icon: 'i-lucide-list-checks' }
  if (flags.value.bq_projects === false) return null
  if (s.key === 'bq') return { label: 'Start the BQ wizard', to: '/projects/new', icon: 'i-lucide-sparkles' }
  return { label: 'Open my BQ projects', to: '/projects', icon: 'i-lucide-folder-kanban' }
})
/** Signed-in users can also read the detailed pages for stages 4–6. */
const DETAILED: string[] = ['bq', 'review', 'build']
const details = computed(() => (loggedIn.value && DETAILED.includes(stage.value.key) ? stage.value.to : null))

/** "Architect, structural & MEP engineers, county planning office" → tags */
const people = (who: string) => who.split(/,\s*/).map(w => w.trim()).filter(Boolean)
  .map(w => (/^often with an? /i.test(w) ? `${w.replace(/^often with an? /i, '')} (optional)` : w))
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))

const link = (s: JourneyStage) => `/guide/${s.key}`

// ← and → move between stages
function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (e.altKey || e.ctrlKey || e.metaKey || t?.closest('input, textarea, select, [contenteditable]')) return
  const to = e.key === 'ArrowRight' ? next.value : e.key === 'ArrowLeft' ? prev.value : null
  if (to) navigateTo(`/guide/${to.key}`, { replace: true })
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <UContainer class="py-6 sm:py-10">
    <div class="flex items-center justify-between gap-3 no-print">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" label="Back" class="-ms-2.5" @click="goBack" />
      <p class="text-sm text-muted">
        Building guide · step {{ stage.no }} of {{ JOURNEY.length }}
      </p>
    </div>

    <div class="mt-4 grid lg:grid-cols-[16rem_minmax(0,1fr)] gap-8 items-start">
      <!-- All six steps (below the stage on small screens) -->
      <nav aria-label="The six building stages" class="order-last lg:order-first lg:sticky lg:top-20">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
          The six stages
        </p>
        <ol>
          <li v-for="(s, i) in JOURNEY" :key="s.key" class="relative">
            <span v-if="i < JOURNEY.length - 1" class="absolute left-[17px] top-10 bottom-0 w-0.5" :class="s.no < stage.no ? 'bg-primary/50' : 'bg-accented'" aria-hidden="true" />
            <NuxtLink
              :to="link(s)" replace
              :aria-current="s.key === stage.key ? 'step' : undefined"
              class="relative flex gap-3 rounded-lg p-1 pb-5 group"
            >
              <span
                class="size-9 shrink-0 rounded-full grid place-items-center font-bold text-sm transition"
                :class="s.key === stage.key ? 'bg-primary text-inverted' : s.no < stage.no ? 'bg-primary/15 text-primary' : 'bg-elevated text-muted group-hover:text-default'"
              >{{ s.no }}</span>
              <span class="min-w-0 pt-1">
                <span class="block font-medium transition" :class="s.key === stage.key ? 'text-highlighted' : 'text-muted group-hover:text-default'">{{ s.title }}</span>
                <span class="block text-xs text-dimmed">{{ s.time }}</span>
              </span>
            </NuxtLink>
          </li>
        </ol>
      </nav>

      <!-- The chosen stage -->
      <article :key="stage.key" class="stage-in min-w-0 rounded-2xl border border-default bg-default overflow-hidden">
        <div class="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div class="p-6 sm:p-8">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Step {{ stage.no }}
            </p>
            <h1 class="font-display text-3xl sm:text-4xl font-bold text-highlighted mt-1">
              {{ stage.title }}
            </h1>
            <p class="mt-4 text-muted">
              {{ stage.what }}
            </p>
            <div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span class="inline-flex items-center gap-1.5"><UIcon name="i-lucide-clock" class="text-primary" /> {{ stage.time }}</span>
              <span class="inline-flex items-center gap-1.5"><UIcon name="i-lucide-package-check" class="text-primary" /> {{ stage.output }}</span>
            </div>
          </div>
          <div class="bg-elevated/50 border-t md:border-t-0 md:border-l border-default p-4 sm:p-6 grid place-items-center text-default">
            <JourneyArt :stage="stage.key" class="max-w-md" />
          </div>
        </div>

        <div class="border-t border-default p-6 sm:p-8 grid md:grid-cols-2 gap-8">
          <section>
            <h2 class="text-[11px] font-semibold uppercase tracking-wider text-muted">
              What is done
            </h2>
            <ol class="mt-3 space-y-2.5">
              <li v-for="(t, i) in stage.steps" :key="t" class="flex gap-3 text-sm">
                <span class="size-6 shrink-0 rounded-full border border-primary/40 text-primary grid place-items-center text-xs font-semibold">{{ i + 1 }}</span>
                <span class="pt-0.5">{{ t }}</span>
              </li>
            </ol>
          </section>
          <section class="space-y-6">
            <div>
              <h2 class="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Who you need
              </h2>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <UBadge v-for="w in people(stage.who)" :key="w" color="primary" variant="subtle" size="lg" icon="i-lucide-user-round" :label="w" />
              </div>
            </div>
            <div class="rounded-xl bg-warning/10 border border-warning/25 p-4 flex gap-3">
              <UIcon name="i-lucide-lightbulb" class="size-5 shrink-0 text-warning mt-0.5" />
              <p class="text-sm">
                <span class="font-semibold">Tip:</span> {{ stage.tip }}
              </p>
            </div>
            <div v-if="action || details" class="flex flex-wrap gap-2">
              <UButton v-if="action" :to="action.to" :icon="action.icon" :label="action.label" size="lg" trailing-icon="i-lucide-arrow-right" />
              <UButton v-if="details" :to="details" color="neutral" variant="outline" size="lg" icon="i-lucide-book-open" label="More about this stage" />
            </div>
          </section>
        </div>

        <!-- Previous / next -->
        <div class="border-t border-default grid grid-cols-2 divide-x divide-default no-print">
          <NuxtLink v-if="prev" :to="link(prev)" replace class="group p-4 sm:px-8 hover:bg-elevated/50 transition">
            <span class="text-xs text-muted inline-flex items-center gap-1"><UIcon name="i-lucide-arrow-left" class="transition group-hover:-translate-x-0.5" /> Step {{ prev.no }}</span>
            <span class="block font-medium text-highlighted truncate">{{ prev.title }}</span>
          </NuxtLink>
          <span v-else />
          <NuxtLink v-if="next" :to="link(next)" replace class="group p-4 sm:px-8 text-right hover:bg-elevated/50 transition">
            <span class="text-xs text-muted inline-flex items-center gap-1">Step {{ next.no }} <UIcon name="i-lucide-arrow-right" class="transition group-hover:translate-x-0.5" /></span>
            <span class="block font-medium text-highlighted truncate">{{ next.title }}</span>
          </NuxtLink>
          <NuxtLink v-else :to="link(JOURNEY[0]!)" replace class="group p-4 sm:px-8 text-right hover:bg-elevated/50 transition">
            <span class="text-xs text-muted inline-flex items-center gap-1">Start again <UIcon name="i-lucide-rotate-ccw" /></span>
            <span class="block font-medium text-highlighted truncate">{{ JOURNEY[0]!.title }}</span>
          </NuxtLink>
        </div>
      </article>
    </div>
    <p class="mt-6 text-xs text-dimmed hidden lg:block no-print">
      Tip: use the ← and → keys to move between stages.
    </p>
  </UContainer>
</template>

<style scoped>
.stage-in {
  animation: stage-in 0.3s ease-out both;
}
@keyframes stage-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .stage-in {
    animation: none;
  }
}
</style>
