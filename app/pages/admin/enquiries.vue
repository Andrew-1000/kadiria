<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Website enquiries | Admin' })

interface Enquiry { id: string, site: string, kind: string, name: string, phone: string, email: string, subject: string, message: string, planRef: string, status: string, createdAt: string }
const { data: enquiries, refresh } = await useFetch<Enquiry[]>('/api/admin/enquiries', { default: () => [], server: false })
const { call } = useApi()

const siteFilter = ref('all')
const kindFilter = ref('all')
const sites = computed(() => [...new Set(enquiries.value.map(e => e.site))])
const filtered = computed(() => enquiries.value.filter(e => (siteFilter.value === 'all' || e.site === siteFilter.value) && (kindFilter.value === 'all' || e.kind === kindFilter.value)))
const { rows, page, pageSize, total, from, to } = usePaged(filtered, 'admin:enquiries', 10)

const KIND: Record<string, { label: string, color: 'primary' | 'info' | 'warning' | 'neutral' }> = {
  consultation: { label: 'Consultation', color: 'primary' },
  plan: { label: 'Plan', color: 'info' },
  quote: { label: 'Quote / BQ', color: 'warning' },
  contact: { label: 'Contact', color: 'neutral' }
}
const statuses = [{ label: 'New', value: 'new' }, { label: 'Contacted', value: 'contacted' }, { label: 'Quoted', value: 'quoted' }, { label: 'Closed', value: 'closed' }]
async function setStatus(e: Enquiry, status: string) {
  await call(`/api/admin/enquiries/${e.id}`, { method: 'PUT', body: { status } })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="admin-enquiries">
    <template #header>
      <UDashboardNavbar title="Website enquiries">
        <template #right>
          <USelect v-model="siteFilter" size="sm" :items="[{ label: 'All websites', value: 'all' }, ...sites.map(s => ({ label: s, value: s }))]" class="w-40" />
          <USelect v-model="kindFilter" size="sm" :items="[{ label: 'All types', value: 'all' }, ...Object.entries(KIND).map(([value, k]) => ({ label: k.label, value }))]" class="w-40" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <p class="text-sm text-muted">
        Contact, consultation, quote and plan enquiries sent from connected company websites. Add each website's address under Website integration so its forms are accepted.
      </p>
      <div v-if="!filtered.length" class="text-center py-16 border border-dashed border-default rounded-xl text-muted">
        No enquiries yet.
      </div>
      <div class="grid lg:grid-cols-2 gap-4">
        <UCard v-for="e in rows" :key="e.id">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-highlighted truncate">
                  {{ e.name }}
                </p>
                <UBadge size="sm" variant="subtle" :color="KIND[e.kind]?.color ?? 'neutral'" :label="KIND[e.kind]?.label ?? e.kind" />
                <UBadge size="sm" variant="outline" color="neutral" :label="e.site" />
              </div>
              <p class="text-sm text-muted">
                {{ [e.phone, e.email].filter(Boolean).join(' · ') }}
              </p>
            </div>
            <USelect :model-value="e.status" :items="statuses" size="sm" class="w-36 shrink-0" @update:model-value="(v: string) => setStatus(e, v)" />
          </div>
          <p v-if="e.subject || e.planRef" class="mt-3 text-sm font-medium">
            {{ e.subject }}<span v-if="e.planRef" class="text-muted"> · plan {{ e.planRef }}</span>
          </p>
          <p v-if="e.message" class="mt-1 text-sm text-muted whitespace-pre-line">
            {{ e.message }}
          </p>
          <p class="mt-3 text-xs text-dimmed">
            {{ new Date(e.createdAt).toLocaleString('en-KE') }}
          </p>
        </UCard>
      </div>
      <div class="rounded-xl border border-default overflow-hidden empty:hidden">
        <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="enquiries" class="border-t-0" />
      </div>
    </template>
  </UDashboardPanel>
</template>
