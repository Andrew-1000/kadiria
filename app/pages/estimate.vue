<script setup lang="ts">
useSeoMeta({ title: 'Construction Cost Calculator | Davecore BQ' })
</script>

<template>
  <UContainer class="py-8 sm:py-12 space-y-8">
    <JourneyGuide stage="plan" compact class="max-w-3xl mx-auto" />
    <CostCalculator />
    <JourneyNext
      stage="plan"
      class="max-w-3xl mx-auto"
      label="See what a BQ needs"
      hint="Happy with the budget? Next, the architect and engineer prepare drawings, the structural design and specification. Check which documents a reliable Bill of Quantities is measured from."
    />
  </UContainer>
</template>
