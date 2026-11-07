<script setup lang="ts">
const props = defineProps<{ projectId: string, bills: BqBill[], item?: BqItem | null, billId?: string | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()
const { call } = useApi()

const blank = () => ({ billId: props.billId ?? props.bills[0]?.id ?? '', section: '', description: '', unit: 'm²', quantity: 0, rate: 0, itemType: 'measured' as BqItem['itemType'], notes: '' })
const form = reactive(blank())
watch(open, (v) => {
  if (!v) return
  Object.assign(form, blank(), props.item
    ? { billId: props.item.billId, section: props.item.section, description: props.item.description, unit: props.item.unit, quantity: props.item.quantity, rate: props.item.rate, itemType: props.item.itemType, notes: props.item.notes }
    : {})
})
watch(() => form.itemType, (t) => {
  if (t !== 'measured' && !props.item) {
    form.unit = 'Sum'
    form.quantity = 1
  }
})

const units = ['m', 'm²', 'm³', 'kg', 't', 'nr', 'Sum', 'Item', 'L', 'bag']
const saving = ref(false)
async function save() {
  saving.value = true
  try {
    if (props.item) await call(`/api/projects/${props.projectId}/items/${props.item.id}`, { method: 'PUT', body: form })
    else await call(`/api/projects/${props.projectId}/items`, { method: 'POST', body: form })
    open.value = false
    emit('saved')
  }
  finally { saving.value = false }
}
</script>

<template>
  <UModal v-model:open="open" :title="item ? 'Edit item' : 'Add item'" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <form id="item-form" class="grid sm:grid-cols-2 gap-4" @submit.prevent="save">
        <UFormField label="Bill">
          <USelect v-model="form.billId" :items="bills.map(b => ({ label: `${b.number}. ${b.title}`, value: b.id }))" class="w-full" />
        </UFormField>
        <UFormField label="Item type">
          <USelect v-model="form.itemType" :items="Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => ({ value, label }))" class="w-full" />
        </UFormField>
        <UFormField label="Section heading" hint="Optional" class="sm:col-span-2">
          <UInput v-model="form.section" placeholder="e.g. Concrete work" class="w-full" />
        </UFormField>
        <UFormField label="Description" required class="sm:col-span-2">
          <UTextarea v-model="form.description" :rows="3" autoresize class="w-full" placeholder="e.g. Reinforced concrete (1:2:4) in strip footings" />
        </UFormField>
        <UFormField label="Unit" required>
          <UInputMenu v-model="form.unit" :items="units" create-item class="w-full" @create="(u: string) => form.unit = u" />
        </UFormField>
        <UFormField label="Quantity" required>
          <UInput v-model.number="form.quantity" type="number" min="0" step="0.01" class="w-full" />
        </UFormField>
        <UFormField label="Rate" required>
          <UInput v-model.number="form.rate" type="number" min="0" step="1" class="w-full" />
        </UFormField>
        <UFormField label="Amount">
          <UInput :model-value="formatNumber(itemTotal(form), 2)" disabled class="w-full" />
        </UFormField>
        <UFormField label="Notes" hint="Internal" class="sm:col-span-2">
          <UInput v-model="form.notes" class="w-full" />
        </UFormField>
      </form>
      <div v-if="item?.calcSnapshot?.materials?.length" class="mt-4 rounded-lg border border-default p-3 text-xs">
        <p class="font-semibold mb-1">
          Materials behind this rate ({{ item.calcSnapshot.module?.name }})
        </p>
        <ul class="grid sm:grid-cols-2 gap-x-4 text-muted">
          <li v-for="m in item.calcSnapshot.materials" :key="m.label">
            {{ m.label }}: {{ formatNumber(m.quantity, 2) }} {{ m.unit }}
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
        <UButton type="submit" form="item-form" :loading="saving" :label="item ? 'Save changes' : 'Add item'" />
      </div>
    </template>
  </UModal>
</template>
