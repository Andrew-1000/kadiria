<script setup lang="ts">
/** Ruler badge on a BQ item: click to see the measurement rules of its section. Rules load on first open. */
const props = defineProps<{ standardKey: string, standardCode: string, code: string, title: string }>()
interface Section { code: string, title: string, guidance: string, rules: { ref: string, item: string, unit: string, rule: string, source: string }[] }
const open = ref(false)
const data = ref<Section | null>(null)
const failed = ref(false)
watch(open, async (o) => {
  if (!o || data.value) return
  try { data.value = await $fetch<Section>(`/api/standards/${props.standardKey}/rules`, { query: { section: props.code } }) }
  catch { failed.value = true }
})
const short = computed(() => props.standardCode.split(' ')[0])
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }">
    <UButton size="xs" variant="soft" color="primary" icon="i-lucide-ruler" :label="`${short} ${code}${title ? ` · ${title}` : ''}`" class="rounded-md px-1.5 py-0.5 text-xs" :aria-label="`Measurement rules: ${standardCode} section ${code}`" />
    <template #content>
      <div class="w-[22rem] max-w-[90vw] p-3 text-sm">
        <p class="text-xs uppercase tracking-wider text-muted">
          {{ standardCode }} · section {{ code }}
        </p>
        <p class="font-semibold">
          {{ data?.title || title }}
        </p>
        <p v-if="data?.guidance" class="text-xs text-muted mt-0.5">
          {{ data.guidance }}
        </p>
        <div v-if="!data && !failed" class="py-4 text-center text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        </div>
        <p v-else-if="failed" class="mt-2 text-error text-xs">
          Could not load the rules.
        </p>
        <ul v-else-if="data && data.rules.length" class="mt-2 max-h-72 overflow-y-auto space-y-2">
          <li v-for="(r, i) in data.rules.filter(x => x.rule !== 'Pay item').slice(0, 12)" :key="i" class="border-t border-default pt-2">
            <p class="font-medium text-xs">
              {{ r.item }} <span v-if="r.unit" class="font-mono text-muted">({{ r.unit }})</span>
            </p>
            <p class="text-xs text-muted">
              {{ r.rule }}
            </p>
          </li>
          <li v-if="data.rules.some(x => x.rule === 'Pay item')" class="border-t border-default pt-2 text-xs text-muted">
            {{ data.rules.filter(x => x.rule === 'Pay item').length }} pay items in this section.
          </li>
        </ul>
        <p v-else class="mt-2 text-xs text-muted">
          No rules recorded for this section yet.
        </p>
        <UButton :to="{ path: '/standards', query: { standard: standardKey } }" size="xs" variant="link" trailing-icon="i-lucide-arrow-right" label="All rules for this standard" class="mt-2 -ms-2" />
      </div>
    </template>
  </UPopover>
</template>
