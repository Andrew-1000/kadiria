<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
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
      </p>
      <div v-if="!leads.length" class="text-center py-16 border border-dashed border-default rounded-xl text-muted">
        No requests yet.
      </div>
      <div class="grid lg:grid-cols-2 gap-4">
        <UCard v-for="l in leads" :key="l.id">
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
          <p class="mt-3 text-xs text-dimmed">
            {{ new Date(l.createdAt).toLocaleString('en-KE') }}
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
