<script setup lang="ts">
definePageMeta({ ownPanel: true, middleware: 'admin' })
useSeoMeta({ title: 'Methods of measurement | Admin' })

const { data: standards, refresh } = await useFetch<{ key: string, code: string }[]>('/api/admin/ref/standards', { default: () => [], server: false })
const standardFilter = ref('smm_ea')
const filter = computed(() => (r: Record<string, unknown>) => r.standardKey === standardFilter.value)
</script>

<template>
  <UDashboardPanel id="admin-standards">
    <template #header>
      <UDashboardNavbar title="Methods of measurement" />
    </template>
    <template #body>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-ruler"
        title="SMM for building works, CESMM for civil works"
        description="Each BQ is measured under one standard, chosen when it is created (and changeable in its details). Library items carry a section reference for each standard (BQ library → SMM ref / CESMM ref); the BQ shows the reference for its standard against every item, and the printed cover states the standard. SMM section letters follow the order of the 2008 edition's contents: check them against your copy and correct them here."
      />
      <AdminRefTable
        name="standards"
        pk="key"
        title="Standards"
        description="The methods of measurement a BQ can be prepared under."
        :columns="[
          { key: 'key', label: 'Key', createOnly: true },
          { key: 'code', label: 'Short name' },
          { key: 'name', label: 'Full title', type: 'textarea' },
          { key: 'scope', label: 'Works', type: 'select', options: [{ label: 'Building works', value: 'building' }, { label: 'Civil engineering works', value: 'civil' }] },
          { key: 'edition', label: 'Edition' },
          { key: 'publisher', label: 'Publisher', formOnly: true },
          { key: 'coverNote', label: 'Sentence on the BQ cover', type: 'textarea', formOnly: true },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true },
          { key: 'active', label: 'Active', type: 'boolean', inline: true }
        ]"
        :defaults="{ scope: 'building', active: true, sort: 10 }"
        @changed="refresh"
      />
      <AdminRefTable
        :key="standardFilter"
        name="sections"
        title="Sections and work classes"
        description="What each section covers and how it is measured. The code is what BQ items reference (e.g. F)."
        :filter="filter"
        :columns="[
          { key: 'standardKey', label: 'Standard', type: 'select', options: standards.map(s => ({ label: s.code, value: s.key })), formOnly: true },
          { key: 'code', label: 'Code' },
          { key: 'title', label: 'Title' },
          { key: 'guidance', label: 'Covers / measured as', type: 'textarea' },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true }
        ]"
        :defaults="{ standardKey: standardFilter, sort: 100 }"
      >
        <template #actions>
          <USelect v-model="standardFilter" size="sm" :items="standards.map(s => ({ label: s.code, value: s.key }))" class="w-48" />
        </template>
      </AdminRefTable>
    </template>
  </UDashboardPanel>
</template>
