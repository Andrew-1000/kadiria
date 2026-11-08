<script setup lang="ts">
definePageMeta({ ownPanel: true, middleware: 'admin' })
useSeoMeta({ title: 'Methods of measurement | Admin' })

const { data: standards, refresh } = await useFetch<{ key: string, code: string }[]>('/api/admin/ref/standards', { default: () => [], server: false })
const { data: sections } = await useFetch<{ standardKey: string, code: string, title: string }[]>('/api/admin/ref/sections', { default: () => [], server: false })
const { data: library } = await useFetch<{ code: string, description: string }[]>('/api/admin/ref/library', { default: () => [], server: false })

const standardFilter = ref('smm_ea')
const sectionFilter = ref('all')
watch(standardFilter, () => { sectionFilter.value = 'all' })
const byStandard = computed(() => (r: Record<string, unknown>) => r.standardKey === standardFilter.value)
const ruleFilter = computed(() => (r: Record<string, unknown>) => r.standardKey === standardFilter.value && (sectionFilter.value === 'all' || r.sectionCode === sectionFilter.value))
const standardItems = computed(() => standards.value.map(s => ({ label: s.code, value: s.key })))
const sectionItems = computed(() => sections.value.filter(s => s.standardKey === standardFilter.value).map(s => ({ label: `${s.code} · ${s.title}`, value: s.code })))
const libraryItems = computed(() => library.value.map(l => ({ label: `${l.code} · ${l.description.slice(0, 60)}`, value: l.code })))
const KINDS = ['law', 'regulation', 'template', 'specification', 'standard', 'register', 'guide'].map(k => ({ label: k[0]!.toUpperCase() + k.slice(1), value: k }))
</script>

<template>
  <UDashboardPanel id="admin-standards">
    <template #header>
      <UDashboardNavbar title="Methods of measurement">
        <template #right>
          <USelect v-model="standardFilter" :items="standardItems" class="w-56" aria-label="Standard shown in the tables below" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-ruler"
        title="How measurement standards work in Kadiria"
        description="Each BQ is measured under one standard, chosen when it is created. Library items reference a section of every standard (Library references); the BQ shows the reference for its standard against each item, with that section's rules, and the printed cover states the standard. Rules are short paraphrases with their source (the standards are copyright): check them against the published editions. The standard selector at the top filters the tables below."
      />
      <AdminRefTable
        name="standards"
        pk="key"
        title="Standards"
        description="Methods of measurement a BQ can be prepared under."
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
        :key="`sections-${standardFilter}`"
        name="sections"
        title="Sections and work classes"
        description="What each section covers. The code is what library items and rules reference."
        :filter="byStandard"
        :columns="[
          { key: 'standardKey', label: 'Standard', type: 'select', options: standardItems, formOnly: true },
          { key: 'code', label: 'Code' },
          { key: 'title', label: 'Title' },
          { key: 'guidance', label: 'Covers / measured as', type: 'textarea' },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true }
        ]"
        :defaults="{ standardKey: standardFilter, sort: 100 }"
      />
      <AdminRefTable
        :key="`rules-${standardFilter}-${sectionFilter}`"
        name="rules"
        title="Measurement rules"
        description="What is measured, in which unit and how; road specification pay items are listed with their units."
        :filter="ruleFilter"
        :columns="[
          { key: 'standardKey', label: 'Standard', type: 'select', options: standardItems, formOnly: true },
          { key: 'sectionCode', label: 'Section' },
          { key: 'ref', label: 'Ref' },
          { key: 'item', label: 'Item', type: 'textarea' },
          { key: 'unit', label: 'Unit' },
          { key: 'rule', label: 'Rule', type: 'textarea' },
          { key: 'source', label: 'Source', type: 'textarea', formOnly: true },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true }
        ]"
        :defaults="{ standardKey: standardFilter, sectionCode: sectionFilter === 'all' ? '' : sectionFilter, sort: 500 }"
      >
        <template #actions>
          <USelect v-model="sectionFilter" size="sm" :items="[{ label: 'All sections', value: 'all' }, ...sectionItems]" class="w-64" />
        </template>
      </AdminRefTable>
      <AdminRefTable
        :key="`refs-${standardFilter}`"
        name="item_refs"
        title="Library references"
        description="The section of this standard each BQ library item is measured under."
        :filter="byStandard"
        :columns="[
          { key: 'libraryCode', label: 'Library item', type: 'select', options: libraryItems },
          { key: 'standardKey', label: 'Standard', type: 'select', options: standardItems, formOnly: true },
          { key: 'sectionCode', label: 'Section', type: 'select', options: sectionItems }
        ]"
        :defaults="{ standardKey: standardFilter }"
      />
      <AdminRefTable
        name="references"
        pk="key"
        title="Policies & references"
        description="Laws, regulations, tender documents and specifications behind BQs in Kenya. Check figures such as NCA limits for currency."
        :columns="[
          { key: 'key', label: 'Key', createOnly: true },
          { key: 'title', label: 'Title', type: 'textarea' },
          { key: 'kind', label: 'Type', type: 'select', options: KINDS },
          { key: 'issuer', label: 'Issued by', formOnly: true },
          { key: 'year', label: 'Year' },
          { key: 'url', label: 'Link', formOnly: true },
          { key: 'summary', label: 'Summary', type: 'textarea', formOnly: true },
          { key: 'relevance', label: 'Why it matters for a BQ', type: 'textarea' },
          { key: 'sort', label: 'Order', type: 'number', step: 1, formOnly: true }
        ]"
        :defaults="{ kind: 'guide', sort: 100 }"
      />
    </template>
  </UDashboardPanel>
</template>
