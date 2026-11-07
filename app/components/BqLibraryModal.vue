<script setup lang="ts">
const props = defineProps<{ projectId: string, billId: string | null, billTemplateKey?: string | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()
const { call } = useApi()

interface Lib { code: string, billKey: string, section: string, description: string, unit: string, rate: number, itemType: string }
const { data, execute } = useFetch<{ bills: { key: string, title: string }[], items: Lib[] }>('/api/library', { immediate: false, server: false })
const filterBill = ref<string>('all')
const search = ref('')
const selected = ref<string[]>([])

watch(open, async (v) => {
  if (!v) return
  selected.value = []
  filterBill.value = props.billTemplateKey ?? 'all'
  if (!data.value) await execute()
})

const items = computed(() => (data.value?.items ?? []).filter(i =>
  (filterBill.value === 'all' || i.billKey === filterBill.value)
  && (!search.value || `${i.code} ${i.description} ${i.section}`.toLowerCase().includes(search.value.toLowerCase()))))

const { rows: pagedItems, page, pageSize, total, from, to } = usePaged(items, 'bq:library-picker', 25)

function toggle(code: string) {
  selected.value = selected.value.includes(code) ? selected.value.filter(c => c !== code) : [...selected.value, code]
}

const saving = ref(false)
async function add() {
  if (!props.billId) return
  saving.value = true
  try {
    await call(`/api/projects/${props.projectId}/library`, { method: 'POST', body: { billId: props.billId, codes: selected.value } })
    open.value = false
    emit('saved')
  }
  finally { saving.value = false }
}
</script>

<template>
  <UModal v-model:open="open" title="Add from BQ library" description="Standard items with indicative rates, measured from your project parameters." :ui="{ content: 'sm:max-w-3xl' }">
    <template #body>
      <div class="flex flex-col sm:flex-row gap-2 mb-3">
        <USelect v-model="filterBill" :items="[{ label: 'All bills', value: 'all' }, ...(data?.bills ?? []).map(b => ({ label: b.title, value: b.key }))]" class="sm:w-64" />
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search items" class="flex-1" />
      </div>
      <div class="divide-y divide-default rounded-lg border border-default">
        <label v-for="i in pagedItems" :key="i.code" class="flex gap-3 px-3 py-2.5 cursor-pointer hover:bg-elevated/50">
          <UCheckbox :model-value="selected.includes(i.code)" @update:model-value="toggle(i.code)" />
          <span class="flex-1 text-sm">
            <span class="text-xs text-muted">{{ i.code }} · {{ i.section }}</span><br>
            {{ i.description }}
          </span>
          <span class="text-xs text-right whitespace-nowrap text-muted">{{ i.unit }}<br>{{ formatNumber(i.rate, 0) }}</span>
        </label>
        <p v-if="!items.length" class="p-6 text-center text-sm text-muted">
          No matching items.
        </p>
      </div>
      <TablePager v-model:page="page" v-model:page-size="pageSize" :total="total" :from="from" :to="to" noun="items" :sizes="[25, 50, 100]" />
      <p v-if="selected.length" class="mt-2 text-xs text-muted">
        Selections are kept when you change page or filter.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <span class="text-sm text-muted">{{ selected.length }} selected</span>
        <div class="flex gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton :disabled="!selected.length" :loading="saving" icon="i-lucide-plus" label="Add to bill" @click="add" />
        </div>
      </div>
    </template>
  </UModal>
</template>
