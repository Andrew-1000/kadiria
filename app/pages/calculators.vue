<script setup lang="ts">
useSeoMeta({ title: 'Material Calculators | Davecore BQ' })
const route = useRoute()
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <MaterialCalculator :initial-module="String(route.query.module ?? '')" />
  </UContainer>
</template>
