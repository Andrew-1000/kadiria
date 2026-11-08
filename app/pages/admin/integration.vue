<script setup lang="ts">
definePageMeta({ ownPanel: true, middleware: 'admin' })
useSeoMeta({ title: 'Website integration | Admin' })

interface Key { id: string, name: string, prefix: string, createdAt: string, lastUsedAt: string | null, revokedAt: string | null }
const { data, refresh } = await useFetch<{ origins: string[], issuer: string, keys: Key[] }>('/api/admin/integration', { server: false })
const { call, toast } = useApi()
const requestUrl = useRequestURL()
const base = computed(() => requestUrl.origin)

const originsText = ref('')
watchEffect(() => { if (data.value) originsText.value = data.value.origins.join('\n') })
async function saveOrigins() {
  const origins = originsText.value.split(/\s+/).map(s => s.trim()).filter(Boolean)
  await call('/api/admin/integration', { method: 'PUT', body: { origins } })
  toast.add({ title: 'Allowed origins saved', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

const issuer = ref('')
watchEffect(() => { if (data.value) issuer.value = data.value.issuer })
async function saveIssuer() {
  await call('/api/admin/branding', { method: 'PUT', body: { issuer: issuer.value } })
  toast.add({ title: 'Saved', description: issuer.value.trim() ? `BQs and reports now show "${issuer.value.trim()}".` : 'BQs and reports now show "Kadiria".', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

const { rows: pagedKeys, page, pageSize, total, from, to } = usePaged(() => data.value?.keys ?? [], 'admin:api-keys')
const keyName = ref('Company website')
const newKey = ref<string | null>(null)
async function createKey() {
  const res = await call<{ key: string }>('/api/admin/api-keys', { method: 'POST', body: { name: keyName.value } })
  newKey.value = res.key
  await refresh()
}
async function revoke(k: Key) {
  await call(`/api/admin/api-keys/${k.id}`, { method: 'DELETE' })
  await refresh()
}

const snippet = computed(() => `<iframe src="${base.value}/embed/estimate" title="Construction Cost Calculator"
        style="width:100%;min-height:1600px;border:0" loading="lazy"></iframe>

<iframe src="${base.value}/embed/calculators?module=blinding" title="Material Calculators"
        style="width:100%;min-height:1400px;border:0" loading="lazy"></iframe>`)

const apiDoc = computed(() => `# Public (no key; CORS for allowed origins)
GET  ${base.value}/api/public/features         → which calculators are on
GET  ${base.value}/api/public/config           → locations, rates, modules
POST ${base.value}/api/public/estimate         → cost estimate
POST ${base.value}/api/public/modules/{key}    → material quantities

# Website admin (server-to-server, header: Authorization: Bearer kdr_...)
GET  ${base.value}/api/integration/features
PUT  ${base.value}/api/integration/features/cost_estimator      {"enabled": false}
PUT  ${base.value}/api/integration/features/module:blinding     {"enabled": true}`)
</script>

<template>
  <UDashboardPanel id="admin-integration">
    <template #header>
      <UDashboardNavbar title="Website integration" />
    </template>
    <template #body>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-plug"
        title="Plugging the BQ subsystem into the company website"
        description="The BQ system runs as its own service. The website can (1) embed the calculators with an iframe, (2) call the public JSON API to render its own UI, and (3) let the website's admin switch calculators on/off using an API key."
      />

      <div class="grid lg:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Allowed website origins
            </h3>
            <p class="text-sm text-muted">
              One per line, e.g. https://www.example.co.ke. These may frame /embed pages and call /api/public from the browser.
            </p>
          </template>
          <UTextarea v-model="originsText" :rows="5" class="w-full font-mono" placeholder="https://www.example.co.ke" />
          <UButton class="mt-3" label="Save origins" @click="saveOrigins" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              Name printed on documents
            </h3>
            <p class="text-sm text-muted">
              Shown at the top of printed Bills of Quantities and detailed cost reports, e.g. your company name. Leave empty to show "Kadiria".
            </p>
          </template>
          <UInput v-model="issuer" maxlength="120" placeholder="e.g. Your Company Ltd" class="w-full" />
          <UButton class="mt-3" label="Save name" @click="saveIssuer" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">
              API keys
            </h3>
            <p class="text-sm text-muted">
              For the website's server to read and switch features. Keys are shown once; store them in the website's environment.
            </p>
          </template>
          <div class="flex gap-2">
            <UInput v-model="keyName" class="flex-1" />
            <UButton icon="i-lucide-key-round" label="Create key" @click="createKey" />
          </div>
          <UAlert v-if="newKey" class="mt-3" color="warning" variant="subtle" icon="i-lucide-copy" title="Copy this key now; it will not be shown again.">
            <template #description>
              <code class="break-all select-all">{{ newKey }}</code>
            </template>
          </UAlert>
          <ul class="mt-4 divide-y divide-default text-sm">
            <li v-for="k in pagedKeys" :key="k.id" class="py-2 flex items-center justify-between gap-2">
              <span>
                <b>{{ k.name }}</b> <code class="text-xs text-muted">{{ k.prefix }}…</code><br>
                <span class="text-xs text-muted">Created {{ new Date(k.createdAt).toLocaleDateString('en-KE') }} · {{ k.lastUsedAt ? `last used ${new Date(k.lastUsedAt).toLocaleString('en-KE')}` : 'never used' }}</span>
              </span>
              <UBadge v-if="k.revokedAt" color="error" variant="subtle" label="Revoked" />
              <UButton v-else size="xs" color="error" variant="outline" label="Revoke" @click="revoke(k)" />
            </li>
          </ul>
          <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="keys" class="-mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-2" />
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold">
            Embed snippet
          </h3>
        </template>
        <pre class="text-xs bg-elevated rounded-lg p-4 overflow-x-auto"><code>{{ snippet }}</code></pre>
      </UCard>
      <UCard>
        <template #header>
          <h3 class="font-semibold">
            API reference
          </h3>
        </template>
        <pre class="text-xs bg-elevated rounded-lg p-4 overflow-x-auto"><code>{{ apiDoc }}</code></pre>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
