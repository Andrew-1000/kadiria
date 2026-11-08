<script setup lang="ts">
/** "What comes next" card shown at the end of each stage, leading into the following tool. */
const props = defineProps<{ stage: JourneyStage['key'], to?: string | Record<string, unknown>, label?: string, hint?: string }>()
const next = computed(() => nextStage(props.stage))
const route = useRoute()
const target = computed(() => props.to ?? ((route.meta.ownPanel === true && next.value?.appTo) || next.value?.to))
</script>

<template>
  <section v-if="next" class="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 no-print">
    <span class="size-10 shrink-0 rounded-lg bg-primary text-inverted grid place-items-center"><UIcon :name="next.icon" class="size-5" /></span>
    <div class="flex-1 min-w-0">
      <p class="text-xs uppercase tracking-wider text-muted">
        Next: stage {{ next.no }} · {{ next.title }}
      </p>
      <p class="text-sm mt-1">
        {{ hint || next.what }}
      </p>
    </div>
    <UButton :to="target" trailing-icon="i-lucide-arrow-right" :label="label ?? `Go to ${next.tool}`" class="shrink-0" />
  </section>
</template>
