<script setup lang="ts">
import { PREREQUISITES } from '#shared/calc/bq'

const { data: config } = await useBqConfig()
const { loggedIn } = useUserSession()
useSeoMeta({ title: 'Kadiria: construction cost, materials & Bills of Quantities' })

const bills = [
  ['1', 'Preliminaries & General Items'], ['2', 'Substructure'], ['3', 'Superstructure'], ['4', 'Roofing'], ['5', 'Doors & Windows'],
  ['6', 'Finishes'], ['7', 'Services'], ['8', 'External Works'], ['9', 'Provisional & Prime Cost Sums'], ['Σ', 'Grand Summary: contingency + 16% VAT']
]
</script>

<template>
  <div>
    <UPageHero
      title="Know what your building will cost before the first stone is laid"
      description="Instant cost estimates for homeowners. Material quantities for fundis. Professional Bills of Quantities for quantity surveyors, contractors and developers. All on current Kenyan rates, kept up to date by our team."
      :links="[
        ...(config?.flags.cost_estimator !== false ? [{ label: 'Estimate my build', to: '/estimate', icon: 'i-lucide-calculator', size: 'xl' as const }] : []),
        ...(config?.flags.bq_projects !== false ? [{ label: loggedIn ? 'Open my BQ projects' : 'Draft a professional BQ', to: loggedIn ? '/projects' : '/login?redirect=/projects/new', color: 'neutral' as const, variant: 'outline' as const, size: 'xl' as const, trailingIcon: 'i-lucide-arrow-right' }] : [])
      ]"
      :ui="{ title: 'font-display', container: 'py-16 sm:py-24' }"
    />

    <UPageSection
      id="journey"
      title="From idea to building: the construction journey"
      description="Every tool here belongs to a stage of a real building project. Start where you are; each stage tells you what it is, who is involved and what comes next."
      :ui="{ title: 'font-display', container: 'py-10 sm:py-14' }"
    >
      <ol class="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <li v-for="s in JOURNEY" :key="s.key">
          <NuxtLink :to="s.to" class="group flex h-full flex-col rounded-xl border border-default p-5 transition hover:border-primary/60 hover:bg-elevated/40">
            <div class="flex items-center gap-3">
              <span class="size-9 rounded-full bg-primary text-inverted grid place-items-center font-bold">{{ s.no }}</span>
              <div>
                <p class="font-display font-semibold text-highlighted">
                  {{ s.title }}
                </p>
                <p class="text-xs text-muted">
                  <UIcon :name="s.icon" class="align-[-2px]" /> {{ s.tool }}
                </p>
              </div>
            </div>
            <p class="mt-3 text-sm text-muted flex-1">
              {{ s.what }}
            </p>
            <p class="mt-3 text-xs text-dimmed">
              <b>Who:</b> {{ s.who }}<br><b>You get:</b> {{ s.output }}
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open {{ s.tool.toLowerCase() }} <UIcon name="i-lucide-arrow-right" class="transition group-hover:translate-x-1" />
            </span>
          </NuxtLink>
        </li>
      </ol>
    </UPageSection>

    <UPageSection id="prerequisites" title="Stage 2 · What you need for a successful BQ" description="A Bill of Quantities is only as good as the documents it is measured from. These are what a quantity surveyor asks for, and what this system does when something is missing." :ui="{ title: 'font-display', container: 'py-10 sm:py-14' }">
      <div class="grid lg:grid-cols-2 gap-4">
        <div v-for="p in PREREQUISITES" :key="p.key" class="rounded-xl border border-default p-5">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-check-2" class="text-primary size-5" />
            <h3 class="font-semibold text-highlighted">
              {{ p.label }}
            </h3>
            <UBadge v-if="p.essential" label="Essential" color="primary" variant="subtle" size="sm" />
          </div>
          <p class="mt-2 text-sm text-muted">
            {{ p.why }}
          </p>
          <p class="mt-2 text-sm">
            <span class="text-warning font-medium">If missing:</span> {{ p.ifMissing }}
          </p>
        </div>
      </div>
      <div class="mt-6">
        <UButton to="/prepare" icon="i-lucide-list-checks" trailing-icon="i-lucide-arrow-right" label="Check which documents you have" />
      </div>
    </UPageSection>

    <UPageSection title="The standard Kenyan BQ layout" description="Drafts follow the bill structure used in Kenyan tender documents. Each item is described, measured (unit × quantity) and priced (rate → amount)." :ui="{ title: 'font-display', container: 'py-10 sm:py-14' }">
      <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div v-for="[n, t] in bills" :key="t" class="rounded-lg border border-default px-4 py-3 flex gap-3 items-center">
          <span class="size-7 rounded-md bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">{{ n }}</span>
          <span class="text-sm">{{ t }}</span>
        </div>
      </div>
    </UPageSection>
  </div>
</template>
