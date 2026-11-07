<script setup lang="ts">
useSeoMeta({ title: 'Material Calculators | Davecore BQ' })
const route = useRoute()
const { loggedIn } = useUserSession()
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-8">
    <JourneyGuide stage="quantify" compact class="max-w-4xl mx-auto" note="Elements are listed in the order they are built on site. Work through them one after another, or jump to the one you need." />
    <MaterialCalculator :initial-module="String(route.query.module ?? '')" />
    <JourneyNext
      stage="quantify"
      class="max-w-4xl mx-auto"
      :to="loggedIn ? '/projects/new' : '/login?redirect=/projects/new'"
      label="Start a BQ"
      hint="Quantities for single elements are useful on site, but a contractor prices the whole building. Next, the BQ wizard drafts every bill, and you can send these calculator results straight into it."
    />
  </UContainer>
</template>
