<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Activity log | Admin' })

interface Ev { id: string, actorName: string | null, action: string, details: Record<string, unknown>, projectId: string | null, at: string }
const { data: events } = await useFetch<Ev[]>('/api/admin/audit', { default: () => [], server: false })
const search = ref('')
const shown = computed(() => events.value.filter(e => !search.value || `${e.action} ${e.actorName} ${JSON.stringify(e.details)}`.toLowerCase().includes(search.value.toLowerCase())))
</script>

<template>
  <UDashboardPanel id="admin-audit">
    <template #header>
      <UDashboardNavbar title="Activity log">
        <template #right>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Filter" class="w-56" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="bq-table">
            <thead>
              <tr>
                <th>When</th><th>Who</th><th>Action</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in shown" :key="e.id">
                <td class="whitespace-nowrap text-muted">
                  {{ new Date(e.at).toLocaleString('en-KE') }}
                </td>
                <td>{{ e.actorName ?? 'System / website' }}</td>
                <td>
                  <NuxtLink v-if="e.projectId" :to="`/projects/${e.projectId}`" class="text-primary">
                    {{ e.action }}
                  </NuxtLink>
                  <span v-else>{{ e.action }}</span>
                </td>
                <td class="text-xs text-muted font-mono max-w-md truncate" :title="JSON.stringify(e.details)">
                  {{ JSON.stringify(e.details) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
