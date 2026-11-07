<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Materials & prices | Admin' })

const { data: config } = await useBqConfig()
const { call, toast } = useApi()
const { data: current, refresh: refreshCurrent } = await useFetch<Record<string, { price: number, source: string }>>('/api/admin/material-prices', { server: false, default: () => ({}) })

const tab = ref('materials')
const tabs = [
  { label: 'Materials & prices', value: 'materials', icon: 'i-lucide-package' },
  { label: 'Mix designs', value: 'mixes', icon: 'i-lucide-flask-conical' }
]

interface Material { id: number, key: string, name: string, unit: string }
const priceOpen = ref(false)
const priceMaterial = ref<Material | null>(null)
const priceForm = reactive({ locationId: 0, price: 0, effectiveFrom: new Date().toISOString().slice(0, 10), source: '' })
const history = ref<{ id: number, price: number, effectiveFrom: string, source: string, locationName: string | null }[]>([])

async function openPrices(row: Record<string, unknown>) {
  priceMaterial.value = row as unknown as Material
  Object.assign(priceForm, { locationId: 0, price: current.value[String(row.key)]?.price ?? 0, effectiveFrom: new Date().toISOString().slice(0, 10), source: '' })
  history.value = await call(`/api/admin/material-prices?materialId=${row.id}`)
  page.value = 1
  priceOpen.value = true
}
async function savePrice() {
  if (!priceMaterial.value) return
  await call('/api/admin/material-prices', { method: 'POST', body: { ...priceForm, locationId: priceForm.locationId || null, materialId: priceMaterial.value.id } })
  toast.add({ title: 'Price recorded', color: 'success', icon: 'i-lucide-check' })
  history.value = await call(`/api/admin/material-prices?materialId=${priceMaterial.value.id}`)
  await refreshCurrent()
}
const refreshConfig = () => refreshNuxtData('bq-config')
const { rows: pagedHistory, page, pageSize, total, from, to } = usePaged(history, 'admin:price-history')
</script>

<template>
  <UDashboardPanel id="admin-materials">
    <template #header>
      <UDashboardNavbar title="Materials & prices" />
    </template>
    <template #body>
      <UTabs v-model="tab" :items="tabs" variant="link" :content="false" />

      <AdminRefTable
        v-if="tab === 'materials'"
        name="materials"
        title="Materials"
        description="Keys are used by the calculator formulas (cement, sand, ballast, y12, brc_a142, stone_200...). Prices are effective-dated; add a location price to override the national price in one town."
        :columns="[
          { key: 'key', label: 'Key', createOnly: true },
          { key: 'name', label: 'Name' },
          { key: 'unit', label: 'Unit' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description', type: 'textarea', formOnly: true },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true },
          { key: 'active', label: 'Active', type: 'boolean', inline: true }
        ]"
        :defaults="{ category: 'General', unit: 'piece' }"
      >
        <template #extra-head>
          <th class="num">
            National price
          </th>
          <th />
        </template>
        <template #extra-cells="{ row }">
          <td class="num tabular-nums">
            {{ current[String(row.key)] ? formatNumber(current[String(row.key)]!.price, 2) : '—' }}
          </td>
          <td>
            <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-tag" label="Prices" @click="openPrices(row)" />
          </td>
        </template>
      </AdminRefTable>

      <AdminRefTable
        v-else
        name="mixes"
        title="Mix designs"
        description="Concrete (cement : sand : ballast) and mortar (cement : sand) ratios offered in the calculators."
        :columns="[
          { key: 'key', label: 'Key', createOnly: true },
          { key: 'name', label: 'Name' },
          { key: 'kind', label: 'Kind', type: 'select', options: [{ label: 'Concrete', value: 'concrete' }, { label: 'Mortar', value: 'mortar' }] },
          { key: 'cement', label: 'Cement', type: 'number' },
          { key: 'sand', label: 'Sand', type: 'number' },
          { key: 'ballast', label: 'Ballast', type: 'number' },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true },
          { key: 'active', label: 'Active', type: 'boolean', inline: true }
        ]"
        :defaults="{ kind: 'concrete', cement: 1, sand: 2, ballast: 4 }"
        @changed="refreshConfig"
      />

      <UModal v-model:open="priceOpen" :title="`Prices: ${priceMaterial?.name}`" :description="`Per ${priceMaterial?.unit}. The latest effective price applies; history is kept.`" :ui="{ content: 'sm:max-w-2xl' }">
        <template #body>
          <form class="grid sm:grid-cols-2 gap-4" @submit.prevent="savePrice">
            <UFormField label="Applies to">
              <USelect v-model="priceForm.locationId" :items="[{ label: 'National (default)', value: 0 }, ...locationSelectItems(config)]" class="w-full" />
            </UFormField>
            <UFormField :label="`Price (${config?.countries[0]?.currency ?? 'KES'})`">
              <UInput v-model.number="priceForm.price" type="number" min="0" step="0.01" class="w-full" />
            </UFormField>
            <UFormField label="Effective from">
              <UInput v-model="priceForm.effectiveFrom" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Source">
              <UInput v-model="priceForm.source" placeholder="Supplier quote, market survey..." class="w-full" />
            </UFormField>
            <div class="sm:col-span-2">
              <UButton type="submit" icon="i-lucide-plus" label="Record price" />
            </div>
          </form>
          <div class="mt-5 rounded-lg border border-default">
            <table class="bq-table">
              <thead>
                <tr>
                  <th>Applies to</th><th class="num">
                    Price
                  </th><th>Effective</th><th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in pagedHistory" :key="h.id">
                  <td>{{ h.locationName ?? 'National' }}</td>
                  <td class="num">
                    {{ formatNumber(h.price, 2) }}
                  </td>
                  <td>{{ h.effectiveFrom }}</td>
                  <td class="text-muted">
                    {{ h.source }}
                  </td>
                </tr>
              </tbody>
            </table>
            <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="prices" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
