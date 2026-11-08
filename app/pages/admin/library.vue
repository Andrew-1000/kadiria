<script setup lang="ts">
import { DRIVERS } from '#shared/calc/bq'

definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'BQ library | Admin' })

const { data: bills, refresh: refreshBills } = await useFetch<{ key: string, title: string, number: number }[]>('/api/admin/ref/bill_templates', { default: () => [], server: false })
const billFilter = ref('all')
const filter = computed(() => billFilter.value === 'all' ? undefined : (r: Record<string, unknown>) => r.billKey === billFilter.value)
const itemTypes = Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const drivers = Object.entries(DRIVERS).map(([value, label]) => ({ value, label }))
// Section references under each method of measurement (Admin → Methods of measurement)
const { data: sections } = await useFetch<{ standardKey: string, code: string, title: string }[]>('/api/admin/ref/sections', { default: () => [], server: false })
const sectionOptions = (std: string) => [{ label: '—', value: '' }, ...sections.value.filter(s => s.standardKey === std).map(s => ({ label: `${s.code} · ${s.title}`, value: s.code }))]
const smmOptions = computed(() => sectionOptions('smm_ea'))
const cesmmOptions = computed(() => sectionOptions('cesmm4'))
</script>

<template>
  <UDashboardPanel id="admin-library">
    <template #header>
      <UDashboardNavbar title="BQ library" />
    </template>
    <template #body>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        title="How library items become a draft BQ"
        description="Each item's quantity is its driver × factor (e.g. foundation length × 0.12 = m³ of strip footing). Rates are Nairobi / standard-finish baselines, scaled by the project's location tier and, if finish-sensitive, its finish level. Lump and provisional sums with a driver are priced as rate × driver (e.g. KES 2,500 per m² of floor for electrical)."
      />
      <AdminRefTable
        :key="billFilter"
        name="library"
        title="Library items"
        :filter="filter"
        :columns="[
          { key: 'code', label: 'Code' },
          { key: 'billKey', label: 'Bill', type: 'select', options: bills.map(b => ({ label: `${b.number}. ${b.title}`, value: b.key })) },
          { key: 'section', label: 'Section', formOnly: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'unit', label: 'Unit' },
          { key: 'smmRef', label: 'SMM ref', type: 'select', options: smmOptions },
          { key: 'cesmmRef', label: 'CESMM ref', type: 'select', options: cesmmOptions },
          { key: 'rate', label: 'Rate', type: 'number' },
          { key: 'itemType', label: 'Type', type: 'select', options: itemTypes, formOnly: true },
          { key: 'driver', label: 'Driver', type: 'select', options: drivers },
          { key: 'factor', label: 'Factor', type: 'number', step: 0.0001 },
          { key: 'finishSensitive', label: 'Finish-sensitive', type: 'boolean', formOnly: true },
          { key: 'includeByDefault', label: 'In drafts', type: 'boolean', inline: true },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true },
          { key: 'active', label: 'Active', type: 'boolean', inline: true }
        ]"
        :defaults="{ billKey: billFilter === 'all' ? 'substructure' : billFilter, itemType: 'measured', driver: 'none', factor: 1, unit: 'm²', rate: 0, finishSensitive: false, includeByDefault: true, active: true }"
      >
        <template #actions>
          <USelect v-model="billFilter" size="sm" :items="[{ label: 'All bills', value: 'all' }, ...bills.map(b => ({ label: `${b.number}. ${b.title}`, value: b.key }))]" class="w-56" />
        </template>
      </AdminRefTable>
      <AdminRefTable
        name="bill_templates"
        pk="key"
        title="Standard bills"
        description="The bills every new draft BQ starts with."
        :columns="[
          { key: 'key', label: 'Key', createOnly: true },
          { key: 'number', label: 'No.', type: 'number', step: 1 },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'sort', label: 'Order', type: 'number', step: 1 }
        ]"
        @changed="refreshBills"
      />
    </template>
  </UDashboardPanel>
</template>
