<script setup lang="ts">
import type { LeadReport } from '~~/server/utils/report'

definePageMeta({ layout: false, middleware: 'admin' })

const route = useRoute()
const { data: r, error, status } = await useFetch<LeadReport>(`/api/admin/leads/${route.params.id}/report`, { server: false })
const { data: brand } = await useFetch<{ issuer: string }>('/api/public/brand', { server: false })
useSeoMeta({ title: () => r.value ? `${r.value.reference}: cost report for ${r.value.request.name}` : 'Cost report' })

const money = (n: number | null | undefined) => formatNumber(n ?? null, 0)
const open = reactive<Record<string, boolean>>({})
function printNow() {
  window.print()
}
</script>

<template>
  <div class="bg-white text-neutral-900 min-h-dvh">
    <div class="no-print sticky top-0 z-10 bg-neutral-100 border-b border-neutral-300 px-4 py-2 flex items-center justify-between gap-2 text-sm">
      <span>Detailed cost report. Use <b>Print / Save PDF</b> to send it to the client.</span>
      <div class="flex gap-2">
        <UButton size="sm" color="neutral" variant="outline" label="Back to requests" to="/admin/leads" />
        <UButton size="sm" icon="i-lucide-printer" label="Print / Save PDF" :disabled="!r" @click="printNow" />
      </div>
    </div>

    <div v-if="status === 'pending'" class="py-24 text-center text-neutral-500">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
      <p class="mt-2">
        Building the report from the current rates…
      </p>
    </div>
    <div v-else-if="error" class="max-w-xl mx-auto py-24 text-center">
      <UIcon name="i-lucide-circle-alert" class="size-8 text-red-600" />
      <p class="mt-3">
        {{ errorMessage(error) }}
      </p>
    </div>

    <article v-else-if="r" class="max-w-5xl mx-auto px-6 sm:px-10 py-10 print:p-0 print:max-w-none text-sm leading-relaxed">
      <!-- Header -->
      <header class="flex flex-wrap items-start justify-between gap-6 border-b-2 border-neutral-800 pb-5">
        <div>
          <p class="tracking-[0.3em] text-xs uppercase text-neutral-500">
            {{ brand?.issuer ?? 'Kadiria' }}
          </p>
          <h1 class="font-display text-3xl font-bold mt-2">
            Detailed cost report
          </h1>
          <p class="mt-1 text-neutral-600">
            How each figure in this estimate was arrived at, from the rates, factors and prices defined in the system.
          </p>
        </div>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt class="text-neutral-500">
            Reference
          </dt><dd class="font-mono">
            {{ r.reference }}
          </dd>
          <dt class="text-neutral-500">
            Prepared
          </dt><dd>{{ new Date(r.generatedAt).toLocaleString('en-KE') }}</dd>
          <dt class="text-neutral-500">
            Requested
          </dt><dd>{{ new Date(r.request.createdAt).toLocaleString('en-KE') }}</dd>
          <dt class="text-neutral-500">
            Currency
          </dt><dd>{{ r.currency }}</dd>
        </dl>
      </header>

      <!-- 1. Request -->
      <section class="mt-8">
        <h2 class="font-display text-xl font-bold">
          1. The request
        </h2>
        <div class="mt-3 grid sm:grid-cols-2 gap-x-10 gap-y-1">
          <p><span class="text-neutral-500">Client:</span> {{ r.request.name }}</p>
          <p><span class="text-neutral-500">Contact:</span> {{ [r.request.phone, r.request.email].filter(Boolean).join(' · ') || '—' }}</p>
          <p><span class="text-neutral-500">Location:</span> {{ r.request.location }} ({{ r.request.tier }})</p>
          <p><span class="text-neutral-500">Building:</span> {{ r.request.buildingType }}, {{ r.request.finish }} finish</p>
          <p><span class="text-neutral-500">Floor areas:</span> {{ r.request.floorAreas.map(a => `${formatNumber(a, 1)} m²`).join(' + ') }}</p>
          <p><span class="text-neutral-500">Add-ons chosen:</span> {{ r.request.addons.join(', ') || 'none' }}</p>
          <p v-if="r.request.budget">
            <span class="text-neutral-500">Budget:</span> {{ r.currency }} {{ money(r.request.budget) }}
          </p>
        </div>
        <p v-if="r.request.message" class="mt-3 italic text-neutral-600">
          “{{ r.request.message }}”
        </p>
      </section>

      <!-- 2. Estimator -->
      <section class="mt-10">
        <h2 class="font-display text-xl font-bold">
          2. How the quick estimate was calculated
        </h2>
        <p class="text-neutral-600 mt-1">
          The cost calculator prices the building per square metre, using the administrator's rate card for the location and finish.
        </p>
        <table class="bq-table mt-3">
          <thead>
            <tr>
              <th class="w-8">
                #
              </th><th>Step</th><th>How it is worked out</th><th class="num">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in r.estimator.steps" :key="i" :class="s.label === 'Estimated total' ? 'font-bold' : ''">
              <td>{{ i + 1 }}</td>
              <td>{{ s.label }}</td>
              <td class="text-neutral-600">
                {{ s.formula }}
              </td>
              <td class="num">
                {{ formatNumber(s.value, 2) }} <span class="text-xs text-neutral-500">{{ s.unit }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="mt-2 text-xs text-neutral-600">
          Likely range {{ r.currency }} {{ money(r.estimator.range.low) }} – {{ money(r.estimator.range.high) }}: {{ r.estimator.range.formula }}.
          <template v-if="r.estimator.quotedTotal !== null && Math.round(r.estimator.quotedTotal) !== Math.round(r.estimator.currentTotal)">
            When requested, the estimate was {{ r.currency }} {{ money(r.estimator.quotedTotal) }}; rates have changed since then.
          </template>
        </p>
        <div v-if="r.estimator.budget" class="mt-3 rounded border border-neutral-300 p-3">
          Budget check: {{ r.estimator.budget.withinBudget ? 'within budget' : 'over budget' }} by {{ r.currency }} {{ money(Math.abs(r.estimator.budget.difference)) }};
          the budget buys about {{ formatNumber(r.estimator.budget.affordableArea, 0) }} m² at this specification.
        </div>
        <h3 class="font-semibold mt-5">
          Where the construction cost goes
        </h3>
        <table class="bq-table mt-2">
          <tbody>
            <tr v-for="e in r.estimator.elements" :key="e.key">
              <td>{{ e.label }}</td>
              <td class="num w-20">
                {{ e.percent }}%
              </td>
              <td class="num w-40">
                {{ money(e.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 3. Quantities -->
      <section class="mt-10 print-page">
        <h2 class="font-display text-xl font-bold">
          3. Quantities taken from the floor areas
        </h2>
        <p class="text-neutral-600 mt-1">
          Without drawings, the main quantities are derived from the floor areas using the standard assumptions below. They feed both the itemised estimate and the materials schedule.
        </p>
        <table class="bq-table mt-3">
          <thead>
            <tr>
              <th>Quantity</th><th>Derivation</th><th class="num">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in r.quantities" :key="q.key">
              <td>{{ q.label }}</td>
              <td class="text-neutral-600">
                {{ q.formula }}
              </td>
              <td class="num">
                {{ formatNumber(q.value, 2) }}
              </td>
            </tr>
          </tbody>
        </table>
        <h3 class="font-semibold mt-4">
          Assumptions
        </h3>
        <ul class="list-disc ms-5 mt-1 space-y-0.5 text-neutral-700">
          <li v-for="(a, i) in r.assumptions" :key="i">
            {{ a }}
          </li>
        </ul>
      </section>

      <!-- 4. Itemised estimate -->
      <section class="mt-10">
        <h2 class="font-display text-xl font-bold">
          4. Itemised estimate: every bill, line by line
        </h2>
        <p class="text-neutral-600 mt-1">
          Each line is priced from the BQ library. Quantity = quantity driver × factor. Rate = library baseline × location factor (× finish factor for finish-sensitive items).
        </p>
        <p class="mt-2 rounded bg-neutral-100 p-3 text-xs text-neutral-700">
          {{ r.factors.explanation }}
        </p>

        <div v-for="b in r.bills" :key="b.key" class="mt-6">
          <div class="flex items-baseline justify-between gap-4 border-b border-neutral-800 pb-1">
            <h3 class="font-semibold">
              Bill {{ b.number }}: {{ b.title }}
            </h3>
            <span class="font-semibold tabular-nums">{{ r.currency }} {{ money(b.total) }}</span>
          </div>
          <p class="text-xs text-neutral-500 mt-1">
            {{ b.description }}
          </p>
          <table class="bq-table mt-2">
            <thead>
              <tr>
                <th class="w-16">
                  Code
                </th><th>Description &amp; basis</th><th class="w-12">
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
              <tr v-for="l in b.lines" :key="l.code">
                <td class="font-mono text-xs">
                  {{ l.code }}
                </td>
                <td>
                  {{ l.description }}
                  <em v-if="l.itemType !== 'measured'" class="text-xs"> ({{ ITEM_TYPE_LABELS[l.itemType] }})</em>
                  <div class="text-[11px] text-neutral-500 mt-0.5">
                    Qty: {{ l.quantityBasis }} · Rate: {{ l.rateBasis }}
                  </div>
                </td>
                <td>{{ l.unit }}</td>
                <td class="num">
                  {{ formatNumber(l.quantity, 2) }}
                </td>
                <td class="num">
                  {{ money(l.rate) }}
                </td>
                <td class="num">
                  {{ money(l.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. Services & statutory -->
      <section class="mt-10">
        <h2 class="font-display text-xl font-bold">
          5. Services and statutory fees
        </h2>
        <p class="text-neutral-600 mt-1">
          These are provisional sums: allowances to be confirmed once engineer designs and approval invoices are available.
        </p>
        <table class="bq-table mt-3">
          <tbody>
            <tr v-for="(s, i) in r.highlights.services?.lines ?? []" :key="`s${i}`">
              <td>{{ s.description }}<div class="text-[11px] text-neutral-500">
                {{ s.basis }}
              </div></td>
              <td class="num w-32">
                {{ money(s.amount) }}
              </td>
            </tr>
            <tr v-for="(s, i) in r.highlights.statutory" :key="`f${i}`">
              <td>{{ s.description }}<div class="text-[11px] text-neutral-500">
                {{ s.basis }}
              </div></td>
              <td class="num w-32">
                {{ money(s.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 6. Summary -->
      <section class="mt-10">
        <h2 class="font-display text-xl font-bold">
          6. Summary of the itemised estimate
        </h2>
        <table class="bq-table mt-3">
          <tbody>
            <tr v-for="b in r.bills" :key="b.key">
              <td class="w-20">
                Bill {{ b.number }}
              </td><td>{{ b.title }}</td><td class="num w-36">
                {{ money(b.total) }}
              </td>
            </tr>
            <tr class="font-semibold">
              <td /><td>Sub-total</td><td class="num">
                {{ money(r.summary.subtotal) }}
              </td>
            </tr>
            <tr v-for="a in r.summary.addons" :key="a.key">
              <td /><td>Add: {{ a.label }} ({{ a.percent }}%)</td><td class="num">
                {{ money(a.amount) }}
              </td>
            </tr>
            <tr class="font-semibold">
              <td /><td>Total before VAT</td><td class="num">
                {{ money(r.summary.beforeVat) }}
              </td>
            </tr>
            <tr>
              <td /><td>Add: VAT ({{ r.summary.vatPercent }}%)</td><td class="num">
                {{ money(r.summary.vat) }}
              </td>
            </tr>
            <tr class="font-bold text-base">
              <td /><td>Itemised total including VAT ({{ r.currency }})</td><td class="num">
                {{ money(r.summary.grandTotal) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="r.summary.approvalsNote" class="mt-2 text-xs text-neutral-600">
          {{ r.summary.approvalsNote }}
        </p>
        <div class="mt-4 rounded border border-neutral-300 p-3">
          <b>Reconciliation:</b> the quick estimate (per m²) is {{ r.currency }} {{ money(r.reconciliation.estimatorTotal) }};
          the itemised estimate before VAT is {{ r.currency }} {{ money(r.reconciliation.itemisedBeforeVat) }}
          ({{ r.reconciliation.variancePercent > 0 ? '+' : '' }}{{ r.reconciliation.variancePercent }}%).
          The two methods use different sources (cost-per-m² bands vs. measured library rates), so some difference is normal; a measured BQ from drawings replaces both.
        </div>
      </section>

      <!-- 7. Materials -->
      <section class="mt-10 print-page">
        <h2 class="font-display text-xl font-bold">
          7. Materials schedule
        </h2>
        <p class="text-neutral-600 mt-1">
          Main structural and finishing materials worked out element by element with the material calculators, including {{ r.materials.wastagePercent }}% wastage and priced at the administrator's current prices for {{ r.request.location }}. These materials are already included in the BQ rates above; this schedule is for purchasing and checking.
        </p>
        <table class="bq-table mt-3">
          <thead>
            <tr>
              <th>Material</th><th class="num">
                Quantity
              </th><th>Unit</th><th class="num">
                Unit price
              </th><th>Price source</th><th class="num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in r.materials.schedule" :key="m.materialKey">
              <td>{{ m.label }}</td>
              <td class="num">
                {{ formatNumber(m.quantity, 2) }}
              </td>
              <td>{{ m.unit }}</td>
              <td class="num">
                {{ m.unitPrice !== null ? formatNumber(m.unitPrice, 2) : '—' }}
              </td>
              <td class="text-xs text-neutral-600">
                {{ m.priceSource === 'location' ? `${r.request.location} price` : m.priceSource === 'national' ? 'National price' : 'No price set' }}{{ m.effectiveFrom ? `, from ${m.effectiveFrom}` : '' }}
              </td>
              <td class="num">
                {{ m.amount !== null ? money(m.amount) : '—' }}
              </td>
            </tr>
            <tr class="font-semibold">
              <td colspan="5">
                Total materials
              </td><td class="num">
                {{ money(r.materials.total) }}
              </td>
            </tr>
          </tbody>
        </table>

        <h3 class="font-semibold mt-6">
          Stage by stage
        </h3>
        <p class="text-xs text-neutral-600">
          Each element in the order it is built on site. In each drawing the blue part is the work in that stage; grey parts are already built and faint outlines come later.
        </p>
        <div class="mt-3 space-y-3">
          <article v-for="(e, i) in r.materials.elements" :key="i" class="grid grid-cols-[13rem_1fr] sm:grid-cols-[18rem_1fr] gap-4 rounded border border-neutral-200 p-3 break-inside-avoid">
            <div class="self-start rounded bg-neutral-50 p-1">
              <BuildingSection :highlight="e.key" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-widest text-neutral-500">
                {{ e.stage || 'Stage' }}
              </p>
              <p class="flex justify-between gap-4 font-semibold">
                <span>{{ e.label }}</span><span class="tabular-nums">{{ e.materials.length ? money(e.total) : 'Labour & plant' }}</span>
              </p>
              <p v-if="e.onSite" class="mt-1 text-xs text-neutral-700">
                <span class="font-medium">On site:</span> {{ e.onSite }}
              </p>
              <button v-if="e.materials.length" type="button" class="mt-2 text-xs text-blue-700 no-print" @click="open[i] = !open[i]">
                <UIcon :name="open[i] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="align-[-2px]" /> {{ open[i] ? 'Hide' : 'Show' }} materials ({{ e.materials.length }})
              </button>
              <div :class="open[i] ? '' : 'hidden print:block'" class="mt-1 text-xs text-neutral-600">
                <p>Inputs: {{ Object.entries(e.inputs).map(([k, v]) => `${k} ${typeof v === 'number' ? formatNumber(v, 2) : v}`).join(' · ') }}</p>
                <p v-for="m in e.materials" :key="m.materialKey">
                  {{ m.label }}: {{ formatNumber(m.quantity, 2) }} {{ m.unit }} × {{ m.unitPrice !== null ? formatNumber(m.unitPrice, 2) : '—' }} = {{ m.amount !== null ? money(m.amount) : '—' }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <h3 class="font-semibold mt-6">
          Engineering constants used
        </h3>
        <p class="text-xs text-neutral-600">
          <span v-for="(c, i) in r.materials.constants" :key="c.key">{{ c.label }} {{ c.value }} {{ c.unit }}<template v-if="i < r.materials.constants.length - 1">; </template></span>
        </p>
      </section>

      <footer class="mt-12 border-t border-neutral-300 pt-4 text-xs text-neutral-500">
        This report is an order-of-cost assessment based on rates and prices in force on {{ new Date(r.generatedAt).toLocaleDateString('en-KE', { dateStyle: 'long' }) }}.
        It is not a tender figure. A Bill of Quantities measured from approved drawings will replace these allowances.
      </footer>
    </article>
  </div>
</template>
