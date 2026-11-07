<script setup lang="ts">
import { PREREQUISITES, readiness, computeDrivers, DEFAULT_PARAMS, DRIVERS, type PrereqStatus } from '#shared/calc/bq'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useSeoMeta({ title: 'New BQ | Davecore BQ' })

const route = useRoute()
const { data: config } = await useBqConfig()
const { user } = useUserSession()
const { call } = useApi()

const step = ref(0)
const steps = [
  { title: 'Prerequisites', icon: 'i-lucide-list-checks' },
  { title: 'Project', icon: 'i-lucide-building-2' },
  { title: 'Building', icon: 'i-lucide-ruler' },
  { title: 'Review', icon: 'i-lucide-file-check-2' }
]

const prereq = reactive<Record<string, PrereqStatus>>(Object.fromEntries(PREREQUISITES.map(p => [p.key, 'missing'])))
const score = computed(() => readiness(prereq))

const areasFromQuery = String(route.query.areas ?? '').split(',').map(Number).filter(n => n > 0)
const form = reactive({
  name: '',
  client: '',
  siteAddress: '',
  preparedBy: user.value?.name ?? '',
  locationId: Number(route.query.location) || (undefined as number | undefined),
  buildingTypeKey: String(route.query.type ?? 'bungalow'),
  finishKey: String(route.query.finish ?? 'standard'),
  contingencyPercent: 5,
  vatPercent: config.value?.countries[0]?.vatPercent ?? 16,
  generate: true
})
const params = reactive({ ...DEFAULT_PARAMS, floorAreas: areasFromQuery.length ? areasFromQuery : [...DEFAULT_PARAMS.floorAreas] })

const buildingType = computed(() => config.value?.buildingTypes.find(b => b.key === form.buildingTypeKey))
const floorCount = computed({
  get: () => params.floorAreas.length,
  set: (n: number) => {
    const count = Math.max(1, Math.min(100, Math.round(Number(n) || 1)))
    const last = params.floorAreas[params.floorAreas.length - 1] ?? 120
    params.floorAreas = Array.from({ length: count }, (_, i) => params.floorAreas[i] ?? last)
  }
})
watch(() => form.buildingTypeKey, () => {
  const bt = buildingType.value
  if (bt && (floorCount.value < bt.minFloors || floorCount.value > bt.maxFloors)) floorCount.value = bt.defaultFloors
})

const drivers = computed(() => computeDrivers({ ...params, floorAreas: params.floorAreas.map(Number) }))
const shownDrivers = ['total_floor_area', 'ext_perimeter', 'foundation_length', 'trench_volume', 'ext_wall_area', 'int_wall_area', 'roof_area', 'window_area']

const statusOptions: { value: PrereqStatus, label: string, color: 'success' | 'warning' | 'error' }[] = [
  { value: 'have', label: 'Have it', color: 'success' },
  { value: 'partial', label: 'Partly', color: 'warning' },
  { value: 'missing', label: 'Not yet', color: 'error' }
]

const canNext = computed(() => {
  if (step.value === 1) return form.name.trim().length > 0 && !!form.locationId
  if (step.value === 2) return params.floorAreas.some(a => Number(a) > 0)
  return true
})

const creating = ref(false)
async function create() {
  creating.value = true
  try {
    const { id } = await call<{ id: string }>('/api/projects', {
      method: 'POST',
      body: { ...form, currency: config.value?.countries[0]?.currency ?? 'KES', prerequisites: prereq, params: { ...params, floorAreas: params.floorAreas.map(Number) } }
    })
    await navigateTo(`/projects/${id}`)
  }
  finally { creating.value = false }
}
</script>

<template>
  <UDashboardPanel id="new-project">
    <template #header>
      <UDashboardNavbar title="New Bill of Quantities">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/projects" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="config" class="max-w-3xl w-full mx-auto space-y-6">
        <!-- Stepper -->
        <ol class="grid grid-cols-4 gap-2">
          <li v-for="(s, i) in steps" :key="s.title">
            <button
              type="button"
              class="w-full flex flex-col sm:flex-row items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
              :class="i === step ? 'border-primary bg-primary/10 text-highlighted' : i < step ? 'border-default text-default' : 'border-default text-dimmed'"
              :disabled="i > step"
              @click="step = i"
            >
              <UIcon :name="i < step ? 'i-lucide-circle-check' : s.icon" :class="i < step ? 'text-success' : ''" />
              <span class="font-medium">{{ s.title }}</span>
            </button>
          </li>
        </ol>

        <!-- Step 1: prerequisites -->
        <UCard v-show="step === 0">
          <template #header>
            <h2 class="font-semibold text-lg">
              What do you have?
            </h2>
            <p class="text-sm text-muted">
              Tell us which documents are available. The BQ will be drafted to match: missing information becomes provisional sums and stated assumptions instead of being guessed silently.
            </p>
          </template>
          <div class="space-y-4">
            <div v-for="p in PREREQUISITES" :key="p.key" class="rounded-lg border border-default p-4">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ p.label }} <UBadge v-if="p.essential" size="sm" variant="subtle" label="Essential" class="ms-1" />
                  </p>
                  <p class="text-sm text-muted mt-1">
                    {{ p.why }}
                  </p>
                </div>
                <div class="flex gap-1 shrink-0">
                  <UButton
                    v-for="o in statusOptions"
                    :key="o.value"
                    size="sm"
                    :label="o.label"
                    :color="prereq[p.key] === o.value ? o.color : 'neutral'"
                    :variant="prereq[p.key] === o.value ? 'solid' : 'outline'"
                    @click="prereq[p.key] = o.value"
                  />
                </div>
              </div>
              <p v-if="prereq[p.key] !== 'have'" class="text-xs text-warning mt-2">
                <UIcon name="i-lucide-info" class="align-[-2px]" /> {{ p.ifMissing }}
              </p>
            </div>
          </div>
          <template #footer>
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium">Readiness: {{ score.level }}</span>
                  <span class="tabular-nums">{{ score.percent }}%</span>
                </div>
                <UProgress :model-value="score.percent" :color="score.percent >= 85 ? 'success' : score.percent >= 55 ? 'warning' : 'error'" />
              </div>
            </div>
          </template>
        </UCard>

        <!-- Step 2: project -->
        <UCard v-show="step === 1">
          <template #header>
            <h2 class="font-semibold text-lg">
              Project details
            </h2>
          </template>
          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField label="Project name" required class="sm:col-span-2">
              <UInput v-model="form.name" placeholder="e.g. Proposed 4-bedroom maisonette, Ruiru" class="w-full" />
            </UFormField>
            <UFormField label="Client">
              <UInput v-model="form.client" class="w-full" />
            </UFormField>
            <UFormField label="Prepared by">
              <UInput v-model="form.preparedBy" class="w-full" />
            </UFormField>
            <UFormField label="Site address / plot" class="sm:col-span-2">
              <UInput v-model="form.siteAddress" placeholder="e.g. Plot LR 1234/56, Ruiru" class="w-full" />
            </UFormField>
            <UFormField label="Rate location" required help="Sets the regional rate level.">
              <USelect v-model="form.locationId" :items="locationSelectItems(config)" placeholder="Select location" class="w-full" />
            </UFormField>
            <UFormField label="Finish level" help="Prices finishes and fittings.">
              <USelect v-model="form.finishKey" :items="config.finishes.map(f => ({ label: f.label, value: f.key }))" class="w-full" />
            </UFormField>
            <UFormField label="Building type" class="sm:col-span-2">
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="bt in config.buildingTypes"
                  :key="bt.key"
                  type="button"
                  class="rounded-lg border p-3 text-left text-sm"
                  :class="form.buildingTypeKey === bt.key ? 'border-primary bg-primary/5' : 'border-default'"
                  @click="form.buildingTypeKey = bt.key"
                >
                  <BuildingIcon :type="bt.key" class="h-7 text-primary/80 mb-1" />
                  <span class="font-medium">{{ bt.label }}</span>
                </button>
              </div>
            </UFormField>
            <UFormField label="Contingency (%)">
              <UInput v-model.number="form.contingencyPercent" type="number" min="0" max="50" class="w-full" />
            </UFormField>
            <UFormField label="VAT (%)">
              <UInput v-model.number="form.vatPercent" type="number" min="0" max="50" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Step 3: building parameters -->
        <UCard v-show="step === 2">
          <template #header>
            <h2 class="font-semibold text-lg">
              Building parameters
            </h2>
            <p class="text-sm text-muted">
              Used to measure a first draft. {{ prereq.architectural === 'have' ? 'Take these from your architectural drawings.' : 'Without drawings, use your best estimates; quantities will be marked as approximate.' }}
            </p>
          </template>
          <div class="grid sm:grid-cols-2 gap-4">
            <UFormField label="Number of floors" :help="buildingType ? `${buildingType.label}: ${buildingType.minFloors}–${buildingType.maxFloors}` : ''">
              <UInput v-model.number="floorCount" type="number" :min="buildingType?.minFloors ?? 1" :max="buildingType?.maxFloors ?? 100" class="w-full" />
            </UFormField>
            <UFormField label="Storey (wall) height (m)">
              <UInput v-model.number="params.wallHeight" type="number" step="0.1" min="2" class="w-full" />
            </UFormField>
            <UFormField v-for="(_, i) in params.floorAreas" :key="i" :label="i === 0 ? 'Ground floor area (m²)' : `Floor ${i + 1} area (m²)`">
              <UInput v-model.number="params.floorAreas[i]" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="External perimeter (m)" help="0 = estimate from the ground floor area">
              <UInput v-model.number="params.perimeter" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Foundation depth (m)">
              <UInput v-model.number="params.foundationDepth" type="number" step="0.1" min="0.3" class="w-full" />
            </UFormField>
            <UFormField label="Number of doors">
              <UInput v-model.number="params.doors" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Number of windows">
              <UInput v-model.number="params.windows" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Average window size (m²)">
              <UInput v-model.number="params.windowSize" type="number" step="0.1" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Internal walls (m per m² of floor)" help="Typical homes: 0.3–0.4">
              <UInput v-model.number="params.internalWallRatio" type="number" step="0.05" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Roof overhang (m)">
              <UInput v-model.number="params.roofOverhang" type="number" step="0.1" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Roof slope factor" help="1.0 flat · 1.15 ≈ 30° pitch">
              <UInput v-model.number="params.roofPitchFactor" type="number" step="0.01" min="1" class="w-full" />
            </UFormField>
          </div>
          <template #footer>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Derived quantities
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div v-for="k in shownDrivers" :key="k" class="rounded-md bg-elevated/60 px-3 py-2">
                <p class="text-[11px] text-muted leading-tight">
                  {{ DRIVERS[k] }}
                </p>
                <p class="font-semibold tabular-nums">
                  {{ formatNumber(drivers[k], 2) }}
                </p>
              </div>
            </div>
          </template>
        </UCard>

        <!-- Step 4: review -->
        <UCard v-show="step === 3">
          <template #header>
            <h2 class="font-semibold text-lg">
              Review &amp; draft
            </h2>
          </template>
          <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Project
              </dt><dd>{{ form.name }}</dd>
            </div>
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Location
              </dt><dd>{{ config.locations.find(l => l.id === form.locationId)?.name }}</dd>
            </div>
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Building
              </dt><dd>{{ buildingType?.label }}, {{ params.floorAreas.length }} floor(s)</dd>
            </div>
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Total floor area
              </dt><dd>{{ formatNumber(drivers.total_floor_area, 1) }} m²</dd>
            </div>
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Finish
              </dt><dd>{{ config.finishes.find(f => f.key === form.finishKey)?.label }}</dd>
            </div>
            <div class="flex justify-between border-b border-default py-1.5">
              <dt class="text-muted">
                Readiness
              </dt><dd>{{ score.level }} ({{ score.percent }}%)</dd>
            </div>
          </dl>
          <UAlert
            v-if="score.missing.length"
            class="mt-4"
            color="warning"
            variant="subtle"
            icon="i-lucide-info"
            title="The draft will state these assumptions"
          >
            <template #description>
              <ul class="list-disc ms-4 mt-1 space-y-0.5">
                <li v-for="m in score.missing" :key="m.key">
                  {{ m.ifMissing }}
                </li>
              </ul>
            </template>
          </UAlert>
          <div class="mt-4">
            <USwitch v-model="form.generate" label="Draft standard bills with measured items" description="Turn off to start with empty bills and measure everything yourself." />
          </div>
        </UCard>

        <div class="flex justify-between">
          <UButton v-if="step > 0" color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Back" @click="step--" />
          <span v-else />
          <UButton v-if="step < steps.length - 1" :disabled="!canNext" trailing-icon="i-lucide-arrow-right" label="Continue" @click="step++" />
          <UButton v-else :loading="creating" icon="i-lucide-sparkles" :label="form.generate ? 'Draft my BQ' : 'Create empty BQ'" @click="create" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
