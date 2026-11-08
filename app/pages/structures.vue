<script setup lang="ts">
import { STRUCTURE_LIST } from '#shared/calc/structures'

/*
 * Other structures: boundary walls, latrines, septic tanks, soak pits, fences, paving, tank stands,
 * sheds and standalone plumbing / electrical installations. Priced on the server with the admin's
 * constants, material prices and BQ library; can be turned into a BQ project.
 */
useSeoMeta({ title: 'Other structures | Kadiria', description: 'Cost, materials and a Bill of Quantities for boundary walls, pit latrines, septic tanks, fences, paving, tank stands, sheds, plumbing and electrical works.' })

interface PricedLine { billKey: string, section?: string, description: string, unit: string, quantity: number, rate: number, amount: number, rateSource: 'materials' | 'library' | 'none' }
interface PricedMaterial { materialKey: string, label: string, unit: string, quantity: number, unitPrice: number | null, amount: number | null }
interface Run {
  structure: { key: string, name: string, group: string }
  summary: { label: string, value: number, unit: string, emphasis?: boolean }[]
  warnings: string[]
  parts: { label: string, materials: PricedMaterial[], bqLines: PricedLine[], total: number }[]
  total: number
  missingPrices: { key: string, label: string }[]
}

const route = useRoute()
const router = useRouter()
const { data: config } = await useBqConfig()
const { loggedIn, user } = useUserSession()
const { call, toast } = useApi()

const groups = computed(() => {
  const g: Record<string, typeof STRUCTURE_LIST> = {}
  for (const s of STRUCTURE_LIST) (g[s.group] ??= []).push(s)
  return g
})
const key = computed(() => (STRUCTURE_LIST.some(s => s.key === route.query.type) ? String(route.query.type) : STRUCTURE_LIST[0]!.key))
const def = computed(() => STRUCTURE_LIST.find(s => s.key === key.value)!)
function pick(k: string) {
  router.replace({ query: { ...route.query, type: k } })
}

const inputs = reactive<Record<string, number | string>>({})
function resetInputs() {
  for (const k of Object.keys(inputs)) delete inputs[k]
  for (const i of def.value.inputs) inputs[i.key] = i.default ?? (i.type === 'select' ? String(i.options?.[0]?.value ?? '') : 0)
}
watch(key, resetInputs, { immediate: true })

const locationId = ref<number | undefined>(config.value?.locations[0]?.id)
const locationItems = computed(() => (config.value?.locations ?? []).map(l => ({ label: l.name, value: l.id })))

const result = ref<Run | null>(null)
const loading = ref(false)
const error = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
async function compute() {
  loading.value = true
  error.value = ''
  try {
    result.value = await $fetch<Run>(`/api/public/structures/${key.value}`, { method: 'POST', body: { inputs: { ...inputs }, locationId: locationId.value ?? null } })
  }
  catch (e) {
    error.value = errorMessage(e)
  }
  finally {
    loading.value = false
  }
}
watch([() => ({ ...inputs }), locationId, key], () => {
  clearTimeout(timer)
  timer = setTimeout(compute, 350)
}, { deep: true, immediate: true })

const materials = computed(() => {
  const map = new Map<string, PricedMaterial>()
  for (const m of (result.value?.parts ?? []).flatMap(p => p.materials)) {
    const ex = map.get(m.materialKey)
    if (ex) {
      ex.quantity = Math.round((ex.quantity + m.quantity) * 100) / 100
      ex.amount = ex.amount === null || m.amount === null ? null : Math.round((ex.amount + m.amount) * 100) / 100
    }
    else map.set(m.materialKey, { ...m })
  }
  return [...map.values()]
})
const money = (v: number | null | undefined) => (v === null || v === undefined ? '—' : Math.round(v).toLocaleString('en-KE'))
const tab = ref<'bq' | 'materials'>('bq')

// Create a BQ project from this structure
const open = ref(false)
const form = reactive({ name: '', client: '', measurementStandard: 'smm_ea' })
const { data: standards } = await useFetch<{ key: string, code: string, name: string }[]>('/api/standards', { default: () => [] })
const creating = ref(false)
watch(open, (o) => { if (o && !form.name) form.name = def.value.name })
async function createBq() {
  creating.value = true
  try {
    const res = await call<{ id: string }>(`/api/structures/${key.value}/project`, { method: 'POST', body: { ...form, inputs: { ...inputs }, locationId: locationId.value ?? null } })
    toast.add({ title: 'BQ drafted', description: `${form.name} is ready to review.`, color: 'success', icon: 'i-lucide-check' })
    await navigateTo(`/projects/${res.id}`)
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div>
      <p class="text-xs uppercase tracking-[0.14em] text-muted">
        Kadiria · Other structures
      </p>
      <h1 class="font-display text-3xl font-bold mt-1">
        Walls, latrines, tanks, services and more
      </h1>
      <p class="text-muted mt-2 max-w-3xl">
        Not every job is a house. Pick a structure, give its size, and get the cost, the materials to buy and a ready Bill of Quantities, priced with the same rates and material prices as the house calculators.
      </p>
    </div>

    <div class="grid lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
      <!-- Structure list -->
      <nav class="rounded-lg border border-default overflow-hidden" aria-label="Structures">
        <template v-for="(list, group) in groups" :key="group">
          <p class="px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted bg-elevated/40 border-b border-default">
            {{ group }}
          </p>
          <button
            v-for="s in list"
            :key="s.key"
            type="button"
            class="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 border-b border-default last:border-b-0"
            :class="key === s.key ? 'bg-primary/10 text-highlighted' : 'hover:bg-elevated/50'"
            :aria-current="key === s.key ? 'page' : undefined"
            @click="pick(s.key)"
          >
            <UIcon :name="s.icon" class="size-4 shrink-0" :class="key === s.key ? 'text-primary' : 'text-muted'" />
            {{ s.name }}
          </button>
        </template>
      </nav>

      <div class="space-y-4 min-w-0">
        <!-- Inputs -->
        <section class="rounded-lg border border-default p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-display text-xl font-semibold flex items-center gap-2">
                <UIcon :name="def.icon" class="text-primary" /> {{ def.name }}
              </h2>
              <p class="text-sm text-muted mt-0.5 max-w-2xl">
                {{ def.description }}
              </p>
            </div>
            <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" label="Reset" @click="resetInputs" />
          </div>
          <div class="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <UFormField label="Location (prices)">
              <USelect v-model="locationId" :items="locationItems" class="w-full" />
            </UFormField>
            <UFormField v-for="i in def.inputs" :key="i.key" :label="i.label" :hint="i.unit">
              <USelect v-if="i.type === 'select'" v-model="inputs[i.key] as string" :items="(i.options ?? []).map(o => ({ label: o.label, value: String(o.value) }))" class="w-full" />
              <UInputNumber v-else v-model="inputs[i.key] as number" :min="i.min ?? 0" :max="i.max" :step="i.step ?? 0.1" class="w-full" />
            </UFormField>
          </div>
        </section>

        <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

        <!-- Result -->
        <section v-if="result" class="rounded-lg border border-default" :class="loading ? 'opacity-70' : ''">
          <div class="p-4 flex flex-wrap items-end justify-between gap-4 border-b border-default">
            <div>
              <p class="text-xs uppercase tracking-wider text-muted">
                Estimated cost
              </p>
              <p class="font-display text-4xl font-bold mt-1">
                KES {{ money(result.total) }}
              </p>
              <p class="text-xs text-muted mt-1">
                Materials at current prices with wastage, plus labour and overheads; items without a material price use the BQ library rate.
              </p>
            </div>
            <div class="flex flex-wrap gap-4 text-sm">
              <div v-for="s in result.summary" :key="s.label + s.unit">
                <p class="text-xs text-muted">
                  {{ s.label }}
                </p>
                <p class="font-mono font-semibold">
                  {{ s.value.toLocaleString('en-KE') }} {{ s.unit }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <UButton v-if="loggedIn && config?.flags.bq_projects !== false" icon="i-lucide-file-spreadsheet" label="Create BQ" @click="open = true" />
              <UButton v-else-if="!loggedIn" :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`" color="neutral" variant="outline" icon="i-lucide-log-in" label="Sign in to create a BQ" />
            </div>
          </div>

          <UAlert
            v-if="result.missingPrices.length"
            class="m-4 mb-0"
            color="warning"
            variant="subtle"
            icon="i-lucide-tag"
            :title="`No price set for ${result.missingPrices.length} material${result.missingPrices.length === 1 ? '' : 's'}`"
            :description="`${result.missingPrices.map(m => m.label).join(', ')}. These are counted at zero until a price is entered${user?.role === 'admin' ? ' in Admin → Materials & prices' : ''}.`"
          />
          <UAlert v-for="(w, i) in result.warnings" :key="i" class="m-4 mb-0" color="warning" variant="subtle" icon="i-lucide-triangle-alert" :title="w" />

          <div class="px-4 pt-4 flex gap-1 border-b border-default" role="tablist">
            <button v-for="t in [{ v: 'bq', l: 'Bill of Quantities' }, { v: 'materials', l: `Materials (${materials.length})` }]" :key="t.v" type="button" role="tab" :aria-selected="tab === t.v" class="px-3 py-2 text-sm border-b-2 -mb-px" :class="tab === t.v ? 'border-primary text-highlighted font-medium' : 'border-transparent text-muted'" @click="tab = t.v as typeof tab">
              {{ t.l }}
            </button>
          </div>

          <div v-if="tab === 'bq'" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th class="px-4 py-2 font-medium">
                    Item
                  </th>
                  <th class="px-2 py-2 font-medium">
                    Unit
                  </th>
                  <th class="px-2 py-2 font-medium text-right">
                    Qty
                  </th>
                  <th class="px-2 py-2 font-medium text-right">
                    Rate
                  </th>
                  <th class="px-4 py-2 font-medium text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="p in result.parts" :key="p.label">
                  <tr class="bg-elevated/40">
                    <td colspan="4" class="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                      {{ p.label }}
                    </td>
                    <td class="px-4 py-1.5 text-right font-mono text-xs font-semibold">
                      {{ money(p.total) }}
                    </td>
                  </tr>
                  <tr v-for="(l, i) in p.bqLines" :key="i" class="border-t border-default align-top">
                    <td class="px-4 py-2">
                      {{ l.description }}
                      <UBadge v-if="l.rateSource === 'none'" size="sm" color="warning" variant="subtle" label="No price" class="ms-1" />
                    </td>
                    <td class="px-2 py-2">
                      {{ l.unit }}
                    </td>
                    <td class="px-2 py-2 text-right font-mono">
                      {{ l.quantity.toLocaleString('en-KE') }}
                    </td>
                    <td class="px-2 py-2 text-right font-mono">
                      {{ money(l.rate) }}
                    </td>
                    <td class="px-4 py-2 text-right font-mono">
                      {{ money(l.amount) }}
                    </td>
                  </tr>
                </template>
                <tr class="border-t-2 border-default font-semibold">
                  <td colspan="4" class="px-4 py-2 text-right">
                    Total
                  </td>
                  <td class="px-4 py-2 text-right font-mono">
                    {{ money(result.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th class="px-4 py-2 font-medium">
                    Material
                  </th>
                  <th class="px-2 py-2 font-medium text-right">
                    Quantity
                  </th>
                  <th class="px-2 py-2 font-medium">
                    Unit
                  </th>
                  <th class="px-2 py-2 font-medium text-right">
                    Unit price
                  </th>
                  <th class="px-4 py-2 font-medium text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in materials" :key="m.materialKey" class="border-t border-default">
                  <td class="px-4 py-2">
                    {{ m.label }}
                  </td>
                  <td class="px-2 py-2 text-right font-mono">
                    {{ m.quantity.toLocaleString('en-KE') }}
                  </td>
                  <td class="px-2 py-2">
                    {{ m.unit }}
                  </td>
                  <td class="px-2 py-2 text-right font-mono">
                    {{ money(m.unitPrice) }}
                  </td>
                  <td class="px-4 py-2 text-right font-mono">
                    {{ money(m.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="px-4 py-3 text-xs text-muted border-t border-default">
              Quantities include 5% wastage and are rounded to what you can buy. Labour is not in these material amounts.
            </p>
          </div>
        </section>
        <div v-else-if="loading" class="py-16 text-center text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        </div>
      </div>
    </div>

    <UModal v-model:open="open" title="Create a Bill of Quantities" :description="`Drafts a BQ from this ${def.name.toLowerCase()} with the quantities and rates shown.`">
      <template #body>
        <form id="structure-bq" class="space-y-3" @submit.prevent="createBq">
          <UFormField label="Project name" required>
            <UInput v-model="form.name" required class="w-full" />
          </UFormField>
          <UFormField label="Client">
            <UInput v-model="form.client" class="w-full" />
          </UFormField>
          <UFormField label="Method of measurement">
            <USelect v-model="form.measurementStandard" :items="standards.map(s => ({ label: `${s.code}: ${s.name}`, value: s.key }))" class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" form="structure-bq" :loading="creating" label="Create BQ" />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
