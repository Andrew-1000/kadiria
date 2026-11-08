<script setup lang="ts">
useSeoMeta({ title: 'Sign in | Kadiria' })
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const { data: config } = await useBqConfig()
const { call } = useApi()

const form = reactive({ email: '', password: '' })
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    const { user } = await call<{ user: { role: string } }>('/api/auth/login', { method: 'POST', body: form })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : (user.role === 'admin' ? '/admin' : '/projects')
    await navigateTo(redirect)
  }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-16 flex justify-center">
    <UCard class="w-full max-w-md" :ui="{ body: 'p-6 sm:p-8' }">
      <div class="text-center mb-6">
        <UIcon name="i-lucide-hard-hat" class="size-10 text-primary" />
        <h1 class="font-display text-2xl font-bold mt-2">
          Sign in
        </h1>
        <p class="text-sm text-muted mt-1">
          Draft, review and issue Bills of Quantities.
        </p>
      </div>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" autocomplete="email" class="w-full" size="lg" />
        </UFormField>
        <UFormField label="Password" required>
          <PasswordInput v-model="form.password" autocomplete="current-password" class="w-full" size="lg" />
        </UFormField>
        <UButton type="submit" block size="lg" :loading="loading" label="Sign in" />
      </form>
      <p v-if="config?.flags.public_registration !== false" class="text-sm text-center text-muted mt-6">
        New here? <NuxtLink :to="{ path: '/register', query: route.query }" class="text-primary font-medium">Create a free account</NuxtLink>
      </p>
    </UCard>
  </UContainer>
</template>
