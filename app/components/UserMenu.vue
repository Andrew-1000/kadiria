<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { user, loggedIn, clear } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}

const items = computed(() => [
  [{ label: user.value?.email ?? '', type: 'label' as const }],
  [
    { label: 'My BQ projects', icon: 'i-lucide-folder-kanban', to: '/projects' },
    ...(user.value?.role === 'admin' ? [{ label: 'Admin back-office', icon: 'i-lucide-shield-check', to: '/admin' }] : [])
  ],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: logout }]
])
</script>

<template>
  <UDropdownMenu v-if="loggedIn" :items="items" :content="{ align: 'end' }">
    <UButton color="neutral" variant="ghost" :block="collapsed" class="data-[state=open]:bg-elevated" :square="collapsed">
      <UAvatar :alt="user?.name" size="xs" />
      <span v-if="!collapsed" class="truncate">{{ user?.name }}</span>
      <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="ms-auto text-dimmed" />
    </UButton>
  </UDropdownMenu>
  <UButton v-else to="/login" color="neutral" variant="outline" icon="i-lucide-log-in" label="Sign in" />
</template>
