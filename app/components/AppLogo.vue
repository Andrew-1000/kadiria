<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2.5 min-w-0" aria-label="Kadiria home">
    <!-- Kadiria mark: a K drawn like a dimension line, with end ticks -->
    <svg viewBox="0 0 32 32" class="size-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" class="fill-primary" />
      <path d="M10.5 8v16" stroke="white" stroke-width="2.6" stroke-linecap="round" />
      <path d="M22 8.5 12.5 16 22 23.5" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M7.5 8h6M7.5 24h6" stroke="white" stroke-width="1.6" stroke-linecap="round" opacity=".7" />
    </svg>
    <span v-if="!collapsed" class="leading-tight min-w-0">
      <span class="block font-display font-semibold text-highlighted truncate">Kadiria</span>
      <span class="block text-[10px] tracking-[0.14em] text-muted uppercase whitespace-nowrap">Measure · Price · Build</span>
    </span>
  </NuxtLink>
</template>
