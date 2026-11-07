<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0" aria-label="Davecore BQ home">
    <span class="size-8 shrink-0 rounded-md bg-primary text-inverted grid place-items-center font-display font-bold text-lg">D</span>
    <span v-if="!collapsed" class="leading-tight min-w-0">
      <span class="block font-display font-semibold text-highlighted truncate">Davecore BQ</span>
      <span class="block text-[10px] tracking-[0.14em] text-muted uppercase whitespace-nowrap">Measure · Price · Build</span>
    </span>
  </NuxtLink>
</template>
