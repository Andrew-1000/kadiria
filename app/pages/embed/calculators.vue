<script setup lang="ts">
definePageMeta({ layout: 'embed' })
useSeoMeta({ title: 'Material Calculators' })
const route = useRoute()
</script>

<template>
  <MaterialCalculator embedded :initial-module="String(route.query.module ?? '')" />
</template>
