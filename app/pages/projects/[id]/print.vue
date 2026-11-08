<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

const route = useRoute()
const id = String(route.params.id)
const docId = typeof route.query.doc === 'string' ? route.query.doc : null

const { data: live } = await useFetch<ProjectDetail>(`/api/projects/${id}`, { immediate: !docId })
const { data: doc } = await useFetch<{ snapshot: ProjectDetail & { issuedByName?: string }, issuedAt: string, revision: number }>(`/api/projects/${id}/documents/${docId}`, { immediate: !!docId })
const { data: brand } = await useFetch<{ issuer: string }>('/api/public/brand')
const p = computed<ProjectDetail | null>(() => (docId ? doc.value?.snapshot : live.value) ?? null)
useSeoMeta({ title: () => `${p.value?.name ?? 'BQ'}: Bill of Quantities` })

function printNow() {
  window.print()
}

const bills = computed(() => (p.value?.bills ?? []).filter(b => b.items.length))
/** Short label of the method of measurement for item references, e.g. 'SMM' or 'CESMM4' */
const stdShort = computed(() => (p.value?.measurement?.code ?? 'SMM').split(' ')[0])
const issuedLabel = computed(() => doc.value ? `Issued ${new Date(doc.value.issuedAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}${doc.value.snapshot.issuedByName ? ` by ${doc.value.snapshot.issuedByName}` : ''}` : (p.value?.status === 'issued' ? 'Issued' : 'DRAFT: not issued'))
</script>

<template>
  <div v-if="p" class="bg-white text-neutral-900 min-h-dvh">
    <div class="no-print sticky top-0 bg-neutral-100 border-b border-neutral-300 px-4 py-2 flex items-center justify-between gap-2 text-sm">
      <span>Print preview. Use your browser's <b>Save as PDF</b> to export.</span>
      <div class="flex gap-2">
        <UButton size="sm" color="neutral" variant="outline" label="Back" :to="`/projects/${id}`" />
        <UButton size="sm" icon="i-lucide-printer" label="Print / Save PDF" @click="printNow" />
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-8 py-10 print:p-0 print:max-w-none">
      <!-- Cover -->
      <section class="print-page min-h-[80vh] flex flex-col justify-between py-10">
        <div>
          <p class="tracking-[0.3em] text-xs uppercase text-neutral-500">
            {{ brand?.issuer ?? 'Kadiria' }}
          </p>
          <h1 class="font-display text-4xl font-bold mt-10 leading-tight">
            {{ p.name }}
          </h1>
          <p class="mt-4 text-2xl font-display">
            Bills of Quantities
          </p>
          <dl class="mt-12 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt class="text-neutral-500">
              Client
            </dt><dd>{{ p.client || '—' }}</dd>
            <dt class="text-neutral-500">
              Site
            </dt><dd>{{ p.siteAddress || '—' }}</dd>
            <dt class="text-neutral-500">
              Rate location
            </dt><dd>{{ p.location?.name ?? '—' }}</dd>
            <dt class="text-neutral-500">
              Prepared by
            </dt><dd>{{ p.preparedBy || '—' }}</dd>
            <dt class="text-neutral-500">
              Revision
            </dt><dd>{{ p.revision }} · {{ issuedLabel }}</dd>
            <dt class="text-neutral-500">
              Estimate basis
            </dt><dd>{{ p.readiness.level }} ({{ p.readiness.percent }}% of prerequisite information available)</dd>
          </dl>
        </div>
        <p class="text-xs text-neutral-500">
          {{ p.measurement?.coverNote || 'Measured generally in accordance with the Standard Method of Measurement of Building Works for East Africa.' }}
          <template v-if="p.measurement">Item references such as "{{ stdShort }} F" are sections of that standard.</template>
          Rates in {{ p.currency }}.
        </p>
      </section>

      <!-- Notes -->
      <section class="print-page py-6">
        <h2 class="font-display text-xl font-bold border-b-2 border-neutral-800 pb-1">
          Preambles: assumptions &amp; exclusions
        </h2>
        <h3 class="font-semibold mt-5">
          Assumptions
        </h3>
        <ol class="list-decimal ms-5 mt-2 text-sm space-y-1">
          <li v-for="(a, i) in p.assumptions.split('\n').filter(Boolean)" :key="i">
            {{ a }}
          </li>
        </ol>
        <h3 class="font-semibold mt-5">
          Exclusions
        </h3>
        <ol class="list-decimal ms-5 mt-2 text-sm space-y-1">
          <li v-for="(a, i) in p.exclusions.split('\n').filter(Boolean)" :key="i">
            {{ a }}
          </li>
        </ol>
        <h3 class="font-semibold mt-5">
          Provisional and prime cost sums
        </h3>
        <p class="text-sm mt-2">
          Provisional Sums are to be expended in whole or in part, or deducted entirely, as directed. Prime Cost Sums are for work or materials by nominated suppliers or sub-contractors.
        </p>
      </section>

      <!-- Bills -->
      <section v-for="bill in bills" :key="bill.id" class="print-page py-6">
        <h2 class="font-display text-xl font-bold border-b-2 border-neutral-800 pb-1">
          Bill No. {{ bill.number }}: {{ bill.title }}
          <span v-if="bill.provisional" class="text-sm font-normal">(All provisional)</span>
        </h2>
        <table class="bq-table mt-3">
          <thead>
            <tr>
              <th class="w-14">
                Item
              </th><th>Description</th><th class="w-14">
                Unit
              </th><th class="num w-20">
                Qty
              </th><th class="num w-24">
                Rate
              </th><th class="num w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, i) in bill.items" :key="item.id">
              <tr v-if="item.section && item.section !== bill.items[i - 1]?.section">
                <td /><td colspan="5" class="font-semibold uppercase text-xs pt-3">
                  {{ item.section }}
                </td>
              </tr>
              <tr>
                <td>
                  {{ bill.number }}.{{ i + 1 }}
                  <span v-if="item.measureRef" class="block text-[9px] leading-tight text-neutral-500" :title="item.measureRef.title">{{ stdShort }} {{ item.measureRef.code }}</span>
                </td>
                <td>
                  {{ item.description }}
                  <em v-if="item.itemType !== 'measured'" class="text-xs"> ({{ ITEM_TYPE_LABELS[item.itemType] }})</em>
                </td>
                <td>{{ item.unit }}</td>
                <td class="num">
                  {{ formatNumber(item.quantity, 2) }}
                </td>
                <td class="num">
                  {{ formatNumber(item.rate, 2) }}
                </td>
                <td class="num">
                  {{ formatNumber(itemTotal(item), 2) }}
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-right font-semibold">
                Total for Bill No. {{ bill.number }} carried to Grand Summary
              </td>
              <td class="num font-bold">
                {{ formatNumber(p.summary.billTotals.find(b => b.id === bill.id)?.total, 2) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <!-- Grand summary -->
      <section class="py-6">
        <h2 class="font-display text-xl font-bold border-b-2 border-neutral-800 pb-1">
          Grand Summary
        </h2>
        <table class="bq-table mt-3">
          <tbody>
            <tr v-for="b in p.summary.billTotals" :key="b.id">
              <td class="w-20">
                Bill {{ b.number }}
              </td><td>{{ b.title }}</td><td class="num">
                {{ formatNumber(b.total, 2) }}
              </td>
            </tr>
            <tr class="font-semibold">
              <td /><td>Sub-total</td><td class="num">
                {{ formatNumber(p.summary.subtotal, 2) }}
              </td>
            </tr>
            <tr>
              <td /><td>Add: Contingencies ({{ p.contingencyPercent }}%)</td><td class="num">
                {{ formatNumber(p.summary.contingency, 2) }}
              </td>
            </tr>
            <tr>
              <td /><td>Add: VAT ({{ p.vatPercent }}%)</td><td class="num">
                {{ formatNumber(p.summary.vat, 2) }}
              </td>
            </tr>
            <tr class="font-bold text-base">
              <td /><td>GRAND TOTAL CARRIED TO FORM OF TENDER ({{ p.currency }})</td><td class="num">
                {{ formatNumber(p.summary.grandTotal, 2) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="grid grid-cols-2 gap-10 mt-16 text-sm">
          <div class="border-t border-neutral-500 pt-2">
            Contractor's signature &amp; stamp
          </div>
          <div class="border-t border-neutral-500 pt-2">
            Quantity Surveyor
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
