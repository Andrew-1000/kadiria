<script setup lang="ts">
const { data: config } = await useBqConfig()
const { loggedIn } = useUserSession()

const links = computed(() => [
  ...(config.value?.flags.cost_estimator !== false ? [{ label: 'Cost Calculator', to: '/estimate', icon: 'i-lucide-calculator' }] : []),
  ...(config.value?.flags.material_calculators !== false ? [{ label: 'Material Calculators', to: '/calculators', icon: 'i-lucide-boxes' }] : []),
  ...(config.value?.flags.bq_projects !== false ? [{ label: 'BQ Projects', to: loggedIn.value ? '/projects' : '/login?redirect=/projects', icon: 'i-lucide-file-spreadsheet' }] : []),
  { label: 'What a BQ needs', to: '/#prerequisites', icon: 'i-lucide-list-checks' }
])
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-default">
    <UHeader :ui="{ root: 'no-print' }">
      <template #left>
        <AppLogo />
      </template>
      <UNavigationMenu :items="links" variant="link" />
      <template #right>
        <UColorModeButton />
        <UserMenu />
      </template>
      <template #body>
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>
    <UMain class="flex-1">
      <slot />
    </UMain>
    <UFooter :ui="{ root: 'no-print' }">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Davecore Construction · Estimates are indicative; confirm with a registered quantity surveyor.
        </p>
      </template>
    </UFooter>
  </div>
</template>
