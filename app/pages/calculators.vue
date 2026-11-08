<script setup lang="ts">
useSeoMeta({ title: 'Material Calculators | Kadiria' })
const route = useRoute()
const router = useRouter()
// Keep ?module= in step with the element picked on the drawing, so the sidebar highlights it
function onModule(key: string) {
  if (route.query.module !== key) router.replace({ query: { ...route.query, module: key } })
}
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-8">
    <JourneyGuide stage="quantify" compact class="max-w-6xl mx-auto" note="Elements are listed in the order they are built on site. Work through them one after another, or jump to the one you need." />
    <MaterialCalculator :initial-module="String(route.query.module ?? '')" @module-change="onModule" />
    <JourneyNext
      stage="quantify"
      class="max-w-6xl mx-auto"
      label="Next: drafting the BQ"
      hint="Quantities for single elements are useful on site, but a contractor prices the whole building. Next, the BQ wizard drafts every bill, and you can send these calculator results straight into it."
    />
  </UContainer>
</template>
