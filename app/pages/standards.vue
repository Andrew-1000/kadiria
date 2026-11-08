<script setup lang="ts">
/*
 * Measurement & rules: the methods of measurement Kadiria supports, their sections and rules, and the
 * Kenyan laws, regulations and tender documents behind BQs. Data maintained in Admin → Methods of measurement.
 */
useSeoMeta({ title: 'Measurement & rules | Kadiria', description: 'Standard methods of measurement (SMM, CESMM, AAQS, Kenya road specification) and the Kenyan rules behind Bills of Quantities.' })

interface Standard { key: string, code: string, name: string, scope: string, edition: string }
interface Detail { standard: Standard & { publisher: string, coverNote: string }, sections: { code: string, title: string, guidance: string }[], rules: { sectionCode: string, ref: string, item: string, unit: string, rule: string, source: string }[] }
interface Reference { key: string, title: string, kind: string, issuer: string, year: string, url: string, summary: string, relevance: string }

const route = useRoute()
const { data: standards } = await useFetch<Standard[]>('/api/standards', { default: () => [] })
const { data: references } = await useFetch<Reference[]>('/api/standards/references', { default: () => [] })
const tab = ref<'standards' | 'policies'>(route.query.tab === 'policies' ? 'policies' : 'standards')
const selected = ref(String(route.query.standard ?? 'smm_ea'))
const { data: detail, status } = await useFetch<Detail>(() => `/api/standards/${selected.value}`, { watch: [selected] })

const section = ref('all')
const search = ref('')
watch(selected, () => { section.value = 'all'; search.value = '' })
const counts = computed(() => {
  const c: Record<string, number> = {}
  for (const r of detail.value?.rules ?? []) c[r.sectionCode] = (c[r.sectionCode] ?? 0) + 1
  return c
})
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (detail.value?.rules ?? []).filter(r => (section.value === 'all' || r.sectionCode === section.value)
    && (!q || `${r.ref} ${r.item} ${r.rule} ${r.unit}`.toLowerCase().includes(q)))
})
const { rows, page, pageSize, total, from, to } = usePaged(filtered, 'standards:rules', 25)
const sectionTitle = (code: string) => detail.value?.sections.find(s => s.code === code)?.title ?? ''

const KIND_LABEL: Record<string, string> = { law: 'Law', regulation: 'Regulation', template: 'Tender document', specification: 'Specification', standard: 'Standard', register: 'Register', guide: 'Guide' }
const KIND_COLOR: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'neutral'> = { law: 'primary', regulation: 'info', template: 'success', specification: 'warning', standard: 'neutral', register: 'neutral', guide: 'neutral' }
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div>
      <p class="text-xs uppercase tracking-[0.14em] text-muted">
        Kadiria · Measurement & rules
      </p>
      <h1 class="font-display text-3xl font-bold mt-1">
        How work is measured, and the rules behind a BQ
      </h1>
      <p class="text-muted mt-2 max-w-3xl">
        A Bill of Quantities is measured under a standard method of measurement: SMM for building works, CESMM or the Kenya road specification for civil works. Each BQ in Kadiria names its standard, and every item shows the section it is measured under. Below are the standards, their rules, and the Kenyan laws and tender documents that apply.
      </p>
    </div>

    <div class="flex gap-1 border-b border-default" role="tablist">
      <button v-for="t in [{ v: 'standards', l: 'Standards & rules', i: 'i-lucide-ruler' }, { v: 'policies', l: 'Policies & references', i: 'i-lucide-scale' }]" :key="t.v" type="button" role="tab" :aria-selected="tab === t.v" class="px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2" :class="tab === t.v ? 'border-primary text-highlighted' : 'border-transparent text-muted hover:text-default'" @click="tab = t.v as typeof tab">
        <UIcon :name="t.i" /> {{ t.l }}
      </button>
    </div>

    <template v-if="tab === 'standards'">
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <button
          v-for="s in standards"
          :key="s.key"
          type="button"
          class="rounded-lg border p-4 text-left transition"
          :class="selected === s.key ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/40'"
          :aria-pressed="selected === s.key"
          @click="selected = s.key"
        >
          <span class="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <UIcon :name="s.scope === 'civil' ? 'i-lucide-construction' : 'i-lucide-building-2'" class="text-primary" />
            {{ s.scope === 'civil' ? 'Civil works' : 'Building works' }}
          </span>
          <span class="block font-semibold mt-1">{{ s.code }}</span>
          <span class="block text-xs text-muted mt-0.5">{{ s.name }}{{ s.edition ? ` · ${s.edition}` : '' }}</span>
        </button>
      </div>

      <div v-if="status === 'pending' && !detail" class="py-16 text-center text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      </div>
      <div v-else-if="detail" class="grid lg:grid-cols-[18rem_minmax(0,1fr)] gap-6 items-start">
        <!-- Sections -->
        <nav class="rounded-lg border border-default overflow-hidden lg:sticky lg:top-4" aria-label="Sections">
          <p class="px-3 py-2 text-xs uppercase tracking-wider text-muted border-b border-default bg-elevated/40">
            {{ detail.sections.length }} sections
          </p>
          <ul class="max-h-[60vh] overflow-y-auto divide-y divide-default text-sm">
            <li>
              <button type="button" class="w-full px-3 py-2 text-left flex justify-between gap-2" :class="section === 'all' ? 'bg-primary/10 text-highlighted' : 'hover:bg-elevated/50'" @click="section = 'all'">
                <span>All sections</span><span class="font-mono text-xs text-muted">{{ detail.rules.length }}</span>
              </button>
            </li>
            <li v-for="sec in detail.sections" :key="sec.code">
              <button type="button" class="w-full px-3 py-2 text-left flex justify-between gap-2" :class="section === sec.code ? 'bg-primary/10 text-highlighted' : 'hover:bg-elevated/50'" :title="sec.guidance" @click="section = sec.code">
                <span class="min-w-0"><span class="font-mono text-xs text-primary me-1.5">{{ sec.code }}</span>{{ sec.title }}</span>
                <span v-if="counts[sec.code]" class="font-mono text-xs text-muted shrink-0">{{ counts[sec.code] }}</span>
              </button>
            </li>
          </ul>
        </nav>

        <!-- Rules -->
        <section class="min-w-0 space-y-3">
          <div class="rounded-lg border border-default p-4 text-sm">
            <p class="font-semibold">
              {{ detail.standard.name }}
            </p>
            <p class="text-muted">
              {{ [detail.standard.edition, detail.standard.publisher].filter(Boolean).join(' · ') }}
            </p>
            <p v-if="section !== 'all'" class="mt-2">
              <span class="font-mono text-primary">{{ section }}</span> {{ sectionTitle(section) }}: <span class="text-muted">{{ detail.sections.find(s => s.code === section)?.guidance }}</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <UInput v-model="search" icon="i-lucide-search" placeholder="Search rules and pay items" class="w-72" />
            <span class="text-sm text-muted">{{ filtered.length }} rule{{ filtered.length === 1 ? '' : 's' }}</span>
          </div>
          <div class="rounded-lg border border-default overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th class="px-3 py-2 font-medium w-16">
                    Section
                  </th>
                  <th class="px-3 py-2 font-medium w-20">
                    Ref
                  </th>
                  <th class="px-3 py-2 font-medium">
                    Item and rule
                  </th>
                  <th class="px-3 py-2 font-medium w-20">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(r, i) in rows" :key="i" class="align-top">
                  <td class="px-3 py-2 font-mono text-xs text-primary" :title="sectionTitle(r.sectionCode)">
                    {{ r.sectionCode }}
                  </td>
                  <td class="px-3 py-2 font-mono text-xs text-muted">
                    {{ r.ref }}
                  </td>
                  <td class="px-3 py-2">
                    <p class="font-medium">
                      {{ r.item }}
                    </p>
                    <p v-if="r.rule && r.rule !== 'Pay item'" class="text-muted">
                      {{ r.rule }}
                    </p>
                    <p v-else-if="r.rule === 'Pay item'" class="text-xs text-dimmed">
                      Pay item
                    </p>
                  </td>
                  <td class="px-3 py-2 font-mono text-xs">
                    {{ r.unit }}
                  </td>
                </tr>
                <tr v-if="!filtered.length">
                  <td colspan="4" class="px-3 py-10 text-center text-muted">
                    No rules recorded for this {{ section === 'all' ? 'standard' : 'section' }} yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePager v-if="total > 10" v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="rules" />
          <p class="text-xs text-dimmed">
            Rules are short paraphrases for guidance, each with its source{{ [...new Set(filtered.map(r => r.source))].length === 1 ? `: ${filtered[0]?.source}` : '' }}. The published standards are the authority.
          </p>
        </section>
      </div>
    </template>

    <div v-else class="grid md:grid-cols-2 gap-4">
      <article v-for="ref in references" :key="ref.key" class="rounded-lg border border-default p-4 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <UBadge :color="KIND_COLOR[ref.kind] ?? 'neutral'" variant="subtle" :label="KIND_LABEL[ref.kind] ?? ref.kind" />
          <span class="text-xs text-muted">{{ ref.year }}</span>
        </div>
        <h2 class="font-semibold mt-2">
          {{ ref.title }}
        </h2>
        <p class="text-xs text-muted">
          {{ ref.issuer }}
        </p>
        <p class="text-sm mt-2">
          {{ ref.summary }}
        </p>
        <p v-if="ref.relevance" class="text-sm mt-2 text-muted">
          <span class="font-medium text-default">For a BQ:</span> {{ ref.relevance }}
        </p>
        <div class="mt-auto pt-3">
          <UButton v-if="ref.url" :to="ref.url" target="_blank" rel="noopener" size="sm" variant="link" trailing-icon="i-lucide-external-link" label="Open source" class="-ms-2.5" />
        </div>
      </article>
      <p class="md:col-span-2 text-xs text-dimmed">
        Summaries for guidance only. Laws, limits and fees change: check the current text with the issuing body before relying on them.
      </p>
    </div>
  </UContainer>
</template>
