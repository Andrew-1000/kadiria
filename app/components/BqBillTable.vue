<script setup lang="ts">
const props = defineProps<{ bill: BqBill, currency: string, editable: boolean, projectId: string }>()
const emit = defineEmits<{ changed: [], edit: [item: BqItem], add: [billId: string], library: [billId: string] }>()
const { call } = useApi()

const total = computed(() => props.bill.items.reduce((s, i) => s + itemTotal(i), 0))

async function saveField(item: BqItem, field: 'quantity' | 'rate', raw: string | number) {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0 || value === item[field]) return
  await call(`/api/projects/${props.projectId}/items/${item.id}`, { method: 'PUT', body: { [field]: value } })
  emit('changed')
}

async function remove(item: BqItem) {
  await call(`/api/projects/${props.projectId}/items/${item.id}`, { method: 'DELETE' })
  emit('changed')
}

// Group consecutive items by section heading, as in a printed BQ
const rows = computed(() => {
  const out: ({ kind: 'section', label: string } | { kind: 'item', item: BqItem, ref: string })[] = []
  let last = ''
  props.bill.items.forEach((item, i) => {
    if (item.section && item.section !== last) {
      out.push({ kind: 'section', label: item.section })
      last = item.section
    }
    out.push({ kind: 'item', item, ref: `${props.bill.number}.${i + 1}` })
  })
  return out
})
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0', header: 'px-4 py-3 sm:px-5' }">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="size-7 rounded-md bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">{{ bill.number }}</span>
          <h3 class="font-semibold text-highlighted truncate">
            {{ bill.title }}
          </h3>
          <UBadge v-if="bill.provisional" color="warning" variant="subtle" size="sm" label="Provisional" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold tabular-nums">{{ formatMoney(total, currency, 2) }}</span>
          <template v-if="editable">
            <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-library" label="From library" @click="emit('library', bill.id)" />
            <UButton size="xs" icon="i-lucide-plus" label="Item" @click="emit('add', bill.id)" />
          </template>
        </div>
      </div>
      <p v-if="bill.notes" class="text-xs text-warning mt-1">
        {{ bill.notes }}
      </p>
    </template>

    <div class="overflow-x-auto">
      <table class="bq-table min-w-[760px]">
        <thead>
          <tr>
            <th class="w-14">
              Item
            </th>
            <th>Description</th>
            <th class="w-16">
              Unit
            </th>
            <th class="num w-28">
              Qty
            </th>
            <th class="num w-32">
              Rate
            </th>
            <th class="num w-36">
              Amount
            </th>
            <th v-if="editable" class="w-16" />
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, idx) in rows" :key="row.kind === 'item' ? row.item.id : `s-${idx}`">
            <tr v-if="row.kind === 'section'">
              <td />
              <td colspan="5" class="font-semibold uppercase text-xs tracking-wider text-muted pt-3">
                {{ row.label }}
              </td>
              <td v-if="editable" />
            </tr>
            <tr v-else class="group">
              <td class="text-muted tabular-nums">
                {{ row.ref }}
              </td>
              <td>
                <div class="flex items-start gap-1.5">
                  <span>{{ row.item.description }}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge v-if="row.item.itemType !== 'measured'" size="sm" variant="subtle" :color="row.item.itemType === 'pc_sum' ? 'info' : 'warning'" :label="ITEM_TYPE_LABELS[row.item.itemType]" />
                  <UBadge v-if="row.item.source === 'calculator'" size="sm" variant="subtle" color="success" icon="i-lucide-calculator" :label="row.item.calcSnapshot?.module?.name ?? 'Calculator'" />
                  <UBadge v-if="row.item.libraryCode" size="sm" variant="outline" color="neutral" :label="row.item.libraryCode" />
                </div>
              </td>
              <td>{{ row.item.unit }}</td>
              <td class="num">
                <input
                  v-if="editable"
                  :value="row.item.quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-24 text-right bg-transparent rounded px-1 py-0.5 border border-transparent hover:border-default focus:border-primary focus:outline-none tabular-nums"
                  :aria-label="`Quantity for item ${row.ref}`"
                  @change="saveField(row.item, 'quantity', ($event.target as HTMLInputElement).value)"
                >
                <span v-else>{{ formatNumber(row.item.quantity, 2) }}</span>
              </td>
              <td class="num">
                <input
                  v-if="editable"
                  :value="row.item.rate"
                  type="number"
                  min="0"
                  step="1"
                  class="w-28 text-right bg-transparent rounded px-1 py-0.5 border border-transparent hover:border-default focus:border-primary focus:outline-none tabular-nums"
                  :aria-label="`Rate for item ${row.ref}`"
                  @change="saveField(row.item, 'rate', ($event.target as HTMLInputElement).value)"
                >
                <span v-else>{{ formatNumber(row.item.rate, 2) }}</span>
              </td>
              <td class="num font-medium">
                {{ formatNumber(itemTotal(row.item), 2) }}
              </td>
              <td v-if="editable" class="text-right whitespace-nowrap">
                <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit item" @click="emit('edit', row.item)" />
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Delete item" @click="remove(row.item)" />
              </td>
            </tr>
          </template>
          <tr v-if="!bill.items.length">
            <td :colspan="editable ? 7 : 6" class="text-center text-muted py-6">
              No items in this bill yet.
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="font-semibold text-right">
              Total carried to summary
            </td>
            <td class="num font-bold">
              {{ formatNumber(total, 2) }}
            </td>
            <td v-if="editable" />
          </tr>
        </tfoot>
      </table>
    </div>
  </UCard>
</template>
