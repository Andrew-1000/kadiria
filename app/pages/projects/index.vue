<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useSeoMeta({ title: 'BQ Projects | Kadiria' })

interface Row { id: string, name: string, client: string, status: string, revision: number, currency: string, updatedAt: string, locationName: string | null, ownerName: string | null, grandTotal: number, itemCount: number }
const { data: projects, status } = await useFetch<Row[]>('/api/projects', { default: () => [] })
const { user } = useUserSession()
const search = ref('')
const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return (projects.value ?? []).filter(p => !q || `${p.name} ${p.client} ${p.locationName ?? ''}`.toLowerCase().includes(q))
})
const { rows: pagedProjects, page, pageSize, total, from, to } = usePaged(filtered, 'projects:list', 12)
const counts = computed(() => ({
  all: projects.value?.length ?? 0,
  draft: projects.value?.filter(p => p.status === 'draft').length ?? 0,
  review: projects.value?.filter(p => p.status === 'submitted' || p.status === 'approved').length ?? 0,
  issued: projects.value?.filter(p => p.status === 'issued').length ?? 0
}))
</script>

<template>
  <UDashboardPanel id="projects">
    <template #header>
      <UDashboardNavbar title="BQ Projects">
        <template #right>
          <UButton icon="i-lucide-plus" label="New BQ" to="/projects/new" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <JourneyGuide stage="bq" compact note="Each project moves from draft (stage 4) to review (stage 5) to issued (stage 6). The badge on each card shows where it is." />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard v-for="s in [
          { label: 'All projects', value: counts.all, icon: 'i-lucide-folder' },
          { label: 'Drafts', value: counts.draft, icon: 'i-lucide-pencil-ruler' },
          { label: 'In review', value: counts.review, icon: 'i-lucide-clipboard-check' },
          { label: 'Issued', value: counts.issued, icon: 'i-lucide-badge-check' }
        ]" :key="s.label" :ui="{ body: 'p-4 sm:p-4 flex items-center gap-3' }">
          <span class="size-9 rounded-lg bg-primary/10 grid place-items-center"><UIcon :name="s.icon" class="text-primary" /></span>
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">
              {{ s.label }}
            </p>
            <p class="text-xl font-semibold">
              {{ s.value }}
            </p>
          </div>
        </UCard>
      </div>

      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">
          {{ user?.role === 'admin' ? 'All projects' : 'Your projects' }}
        </h2>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search projects" class="w-64" />
      </div>

      <div v-if="status !== 'pending' && !filtered.length" class="text-center py-16 border border-dashed border-default rounded-xl">
        <UIcon name="i-lucide-file-spreadsheet" class="size-10 text-dimmed" />
        <h3 class="mt-3 font-semibold">
          No BQ projects yet
        </h3>
        <p class="text-sm text-muted mt-1">
          The wizard checks your documents and drafts the bills for you.
        </p>
        <UButton class="mt-4" icon="i-lucide-plus" label="Create your first BQ" to="/projects/new" />
      </div>

      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <NuxtLink v-for="p in pagedProjects" :key="p.id" :to="`/projects/${p.id}`" class="block group">
          <UCard class="h-full transition group-hover:ring-primary/50" :ui="{ body: 'p-5 sm:p-5 space-y-3' }">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-semibold text-highlighted truncate">
                  {{ p.name }}
                </p>
                <p class="text-sm text-muted truncate">
                  {{ p.client || 'No client' }} · {{ p.locationName || 'No location' }}
                </p>
              </div>
              <UBadge :color="STATUS_LABELS[p.status]?.color" variant="subtle" :label="STATUS_LABELS[p.status]?.label" />
            </div>
            <p class="font-display text-2xl font-bold tabular-nums">
              {{ formatMoney(p.grandTotal, p.currency) }}
            </p>
            <div class="flex justify-between text-xs text-muted">
              <span>Rev {{ p.revision }} · {{ p.itemCount }} items<template v-if="user?.role === 'admin'"> · {{ p.ownerName }}</template></span>
              <span>Updated {{ new Date(p.updatedAt).toLocaleDateString('en-KE') }}</span>
            </div>
          </UCard>
        </NuxtLink>
      </div>
      <div class="rounded-xl border border-default overflow-hidden empty:hidden">
        <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="projects" :sizes="[12, 24, 48, 96]" class="border-t-0" />
      </div>
    </template>
  </UDashboardPanel>
</template>
