<script setup lang="ts">
/**
 * Generic editor for an admin reference table (/api/admin/ref/:name).
 * Columns describe how to display and edit each field.
 */
interface RefColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  options?: { label: string, value: string | number }[]
  /** Not editable after creation (primary keys). */
  createOnly?: boolean
  /** Hide from the table (still in the form). */
  formOnly?: boolean
  /** Toggle directly in the table. */
  inline?: boolean
  help?: string
  step?: number
  format?: (row: Record<string, unknown>) => string
}

const props = withDefaults(defineProps<{
  name: string
  title: string
  description?: string
  columns: RefColumn[]
  pk?: string
  defaults?: Record<string, unknown>
  canCreate?: boolean
  canDelete?: boolean
  filter?: (row: Record<string, unknown>) => boolean
}>(), { pk: 'id', canCreate: true, canDelete: true, defaults: () => ({}), description: '', filter: undefined })
const emit = defineEmits<{ changed: [] }>()
const { call, toast } = useApi()

const { data: rows, refresh, status } = await useFetch<Record<string, unknown>[]>(`/api/admin/ref/${props.name}`, { default: () => [], server: false })
const shown = computed(() => props.filter ? rows.value.filter(props.filter) : rows.value)
const tableColumns = computed(() => props.columns.filter(c => !c.formOnly))

const open = ref(false)
const editing = ref<Record<string, unknown> | null>(null)
const form = reactive<Record<string, unknown>>({})

function startCreate() {
  editing.value = null
  for (const k of Object.keys(form)) delete form[k]
  Object.assign(form, Object.fromEntries(props.columns.map(c => [c.key, c.type === 'boolean' ? true : c.type === 'number' ? 0 : ''])), props.defaults)
  open.value = true
}
function startEdit(row: Record<string, unknown>) {
  editing.value = row
  for (const k of Object.keys(form)) delete form[k]
  Object.assign(form, Object.fromEntries(props.columns.map(c => [c.key, row[c.key]])))
  open.value = true
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const body = { ...form }
    if (editing.value) {
      for (const c of props.columns) if (c.createOnly) delete body[c.key]
      await call(`/api/admin/ref/${props.name}/${encodeURIComponent(String(editing.value[props.pk]))}`, { method: 'PUT', body })
    }
    else {
      await call(`/api/admin/ref/${props.name}`, { method: 'POST', body })
    }
    open.value = false
    toast.add({ title: 'Saved', color: 'success', icon: 'i-lucide-check' })
    await refresh()
    emit('changed')
  }
  finally { saving.value = false }
}

async function toggle(row: Record<string, unknown>, key: string, value: boolean) {
  await call(`/api/admin/ref/${props.name}/${encodeURIComponent(String(row[props.pk]))}`, { method: 'PUT', body: { [key]: value } })
  row[key] = value
  emit('changed')
}

const confirmDelete = ref<Record<string, unknown> | null>(null)
async function remove() {
  if (!confirmDelete.value) return
  await call(`/api/admin/ref/${props.name}/${encodeURIComponent(String(confirmDelete.value[props.pk]))}`, { method: 'DELETE' })
  confirmDelete.value = null
  await refresh()
  emit('changed')
}

function display(row: Record<string, unknown>, c: RefColumn) {
  if (c.format) return c.format(row)
  const v = row[c.key]
  if (c.type === 'select') return c.options?.find(o => o.value === v)?.label ?? String(v ?? '')
  if (typeof v === 'number') return formatNumber(v, 4)
  return String(v ?? '')
}

defineExpose({ refresh, rows })
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-highlighted">
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm text-muted mt-0.5">
            {{ description }}
          </p>
        </div>
        <div class="flex gap-2">
          <slot name="actions" />
          <UButton v-if="canCreate" size="sm" icon="i-lucide-plus" label="Add" @click="startCreate" />
        </div>
      </div>
    </template>
    <div class="overflow-x-auto">
      <table class="bq-table">
        <thead>
          <tr>
            <th v-for="c in tableColumns" :key="c.key" :class="c.type === 'number' ? 'num' : ''">
              {{ c.label }}
            </th>
            <slot name="extra-head" />
            <th class="w-20" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in shown" :key="String(row[pk])">
            <td v-for="c in tableColumns" :key="c.key" :class="c.type === 'number' ? 'num' : ''">
              <USwitch v-if="c.type === 'boolean' && c.inline" :model-value="Boolean(row[c.key])" size="sm" @update:model-value="(v: boolean) => toggle(row, c.key, v)" />
              <UIcon v-else-if="c.type === 'boolean'" :name="row[c.key] ? 'i-lucide-check' : 'i-lucide-minus'" :class="row[c.key] ? 'text-success' : 'text-dimmed'" />
              <span v-else>{{ display(row, c) }}</span>
            </td>
            <slot name="extra-cells" :row="row" />
            <td class="text-right whitespace-nowrap">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit" @click="startEdit(row)" />
              <UButton v-if="canDelete" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Delete" @click="confirmDelete = row" />
            </td>
          </tr>
          <tr v-if="status !== 'pending' && !shown.length">
            <td :colspan="tableColumns.length + 2" class="text-center text-muted py-6">
              Nothing here yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="`${editing ? 'Edit' : 'Add'}: ${title}`" :ui="{ content: 'sm:max-w-2xl' }">
      <template #body>
        <form :id="`ref-form-${name}`" class="grid sm:grid-cols-2 gap-4" @submit.prevent="save">
          <UFormField v-for="c in columns" :key="c.key" :label="c.label" :help="c.help" :class="c.type === 'textarea' ? 'sm:col-span-2' : ''">
            <USwitch v-if="c.type === 'boolean'" v-model="form[c.key] as boolean" />
            <USelect v-else-if="c.type === 'select'" v-model="form[c.key] as string" :items="c.options ?? []" :disabled="!!editing && c.createOnly" class="w-full" />
            <UTextarea v-else-if="c.type === 'textarea'" v-model="form[c.key] as string" :rows="3" autoresize class="w-full" />
            <UInput v-else-if="c.type === 'number'" v-model.number="form[c.key] as number" type="number" :step="c.step ?? 'any'" class="w-full" />
            <UInput v-else v-model="form[c.key] as string" :disabled="!!editing && c.createOnly" class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" :form="`ref-form-${name}`" :loading="saving" label="Save" />
        </div>
      </template>
    </UModal>

    <UModal :open="!!confirmDelete" title="Delete this record?" description="This cannot be undone. Records that are in use elsewhere cannot be deleted; deactivate them instead." @update:open="(v: boolean) => { if (!v) confirmDelete = null }">
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="confirmDelete = null" />
          <UButton color="error" icon="i-lucide-trash-2" label="Delete" @click="remove" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
