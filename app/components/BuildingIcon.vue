<script setup lang="ts">
defineProps<{ type: string }>()
</script>

<template>
  <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
    <template v-if="type === 'bungalow'">
      <path d="M6 26 L40 8 L74 26" />
      <path d="M14 22 V34 H66 V22" />
      <path d="M14 28 H66" />
    </template>
    <template v-else-if="type === 'maisonette'">
      <path d="M6 18 L40 4 L74 18" />
      <path d="M14 15 V36 H66 V15" />
      <path d="M40 22 V36" />
      <path d="M14 22 H66" />
    </template>
    <template v-else>
      <rect x="24" y="3" width="32" height="34" />
      <path d="M24 10 H56 M24 17 H56 M24 24 H56 M24 31 H56" />
    </template>
  </svg>
</template>
