<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Locations & rates | Admin' })

interface Tier { id: number, countryCode: string, key: string, label: string }
interface Rate { id: number, tierId: number, finishKey: string, minRate: number, maxRate: number, effectiveFrom: string, note: string, recordedAt: string }
const { data: tiers, refresh: refreshTiers } = await useFetch<Tier[]>('/api/admin/ref/tiers', { default: () => [], server: false })
const { data: finishes, refresh: refreshFinishes } = await useFetch<{ key: string, label: string }[]>('/api/admin/ref/finishes', { default: () => [], server: false })
const { data: countries } = await useFetch<{ code: string, name: string }[]>('/api/admin/ref/countries', { default: () => [], server: false })
const { data: rates, refresh: refreshRates } = await useFetch<{ current: Rate[], history: Rate[] }>('/api/admin/cost-rates', { server: false })
const { call, toast } = useApi()

const tab = ref('rates')
const tabs = [
  { label: 'Cost per m²', value: 'rates', icon: 'i-lucide-coins' },
  { label: 'Locations', value: 'locations', icon: 'i-lucide-map-pin' },
  { label: 'Finishes & building types', value: 'types', icon: 'i-lucide-building' },
  { label: 'Estimator add-ons', value: 'addons', icon: 'i-lucide-percent' }
]

function band(tierId: number, finishKey: string) {
  return rates.value?.current.find(r => r.tierId === tierId && r.finishKey === finishKey)
}

const rateOpen = ref(false)
const rateForm = reactive({ tierId: 0, finishKey: '', minRate: 0, maxRate: 0, effectiveFrom: new Date().toISOString().slice(0, 10), note: '' })
function editBand(tierId: number, finishKey: string) {
  const b = band(tierId, finishKey)
  Object.assign(rateForm, { tierId, finishKey, minRate: b?.minRate ?? 0, maxRate: b?.maxRate ?? 0, effectiveFrom: new Date().toISOString().slice(0, 10), note: '' })
  rateOpen.value = true
}
async function saveRate() {
  await call('/api/admin/cost-rates', { method: 'POST', body: rateForm })
  rateOpen.value = false
  toast.add({ title: 'New rate recorded', color: 'success', icon: 'i-lucide-check' })
  await refreshRates()
  refreshNuxtData('bq-config')
}

const { rows: pagedHistory, page, pageSize, total, from, to } = usePaged(() => rates.value?.history ?? [], 'admin:rate-history')
const tierLabel = (id: number) => tiers.value.find(t => t.id === id)?.label ?? id
const finishLabel = (k: string) => finishes.value.find(f => f.key === k)?.label ?? k
const refreshConfig = () => refreshNuxtData('bq-config')
</script>

<template>
  <UDashboardPanel id="admin-rates">
    <template #header>
      <UDashboardNavbar title="Locations & rates" />
    </template>
    <template #body>
      <UTabs v-model="tab" :items="tabs" variant="link" :content="false" />

      <template v-if="tab === 'rates'">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <h3 class="font-semibold">
              Current cost-per-m² bands
            </h3>
            <p class="text-sm text-muted">
              Click a band to record a new effective-dated rate. History is kept; the latest effective band is used by the Cost Calculator, and the standard-finish midpoints scale BQ library rates regionally.
            </p>
          </template>
          <div class="overflow-x-auto">
            <table class="bq-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Finish</th>
                  <th v-for="t in tiers" :key="t.id">
                    {{ t.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in finishes" :key="f.key">
                  <td class="font-medium">
                    {{ f.label }}
                  </td>
                  <td v-for="t in tiers" :key="t.id">
                    <button type="button" class="w-full text-left rounded-md px-2 py-1.5 hover:bg-elevated tabular-nums" @click="editBand(t.id, f.key)">
                      <template v-if="band(t.id, f.key)">
                        {{ formatNumber(band(t.id, f.key)!.minRate, 0) }} – {{ formatNumber(band(t.id, f.key)!.maxRate, 0) }}
                        <span class="block text-[11px] text-muted">from {{ band(t.id, f.key)!.effectiveFrom }}</span>
                      </template>
                      <span v-else class="text-warning">Set rate</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <h3 class="font-semibold">
              Rate history
            </h3>
          </template>
          <div class="overflow-x-auto">
            <table class="bq-table">
              <thead>
                <tr>
                  <th>Tier</th><th>Finish</th><th class="num">
                    Min
                  </th><th class="num">
                    Max
                  </th><th>Effective</th><th>Note</th><th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in pagedHistory" :key="r.id">
                  <td>{{ tierLabel(r.tierId) }}</td><td>{{ finishLabel(r.finishKey) }}</td>
                  <td class="num">
                    {{ formatNumber(r.minRate, 0) }}
                  </td><td class="num">
                    {{ formatNumber(r.maxRate, 0) }}
                  </td>
                  <td>{{ r.effectiveFrom }}</td><td class="text-muted">
                    {{ r.note }}
                  </td><td class="text-muted">
                    {{ new Date(r.recordedAt).toLocaleDateString('en-KE') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="rate records" />
        </UCard>
      </template>

      <template v-else-if="tab === 'locations'">
        <AdminRefTable
          name="tiers"
          title="Rate tiers"
          description="Groups of locations that share a cost band (e.g. Nairobi, other urban, rural)."
          :columns="[
            { key: 'countryCode', label: 'Country', type: 'select', options: countries.map(c => ({ label: c.name, value: c.code })) },
            { key: 'key', label: 'Key', help: 'lowercase, e.g. urban' },
            { key: 'label', label: 'Label' },
            { key: 'sort', label: 'Order', type: 'number', step: 1 }
          ]"
          :defaults="{ countryCode: 'KE' }"
          @changed="() => { refreshTiers(); refreshConfig() }"
        />
        <AdminRefTable
          name="locations"
          title="Locations"
          description="Adjustment % lifts or lowers the tier band for a specific town (e.g. +10% Westlands, +8% remote areas)."
          :columns="[
            { key: 'name', label: 'Location' },
            { key: 'tierId', label: 'Tier', type: 'select', options: tiers.map(t => ({ label: t.label, value: t.id })) },
            { key: 'adjustmentPercent', label: 'Adjustment %', type: 'number', step: 0.5 },
            { key: 'sort', label: 'Order', type: 'number', step: 1 },
            { key: 'active', label: 'Active', type: 'boolean', inline: true }
          ]"
          :defaults="{ tierId: tiers[0]?.id, adjustmentPercent: 0 }"
          @changed="refreshConfig"
        />
        <AdminRefTable
          name="countries"
          pk="code"
          title="Countries"
          description="Rates are priced natively in each country's currency."
          :columns="[
            { key: 'code', label: 'Code', createOnly: true, help: 'ISO, e.g. KE' },
            { key: 'name', label: 'Name' },
            { key: 'currency', label: 'Currency', help: 'ISO, e.g. KES' },
            { key: 'vatPercent', label: 'VAT %', type: 'number' },
            { key: 'active', label: 'Active', type: 'boolean', inline: true }
          ]"
          @changed="refreshConfig"
        />
      </template>

      <template v-else-if="tab === 'types'">
        <AdminRefTable
          name="finishes"
          pk="key"
          title="Finish levels"
          description="Labour % is added on top of the material cost in the Cost Calculator."
          :columns="[
            { key: 'key', label: 'Key', createOnly: true },
            { key: 'label', label: 'Label' },
            { key: 'description', label: 'Description' },
            { key: 'labourPercent', label: 'Labour %', type: 'number' },
            { key: 'sort', label: 'Order', type: 'number', step: 1 }
          ]"
          @changed="() => { refreshFinishes(); refreshConfig() }"
        />
        <AdminRefTable
          name="building_types"
          pk="key"
          title="Building types"
          description="Factor multiplies the cost per m² (e.g. 1.05 for apartment structure)."
          :columns="[
            { key: 'key', label: 'Key', createOnly: true },
            { key: 'label', label: 'Label' },
            { key: 'description', label: 'Description', type: 'textarea', formOnly: true },
            { key: 'factor', label: 'Factor', type: 'number', step: 0.01 },
            { key: 'defaultFloors', label: 'Default floors', type: 'number', step: 1 },
            { key: 'minFloors', label: 'Min floors', type: 'number', step: 1 },
            { key: 'maxFloors', label: 'Max floors', type: 'number', step: 1 },
            { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true },
            { key: 'active', label: 'Active', type: 'boolean', inline: true }
          ]"
          @changed="refreshConfig"
        />
      </template>

      <template v-else-if="tab === 'addons'">
        <AdminRefTable
          name="addons"
          pk="key"
          title="Estimator add-ons"
          description="Percentages added to the construction cost (contingency, fees...). Homeowners can tick them on/off."
          :columns="[
            { key: 'key', label: 'Key', createOnly: true },
            { key: 'label', label: 'Label' },
            { key: 'description', label: 'Description', formOnly: true },
            { key: 'percent', label: 'Percent', type: 'number' },
            { key: 'enabledByDefault', label: 'On by default', type: 'boolean', inline: true },
            { key: 'sort', label: 'Order', type: 'number', step: 1 }
          ]"
          @changed="refreshConfig"
        />
        <AdminRefTable
          name="elements"
          pk="key"
          title="Elemental cost split"
          description="How the construction cost is broken down in the estimator result. Percentages are normalised to 100%."
          :columns="[
            { key: 'key', label: 'Key', createOnly: true },
            { key: 'label', label: 'Element' },
            { key: 'percent', label: 'Percent', type: 'number' },
            { key: 'sort', label: 'Order', type: 'number', step: 1 }
          ]"
          @changed="refreshConfig"
        />
      </template>

      <UModal v-model:open="rateOpen" :title="`New rate: ${finishLabel(rateForm.finishKey)}, ${tierLabel(rateForm.tierId)}`">
        <template #body>
          <form id="rate-form" class="grid grid-cols-2 gap-4" @submit.prevent="saveRate">
            <UFormField label="Minimum per m²">
              <UInput v-model.number="rateForm.minRate" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Maximum per m²">
              <UInput v-model.number="rateForm.maxRate" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Effective from">
              <UInput v-model="rateForm.effectiveFrom" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Note / source">
              <UInput v-model="rateForm.note" placeholder="e.g. Q1 2027 market survey" class="w-full" />
            </UFormField>
          </form>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="rateOpen = false" />
            <UButton type="submit" form="rate-form" label="Record rate" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
