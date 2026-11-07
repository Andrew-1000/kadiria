<script setup lang="ts">
import type { BqLine, PricedMaterial, ResultLine } from '#shared/calc/types'

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

// Global settings (shared by all modules)
const settings = reactive({
  wastagePercent: 5,
  locationId: (props.projectLocationId ?? 0) as number,
  cement: null as number | null,
  sand: null as number | null,
  ballast: null as number | null,
  projectName: ''
})

// Inputs per module, initialised from (admin-adjusted) defaults
const inputs = reactive<Record<string, Record<string, number | string | undefined>>>({})
watchEffect(() => {
  for (const m of modules.value) {
    if (!inputs[m.key]) inputs[m.key] = Object.fromEntries(m.inputs.map(i => [i.key, i.default]))
  }
})

const results = reactive<Record<string, RunResult | undefined>>({})
const running = ref(false)
const currency = computed(() => config.value?.countries[0]?.currency ?? 'KES')
const locationItems = computed(() => [{ label: 'National average prices', value: 0 }, ...locationSelectItems(config.value)])

function optionsFor(input: NonNullable<typeof active.value>['inputs'][number]) {
  if (input.type === 'mix') return (config.value?.mixes ?? []).filter(m => m.kind === input.mixKind).map(m => ({ label: m.name, value: m.key }))
  return input.options ?? []
}

async function run() {
  if (!active.value) return
  running.value = true
  try {
    const overrides: Record<string, number> = {}
    for (const k of ['cement', 'sand', 'ballast'] as const) if (settings[k]) overrides[k] = Number(settings[k])
    results[active.value.key] = await call<RunResult>(`/api/public/modules/${active.value.key}`, {
      method: 'POST',
      body: { inputs: inputs[active.value.key], locationId: settings.locationId || null, wastagePercent: settings.wastagePercent, priceOverrides: overrides }
    })
  }
  finally { running.value = false }
}

const result = computed(() => active.value ? results[active.value.key] : undefined)

// Push to BQ
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
    const overrides: Record<string, number> = {}
    for (const k of ['cement', 'sand', 'ballast'] as const) if (settings[k]) overrides[k] = Number(settings[k])
    const res = await call<{ added: unknown[] }>(`/api/projects/${targetProject.value}/calculator`, {
      method: 'POST',
      body: { moduleKey: active.value.key, inputs: inputs[active.value.key], locationId: settings.locationId || null, wastagePercent: settings.wastagePercent, priceOverrides: overrides, lines: selectedLines.value.map(Number) }
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
  <div v-if="config" class="max-w-4xl mx-auto">
    <div v-if="config.flags.material_calculators === false || !modules.length" class="text-center py-16">
      <UIcon name="i-lucide-power-off" class="size-10 text-dimmed" />
      <p class="mt-3 text-muted">
        The material calculators are currently unavailable.
      </p>
    </div>
    <UCard v-else :ui="{ root: 'rounded-2xl overflow-hidden', body: 'p-0 sm:p-0', header: 'p-0 sm:p-0' }">
      <template #header>
        <div class="bg-gradient-to-br from-blue-950 to-blue-800 text-white px-6 sm:px-8 pt-6 pb-0 no-print-bg">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold tracking-[0.2em] uppercase text-sky-300">
                — Mafundi Calculator —
              </p>
              <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold">
                Material Quantification Module
              </h2>
              <p class="mt-2 text-sm text-white/70 max-w-lg">
                Calculate individual building elements using standard Kenyan construction practice. Full formula display, editable assumptions, cost estimates and a printable report.
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-4xl font-extrabold text-sky-300 tabular-nums">
                {{ modules.length }}
              </p>
              <p class="text-[10px] tracking-[0.2em] uppercase text-white/60">
                Modules
              </p>
            </div>
          </div>
          <div class="mt-5 -mx-6 sm:-mx-8 px-4 sm:px-6 overflow-x-auto no-print">
            <div class="flex gap-1 min-w-max">
              <button
                v-for="m in modules"
                :key="m.key"
                type="button"
                class="flex items-center gap-1.5 px-3 py-3 text-[11px] font-bold tracking-wider uppercase border-b-2 transition whitespace-nowrap"
                :class="activeKey === m.key ? 'border-sky-300 text-sky-300' : 'border-transparent text-white/60 hover:text-white'"
                @click="activeKey = m.key"
              >
                <span class="opacity-60 tabular-nums">{{ String(modules.indexOf(m) + 1).padStart(2, '0') }}</span>
                <UIcon :name="m.icon" class="size-4" /> {{ m.short }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <div class="p-5 sm:p-8 space-y-6">
        <!-- Global settings -->
        <div class="rounded-xl border border-default p-4 space-y-4 no-print">
          <p class="text-[11px] font-bold tracking-[0.14em] uppercase text-muted">
            <UIcon name="i-lucide-settings" class="align-[-2px]" /> Global settings: applied to all modules
          </p>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <UFormField label="Wastage allowance (%)" class="col-span-1">
              <UInput v-model.number="settings.wastagePercent" type="number" min="0" max="50" class="w-full" />
            </UFormField>
            <UFormField label="Price location" class="col-span-1 lg:col-span-3">
              <USelect v-model="settings.locationId" :items="locationItems" class="w-full" placeholder="National average prices" />
            </UFormField>
            <UFormField :label="`Cement rate (${currency}/bag)`">
              <UInput v-model.number="settings.cement" type="number" min="0" placeholder="Admin price" class="w-full" />
            </UFormField>
            <UFormField :label="`Sand rate (${currency}/tonne)`">
              <UInput v-model.number="settings.sand" type="number" min="0" placeholder="Admin price" class="w-full" />
            </UFormField>
            <UFormField :label="`Ballast rate (${currency}/tonne)`">
              <UInput v-model.number="settings.ballast" type="number" min="0" placeholder="Admin price" class="w-full" />
            </UFormField>
            <UFormField label="Project name">
              <UInput v-model="settings.projectName" placeholder="e.g. Kiambu Bungalow" class="w-full" />
            </UFormField>
          </div>
          <p class="text-xs text-muted">
            Leave rates blank to use the prices maintained by the administrator for the selected location.
          </p>
        </div>

        <template v-if="active">
          <div class="flex items-start gap-3">
            <span class="size-9 shrink-0 rounded-lg bg-elevated grid place-items-center"><UIcon :name="active.icon" class="text-primary size-5" /></span>
            <div>
              <h3 class="font-semibold text-highlighted text-lg">
                {{ active.name }}
              </h3>
              <p class="text-sm text-muted">
                {{ active.description }}
              </p>
            </div>
          </div>

          <!-- Where this element sits in the construction sequence -->
          <div v-if="active.onSite" class="rounded-lg border border-default bg-elevated/40 p-4 no-print">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                <UIcon name="i-lucide-hard-hat" class="align-[-2px] text-primary" />
                On site · step {{ activeIndex + 1 }} of {{ modules.length }} · {{ active.stage }}
              </p>
              <div class="flex gap-1">
                <UButton v-if="prevModule" size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-left" :label="prevModule.short" @click="activeKey = prevModule.key" />
                <UButton v-if="nextModule" size="xs" color="neutral" variant="outline" trailing-icon="i-lucide-arrow-right" :label="`Next: ${nextModule.short}`" @click="activeKey = nextModule.key" />
              </div>
            </div>
            <p class="mt-2 text-sm">
              {{ active.onSite }}
            </p>
            <p v-if="nextModule" class="mt-1 text-xs text-muted">
              Then: {{ nextModule.name.toLowerCase() }}.
            </p>
            <p v-else class="mt-1 text-xs text-muted">
              This is the last element here. Roofing, doors, windows and services are priced in the full BQ.
            </p>
          </div>

          <div class="formula-block">
            <div v-for="(f, i) in active.formula" :key="i">
              {{ f }}
            </div>
          </div>

          <form class="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print" @submit.prevent="run">
            <UFormField
              v-for="input in active.inputs"
              :key="input.key"
              :label="`${input.label}${input.unit ? ` (${input.unit})` : ''}`"
              :hint="input.default !== undefined && input.type !== 'mix' && input.type !== 'select' ? `default ${input.default}` : undefined"
              :help="input.help"
              :required="input.required"
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
                :placeholder="input.required ? 'e.g. 45' : undefined"
                class="w-full"
              />
            </UFormField>
            <div class="sm:col-span-2">
              <UButton type="submit" block size="lg" color="neutral" icon="i-lucide-zap" :loading="running" :label="`Calculate ${active.name}`" />
            </div>
          </form>

          <div v-if="result" class="space-y-5">
            <UAlert v-for="(w, i) in result.warnings" :key="i" color="warning" variant="subtle" icon="i-lucide-triangle-alert" :title="w" />

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="line in result.lines" :key="line.label" class="rounded-lg border border-default p-3" :class="line.emphasis ? 'bg-primary/5 border-primary/40' : ''">
                <p class="text-xs text-muted">
                  {{ line.label }}
                </p>
                <p class="mt-1 text-lg font-semibold tabular-nums text-highlighted">
                  {{ formatNumber(line.value, 3) }} <span class="text-xs font-normal text-muted">{{ line.unit }}</span>
                </p>
              </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-default">
              <table class="bq-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th class="num">
                      Net qty
                    </th>
                    <th class="num">
                      Order (+{{ settings.wastagePercent }}%)
                    </th>
                    <th class="num">
                      Unit price
                    </th>
                    <th class="num">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in result.materials" :key="m.materialKey">
                    <td>
                      {{ m.label }}
                      <UBadge v-if="m.priceSource === 'location'" size="sm" variant="subtle" color="info" label="local price" class="ms-1" />
                      <UBadge v-else-if="m.priceSource === 'override'" size="sm" variant="subtle" color="warning" label="your rate" class="ms-1" />
                      <UBadge v-else-if="m.priceSource === 'missing'" size="sm" variant="subtle" color="error" label="no price" class="ms-1" />
                    </td>
                    <td class="num">
                      {{ formatNumber(m.netQuantity, 3) }}
                    </td>
                    <td class="num font-semibold">
                      {{ formatNumber(m.quantity, 2) }} {{ m.unit }}
                    </td>
                    <td class="num">
                      {{ formatMoney(m.unitPrice, currency) }}
                    </td>
                    <td class="num">
                      {{ formatMoney(m.amount, currency) }}
                    </td>
                  </tr>
                  <tr v-if="!result.materials.length">
                    <td colspan="5" class="text-center text-muted">
                      This element is labour/measurement only; no materials.
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="result.materials.length">
                  <tr>
                    <td colspan="4" class="font-semibold">
                      Estimated material cost
                    </td>
                    <td class="num font-bold text-primary">
                      {{ formatMoney(result.materialsTotal, currency) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <p class="text-sm font-semibold mb-2">
                BQ items from this calculation
              </p>
              <ul class="text-sm divide-y divide-default rounded-lg border border-default">
                <li v-for="(b, i) in result.bqLines" :key="i" class="flex justify-between gap-4 px-3 py-2">
                  <span>{{ b.description }}</span>
                  <span class="tabular-nums whitespace-nowrap font-medium">{{ formatNumber(b.quantity, 2) }} {{ b.unit }}</span>
                </li>
              </ul>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 no-print">
              <UButton v-if="loggedIn && !embedded" class="flex-1 justify-center" icon="i-lucide-file-plus" label="Add to a BQ project" @click="openPush" />
              <UButton v-else-if="!embedded" class="flex-1 justify-center" color="neutral" variant="outline" icon="i-lucide-log-in" label="Sign in to add these to a BQ" :to="`/login?redirect=/calculators`" />
              <UButton class="flex-1 justify-center" color="neutral" variant="outline" icon="i-lucide-printer" label="Print / save PDF report" @click="printReport" />
            </div>
          </div>
        </template>
      </div>
    </UCard>

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
