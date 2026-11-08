<script setup lang="ts">
useSeoMeta({ title: 'Create account | Kadiria' })
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const { data: config } = await useBqConfig()
const { call } = useApi()

const form = reactive({ name: '', email: '', organisation: '', password: '' })
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await call('/api/auth/register', { method: 'POST', body: form })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/projects'
    await navigateTo(redirect)
  }
  finally { loading.value = false }
}
</script>

<template>
  <UContainer class="py-16 flex justify-center">
    <UCard class="w-full max-w-md" :ui="{ body: 'p-6 sm:p-8' }">
      <div v-if="config?.flags.public_registration === false" class="text-center py-6">
        <UIcon name="i-lucide-lock" class="size-10 text-dimmed" />
        <p class="mt-3 text-muted">
          Sign-up is closed. Ask an administrator for an account.
        </p>
      </div>
      <template v-else>
        <div class="text-center mb-6">
          <h1 class="font-display text-2xl font-bold">
            Create your account
          </h1>
          <p class="text-sm text-muted mt-1">
            Save BQ projects and send calculator results into them.
          </p>
        </div>
        <form class="space-y-4" @submit.prevent="submit">
          <UFormField label="Full name" required>
            <UInput v-model="form.name" autocomplete="name" class="w-full" size="lg" />
          </UFormField>
          <UFormField label="Email" required>
            <UInput v-model="form.email" type="email" autocomplete="email" class="w-full" size="lg" />
          </UFormField>
          <UFormField label="Company / organisation" hint="Optional">
            <UInput v-model="form.organisation" class="w-full" size="lg" />
          </UFormField>
          <UFormField label="Password" help="At least 8 characters." required>
            <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" size="lg" />
          </UFormField>
          <UButton type="submit" block size="lg" :loading="loading" label="Create account" />
        </form>
        <p class="text-sm text-center text-muted mt-6">
          Already registered? <NuxtLink :to="{ path: '/login', query: route.query }" class="text-primary font-medium">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </UContainer>
</template>
