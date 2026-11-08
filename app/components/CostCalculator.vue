<script setup lang="ts">
import { autoRate, estimate } from '#shared/calc/estimator'

/*
 * Davecore Cost Plan: laid out like an architect's drawing sheet. The building is drawn as an
 * elevation that grows with the floors you add; costs are annotated on the drawing and the
 * totals sit in a title block. Data and calculations are the standard estimator.
 */
const props = defineProps<{ embedded?: boolean }>()
const { data: config } = await useBqConfig()
const { call, toast } = useApi()

// Optional pre-fill from the URL, e.g. from a house plan on the company website:
// ?type=maisonette&areas=110,110&finish=standard&location=<id>
const query = useRoute().query
const q = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined
const qAreas = String(q(query.areas) ?? '').split(',').map(Number).filter(n => n > 0 && n < 100000)

const countryCode = ref('KE')
const locationId = ref<number | null>(config.value?.locations.some(l => l.id === Number(q(query.location))) ? Number(q(query.location)) : null)
const buildingTypeKey = ref(config.value?.buildingTypes.some(b => b.key === q(query.type)) ? q(query.type)! : 'bungalow')
const finishKey = ref(config.value?.finishes.some(f => f.key === q(query.finish)) ? q(query.finish)! : 'standard')
const floorAreas = ref<number[]>(qAreas.length ? qAreas : [120])
const useQuotedRate = ref(false)
const manualRate = ref<number | null>(null)
const addonKeys = ref<string[]>([])
const budget = ref<number | null>(null)
const selectedFloor = ref(0)

watchEffect(() => {
  if (config.value && !addonKeys.value.length) addonKeys.value = config.value.addons.filter(a => a.enabledByDefault).map(a => a.key)
})

const country = computed(() => config.value?.countries.find(c => c.code === countryCode.value))
const currency = computed(() => country.value?.currency ?? 'KES')
const tiers = computed(() => (config.value?.tiers ?? []).filter(t => t.countryCode === countryCode.value))
const location = computed(() => config.value?.locations.find(l => l.id === locationId.value))
const buildingType = computed(() => config.value?.buildingTypes.find(b => b.key === buildingTypeKey.value))
const finish = computed(() => config.value?.finishes.find(f => f.key === finishKey.value))

// Location picker: one tab per rate band, towns listed underneath
const activeTierId = ref<number | null>(null)
watchEffect(() => {
  if (activeTierId.value === null && tiers.value.length) activeTierId.value = tiers.value[0]!.id
})
const tierTowns = computed(() => (config.value?.locations ?? []).filter(l => l.tierId === activeTierId.value))
function pickTown(id: number) {
  locationId.value = id
}

function band(tierId: number | undefined, fk: string) {
  return config.value?.rates.find(r => r.tierId === tierId && r.finishKey === fk)
}
const currentBand = computed(() => band(location.value?.tierId, finishKey.value))
const midpoint = computed(() => currentBand.value ? (currentBand.value.minRate + currentBand.value.maxRate) / 2 : null)
const auto = computed(() => currentBand.value && location.value && buildingType.value
  ? autoRate(currentBand.value, location.value.adjustmentPercent, buildingType.value.factor)
  : null)
const rate = computed(() => useQuotedRate.value && manualRate.value && manualRate.value > 0 ? manualRate.value : auto.value)
watch([locationId, finishKey, buildingTypeKey], () => { manualRate.value = null; useQuotedRate.value = false })

// Floors follow the building type's limits
watch(buildingType, (bt, previous) => {
  if (!bt) return
  // Keep floor areas passed in the URL on first load when they fit the building type
  if (!previous && qAreas.length >= bt.minFloors && qAreas.length <= bt.maxFloors) return
  const n = Math.min(bt.maxFloors, Math.max(bt.minFloors, bt.defaultFloors))
  const last = floorAreas.value[floorAreas.value.length - 1] ?? 120
  floorAreas.value = Array.from({ length: n }, (_, i) => floorAreas.value[i] ?? last)
  selectedFloor.value = 0
}, { immediate: true })
const canAddFloor = computed(() => !!buildingType.value && floorAreas.value.length < buildingType.value.maxFloors)
const canRemoveFloor = computed(() => !!buildingType.value && floorAreas.value.length > buildingType.value.minFloors)
function addFloor() {
  if (!canAddFloor.value) return
  floorAreas.value = [...floorAreas.value, floorAreas.value[floorAreas.value.length - 1] ?? 100]
  selectedFloor.value = floorAreas.value.length - 1
}
function removeFloor() {
  if (!canRemoveFloor.value) return
  floorAreas.value = floorAreas.value.slice(0, -1)
  selectedFloor.value = Math.min(selectedFloor.value, floorAreas.value.length - 1)
}
const floorCode = (i: number) => (i === 0 ? 'GF' : `F${i}`)
const floorName = (i: number) => (i === 0 ? 'Ground floor' : `Floor ${i}`)

const result = computed(() => {
  if (!config.value || !currentBand.value || !rate.value || !finish.value || !buildingType.value || !location.value) return null
  if (!floorAreas.value.some(a => Number(a) > 0)) return null
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
const totalArea = computed(() => floorAreas.value.reduce((s, a) => s + (Number(a) > 0 ? Number(a) : 0), 0))
const element = (key: string) => result.value?.elements.find(e => e.key === key)
const floorCost = (i: number) => result.value && totalArea.value > 0 ? result.value.construction * (Number(floorAreas.value[i]) || 0) / totalArea.value : 0
// Elements not drawn on the elevation are listed in the drawing's schedule
const scheduleElements = computed(() => (result.value?.elements ?? []).filter(e => !['substructure', 'roofing', 'frame_walling'].includes(e.key)))

/* ---------------- Elevation drawing geometry ---------------- */
const W = 640
const drawing = computed(() => {
  const n = floorAreas.value.length
  const floorH = Math.max(14, Math.min(46, 250 / n))
  const maxArea = Math.max(...floorAreas.value.map(a => Number(a) || 0), 1)
  const flat = buildingTypeKey.value === 'apartment'
  const roofH = flat ? 14 : 46
  const top = 34
  const groundY = top + roofH + n * floorH
  const width = (a: number) => Math.max(150, Math.min(380, 150 + (Number(a) || 0) / maxArea * 230))
  const floorsGeo = floorAreas.value.map((a, i) => {
    const w = width(a)
    const y = groundY - (i + 1) * floorH
    return { i, x: (W - w) / 2, y, w, h: floorH }
  })
  const topFloor = floorsGeo[n - 1]!
  const ground = floorsGeo[0]!
  const roof = flat
    ? `M ${topFloor.x - 6} ${topFloor.y} L ${topFloor.x - 6} ${topFloor.y - roofH} L ${topFloor.x + topFloor.w + 6} ${topFloor.y - roofH} L ${topFloor.x + topFloor.w + 6} ${topFloor.y}`
    : `M ${topFloor.x - 22} ${topFloor.y} L ${W / 2} ${topFloor.y - roofH} L ${topFloor.x + topFloor.w + 22} ${topFloor.y} Z`
  return { n, floorH, groundY, floorsGeo, roof, roofTop: topFloor.y - roofH, ground, height: groundY + 52, flat }
})

const budgetPct = computed(() => result.value?.budget ? result.value.total / result.value.budget.budget * 100 : 0)
// Semicircle gauge: needle angle from -90° (0%) to +90° (≥150% of budget)
const needle = computed(() => {
  const a = (Math.min(150, budgetPct.value) / 150) * Math.PI - Math.PI / 2
  return { x: 60 + Math.sin(a) * 44, y: 58 - Math.cos(a) * 44 }
})

function toggleAddon(key: string) {
  addonKeys.value = addonKeys.value.includes(key) ? addonKeys.value.filter(k => k !== key) : [...addonKeys.value, key]
}

function reset() {
  locationId.value = null
  buildingTypeKey.value = 'bungalow'
  finishKey.value = 'standard'
  floorAreas.value = [120]
  manualRate.value = null
  useQuotedRate.value = false
  budget.value = null
  selectedFloor.value = 0
  addonKeys.value = config.value?.addons.filter(a => a.enabledByDefault).map(a => a.key) ?? []
}

const sheetDate = new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })

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
        estimate: { locationId: locationId.value, buildingTypeKey: buildingTypeKey.value, finishKey: finishKey.value, floorAreas: floorAreas.value, ratePerM2: useQuotedRate.value ? manualRate.value : null, addonKeys: addonKeys.value, budget: budget.value }
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
  <div v-if="config">
    <div v-if="config.flags.cost_estimator === false" class="text-center py-16">
      <UIcon name="i-lucide-power-off" class="size-10 text-dimmed" />
      <p class="mt-3 text-muted">
        The cost calculator is currently unavailable.
      </p>
    </div>

    <!-- Drawing sheet frame -->
    <div v-else class="rounded-sm border-2 border-accented p-1.5">
      <div class="border border-default">
        <!-- Sheet header -->
        <header class="flex flex-wrap items-stretch border-b border-default">
          <div class="flex-1 min-w-[16rem] px-5 py-4">
            <p class="text-[10px] uppercase tracking-[0.25em] text-muted">
              Davecore · Cost plan
            </p>
            <h1 class="font-display text-2xl sm:text-3xl font-bold text-highlighted mt-1">
              What will your building cost?
            </h1>
            <p class="text-sm text-muted mt-1">
              Draw your building floor by floor, choose where and how well it is finished, and read the cost straight off the plan.
            </p>
          </div>
          <dl class="grid grid-cols-2 border-s border-default text-xs min-w-[14rem]">
            <div class="px-3 py-2 border-b border-e border-default">
              <dt class="text-[9px] uppercase tracking-widest text-dimmed">
                Sheet
              </dt><dd class="font-mono">
                CP-01
              </dd>
            </div>
            <div class="px-3 py-2 border-b border-default">
              <dt class="text-[9px] uppercase tracking-widest text-dimmed">
                Date
              </dt><dd class="font-mono">
                {{ sheetDate }}
              </dd>
            </div>
            <div class="px-3 py-2 border-e border-default">
              <dt class="text-[9px] uppercase tracking-widest text-dimmed">
                Rates
              </dt><dd class="font-mono">
                {{ new Date().getFullYear() }} · {{ currency }}
              </dd>
            </div>
            <div class="px-3 py-2 flex items-center">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" label="Clear sheet" @click="reset" />
            </div>
          </dl>
        </header>

        <div class="grid xl:grid-cols-[minmax(0,1fr)_22rem]">
          <!-- LEFT: drawing + specification -->
          <div class="xl:border-e border-default">
            <!-- 1. Site -->
            <section class="border-b border-default">
              <div class="flex items-center justify-between gap-3 px-5 pt-4">
                <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <span class="text-primary font-mono">A</span> · Site location
                </h2>
                <USelect v-if="config.countries.length > 1" v-model="countryCode" size="xs" :items="config.countries.map(c => ({ label: c.name, value: c.code }))" class="w-32" />
                <span v-else class="text-xs text-muted">{{ country?.name }}</span>
              </div>
              <div class="px-5 pt-3 flex gap-1 overflow-x-auto" role="tablist">
                <button
                  v-for="t in tiers"
                  :key="t.id"
                  type="button"
                  role="tab"
                  :aria-selected="activeTierId === t.id"
                  class="px-3 py-1.5 text-xs font-medium rounded-t-md border border-b-0 transition whitespace-nowrap"
                  :class="activeTierId === t.id ? 'border-default bg-elevated text-highlighted' : 'border-transparent text-muted hover:text-default'"
                  @click="activeTierId = t.id"
                >
                  {{ t.label.replace(/ rates$/i, '') }}
                  <UIcon v-if="location?.tierId === t.id" name="i-lucide-map-pin" class="size-3 text-primary align-[-1px]" />
                </button>
              </div>
              <div class="mx-5 mb-4 rounded-b-md rounded-tr-md border border-default bg-elevated p-2 grid grid-cols-2 sm:grid-cols-3 gap-1" role="radiogroup" aria-label="Town">
                <button
                  v-for="town in tierTowns"
                  :key="town.id"
                  type="button"
                  role="radio"
                  :aria-checked="locationId === town.id"
                  class="flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-sm text-left transition"
                  :class="locationId === town.id ? 'bg-primary text-inverted' : 'hover:bg-default'"
                  @click="pickTown(town.id)"
                >
                  <span class="truncate">{{ town.name }}</span>
                  <span v-if="town.adjustmentPercent" class="font-mono text-[10px] opacity-75">{{ town.adjustmentPercent > 0 ? '+' : '' }}{{ town.adjustmentPercent }}%</span>
                </button>
              </div>
            </section>

            <!-- 2. Elevation drawing -->
            <section class="border-b border-default">
              <div class="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
                <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <span class="text-primary font-mono">B</span> · Elevation
                </h2>
                <div class="flex rounded-md border border-default overflow-hidden" role="radiogroup" aria-label="Building type">
                  <button
                    v-for="bt in config.buildingTypes"
                    :key="bt.key"
                    type="button"
                    role="radio"
                    :aria-checked="buildingTypeKey === bt.key"
                    :title="bt.description"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs border-e border-default last:border-e-0 transition"
                    :class="buildingTypeKey === bt.key ? 'bg-primary text-inverted' : 'text-muted hover:text-default'"
                    @click="buildingTypeKey = bt.key"
                  >
                    <BuildingIcon :type="bt.key" class="h-3.5 w-7" />
                    {{ bt.label }}
                  </button>
                </div>
              </div>

              <div class="px-2 sm:px-5 pt-2">
                <svg :viewBox="`0 0 ${W} ${drawing.height}`" class="w-full max-h-[26rem]" role="img" :aria-label="`Elevation of a ${drawing.n}-floor ${buildingType?.label ?? 'building'}`">
                  <defs>
                    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="6" class="stroke-(--ui-border-accented)" stroke-width="1" />
                    </pattern>
                  </defs>
                  <!-- foundations (below ground) -->
                  <rect :x="drawing.ground.x - 10" :y="drawing.groundY" :width="drawing.ground.w + 20" height="22" fill="url(#hatch)" class="stroke-(--ui-border-accented)" stroke-dasharray="4 3" />
                  <!-- ground line -->
                  <line x1="20" :y1="drawing.groundY" :x2="W - 20" :y2="drawing.groundY" class="stroke-(--ui-text-muted)" stroke-width="2" />
                  <text x="24" :y="drawing.groundY - 6" class="fill-(--ui-text-dimmed)" font-size="10" font-family="ui-monospace, monospace">GL ±0.00</text>
                  <!-- roof -->
                  <path :d="drawing.roof" class="fill-primary/10 stroke-primary" stroke-width="2" stroke-linejoin="round" />
                  <!-- floors -->
                  <g v-for="f in drawing.floorsGeo" :key="f.i" class="cursor-pointer" @click="selectedFloor = f.i">
                    <rect :x="f.x" :y="f.y" :width="f.w" :height="f.h" :class="selectedFloor === f.i ? 'fill-primary/25 stroke-primary' : 'fill-primary/5 stroke-(--ui-text-muted)'" stroke-width="1.5" />
                    <text v-if="f.h >= 18" :x="W / 2" :y="f.y + f.h / 2 + 4" text-anchor="middle" class="fill-(--ui-text-highlighted)" font-size="12" font-family="ui-monospace, monospace">
                      {{ floorCode(f.i) }} · {{ formatNumber(Number(floorAreas[f.i]) || 0, 0) }} m²
                    </text>
                    <!-- cost callout on the right -->
                    <template v-if="result && f.h >= 18">
                      <line :x1="f.x + f.w" :y1="f.y + f.h / 2" :x2="W - 120" :y2="f.y + f.h / 2" class="stroke-(--ui-border-accented)" stroke-dasharray="2 3" />
                      <text :x="W - 116" :y="f.y + f.h / 2 + 4" class="fill-(--ui-text-muted)" font-size="11" font-family="ui-monospace, monospace">{{ formatNumber(floorCost(f.i) / 1e6, 2) }}M</text>
                    </template>
                  </g>
                  <!-- element callouts on the left -->
                  <template v-if="result">
                    <g>
                      <line x1="118" :y1="drawing.roofTop + 18" :x2="W / 2 - 40" :y2="drawing.roofTop + 18" class="stroke-(--ui-border-accented)" stroke-dasharray="2 3" />
                      <text x="20" :y="drawing.roofTop + 14" class="fill-(--ui-text-dimmed)" font-size="9" font-family="ui-monospace, monospace">ROOFING</text>
                      <text x="20" :y="drawing.roofTop + 26" class="fill-primary" font-size="11" font-family="ui-monospace, monospace">{{ formatNumber((element('roofing')?.amount ?? 0) / 1e6, 2) }}M</text>
                    </g>
                    <g>
                      <text x="20" :y="drawing.groundY + 16" class="fill-(--ui-text-dimmed)" font-size="9" font-family="ui-monospace, monospace">FOUNDATIONS</text>
                      <text x="20" :y="drawing.groundY + 28" class="fill-primary" font-size="11" font-family="ui-monospace, monospace">{{ formatNumber((element('substructure')?.amount ?? 0) / 1e6, 2) }}M</text>
                      <line x1="104" :y1="drawing.groundY + 11" :x2="drawing.ground.x - 10" :y2="drawing.groundY + 11" class="stroke-(--ui-border-accented)" stroke-dasharray="2 3" />
                    </g>
                    <g v-if="element('frame_walling')">
                      <text x="20" :y="drawing.groundY - drawing.n * drawing.floorH / 2 - 2" class="fill-(--ui-text-dimmed)" font-size="9" font-family="ui-monospace, monospace">FRAME &amp; WALLS</text>
                      <text x="20" :y="drawing.groundY - drawing.n * drawing.floorH / 2 + 10" class="fill-primary" font-size="11" font-family="ui-monospace, monospace">{{ formatNumber((element('frame_walling')?.amount ?? 0) / 1e6, 2) }}M</text>
                    </g>
                  </template>
                  <!-- height dimension -->
                  <line :x1="W - 24" :y1="drawing.groundY" :x2="W - 24" :y2="drawing.groundY - drawing.n * drawing.floorH" class="stroke-(--ui-text-dimmed)" />
                  <line :x1="W - 30" :y1="drawing.groundY" :x2="W - 18" :y2="drawing.groundY" class="stroke-(--ui-text-dimmed)" />
                  <line :x1="W - 30" :y1="drawing.groundY - drawing.n * drawing.floorH" :x2="W - 18" :y2="drawing.groundY - drawing.n * drawing.floorH" class="stroke-(--ui-text-dimmed)" />
                  <text :x="W / 2" :y="drawing.groundY + 44" text-anchor="middle" class="fill-(--ui-text-muted)" font-size="11" font-family="ui-monospace, monospace">
                    {{ drawing.n }} {{ drawing.n === 1 ? 'FLOOR' : 'FLOORS' }} · {{ formatNumber(totalArea, 0) }} m² GROSS{{ result ? ` · COSTS IN ${currency} MILLIONS` : '' }}
                  </text>
                </svg>
              </div>

              <!-- floor schedule -->
              <div class="px-5 pb-4">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <p class="text-[10px] uppercase tracking-widest text-dimmed">
                    Floor schedule · click a floor on the drawing to edit it
                  </p>
                  <div v-if="buildingType && buildingType.maxFloors > 1" class="flex gap-1">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-minus" :disabled="!canRemoveFloor" aria-label="Remove top floor" @click="removeFloor" />
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-plus" label="Floor" :disabled="!canAddFloor" @click="addFloor" />
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="(_, i) in floorAreas"
                    :key="i"
                    class="flex items-center gap-2 rounded-md border px-2 py-1 transition"
                    :class="selectedFloor === i ? 'border-primary ring-1 ring-primary/40' : 'border-default'"
                  >
                    <span class="font-mono text-xs text-muted w-6">{{ floorCode(i) }}</span>
                    <input
                      v-model.number="floorAreas[i]"
                      type="number"
                      min="0"
                      step="1"
                      class="w-20 bg-transparent text-right font-mono text-sm focus:outline-none"
                      :aria-label="`${floorName(i)} area in square metres`"
                      @focus="selectedFloor = i"
                    >
                    <span class="text-xs text-muted">m²</span>
                  </label>
                </div>
              </div>
            </section>

            <!-- 3. Specification -->
            <section class="border-b xl:border-b-0 border-default px-5 py-4">
              <h2 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                <span class="text-primary font-mono">C</span> · Specification
              </h2>
              <!-- specification scale -->
              <div class="relative mt-6 mb-2">
                <div class="absolute left-[16.66%] right-[16.66%] top-[9px] h-0.5 bg-(--ui-border-accented)" />
                <div class="relative grid grid-cols-3">
                  <button
                    v-for="f in config.finishes"
                    :key="f.key"
                    type="button"
                    :aria-pressed="finishKey === f.key"
                    class="flex flex-col items-center text-center gap-1 group"
                    @click="finishKey = f.key"
                  >
                    <span class="size-5 rounded-full border-2 transition" :class="finishKey === f.key ? 'bg-primary border-primary ring-4 ring-primary/20' : 'bg-default border-accented group-hover:border-primary'" />
                    <span class="text-sm font-medium mt-1" :class="finishKey === f.key ? 'text-highlighted' : 'text-muted'">{{ f.label }}</span>
                    <span class="font-mono text-[11px] text-dimmed">
                      {{ band(location?.tierId, f.key) ? `${formatNumber(band(location?.tierId, f.key)!.minRate / 1000, 0)}–${formatNumber(band(location?.tierId, f.key)!.maxRate / 1000, 0)}k /m²` : '—' }}
                    </span>
                    <span class="text-[11px] text-dimmed">labour +{{ f.labourPercent }}%</span>
                  </button>
                </div>
              </div>

              <!-- rate build-up -->
              <div class="mt-5 rounded-md border border-default">
                <p class="px-3 py-2 border-b border-default text-[10px] uppercase tracking-widest text-dimmed flex justify-between">
                  <span>Rate build-up · {{ currency }} per m²</span>
                  <span v-if="!location" class="normal-case tracking-normal">select a town first</span>
                </p>
                <dl class="text-sm font-mono divide-y divide-default">
                  <div class="flex justify-between px-3 py-1.5">
                    <dt class="text-muted font-sans">
                      Band midpoint{{ currentBand ? ` (${formatNumber(currentBand.minRate, 0)}–${formatNumber(currentBand.maxRate, 0)})` : '' }}
                    </dt><dd>{{ midpoint ? formatNumber(midpoint, 0) : '—' }}</dd>
                  </div>
                  <div class="flex justify-between px-3 py-1.5">
                    <dt class="text-muted font-sans">
                      Town adjustment
                    </dt><dd>{{ location ? `${location.adjustmentPercent >= 0 ? '+' : ''}${location.adjustmentPercent}%` : '—' }}</dd>
                  </div>
                  <div class="flex justify-between px-3 py-1.5">
                    <dt class="text-muted font-sans">
                      Building factor ({{ buildingType?.label }})
                    </dt><dd>× {{ buildingType?.factor ?? '—' }}</dd>
                  </div>
                  <div class="flex justify-between px-3 py-1.5 font-semibold" :class="useQuotedRate ? 'line-through text-dimmed' : 'text-highlighted'">
                    <dt class="font-sans">
                      Rate (to nearest 100)
                    </dt><dd>{{ auto ? formatNumber(auto, 0) : '—' }}</dd>
                  </div>
                </dl>
                <div class="px-3 py-2 border-t border-default flex flex-col sm:flex-row sm:items-center gap-2">
                  <UCheckbox v-model="useQuotedRate" label="Use a quoted rate instead" class="flex-1" />
                  <UInput v-if="useQuotedRate" v-model.number="manualRate" type="number" min="0" step="500" size="sm" :placeholder="auto ? String(auto) : ''" class="sm:w-40" :ui="{ base: 'font-mono' }" />
                </div>
              </div>

              <!-- allowances -->
              <div class="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-dimmed mb-2">
                    Allowances
                  </p>
                  <button
                    v-for="a in config.addons"
                    :key="a.key"
                    type="button"
                    :aria-pressed="addonKeys.includes(a.key)"
                    class="w-full flex items-start gap-2 py-1.5 text-left"
                    :title="a.description"
                    @click="toggleAddon(a.key)"
                  >
                    <UIcon :name="addonKeys.includes(a.key) ? 'i-lucide-square-check-big' : 'i-lucide-square'" class="size-4 mt-0.5 shrink-0" :class="addonKeys.includes(a.key) ? 'text-primary' : 'text-dimmed'" />
                    <span class="flex-1 text-sm">{{ a.label }}</span>
                    <span class="font-mono text-xs text-muted">{{ a.percent }}%</span>
                  </button>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-widest text-dimmed mb-2">
                    Budget (optional)
                  </p>
                  <UInput v-model.number="budget" type="number" min="0" step="100000" placeholder="e.g. 8000000" class="w-full" :ui="{ base: 'font-mono' }">
                    <template #leading>
                      <span class="text-xs text-muted">{{ currency }}</span>
                    </template>
                  </UInput>
                  <p class="mt-1.5 text-xs text-dimmed">
                    Compared against the total in the title block.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <!-- RIGHT: title block -->
          <aside class="xl:sticky xl:top-20 self-start">
            <div class="grid grid-cols-2 text-xs border-b border-default">
              <div class="col-span-2 px-4 py-2 border-b border-default">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Project
                </p>
                <p class="font-medium">
                  {{ buildingType?.label ?? 'Building' }}, {{ formatNumber(totalArea, 0) }} m²
                </p>
              </div>
              <div class="px-4 py-2 border-e border-b border-default">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Location
                </p>
                <p class="truncate">
                  {{ location?.name ?? '—' }}
                </p>
              </div>
              <div class="px-4 py-2 border-b border-default">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Finish
                </p>
                <p>{{ finish?.label ?? '—' }}</p>
              </div>
              <div class="px-4 py-2 border-e border-default">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Rate / m²
                </p>
                <p class="font-mono">
                  {{ rate ? formatNumber(rate, 0) : '—' }}
                </p>
              </div>
              <div class="px-4 py-2">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Labour
                </p>
                <p class="font-mono">
                  +{{ finish?.labourPercent ?? 0 }}%
                </p>
              </div>
            </div>

            <div v-if="!result" class="px-4 py-10 text-center">
              <UIcon name="i-lucide-pencil-ruler" class="size-8 text-dimmed" />
              <p class="mt-2 text-sm text-muted">
                {{ !location ? 'Choose a town in section A to price the plan.' : 'Enter floor areas to price the plan.' }}
              </p>
            </div>

            <template v-else>
              <dl class="px-4 py-3 text-sm space-y-1.5 border-b border-default">
                <div class="flex justify-between">
                  <dt class="text-muted">
                    Materials
                  </dt><dd class="font-mono">
                    {{ formatNumber(result.materials, 0) }}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-muted">
                    Labour
                  </dt><dd class="font-mono">
                    {{ formatNumber(result.labour, 0) }}
                  </dd>
                </div>
                <div v-for="a in result.addons" :key="a.key" class="flex justify-between">
                  <dt class="text-muted">
                    {{ a.label }}
                  </dt><dd class="font-mono">
                    {{ formatNumber(a.amount, 0) }}
                  </dd>
                </div>
              </dl>
              <div class="px-4 py-4 border-b border-default bg-primary/5">
                <p class="text-[9px] uppercase tracking-widest text-dimmed">
                  Estimated total · {{ currency }}
                </p>
                <p class="font-mono text-3xl font-bold text-primary mt-1">
                  {{ formatNumber(result.total, 0) }}
                </p>
                <p class="font-mono text-[11px] text-muted mt-1">
                  {{ formatNumber(result.range.low, 0) }} – {{ formatNumber(result.range.high, 0) }}
                </p>
                <p class="font-mono text-[11px] text-muted">
                  {{ formatNumber(result.costPerM2AllIn, 0) }} per m² all-in
                </p>
              </div>

              <div v-if="result.budget" class="px-4 py-3 border-b border-default flex items-center gap-3">
                <svg viewBox="0 0 120 66" class="w-28 shrink-0" role="img" :aria-label="`${Math.round(budgetPct)}% of budget`">
                  <path d="M 16 58 A 44 44 0 0 1 104 58" fill="none" class="stroke-(--ui-border-accented)" stroke-width="8" stroke-linecap="round" />
                  <path d="M 16 58 A 44 44 0 0 1 89.3 26.9" fill="none" class="stroke-success/60" stroke-width="8" stroke-linecap="round" />
                  <line x1="60" y1="58" :x2="needle.x" :y2="needle.y" :class="result.budget.withinBudget ? 'stroke-success' : 'stroke-error'" stroke-width="3" stroke-linecap="round" />
                  <circle cx="60" cy="58" r="4" class="fill-(--ui-text-highlighted)" />
                </svg>
                <div class="text-xs">
                  <p class="font-semibold" :class="result.budget.withinBudget ? 'text-success' : 'text-error'">
                    {{ Math.round(budgetPct) }}% of budget
                  </p>
                  <p class="text-muted">
                    {{ result.budget.withinBudget ? `${formatMoney(result.budget.difference, currency)} spare` : `${formatMoney(-result.budget.difference, currency)} short` }}<br>
                    Budget builds ≈ {{ formatNumber(result.budget.affordableArea, 0) }} m²
                  </p>
                </div>
              </div>

              <!-- drawing notes / schedule -->
              <div class="px-4 py-3 border-b border-default">
                <p class="text-[9px] uppercase tracking-widest text-dimmed mb-1.5">
                  Notes · other elements
                </p>
                <ol class="text-xs space-y-1">
                  <li v-for="(e, i) in scheduleElements" :key="e.key" class="flex gap-2">
                    <span class="font-mono text-dimmed w-4">{{ i + 1 }}.</span>
                    <span class="flex-1 text-muted">{{ e.label }} ({{ e.percent }}%)</span>
                    <span class="font-mono">{{ formatNumber(e.amount, 0) }}</span>
                  </li>
                </ol>
              </div>

              <div class="p-4 space-y-2">
                <UButton v-if="config.flags.estimate_requests !== false" block icon="i-lucide-send" label="Request a detailed BQ" @click="leadOpen = true" />
                <UButton v-if="config.flags.bq_projects !== false && !props.embedded" block color="neutral" variant="outline" icon="i-lucide-file-spreadsheet" label="Draft a full BQ yourself" :to="bqLink" />
                <p class="text-[10px] leading-snug text-dimmed pt-1">
                  Order-of-cost estimate on average {{ new Date().getFullYear() }} rates. A Bill of Quantities measured from drawings gives a tender-ready price.
                </p>
              </div>
            </template>
          </aside>
        </div>
      </div>
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
  </div>
</template>
