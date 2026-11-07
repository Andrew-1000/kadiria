<script setup lang="ts">
import { autoRate, estimate } from '#shared/calc/estimator'

const props = defineProps<{ embedded?: boolean }>()
const { data: config } = await useBqConfig()
const { call, toast } = useApi()

const countryCode = ref('KE')
const locationId = ref<number | null>(null)
const buildingTypeKey = ref('bungalow')
const finishKey = ref('standard')
const floors = ref(1)
const floorAreas = ref<number[]>([120])
const manualRate = ref<number | null>(null)
const addonKeys = ref<string[]>([])
const budget = ref<number | null>(null)
const showResults = ref(false)

watchEffect(() => {
  if (config.value && !addonKeys.value.length) addonKeys.value = config.value.addons.filter(a => a.enabledByDefault).map(a => a.key)
})

const country = computed(() => config.value?.countries.find(c => c.code === countryCode.value))
const currency = computed(() => country.value?.currency ?? 'KES')
const tiers = computed(() => (config.value?.tiers ?? []).filter(t => t.countryCode === countryCode.value))
const groups = computed(() => tiers.value.map(tier => ({ tier, locations: (config.value?.locations ?? []).filter(l => l.tierId === tier.id) })))
const location = computed(() => config.value?.locations.find(l => l.id === locationId.value))
const buildingType = computed(() => config.value?.buildingTypes.find(b => b.key === buildingTypeKey.value))
const finish = computed(() => config.value?.finishes.find(f => f.key === finishKey.value))
const tierDots = ['bg-amber-600', 'bg-green-600', 'bg-orange-700', 'bg-sky-600']

function band(tierId: number | undefined, fk: string) {
  return config.value?.rates.find(r => r.tierId === tierId && r.finishKey === fk)
}
const currentBand = computed(() => band(location.value?.tierId, finishKey.value))
const auto = computed(() => currentBand.value && location.value && buildingType.value
  ? autoRate(currentBand.value, location.value.adjustmentPercent, buildingType.value.factor)
  : null)
const rate = computed(() => manualRate.value && manualRate.value > 0 ? manualRate.value : auto.value)

// keep floors within the building type's limits and the area list in sync
watch(buildingType, (bt) => {
  if (!bt) return
  floors.value = Math.min(bt.maxFloors, Math.max(bt.minFloors, bt.defaultFloors))
}, { immediate: true })
watch(floors, (n) => {
  const count = Math.max(1, Math.min(100, Math.round(Number(n) || 1)))
  const last = floorAreas.value[floorAreas.value.length - 1] ?? 120
  floorAreas.value = Array.from({ length: count }, (_, i) => floorAreas.value[i] ?? last)
}, { immediate: true })
watch([locationId, finishKey, buildingTypeKey], () => { manualRate.value = null })

const result = computed(() => {
  if (!config.value || !currentBand.value || !rate.value || !finish.value || !buildingType.value || !location.value) return null
  return estimate({
    floorAreas: floorAreas.value.map(Number),
    ratePerM2: rate.value,
    band: currentBand.value,
    labourPercent: finish.value.labourPercent,
    buildingFactor: buildingType.value.factor,
    locationAdjustmentPercent: location.value.adjustmentPercent,
    addons: config.value.addons.filter(a => addonKeys.value.includes(a.key)),
    elements: config.value.elements,
    budget: budget.value
  })
})

const missing = computed(() => {
  if (!locationId.value) return 'Pick a location to load the rates.'
  if (!floorAreas.value.some(a => Number(a) > 0)) return 'Enter the floor area.'
  return null
})

function calculate() {
  if (missing.value) {
    toast.add({ title: missing.value, color: 'warning', icon: 'i-lucide-info' })
    return
  }
  showResults.value = true
  nextTick(() => document.getElementById('estimate-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function reset() {
  locationId.value = null
  buildingTypeKey.value = 'bungalow'
  finishKey.value = 'standard'
  floorAreas.value = [120]
  manualRate.value = null
  budget.value = null
  showResults.value = false
  addonKeys.value = config.value?.addons.filter(a => a.enabledByDefault).map(a => a.key) ?? []
}

function toggleAddon(key: string, on: boolean) {
  addonKeys.value = on ? [...new Set([...addonKeys.value, key])] : addonKeys.value.filter(k => k !== key)
}

// Lead capture
const leadOpen = ref(false)
const lead = reactive({ name: '', phone: '', email: '', message: '' })
const leadSending = ref(false)
async function sendLead() {
  leadSending.value = true
  try {
    await call('/api/public/estimate-request', {
      method: 'POST',
      body: {
        ...lead,
        estimate: { locationId: locationId.value, buildingTypeKey: buildingTypeKey.value, finishKey: finishKey.value, floorAreas: floorAreas.value, ratePerM2: manualRate.value, addonKeys: addonKeys.value, budget: budget.value }
      }
    })
    leadOpen.value = false
    toast.add({ title: 'Request sent. Our team will contact you shortly.', color: 'success', icon: 'i-lucide-check' })
  }
  finally { leadSending.value = false }
}

const bqLink = computed(() => ({
  path: '/projects/new',
  query: { location: locationId.value ?? undefined, type: buildingTypeKey.value, finish: finishKey.value, areas: floorAreas.value.join(',') }
}))
</script>

<template>
  <div v-if="config" class="max-w-3xl mx-auto">
    <div v-if="config.flags.cost_estimator === false" class="text-center py-16">
      <UIcon name="i-lucide-power-off" class="size-10 text-dimmed" />
      <p class="mt-3 text-muted">
        The cost calculator is currently unavailable.
      </p>
    </div>
    <template v-else>
      <div class="text-center mb-8">
        <div class="mx-auto mb-4 h-0.5 w-12 bg-primary/60" />
        <h1 class="font-display text-3xl sm:text-4xl font-bold text-highlighted">
          Construction Cost Calculator
        </h1>
        <p class="mt-3 text-muted max-w-xl mx-auto">
          Find out if your dream home is actually within your budget. Get an instant construction cost estimate before you commit to building.
        </p>
      </div>

      <UCard :ui="{ root: 'rounded-2xl', body: 'p-5 sm:p-8 space-y-8' }">
        <!-- Location & property type -->
        <section class="space-y-5">
          <div class="flex items-center gap-3 pb-3 border-b border-primary/30">
            <span class="size-8 rounded-lg bg-elevated grid place-items-center"><UIcon name="i-lucide-map-pin" class="text-error" /></span>
            <h2 class="font-display font-semibold text-lg">
              Location &amp; Property Type
            </h2>
          </div>

          <UFormField label="Country" :ui="{ label: 'uppercase tracking-wider text-xs font-semibold' }">
            <USelect v-model="countryCode" :items="config.countries.map(c => ({ label: c.name, value: c.code }))" class="w-full" size="lg" />
          </UFormField>

          <div v-for="(g, gi) in groups" :key="g.tier.id" class="space-y-2">
            <p class="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              <span class="size-2 rounded-sm" :class="tierDots[gi % tierDots.length]" /> {{ g.tier.label }}
            </p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="loc in g.locations"
                :key="loc.id"
                :label="loc.name"
                :variant="locationId === loc.id ? 'solid' : 'outline'"
                :color="locationId === loc.id ? 'primary' : 'neutral'"
                class="rounded-full"
                @click="locationId = loc.id"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="bt in config.buildingTypes"
              :key="bt.key"
              type="button"
              class="relative text-left rounded-xl border p-4 transition hover:border-primary/60"
              :class="buildingTypeKey === bt.key ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : 'border-default'"
              @click="buildingTypeKey = bt.key"
            >
              <UIcon v-if="buildingTypeKey === bt.key" name="i-lucide-circle-check" class="absolute top-3 right-3 text-primary" />
              <BuildingIcon :type="bt.key" class="h-10 text-primary/80 mb-3" />
              <p class="font-display font-semibold text-highlighted">
                {{ bt.label }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ bt.description }}
              </p>
            </button>
          </div>

          <UFormField
            v-if="buildingType && buildingType.maxFloors > 1"
            label="Number of floors"
            :help="`Ground + upper floors (e.g. G+3 = 4 floors). ${buildingType.label}: ${buildingType.minFloors}–${buildingType.maxFloors}.`"
            :ui="{ label: 'uppercase tracking-wider text-xs font-semibold' }"
          >
            <UInput v-model.number="floors" type="number" :min="buildingType.minFloors" :max="buildingType.maxFloors" class="w-full" size="lg" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField
              v-for="(_, i) in floorAreas"
              :key="i"
              :label="floorAreas.length === 1 ? 'Floor area (m²)' : `Floor ${i + 1} area (m²)`"
              :ui="{ label: 'uppercase tracking-wider text-xs font-semibold' }"
            >
              <UInput v-model.number="floorAreas[i]" type="number" min="0" step="1" class="w-full" size="lg" />
            </UFormField>
          </div>
        </section>

        <!-- Cost parameters -->
        <section class="space-y-5">
          <div class="flex items-center gap-3 pb-3 border-b border-primary/30">
            <span class="size-8 rounded-lg bg-elevated grid place-items-center"><UIcon name="i-lucide-coins" class="text-primary" /></span>
            <h2 class="font-display font-semibold text-lg">
              Cost Parameters
            </h2>
          </div>

          <div class="rounded-xl border border-default bg-elevated/40 p-4 overflow-x-auto">
            <p class="text-xs font-bold tracking-wider uppercase text-success mb-3">
              <UIcon name="i-lucide-chart-column" class="align-[-2px]" /> {{ new Date().getFullYear() }} {{ country?.name }} market rates (per m²)
            </p>
            <table class="w-full text-sm min-w-[520px]">
              <thead>
                <tr class="text-left text-muted border-b border-default">
                  <th class="py-2 font-medium">
                    Finish level
                  </th>
                  <th v-for="tier in tiers" :key="tier.id" class="py-2 font-medium">
                    {{ tier.label.replace(/ rates$/i, '') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in config.finishes" :key="f.key" class="border-b border-default last:border-0">
                  <td class="py-2">
                    <b class="text-highlighted">{{ f.label }}</b> <span class="text-muted">({{ f.description.toLowerCase() }})</span>
                  </td>
                  <td v-for="tier in tiers" :key="tier.id" class="py-2 tabular-nums" :class="location?.tierId === tier.id && finishKey === f.key ? 'text-primary font-semibold' : ''">
                    <template v-if="band(tier.id, f.key)">
                      {{ currency }} {{ formatNumber(band(tier.id, f.key)!.minRate, 0) }}–{{ formatNumber(band(tier.id, f.key)!.maxRate, 0) }}
                    </template>
                    <span v-else class="text-dimmed">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p class="uppercase tracking-wider text-xs font-semibold mb-2">
              Construction quality
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                v-for="(f, fi) in config.finishes"
                :key="f.key"
                type="button"
                class="relative text-left rounded-xl border p-4 transition hover:border-primary/60"
                :class="finishKey === f.key ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : 'border-default'"
                @click="finishKey = f.key"
              >
                <div class="h-1.5 rounded-full mb-3" :class="['bg-green-600', 'bg-amber-700', 'bg-amber-500'][fi % 3]" />
                <UIcon v-if="finishKey === f.key" name="i-lucide-circle-check" class="absolute top-5 right-3 text-primary" />
                <p class="font-display font-semibold text-highlighted">
                  {{ f.label }}
                </p>
                <p class="mt-2 inline-block rounded-md bg-elevated px-2 py-1 text-xs font-semibold tabular-nums">
                  <template v-if="band(location?.tierId, f.key)">
                    {{ currency }} {{ formatNumber(band(location?.tierId, f.key)!.minRate, 0) }}–{{ formatNumber(band(location?.tierId, f.key)!.maxRate, 0) }}
                  </template>
                  <template v-else>
                    —
                  </template>
                </p>
                <p class="mt-2 text-xs text-muted">
                  +{{ f.labourPercent }}% labour on materials
                </p>
              </button>
            </div>
            <p class="mt-2 text-xs text-muted">
              {{ location ? `Per m² rates for ${location.name}.` : 'Pick a location above to see per m² rates for each finish.' }}
            </p>
          </div>

          <div class="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <p class="uppercase tracking-wider text-xs font-semibold text-muted">
                Auto-selected cost / m²
              </p>
              <p class="font-display text-2xl font-bold text-highlighted tabular-nums">
                {{ auto ? formatMoney(auto, currency) : '—' }}
              </p>
            </div>
            <UFormField label="Your cost per m²" :help="`Auto-set to the midpoint of your location + finish${buildingType && buildingType.factor !== 1 ? `, × ${buildingType.factor} for ${buildingType.label.toLowerCase()}` : ''}${location?.adjustmentPercent ? `, ${location.adjustmentPercent > 0 ? '+' : ''}${location.adjustmentPercent}% for ${location.name}` : ''}. Edit to use your own rate.`">
              <UInput v-model.number="manualRate" type="number" min="0" step="500" :placeholder="auto ? String(auto) : 'Pick a location first'" class="w-full" size="lg" />
            </UFormField>
          </div>

          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-hard-hat"
            :title="`Labour (auto-added): ${config.finishes.map(f => `${f.label} → ${f.labourPercent}%`).join(', ')} of base material cost.`"
            description="These reflect typical Kenyan fundi and skilled labour rates for the year."
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <p class="uppercase tracking-wider text-xs font-semibold">
                Include
              </p>
              <USwitch
                v-for="a in config.addons"
                :key="a.key"
                :model-value="addonKeys.includes(a.key)"
                :label="`${a.label} (${a.percent}%)`"
                :description="a.description"
                @update:model-value="(v: boolean) => toggleAddon(a.key, v)"
              />
            </div>
            <UFormField label="Your budget (optional)" help="We'll tell you whether the estimate fits and how much floor area your budget buys.">
              <UInput v-model.number="budget" type="number" min="0" step="100000" :placeholder="`e.g. 8000000`" class="w-full" size="lg">
                <template #leading>
                  <span class="text-xs text-muted">{{ currency }}</span>
                </template>
              </UInput>
            </UFormField>
          </div>

          <div class="space-y-3 pt-2">
            <UButton block size="xl" label="Calculate Estimate" trailing-icon="i-lucide-arrow-right" @click="calculate" />
            <UButton block size="lg" color="neutral" variant="outline" icon="i-lucide-rotate-ccw" label="Reset Form" @click="reset" />
          </div>
        </section>
      </UCard>

      <!-- Results -->
      <div v-if="showResults && result" id="estimate-results" class="mt-8 scroll-mt-20">
        <UCard :ui="{ root: 'rounded-2xl', body: 'p-5 sm:p-8 space-y-6' }">
          <div class="text-center">
            <p class="text-xs uppercase tracking-[0.16em] text-muted">
              Estimated total cost
            </p>
            <p class="font-display text-4xl sm:text-5xl font-bold text-primary mt-2 tabular-nums">
              {{ formatMoney(result.total, currency) }}
            </p>
            <p class="mt-2 text-sm text-muted">
              Range {{ formatMoney(result.range.low, currency) }} – {{ formatMoney(result.range.high, currency) }}
              · {{ formatNumber(result.totalArea, 1) }} m² · {{ formatMoney(result.costPerM2AllIn, currency) }}/m² all-in
            </p>
          </div>

          <UAlert
            v-if="result.budget"
            :color="result.budget.withinBudget ? 'success' : 'error'"
            variant="subtle"
            :icon="result.budget.withinBudget ? 'i-lucide-badge-check' : 'i-lucide-triangle-alert'"
            :title="result.budget.withinBudget ? `Within budget, with ${formatMoney(result.budget.difference, currency)} to spare` : `Over budget by ${formatMoney(-result.budget.difference, currency)}`"
            :description="`At this specification your budget of ${formatMoney(result.budget.budget, currency)} builds about ${formatNumber(result.budget.affordableArea, 0)} m².`"
          />

          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 class="font-semibold mb-2">
                Cost build-up
              </h3>
              <dl class="text-sm divide-y divide-default">
                <div class="flex justify-between py-2">
                  <dt class="text-muted">
                    Materials ({{ formatNumber(result.totalArea, 1) }} m² × {{ formatMoney(result.ratePerM2, currency) }})
                  </dt><dd class="tabular-nums">
                    {{ formatMoney(result.materials, currency) }}
                  </dd>
                </div>
                <div class="flex justify-between py-2">
                  <dt class="text-muted">
                    Labour ({{ finish?.labourPercent }}%)
                  </dt><dd class="tabular-nums">
                    {{ formatMoney(result.labour, currency) }}
                  </dd>
                </div>
                <div class="flex justify-between py-2 font-semibold">
                  <dt>Construction cost</dt><dd class="tabular-nums">
                    {{ formatMoney(result.construction, currency) }}
                  </dd>
                </div>
                <div v-for="a in result.addons" :key="a.key" class="flex justify-between py-2">
                  <dt class="text-muted">
                    {{ a.label }} ({{ a.percent }}%)
                  </dt><dd class="tabular-nums">
                    {{ formatMoney(a.amount, currency) }}
                  </dd>
                </div>
                <div class="flex justify-between py-2 font-bold text-highlighted">
                  <dt>Total</dt><dd class="tabular-nums">
                    {{ formatMoney(result.total, currency) }}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 class="font-semibold mb-2">
                Where the money goes
              </h3>
              <ul class="space-y-2.5">
                <li v-for="e in result.elements" :key="e.key" class="text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted">{{ e.label }}</span>
                    <span class="tabular-nums">{{ formatMoney(e.amount, currency) }}</span>
                  </div>
                  <div class="mt-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div class="h-full bg-primary rounded-full" :style="{ width: `${e.percent}%` }" />
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <p class="text-xs text-dimmed">
            This is an order-of-cost estimate based on average {{ new Date().getFullYear() }} rates. A Bill of Quantities measured from drawings gives a tender-ready price.
          </p>

          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              v-if="config.flags.estimate_requests !== false"
              class="flex-1 justify-center"
              size="lg"
              icon="i-lucide-send"
              label="Request a detailed BQ"
              @click="leadOpen = true"
            />
            <UButton
              v-if="config.flags.bq_projects !== false && !props.embedded"
              class="flex-1 justify-center"
              size="lg"
              color="neutral"
              variant="outline"
              icon="i-lucide-file-spreadsheet"
              label="Draft a full BQ yourself"
              :to="bqLink"
            />
          </div>
        </UCard>
      </div>

      <UModal v-model:open="leadOpen" title="Request a detailed Bill of Quantities" description="Our quantity surveyors will review your estimate and get in touch.">
        <template #body>
          <form id="lead-form" class="space-y-4" @submit.prevent="sendLead">
            <UFormField label="Your name" required>
              <UInput v-model="lead.name" class="w-full" autocomplete="name" />
            </UFormField>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Phone (M-Pesa / WhatsApp)">
                <UInput v-model="lead.phone" class="w-full" autocomplete="tel" placeholder="07xx xxx xxx" />
              </UFormField>
              <UFormField label="Email">
                <UInput v-model="lead.email" type="email" class="w-full" autocomplete="email" />
              </UFormField>
            </div>
            <UFormField label="Anything else? (plot, drawings, timeline)">
              <UTextarea v-model="lead.message" class="w-full" :rows="3" />
            </UFormField>
          </form>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="leadOpen = false" />
            <UButton type="submit" form="lead-form" :loading="leadSending" label="Send request" icon="i-lucide-send" />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
