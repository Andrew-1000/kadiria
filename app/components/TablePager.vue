<script setup lang="ts">
/** Footer for a paged table: "Showing x–y of n", rows-per-page and page buttons. */
const props = withDefaults(defineProps<{ total: number, from: number, to: number, noun?: string, sizes?: number[] }>(), { noun: 'rows', sizes: () => PAGE_SIZES })
const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })
const sizeItems = computed(() => props.sizes.map(s => ({ label: `${s} / page`, value: s })))
</script>

<template>
  <div v-if="total > sizes[0]!" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-default text-sm no-print">
    <p class="text-muted tabular-nums">
      Showing {{ from }}–{{ to }} of {{ total }} {{ noun }}
    </p>
    <div class="flex items-center gap-3">
      <USelect v-model="pageSize" :items="sizeItems" size="sm" class="w-32" aria-label="Rows per page" />
      <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" size="sm" :sibling-count="1" show-edges />
    </div>
  </div>
</template>
