<script setup lang="ts">
import type { BqLine, PricedMaterial, ResultLine } from '#shared/calc/types'

/*
 * Kadiria Materials Takeoff: a cross-section drawing of the building is the menu. Click a part
 * of the section (trench, footing, slab, wall, beam...) to take off its materials; results come
 * out as a supplier's delivery docket. Calculations are the standard module engine.
 */
const props = defineProps<{
  /** When set, results can be added straight into this draft project. */
  projectId?: string
  projectLocationId?: number | null
  embedded?: boolean
  initialModule?: string
}>()
const emit = defineEmits<{ added: [] }>()

interface RunResult {
  module: { key: string, name: string }
  inputs: Record<string, number | string>
  lines: ResultLine[]
  materials: PricedMaterial[]
  bqLines: BqLine[]
  warnings: string[]
  materialsTotal: number
  missingPrices: number
}

const { data: config } = await useBqConfig()
const { call, toast } = useApi()
const { loggedIn } = useUserSession()

const modules = computed(() => config.value?.modules ?? [])
const activeKey = ref(props.initialModule && modules.value.some(m => m.key === props.initialModule) ? props.initialModule : modules.value[0]?.key ?? '')
const active = computed(() => modules.value.find(m => m.key === activeKey.value))
const activeIndex = computed(() => modules.value.findIndex(m => m.key === activeKey.value))
const prevModule = computed(() => activeIndex.value > 0 ? modules.value[activeIndex.value - 1] : undefined)
const nextModule = computed(() => activeIndex.value >= 0 ? modules.value[activeIndex.value + 1] : undefined)
const seq = (key: string) => modules.value.findIndex(m => m.key === key) + 1

// Price list (shared by every element)
const pricesOpen = ref(false)
const settings = reactive({
  wastagePercent: 5,
  locationId: (props.projectLocationId ?? 0) as number,
  cement: null as number | null,
  sand: null as number | null,
  ballast: null as number | null,
  projectName: ''
})
const currency = computed(() => config.value?.countries[0]?.currency ?? 'KES')
const locationItems = computed(() => [{ label: 'National average prices', value: 0 }, ...locationSelectItems(config.value)])
const locationName = computed(() => settings.locationId ? config.value?.locations.find(l => l.id === settings.locationId)?.name : 'National average')
const ownRates = computed(() => (['cement', 'sand', 'ballast'] as const).filter(k => settings[k]).length)

// Inputs per element, initialised from (admin-adjusted) defaults
const inputs = reactive<Record<string, Record<string, number | string | undefined>>>({})
watchEffect(() => {
  for (const m of modules.value) {
    if (!inputs[m.key]) inputs[m.key] = Object.fromEntries(m.inputs.map(i => [i.key, i.default]))
  }
})

const results = reactive<Record<string, RunResult | undefined>>({})
const running = ref(false)
const showMethod = ref(false)

function optionsFor(input: NonNullable<typeof active.value>['inputs'][number]) {
  if (input.type === 'mix') return (config.value?.mixes ?? []).filter(m => m.kind === input.mixKind).map(m => ({ label: m.name, value: m.key }))
  return input.options ?? []
}
function overrides() {
  const o: Record<string, number> = {}
  for (const k of ['cement', 'sand', 'ballast'] as const) if (settings[k]) o[k] = Number(settings[k])
  return o
}
const missingRequired = computed(() => active.value?.inputs.filter(i => i.required && !(Number(inputs[active.value!.key]?.[i.key]) > 0)).map(i => i.label) ?? [])

async function run() {
  const m = active.value
  if (!m) return
  if (missingRequired.value.length) {
    toast.add({ title: `Enter ${missingRequired.value.join(', ').toLowerCase()} first.`, color: 'warning', icon: 'i-lucide-ruler' })
    return
  }
  running.value = true
  try {
    results[m.key] = await call<RunResult>(`/api/public/modules/${m.key}`, {
      method: 'POST',
      body: { inputs: inputs[m.key], locationId: settings.locationId || null, wastagePercent: settings.wastagePercent, priceOverrides: overrides() }
    })
  }
  catch { /* toast shown */ }
  finally { running.value = false }
}

// Once an element has been taken off, keep its docket in step with edits
let timer: ReturnType<typeof setTimeout> | undefined
watch([() => active.value && inputs[active.value.key], () => ({ ...settings })], () => {
  if (!active.value || !results[active.value.key]) return
  clearTimeout(timer)
  timer = setTimeout(() => { if (!missingRequired.value.length) run() }, 500)
}, { deep: true })

const result = computed(() => active.value ? results[active.value.key] : undefined)
const docketNo = computed(() => `DC-${String(seq(activeKey.value)).padStart(2, '0')}${new Date().toISOString().slice(5, 10).replace('-', '')}`)

/* ---------------- Cross-section drawing ---------------- */
// Each element's shape(s) on the section and where its numbered bubble sits.
interface Part { key: string, shapes: string[], bubble: [number, number], anchor: [number, number], kind?: 'fill' | 'hatch' | 'stones' | 'thin' }
const PARTS: Part[] = [
  { key: 'excavation', shapes: ['M 60 220 L 60 332 L 200 332 L 200 220'], bubble: [34, 300], anchor: [60, 300], kind: 'thin' },
  { key: 'blinding', shapes: ['M 70 322 h 120 v 8 h -120 Z'], bubble: [226, 346], anchor: [190, 326] },
  { key: 'strip_footing', shapes: ['M 76 292 h 108 v 30 h -108 Z'], bubble: [226, 306], anchor: [184, 306] },
  { key: 'foundation_walling', shapes: ['M 106 206 h 48 v 86 h -48 Z'], bubble: [34, 246], anchor: [106, 246], kind: 'stones' },
  { key: 'hardcore', shapes: ['M 154 206 h 352 v 22 h -352 Z'], bubble: [330, 252], anchor: [330, 228], kind: 'hatch' },
  { key: 'ground_slab', shapes: ['M 100 194 h 460 v 12 h -460 Z'], bubble: [600, 200], anchor: [560, 200] },
  { key: 'column_bases', shapes: ['M 470 284 h 90 v 28 h -90 Z'], bubble: [600, 298], anchor: [560, 298] },
  { key: 'columns', shapes: ['M 506 96 h 20 v 98 h -20 Z', 'M 506 206 h 20 v 78 h -20 Z'], bubble: [600, 140], anchor: [526, 140] },
  { key: 'walling', shapes: ['M 112 96 h 36 v 98 h -36 Z'], bubble: [34, 146], anchor: [112, 146], kind: 'stones' },
  { key: 'plaster', shapes: ['M 106 96 h 6 v 98 h -6 Z', 'M 148 96 h 6 v 98 h -6 Z'], bubble: [226, 170], anchor: [154, 170] },
  { key: 'beams', shapes: ['M 106 82 h 420 v 14 h -420 Z'], bubble: [330, 120], anchor: [330, 96] },
  { key: 'suspended_slab', shapes: ['M 90 68 h 480 v 14 h -480 Z'], bubble: [600, 75], anchor: [570, 75] },
  { key: 'roofing', shapes: ['M 70 52 L 330 8 L 590 52 Z'], bubble: [440, 22], anchor: [400, 28] },
  { key: 'tiling', shapes: ['M 160 189 h 340 v 5 h -340 Z'], bubble: [420, 168], anchor: [420, 189] },
  { key: 'painting', shapes: ['M 154 96 h 4 v 93 h -4 Z'], bubble: [226, 128], anchor: [158, 128] }
]
const parts = computed(() => PARTS.map(p => ({ ...p, n: seq(p.key), enabled: modules.value.some(m => m.key === p.key) })))
const hovered = ref<string | null>(null)
const nameOf = (key: string) => modules.value.find(m => m.key === key)?.name ?? key
function pick(key: string) {
  if (modules.value.some(m => m.key === key)) activeKey.value = key
}

/* ---------------- Send to BQ ---------------- */
const pushOpen = ref(false)
const targetProject = ref<string | undefined>(props.projectId)
const selectedLines = ref<string[]>([])
const { data: myProjects, execute: loadProjects } = useFetch<{ id: string, name: string, status: string }[]>('/api/projects', { immediate: false, server: false, default: () => [] })
const draftProjects = computed(() => (myProjects.value ?? []).filter(p => p.status === 'draft').map(p => ({ label: p.name, value: p.id })))

async function openPush() {
  if (!result.value) return
  selectedLines.value = result.value.bqLines.map((_, i) => i).filter(i => result.value!.bqLines[i]!.quantity > 0).map(String)
  if (!props.projectId) await loadProjects()
  pushOpen.value = true
}

const pushing = ref(false)
async function push() {
  if (!targetProject.value || !active.value) return
  pushing.value = true
  try {
    const res = await call<{ added: unknown[] }>(`/api/projects/${targetProject.value}/calculator`, {
      method: 'POST',
      body: { moduleKey: active.value.key, inputs: inputs[active.value.key], locationId: settings.locationId || null, wastagePercent: settings.wastagePercent, priceOverrides: overrides(), lines: selectedLines.value.map(Number) }
    })
    pushOpen.value = false
    toast.add({ title: `${res.added.length} item(s) added to the BQ`, color: 'success', icon: 'i-lucide-check' })
    emit('added')
  }
  finally { pushing.value = false }
}

function printReport() {
  window.print()
}
</script>

<template>
  <div v-if="config" class="max-w-6xl mx-auto">
    <div v-if="config.flags.material_calculators === false || !modules.length" class="text-center py-16">
      <UIcon name="i-lucide-power-off" class="size-10 text-dimmed" />
      <p class="mt-3 text-muted">
        The material calculators are currently unavailable.
      </p>
    </div>

    <div v-else class="rounded-sm border-2 border-accented p-1.5">
      <div class="border border-default">
        <!-- Sheet header -->
        <header class="flex flex-wrap items-stretch border-b border-default">
          <div class="flex-1 min-w-[16rem] px-5 py-4">
            <p class="text-[10px] uppercase tracking-[0.25em] text-muted">
              Kadiria · Materials takeoff
            </p>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-highlighted mt-1">
              Pick a part of the building
            </h2>
            <p class="text-sm text-muted mt-1">
              Click any element on the section, give its dimensions and get a delivery docket of cement, sand, ballast, steel and stone, priced for your area.
            </p>
          </div>
          <button
            type="button"
            class="border-s border-default px-4 py-3 text-left text-xs hover:bg-elevated/50 transition min-w-[14rem] no-print"
            :aria-expanded="pricesOpen"
            @click="pricesOpen = !pricesOpen"
          >
            <span class="text-[9px] uppercase tracking-widest text-dimmed flex items-center justify-between">
              Price list <UIcon :name="pricesOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" />
            </span>
            <span class="block mt-1 font-medium text-sm">{{ locationName }}</span>
            <span class="block text-muted font-mono">+{{ settings.wastagePercent }}% waste<template v-if="ownRates"> · {{ ownRates }} own rate{{ ownRates > 1 ? 's' : '' }}</template></span>
          </button>
        </header>

        <!-- Price list panel -->
        <div v-if="pricesOpen" class="border-b border-default bg-elevated/40 px-5 py-4 grid grid-cols-2 md:grid-cols-6 gap-3 no-print">
          <UFormField label="Prices for" class="col-span-2">
            <USelect v-model="settings.locationId" :items="locationItems" class="w-full" />
          </UFormField>
          <UFormField label="Wastage %">
            <UInput v-model.number="settings.wastagePercent" type="number" min="0" max="50" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField :label="`Cement /bag`">
            <UInput v-model.number="settings.cement" type="number" min="0" placeholder="list price" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField :label="`Sand /t`">
            <UInput v-model.number="settings.sand" type="number" min="0" placeholder="list price" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField :label="`Ballast /t`">
            <UInput v-model.number="settings.ballast" type="number" min="0" placeholder="list price" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField label="Docket reference" class="col-span-2">
            <UInput v-model="settings.projectName" placeholder="e.g. Kiambu Bungalow" class="w-full" />
          </UFormField>
          <p class="col-span-2 md:col-span-4 self-end text-xs text-muted">
            Leave rates blank to use the current {{ currency }} list prices for the selected area.
          </p>
        </div>

        <!-- Section drawing + element card -->
        <div class="grid lg:grid-cols-[minmax(0,1fr)_20rem] border-b border-default">
          <div class="lg:border-e border-default p-2 sm:p-4">
            <p class="px-1 text-[10px] uppercase tracking-widest text-dimmed flex justify-between">
              <span>Section A–A · foundation, floor, wall and roof</span>
              <span class="font-mono normal-case tracking-normal">{{ hovered ? nameOf(hovered) : 'hover or click a part' }}</span>
            </p>
            <svg viewBox="0 0 640 360" class="w-full mt-1 no-print" role="group" aria-label="Building cross-section. Select an element to take off.">
              <defs>
                <pattern id="dc-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="7" class="stroke-(--ui-border-accented)" stroke-width="1.2" />
                </pattern>
                <pattern id="dc-soil" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="4" r="0.9" class="fill-(--ui-text-dimmed)" />
                  <circle cx="10" cy="10" r="0.9" class="fill-(--ui-text-dimmed)" />
                </pattern>
                <pattern id="dc-stones" width="18" height="10" patternUnits="userSpaceOnUse">
                  <rect x="0.5" y="0.5" width="17" height="9" fill="none" class="stroke-(--ui-text-dimmed)" stroke-width="0.8" />
                </pattern>
              </defs>
              <!-- soil -->
              <rect x="0" y="220" width="640" height="140" fill="url(#dc-soil)" opacity="0.5" />
              <line x1="0" y1="220" x2="640" y2="220" class="stroke-(--ui-text-muted)" stroke-width="2" />
              <text x="8" y="214" font-size="9" font-family="ui-monospace, monospace" class="fill-(--ui-text-dimmed)">GL</text>
              <!-- upper wall (context) -->
              <rect x="112" y="52" width="36" height="16" fill="url(#dc-stones)" opacity="0.4" />

              <g
                v-for="p in parts"
                :key="p.key"
                :class="p.enabled ? 'cursor-pointer' : 'opacity-25 pointer-events-none'"
                role="button"
                :tabindex="p.enabled ? 0 : -1"
                :aria-label="`${p.n > 0 ? `${p.n}. ` : ''}${nameOf(p.key)}`"
                :aria-pressed="activeKey === p.key"
                @click="pick(p.key)"
                @keydown.enter.prevent="pick(p.key)"
                @keydown.space.prevent="pick(p.key)"
                @mouseenter="hovered = p.key"
                @mouseleave="hovered = null"
              >
                <title>{{ nameOf(p.key) }}</title>
                <path
                  v-for="(d, i) in p.shapes"
                  :key="i"
                  :d="d"
                  :fill="p.kind === 'hatch' ? 'url(#dc-hatch)' : p.kind === 'stones' ? 'url(#dc-stones)' : p.kind === 'thin' ? 'none' : undefined"
                  :stroke-dasharray="p.kind === 'thin' ? '5 4' : undefined"
                  stroke-width="1.5"
                  class="transition-colors"
                  :class="[
                    activeKey === p.key ? 'stroke-primary' : hovered === p.key ? 'stroke-primary/70' : 'stroke-(--ui-text-muted)',
                    p.kind ? '' : activeKey === p.key ? 'fill-primary/55' : hovered === p.key ? 'fill-primary/25' : 'fill-(--ui-bg-accented)'
                  ]"
                />
                <!-- wider invisible hit area for thin parts -->
                <path v-for="(d, i) in p.shapes" :key="`hit${i}`" :d="d" fill="transparent" stroke="transparent" stroke-width="10" />
                <line :x1="p.bubble[0]" :y1="p.bubble[1]" :x2="p.anchor[0]" :y2="p.anchor[1]" class="stroke-(--ui-border-accented)" stroke-width="1" />
                <circle :cx="p.bubble[0]" :cy="p.bubble[1]" r="11" :class="activeKey === p.key ? 'fill-primary stroke-primary' : 'fill-(--ui-bg) stroke-(--ui-text-muted)'" stroke-width="1.5" />
                <text :x="p.bubble[0]" :y="p.bubble[1] + 4" text-anchor="middle" font-size="10" font-weight="700" font-family="ui-monospace, monospace" :class="activeKey === p.key ? 'fill-(--ui-bg)' : 'fill-(--ui-text-highlighted)'">
                  {{ p.n > 0 ? p.n : '–' }}
                </text>
                <circle v-if="results[p.key]" :cx="p.bubble[0] + 9" :cy="p.bubble[1] - 9" r="3.5" class="fill-success" />
              </g>
            </svg>
            <!-- compact list (keyboard/mobile friendly) -->
            <div class="mt-2 flex flex-wrap gap-1 no-print">
              <button
                v-for="m in modules"
                :key="m.key"
                type="button"
                class="rounded-full border px-2.5 py-0.5 text-xs transition"
                :class="activeKey === m.key ? 'border-primary bg-primary text-inverted' : 'border-default text-muted hover:text-default'"
                @click="activeKey = m.key"
              >
                <span class="font-mono opacity-70">{{ seq(m.key) }}</span> {{ m.short }}
              </button>
            </div>
          </div>

          <!-- Element card -->
          <aside v-if="active" class="p-4 flex flex-col">
            <div class="flex items-start gap-3">
              <span class="size-11 shrink-0 rounded-full border-2 border-primary text-primary grid place-items-center font-mono font-bold text-lg">{{ activeIndex + 1 }}</span>
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-widest text-dimmed">
                  {{ active.stage || 'Element' }} · step {{ activeIndex + 1 }} of {{ modules.length }}
                </p>
                <h3 class="font-display text-lg font-semibold text-highlighted leading-snug">
                  {{ active.name }}
                </h3>
              </div>
            </div>
            <p class="mt-3 text-sm text-muted">
              {{ active.description }}
            </p>
            <div v-if="active.onSite" class="mt-3 border-s-2 border-primary/60 ps-3 text-sm">
              <p class="text-[10px] uppercase tracking-widest text-dimmed mb-0.5">
                On site
              </p>
              {{ active.onSite }}
            </div>
            <div class="mt-auto pt-4 flex items-center justify-between gap-2 no-print">
              <UButton v-if="prevModule" size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-left" :label="prevModule.short" @click="activeKey = prevModule.key" />
              <span v-else />
              <UButton v-if="nextModule" size="xs" color="neutral" variant="outline" trailing-icon="i-lucide-arrow-right" :label="`Then: ${nextModule.short}`" @click="activeKey = nextModule.key" />
              <span v-else class="text-[11px] text-dimmed text-right">Last element: roofing, doors and services are priced in the full BQ.</span>
            </div>
          </aside>
        </div>

        <!-- Dimensions + docket -->
        <div v-if="active" class="grid lg:grid-cols-2">
          <!-- Dimensions -->
          <form class="p-5 lg:border-e border-default space-y-4 no-print" @submit.prevent="run">
            <div class="flex items-center justify-between">
              <h3 class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Dimensions &amp; specification
              </h3>
              <UButton size="xs" color="neutral" variant="ghost" :icon="showMethod ? 'i-lucide-chevron-up' : 'i-lucide-sigma'" :label="showMethod ? 'Hide method' : 'Method'" @click="showMethod = !showMethod" />
            </div>
            <div v-if="showMethod" class="formula-block">
              <div v-for="(f, i) in active.formula" :key="i">
                {{ f }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-3">
              <UFormField
                v-for="input in active.inputs"
                :key="input.key"
                :label="input.label"
                :help="input.help"
                :required="input.required"
                :class="input.type === 'mix' || input.type === 'select' ? 'col-span-2' : ''"
              >
                <USelect
                  v-if="input.type === 'mix' || input.type === 'select' || input.type === 'bar'"
                  v-model="inputs[active.key]![input.key]"
                  :items="optionsFor(input)"
                  class="w-full"
                />
                <UInput
                  v-else
                  v-model.number="inputs[active.key]![input.key]"
                  type="number"
                  :min="input.min"
                  :max="input.max"
                  :step="input.step ?? 0.01"
                  :placeholder="input.default === undefined ? 'measure on site' : String(input.default)"
                  class="w-full"
                  :ui="{ base: 'font-mono' }"
                >
                  <template v-if="input.unit" #trailing>
                    <span class="text-xs text-muted">{{ input.unit }}</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
            <UButton type="submit" block size="lg" icon="i-lucide-clipboard-list" :loading="running" :label="result ? 'Refresh docket' : `Take off ${active.short.toLowerCase()}`" />
          </form>

          <!-- Delivery docket -->
          <div class="p-5 bg-elevated/30">
            <div v-if="!result" class="h-full min-h-56 grid place-items-center text-center rounded-md border-2 border-dashed border-default p-6">
              <div>
                <UIcon name="i-lucide-receipt-text" class="size-8 text-dimmed" />
                <p class="mt-2 text-sm text-muted">
                  Your delivery docket for <b>{{ active.name.toLowerCase() }}</b> appears here.
                </p>
              </div>
            </div>
            <div v-else class="rounded-md bg-default border border-default shadow-sm" :class="running ? 'opacity-60' : ''">
              <!-- perforated top edge -->
              <div class="h-2 rounded-t-md bg-[radial-gradient(circle_at_6px_0,transparent_4px,var(--ui-bg-elevated)_4.5px)] bg-[length:12px_8px]" aria-hidden="true" />
              <div class="px-4 pt-2 pb-3 border-b border-dashed border-default flex justify-between gap-3 text-xs">
                <div>
                  <p class="font-display font-bold text-sm text-highlighted">
                    Delivery docket
                  </p>
                  <p class="text-muted">
                    {{ result.module.name }}{{ settings.projectName ? ` · ${settings.projectName}` : '' }}
                  </p>
                </div>
                <div class="text-right font-mono text-muted">
                  <p>No. {{ docketNo }}</p>
                  <p>{{ locationName }}</p>
                </div>
              </div>

              <UAlert v-for="(w, i) in result.warnings" :key="i" class="m-3" color="warning" variant="soft" icon="i-lucide-triangle-alert" :title="w" />

              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] uppercase tracking-widest text-dimmed">
                    <th class="text-right font-medium px-3 py-2 w-20">
                      Qty
                    </th>
                    <th class="text-left font-medium py-2">
                      Item
                    </th>
                    <th class="text-right font-medium px-3 py-2">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-dashed divide-(--ui-border)">
                  <tr v-for="m in result.materials" :key="m.materialKey">
                    <td class="text-right font-mono font-semibold px-3 py-2 align-top">
                      {{ formatNumber(m.quantity, 2) }}
                    </td>
                    <td class="py-2">
                      {{ m.label }}
                      <span class="block text-[11px] text-muted">
                        {{ m.unit }} @ {{ m.unitPrice !== null ? formatNumber(m.unitPrice, 0) : '—' }}
                        <template v-if="m.priceSource === 'location'"> · local price</template>
                        <template v-else-if="m.priceSource === 'override'"> · your rate</template>
                        <template v-else-if="m.priceSource === 'missing'"> · no price set</template>
                      </span>
                    </td>
                    <td class="text-right font-mono px-3 py-2 align-top">
                      {{ m.amount !== null ? formatNumber(m.amount, 0) : '—' }}
                    </td>
                  </tr>
                  <tr v-if="!result.materials.length">
                    <td colspan="3" class="px-3 py-4 text-center text-muted">
                      Labour and plant only, with no materials to deliver.
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="px-4 py-3 border-t-2 border-default flex items-baseline justify-between">
                <span class="text-xs text-muted">Total incl. {{ settings.wastagePercent }}% waste · {{ currency }}</span>
                <span class="font-mono text-xl font-bold text-primary">{{ formatNumber(result.materialsTotal, 0) }}</span>
              </div>
              <div class="px-4 pb-3 text-[11px] text-muted font-mono flex flex-wrap gap-x-4 gap-y-0.5">
                <span v-for="l in result.lines" :key="l.label">{{ l.label }}: {{ formatNumber(l.value, 2) }} {{ l.unit }}</span>
              </div>
              <details class="border-t border-dashed border-default">
                <summary class="cursor-pointer select-none px-4 py-2 text-xs font-medium">
                  {{ result.bqLines.length }} BQ line{{ result.bqLines.length === 1 ? '' : 's' }} from this takeoff
                </summary>
                <ul class="px-4 pb-3 text-xs space-y-1">
                  <li v-for="(b, i) in result.bqLines" :key="i" class="flex justify-between gap-3">
                    <span class="text-muted">{{ b.description }}</span>
                    <span class="font-mono whitespace-nowrap">{{ formatNumber(b.quantity, 2) }} {{ b.unit }}</span>
                  </li>
                </ul>
              </details>
            </div>

            <div v-if="result" class="mt-3 flex flex-col sm:flex-row gap-2 no-print">
              <UButton v-if="loggedIn && !embedded" class="flex-1 justify-center" icon="i-lucide-file-plus" label="Add to a BQ project" @click="openPush" />
              <UButton v-else-if="!embedded" class="flex-1 justify-center" color="neutral" variant="outline" icon="i-lucide-log-in" label="Sign in to add to a BQ" :to="`/login?redirect=/calculators`" />
              <UButton class="flex-1 justify-center" color="neutral" variant="outline" icon="i-lucide-printer" label="Print docket" @click="printReport" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="pushOpen" title="Add to Bill of Quantities" :description="projectId ? 'Choose which lines to add to this BQ.' : 'Choose a draft project and the lines to add.'">
      <template #body>
        <div class="space-y-4">
          <UFormField v-if="!projectId" label="Draft project">
            <USelect v-model="targetProject" :items="draftProjects" placeholder="Select a draft BQ" class="w-full" />
            <template #help>
              No draft yet? <NuxtLink to="/projects/new" class="text-primary underline">Create a BQ project</NuxtLink>.
            </template>
          </UFormField>
          <UCheckboxGroup
            v-if="result"
            v-model="selectedLines"
            :items="result.bqLines.map((b, i) => ({ label: `${b.description}: ${formatNumber(b.quantity, 2)} ${b.unit}`, value: String(i), disabled: b.quantity <= 0 }))"
          />
          <p class="text-xs text-muted">
            Each item is priced from its own materials (concrete, steel, mesh, membrane...) plus labour and overheads; items without materials, such as formwork, use the BQ library rate adjusted for the project's location and finish.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="pushOpen = false" />
          <UButton :disabled="!targetProject || !selectedLines.length" :loading="pushing" icon="i-lucide-check" label="Add items" @click="push" />
        </div>
      </template>
    </UModal>
  </div>
</template>
