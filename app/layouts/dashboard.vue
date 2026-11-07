<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user } = useUserSession()
const route = useRoute()

const workspace = computed<NavigationMenuItem[]>(() => [
  { label: 'BQ Projects', icon: 'i-lucide-folder-kanban', to: '/projects', active: route.path.startsWith('/projects') },
  { label: 'Cost Calculator', icon: 'i-lucide-calculator', to: '/estimate' },
  { label: 'Material Calculators', icon: 'i-lucide-boxes', to: '/calculators' }
])

const admin = computed<NavigationMenuItem[]>(() => user.value?.role !== 'admin'
  ? []
  : [
      { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
      { label: 'Feature switches', icon: 'i-lucide-toggle-right', to: '/admin/features' },
      { label: 'Locations & rates', icon: 'i-lucide-map-pin', to: '/admin/rates' },
      { label: 'Materials & prices', icon: 'i-lucide-package', to: '/admin/materials' },
      { label: 'Calculator settings', icon: 'i-lucide-sliders-horizontal', to: '/admin/calculators' },
      { label: 'BQ library', icon: 'i-lucide-library', to: '/admin/library' },
      { label: 'Estimate requests', icon: 'i-lucide-inbox', to: '/admin/leads' },
      { label: 'Users', icon: 'i-lucide-users', to: '/admin/users' },
      { label: 'Website integration', icon: 'i-lucide-plug', to: '/admin/integration' },
      { label: 'Activity log', icon: 'i-lucide-history', to: '/admin/audit' }
    ])
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar id="main" collapsible resizable :ui="{ footer: 'border-t border-default', root: 'no-print' }">
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
      </template>
      <template #default="{ collapsed }">
        <p v-if="!collapsed" class="px-2.5 pt-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-dimmed">
          Workspace
        </p>
        <UNavigationMenu :collapsed="collapsed" :items="workspace" orientation="vertical" tooltip />
        <template v-if="admin.length">
          <p v-if="!collapsed" class="px-2.5 pt-4 text-[10px] font-semibold tracking-[0.16em] uppercase text-dimmed">
            Admin back-office
          </p>
          <UNavigationMenu :collapsed="collapsed" :items="admin" orientation="vertical" tooltip />
        </template>
      </template>
      <template #footer="{ collapsed }">
        <div class="flex items-center gap-1 w-full">
          <UserMenu :collapsed="collapsed" class="flex-1" />
          <UColorModeButton v-if="!collapsed" />
        </div>
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
