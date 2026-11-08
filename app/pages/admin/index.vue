<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Admin | Kadiria' })

interface Stats {
  counts: Record<'users' | 'projects' | 'issued' | 'leads' | 'newLeads' | 'materials', number>
  flags: { key: string, label: string, description: string, enabled: boolean }[]
  recent: { id: string, action: string, actorName: string | null, at: string }[]
}
const { data, refresh } = await useFetch<Stats>('/api/admin/stats', { server: false })
const { call } = useApi()

function setFlag(key: string, enabled: boolean) {
  if (data.value) data.value = { ...data.value, flags: data.value.flags.map(f => f.key === key ? { ...f, enabled } : f) }
}

/** Optimistic: flip the switch immediately, save in the background, roll back on failure. */
async function toggle(key: string, enabled: boolean) {
  setFlag(key, enabled)
  try {
    await call(`/api/admin/ref/flags/${key}`, { method: 'PUT', body: { enabled } })
    refreshNuxtData('bq-config')
    refresh()
  }
  catch {
    setFlag(key, !enabled)
  }
}

const cards = computed(() => data.value
  ? [
      { label: 'BQ projects', value: data.value.counts.projects, icon: 'i-lucide-folder-kanban', to: '/projects' },
      { label: 'Issued BQs', value: data.value.counts.issued, icon: 'i-lucide-stamp', to: '/projects' },
      { label: 'New estimate requests', value: data.value.counts.newLeads, icon: 'i-lucide-inbox', to: '/admin/leads' },
      { label: 'Users', value: data.value.counts.users, icon: 'i-lucide-users', to: '/admin/users' }
    ]
  : [])
</script>

<template>
  <UDashboardPanel id="admin-overview">
    <template #header>
      <UDashboardNavbar title="Admin back-office" />
    </template>
    <template #body>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <NuxtLink v-for="c in cards" :key="c.label" :to="c.to">
          <UCard :ui="{ body: 'p-4 sm:p-4 flex items-center gap-3' }" class="hover:ring-primary/50 transition">
            <span class="size-9 rounded-lg bg-primary/10 grid place-items-center"><UIcon :name="c.icon" class="text-primary" /></span>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider">
                {{ c.label }}
              </p>
              <p class="text-xl font-semibold">
                {{ c.value }}
              </p>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">
                Calculators &amp; features
              </h3>
              <UButton size="xs" color="neutral" variant="ghost" label="All switches" to="/admin/features" trailing-icon="i-lucide-arrow-right" />
            </div>
          </template>
          <div class="space-y-4">
            <USwitch
              v-for="f in data?.flags ?? []"
              :key="f.key"
              :model-value="f.enabled"
              :label="f.label"
              :description="f.description"
              @update:model-value="(v: boolean) => toggle(f.key, v)"
            />
          </div>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">
                Recent activity
              </h3>
              <UButton size="xs" color="neutral" variant="ghost" label="Activity log" to="/admin/audit" trailing-icon="i-lucide-arrow-right" />
            </div>
          </template>
          <ul class="divide-y divide-default text-sm">
            <li v-for="e in data?.recent ?? []" :key="e.id" class="py-2 flex justify-between gap-3">
              <span><b>{{ e.actorName ?? 'System' }}</b> · {{ e.action }}</span>
              <span class="text-muted whitespace-nowrap">{{ new Date(e.at).toLocaleString('en-KE') }}</span>
            </li>
          </ul>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold">
            How the back-office drives the calculators
          </h3>
        </template>
        <div class="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="font-medium">
              <UIcon name="i-lucide-map-pin" class="text-primary align-[-2px]" /> Locations &amp; rates
            </p>
            <p class="text-muted mt-1">
              Cost-per-m² bands per rate tier and finish feed the Cost Calculator, and scale BQ library rates by region.
            </p>
          </div>
          <div>
            <p class="font-medium">
              <UIcon name="i-lucide-package" class="text-primary align-[-2px]" /> Materials &amp; prices
            </p>
            <p class="text-muted mt-1">
              Effective-dated prices (national and per location) price every material calculator result.
            </p>
          </div>
          <div>
            <p class="font-medium">
              <UIcon name="i-lucide-sliders-horizontal" class="text-primary align-[-2px]" /> Calculator settings
            </p>
            <p class="text-muted mt-1">
              Densities, voids factors, stone sizes and module defaults change the formulas' inputs with no code release.
            </p>
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
