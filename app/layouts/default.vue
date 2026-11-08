<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { STRUCTURE_LIST } from '#shared/calc/structures'

/*
 * Two frames, chosen by sign-in:
 * - Signed out (the public): a website-style top bar with the calculators and the construction guide.
 * - Signed in: the workspace sidebar with every major page and, for admins, the back-office.
 *   Pages that build their own dashboard panel set `ownPanel: true` in definePageMeta; every other
 *   page is wrapped in a panel here.
 * Embed pages (websites) and print views use their own minimal layouts.
 */
const { data: config } = await useBqConfig()
const { user, loggedIn } = useUserSession()
const route = useRoute()
const flags = computed(() => config.value?.flags ?? {} as Record<string, boolean>)

const workspace = computed<NavigationMenuItem[]>(() => [
  { label: 'Home', icon: 'i-lucide-house', to: '/', exact: true },
  ...(flags.value.cost_estimator !== false ? [{ label: 'Cost calculator', icon: 'i-lucide-calculator', to: '/estimate' }] : []),
  ...(flags.value.material_calculators !== false
    ? [{
        label: 'Material calculators',
        icon: 'i-lucide-boxes',
        to: '/calculators',
        active: route.path === '/calculators',
        defaultOpen: route.path === '/calculators',
        children: (config.value?.modules ?? []).filter(m => m.enabled).map((m, i) => ({
          label: `${i + 1}. ${m.name}`,
          to: { path: '/calculators', query: { module: m.key } },
          active: route.path === '/calculators' && route.query.module === m.key
        }))
      }]
    : []),
  ...(flags.value.material_calculators !== false
    ? [{
        label: 'Other structures',
        icon: 'i-lucide-shapes',
        to: '/structures',
        active: route.path === '/structures',
        defaultOpen: route.path === '/structures',
        children: STRUCTURE_LIST.map(s => ({
          label: s.name,
          to: { path: '/structures', query: { type: s.key } },
          active: route.path === '/structures' && (route.query.type ?? STRUCTURE_LIST[0]!.key) === s.key
        }))
      }]
    : []),
  ...(flags.value.bq_projects !== false ? [{ label: 'BQ projects', icon: 'i-lucide-folder-kanban', to: loggedIn.value ? '/projects' : '/login?redirect=/projects', active: route.path.startsWith('/projects') }] : [])
])

// The construction guide: stages that aren't a calculator of their own
const guide = computed<NavigationMenuItem[]>(() => [
  ...JOURNEY.filter(s => ['prepare', 'bq', 'review', 'build'].includes(s.key)).map(s => ({
    label: s.key === 'prepare' ? 'What a BQ needs' : s.title,
    icon: s.icon,
    to: s.to
  })),
  { label: 'Measurement & rules', icon: 'i-lucide-ruler', to: '/standards' }
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
      { label: 'Methods of measurement', icon: 'i-lucide-ruler', to: '/admin/standards' },
      { label: 'Estimate requests', icon: 'i-lucide-inbox', to: '/admin/leads' },
      { label: 'Website enquiries', icon: 'i-lucide-mail', to: '/admin/enquiries' },
      { label: 'Users', icon: 'i-lucide-users', to: '/admin/users' },
      { label: 'Website integration', icon: 'i-lucide-plug', to: '/admin/integration' },
      { label: 'Activity log', icon: 'i-lucide-history', to: '/admin/audit' }
    ])

// Signed-out visitors get the public top bar; signed-in users (and workspace pages) the sidebar
const workspaceView = computed(() => loggedIn.value || !!route.meta.ownPanel)
// The public sees the two calculators; other structures, BQ projects and the guide are for signed-in users
const publicLinks = computed<NavigationMenuItem[]>(() => [
  ...(flags.value.cost_estimator !== false ? [{ label: 'Cost calculator', icon: 'i-lucide-calculator', to: '/estimate' }] : []),
  ...(flags.value.material_calculators !== false ? [{ label: 'Material calculators', icon: 'i-lucide-boxes', to: '/calculators' }] : [])
])

/** Title in the top bar of pages wrapped by this layout. */
const TITLES: Record<string, string> = { '/': 'Home', '/estimate': 'Cost calculator', '/calculators': 'Material calculators', '/prepare': 'What a BQ needs', '/standards': 'Measurement & rules', '/structures': 'Other structures', '/login': 'Sign in', '/register': 'Create account' }
const pageTitle = computed(() => TITLES[route.path] ?? (route.path.startsWith('/stage/') ? JOURNEY.find(s => s.to === route.path)?.title ?? 'Construction guide' : 'Kadiria'))
</script>

<template>
  <!-- Public site (signed out) -->
  <div v-if="!workspaceView" class="min-h-dvh flex flex-col bg-default">
    <UHeader :ui="{ root: 'no-print' }" mode="slideover">
      <template #left>
        <AppLogo />
      </template>
      <UNavigationMenu :items="publicLinks" variant="link" content-orientation="vertical" />
      <template #right>
        <UColorModeButton />
        <UButton to="/login" color="neutral" variant="ghost" icon="i-lucide-log-in" label="Sign in" class="hidden sm:inline-flex" />
        <UButton v-if="flags.public_registration !== false" to="/register" label="Create account" class="hidden md:inline-flex" />
      </template>
      <template #body>
        <UNavigationMenu :items="publicLinks" orientation="vertical" class="-mx-2.5" />
        <div class="mt-4 flex gap-2">
          <UButton to="/login" color="neutral" variant="outline" icon="i-lucide-log-in" label="Sign in" class="flex-1 justify-center" />
          <UButton v-if="flags.public_registration !== false" to="/register" label="Create account" class="flex-1 justify-center" />
        </div>
      </template>
    </UHeader>
    <UMain class="flex-1">
      <slot />
    </UMain>
    <UFooter :ui="{ root: 'no-print' }">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Kadiria · Estimates are indicative; confirm with a registered quantity surveyor.
        </p>
      </template>
    </UFooter>
  </div>

  <!-- Workspace (signed in) -->
  <UDashboardGroup v-else unit="rem" storage="local">
    <UDashboardSidebar id="main" collapsible resizable :ui="{ footer: 'border-t border-default', root: 'no-print' }">
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
      </template>
      <template #default="{ collapsed }">
        <p v-if="!collapsed" class="px-2.5 pt-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-dimmed">
          Workspace
        </p>
        <UNavigationMenu :collapsed="collapsed" :items="workspace" orientation="vertical" tooltip popover />
        <p v-if="!collapsed" class="px-2.5 pt-4 text-[10px] font-semibold tracking-[0.16em] uppercase text-dimmed">
          Construction guide
        </p>
        <UNavigationMenu :collapsed="collapsed" :items="guide" orientation="vertical" tooltip />
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

    <!-- Pages with their own dashboard panel (BQ projects, admin) -->
    <slot v-if="route.meta.ownPanel" />
    <!-- Everything else: wrapped in a panel with a title bar -->
    <UDashboardPanel v-else id="page" :ui="{ body: '*:shrink-0' }">
      <template #header>
        <UDashboardNavbar :title="pageTitle" :ui="{ root: 'no-print' }">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <slot />
        <p class="no-print text-xs text-dimmed pt-6 pb-2">
          © {{ new Date().getFullYear() }} Kadiria · Estimates are indicative; confirm with a registered quantity surveyor.
        </p>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
