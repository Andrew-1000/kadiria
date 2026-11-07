<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Calculator settings | Admin' })

interface Constant { key: string, label: string, value: number, unit: string, groupName: string, description: string }
interface ModuleCfg { key: string, name: string, description: string, enabled: boolean, inputs: { key: string, label: string, unit?: string, type?: string, default?: number | string, options?: { label: string, value: string | number }[], mixKind?: string }[] }

const { data: constants, refresh } = await useFetch<Constant[]>('/api/admin/ref/constants', { default: () => [], server: false })
const { data: config } = await useBqConfig()
const { data: moduleRows, refresh: refreshModules } = await useFetch<{ key: string, defaults: Record<string, number | string> }[]>('/api/admin/ref/modules', { default: () => [], server: false })
const { call, toast } = useApi()

const groups = computed(() => {
  const map = new Map<string, Constant[]>()
  for (const c of constants.value) map.set(c.groupName, [...(map.get(c.groupName) ?? []), c])
  return [...map.entries()]
})

const drafts = reactive<Record<string, number>>({})
watchEffect(() => { for (const c of constants.value) if (drafts[c.key] === undefined) drafts[c.key] = c.value })
async function saveConstant(c: Constant) {
  if (drafts[c.key] === c.value) return
  await call(`/api/admin/ref/constants/${c.key}`, { method: 'PUT', body: { value: drafts[c.key] } })
  toast.add({ title: `${c.label} updated`, color: 'success', icon: 'i-lucide-check' })
  await refresh()
  refreshNuxtData('bq-config')
}

// Module default inputs
const modules = computed(() => (config.value?.modules ?? []) as ModuleCfg[])
const editing = ref<ModuleCfg | null>(null)
const defaultsForm = reactive<Record<string, number | string | undefined>>({})
function editModule(m: ModuleCfg) {
  editing.value = m
  for (const k of Object.keys(defaultsForm)) delete defaultsForm[k]
  for (const i of m.inputs) defaultsForm[i.key] = i.default
}
async function saveDefaults() {
  if (!editing.value) return
  const clean = Object.fromEntries(Object.entries(defaultsForm).filter(([, v]) => v !== undefined && v !== ''))
  await call(`/api/admin/ref/modules/${editing.value.key}`, { method: 'PUT', body: { defaults: clean } })
  toast.add({ title: 'Defaults saved', color: 'success', icon: 'i-lucide-check' })
  editing.value = null
  await refreshModules()
  await refreshNuxtData('bq-config')
}
const overrides = (key: string) => Object.keys(moduleRows.value.find(r => r.key === key)?.defaults ?? {}).length
function optionsFor(i: ModuleCfg['inputs'][number]) {
  if (i.type === 'mix') return (config.value?.mixes ?? []).filter(m => m.kind === i.mixKind).map(m => ({ label: m.name, value: m.key }))
  return i.options ?? []
}
</script>

<template>
  <UDashboardPanel id="admin-calculators">
    <template #header>
      <UDashboardNavbar title="Calculator settings" />
    </template>
    <template #body>
      <UCard>
        <template #header>
          <h3 class="font-semibold">
            Engineering constants
          </h3>
          <p class="text-sm text-muted">
            Used by every material formula. Changes apply to new calculations immediately; items already in a BQ keep their snapshot.
          </p>
        </template>
        <div class="space-y-6">
          <div v-for="[group, items] in groups" :key="group">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              {{ group }}
            </p>
            <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <UFormField v-for="c in items" :key="c.key" :label="c.label" :help="c.description || undefined">
                <UInput v-model.number="drafts[c.key]" type="number" step="any" class="w-full" @change="saveConstant(c)">
                  <template #trailing>
                    <span class="text-xs text-muted">{{ c.unit }}</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h3 class="font-semibold">
            Module default inputs
          </h3>
          <p class="text-sm text-muted">
            Set typical dimensions, mixes and bar sizes your team uses, so users start from your standards. Switch modules on/off under Feature switches.
          </p>
        </template>
        <table class="bq-table">
          <thead>
            <tr>
              <th>Module</th><th>Description</th><th>Custom defaults</th><th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in modules" :key="m.key">
              <td class="font-medium whitespace-nowrap">
                {{ m.name }}
              </td>
              <td class="text-muted">
                {{ m.description }}
              </td>
              <td>{{ overrides(m.key) || '—' }}</td>
              <td class="text-right">
                <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-sliders-horizontal" label="Defaults" @click="editModule(m)" />
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <UModal :open="!!editing" :title="`Defaults: ${editing?.name}`" :ui="{ content: 'sm:max-w-2xl' }" @update:open="(v: boolean) => { if (!v) editing = null }">
        <template #body>
          <form v-if="editing" id="defaults-form" class="grid sm:grid-cols-2 gap-4" @submit.prevent="saveDefaults">
            <UFormField v-for="i in editing.inputs" :key="i.key" :label="`${i.label}${i.unit ? ` (${i.unit})` : ''}`">
              <USelect v-if="i.type === 'mix' || i.type === 'select' || i.type === 'bar'" v-model="defaultsForm[i.key]" :items="optionsFor(i)" class="w-full" />
              <UInput v-else v-model.number="defaultsForm[i.key]" type="number" step="any" class="w-full" placeholder="(no default)" />
            </UFormField>
          </form>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="editing = null" />
            <UButton type="submit" form="defaults-form" label="Save defaults" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
