<script setup lang="ts">
definePageMeta({ ownPanel: true, middleware: 'admin' })
useSeoMeta({ title: 'Estimate requests | Admin' })

interface Lead {
  id: string, name: string, phone: string, email: string, message: string, status: string, createdAt: string
  result: { total: number, totalArea: number, location: string, buildingType: string, finish: string, budget: null | { budget: number, withinBudget: boolean } }
}
const { data: leads, refresh } = await useFetch<Lead[]>('/api/admin/leads', { default: () => [], server: false })
const { call } = useApi()
const statuses = [
  { label: 'New', value: 'new' }, { label: 'Contacted', value: 'contacted' }, { label: 'Quoted', value: 'quoted' }, { label: 'Closed', value: 'closed' }
]
const { rows: pagedLeads, page, pageSize, total, from, to } = usePaged(leads, 'admin:leads', 10)

async function setStatus(l: Lead, status: string) {
  await call(`/api/admin/leads/${l.id}`, { method: 'PUT', body: { status } })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="admin-leads">
    <template #header>
      <UDashboardNavbar title="Estimate requests" />
    </template>
    <template #body>
      <p class="text-sm text-muted">
        Homeowners who used the Cost Calculator and asked for a detailed BQ. Each request stores the exact inputs and estimate they saw.
        <b>Detailed report</b> re-prices the request with today's rates and shows how every figure is derived: the per-m² estimate, the quantities, each bill line, services, statutory fees and a priced materials schedule.
      </p>
      <div v-if="!leads.length" class="text-center py-16 border border-dashed border-default rounded-xl text-muted">
        No requests yet.
      </div>
      <div class="grid lg:grid-cols-2 gap-4">
        <UCard v-for="l in pagedLeads" :key="l.id">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-highlighted">
                {{ l.name }}
              </p>
              <p class="text-sm text-muted">
                {{ [l.phone, l.email].filter(Boolean).join(' · ') }}
              </p>
            </div>
            <USelect :model-value="l.status" :items="statuses" size="sm" class="w-36" @update:model-value="(v: string) => setStatus(l, v)" />
          </div>
          <p class="mt-3 text-sm">
            {{ l.result.buildingType }}, {{ formatNumber(l.result.totalArea, 0) }} m², {{ l.result.finish }}, {{ l.result.location }}
          </p>
          <p class="font-display text-xl font-bold mt-1">
            {{ formatMoney(l.result.total) }}
            <UBadge v-if="l.result.budget" class="ms-2 align-middle" size="sm" variant="subtle" :color="l.result.budget.withinBudget ? 'success' : 'error'" :label="`Budget ${formatMoney(l.result.budget.budget)}`" />
          </p>
          <p v-if="l.message" class="mt-2 text-sm text-muted italic">
            "{{ l.message }}"
          </p>
          <div class="mt-3 flex items-center justify-between gap-3">
            <p class="text-xs text-dimmed">
              {{ new Date(l.createdAt).toLocaleString('en-KE') }}
            </p>
            <UButton size="sm" icon="i-lucide-file-text" label="Detailed report" :to="`/admin/lead-report/${l.id}`" target="_blank" />
          </div>
        </UCard>
      </div>
      <div class="rounded-xl border border-default overflow-hidden empty:hidden">
        <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="requests" class="border-t-0" />
      </div>
    </template>
  </UDashboardPanel>
</template>
