<script setup lang="ts">
import { PREREQUISITES } from '#shared/calc/bq'

const { data: config } = await useBqConfig()
const { loggedIn } = useUserSession()
useSeoMeta({ title: 'Davecore BQ: construction cost, materials & Bills of Quantities' })

const steps = [
  { icon: 'i-lucide-calculator', title: '1. Ballpark the cost', text: 'Pick your town, house type, floor area and finish. The cost calculator uses current cost-per-m² bands to tell you whether your plan fits your budget.' },
  { icon: 'i-lucide-boxes', title: '2. Quantify materials', text: 'Element calculators (blinding, footings, columns, slabs, walling, plaster...) give cement bags, sand, ballast, steel and stones, priced for your location.' },
  { icon: 'i-lucide-file-spreadsheet', title: '3. Draft the BQ', text: 'The BQ wizard checks what documents you have, then drafts the standard bills, from Preliminaries to Provisional Sums, ready for a professional to refine, approve and issue.' }
]

const bills = [
  ['1', 'Preliminaries & General Items'], ['2', 'Substructure'], ['3', 'Superstructure'], ['4', 'Roofing'], ['5', 'Doors & Windows'],
  ['6', 'Finishes'], ['7', 'Services'], ['8', 'External Works'], ['9', 'Provisional & Prime Cost Sums'], ['Σ', 'Grand Summary: contingency + 16% VAT']
]
</script>

<template>
  <div>
    <UPageHero
      title="Know what your building will cost before the first stone is laid"
      description="Instant cost estimates for homeowners. Material quantities for fundis. Professional Bills of Quantities for quantity surveyors, contractors and developers. All on rates maintained by Davecore's team."
      :links="[
        ...(config?.flags.cost_estimator !== false ? [{ label: 'Estimate my build', to: '/estimate', icon: 'i-lucide-calculator', size: 'xl' as const }] : []),
        ...(config?.flags.bq_projects !== false ? [{ label: loggedIn ? 'Open my BQ projects' : 'Draft a professional BQ', to: loggedIn ? '/projects' : '/login?redirect=/projects/new', color: 'neutral' as const, variant: 'outline' as const, size: 'xl' as const, trailingIcon: 'i-lucide-arrow-right' }] : [])
      ]"
      :ui="{ title: 'font-display', container: 'py-16 sm:py-24' }"
    />

    <UPageSection title="Three steps from idea to Bill of Quantities" :ui="{ title: 'font-display', container: 'py-10 sm:py-14' }">
      <div class="grid md:grid-cols-3 gap-4">
        <UPageCard v-for="s in steps" :key="s.title" :icon="s.icon" :title="s.title" :description="s.text" spotlight />
      </div>
    </UPageSection>

    <UPageSection id="prerequisites" title="What you need for a successful BQ" description="A Bill of Quantities is only as good as the information it is measured from. Here is what a quantity surveyor asks for, and what this system does when something is missing." :ui="{ title: 'font-display', container: 'py-10 sm:py-14' }">
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
