<script setup lang="ts">
/**
 * "You are here" banner: the six construction stages, the current one highlighted, and a
 * plain-language explanation of what this stage is in a real building project.
 */
const props = withDefaults(defineProps<{ stage: JourneyStage['key'], compact?: boolean, note?: string }>(), { compact: false, note: '' })
const current = computed(() => journeyStage(props.stage))
const open = ref(!props.compact)
// Public pages keep visitors inside the journey; inside the workspace, link to the working pages.
const route = useRoute()
const inApp = computed(() => route.meta.layout === 'dashboard')
const linkFor = (s: JourneyStage) => (inApp.value && s.appTo) || s.to
</script>

<template>
  <nav class="rounded-xl border border-default bg-default no-print" aria-label="Construction journey">
    <ol class="flex overflow-x-auto">
      <li v-for="s in JOURNEY" :key="s.key" class="flex-1 min-w-[7.5rem]">
        <NuxtLink
          :to="linkFor(s)"
          class="flex items-center gap-2 px-3 py-2.5 text-xs border-b-2 h-full transition"
          :class="s.key === current.key
            ? 'border-primary text-highlighted font-semibold bg-primary/5'
            : s.no < current.no ? 'border-success/50 text-muted hover:text-default' : 'border-transparent text-dimmed hover:text-default'"
          :aria-current="s.key === current.key ? 'step' : undefined"
        >
          <span
            class="size-5 shrink-0 rounded-full grid place-items-center text-[10px] font-bold"
            :class="s.key === current.key ? 'bg-primary text-inverted' : s.no < current.no ? 'bg-success/15 text-success' : 'bg-elevated text-dimmed'"
          >
            <UIcon v-if="s.no < current.no" name="i-lucide-check" class="size-3" />
            <template v-else>{{ s.no }}</template>
          </span>
          <span class="truncate">{{ s.title }}</span>
        </NuxtLink>
      </li>
    </ol>
    <div class="px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-start gap-3">
      <span class="size-9 shrink-0 rounded-lg bg-primary/10 grid place-items-center"><UIcon :name="current.icon" class="size-5 text-primary" /></span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm">
            <span class="text-muted">Stage {{ current.no }} of {{ JOURNEY.length }} ·</span>
            <b class="text-highlighted"> {{ current.title }}</b>
            <span class="text-muted"> · {{ current.tool }}</span>
          </p>
          <UButton v-if="compact" size="xs" color="neutral" variant="ghost" :icon="open ? 'i-lucide-chevron-up' : 'i-lucide-info'" :label="open ? 'Less' : 'What is this stage?'" @click="open = !open" />
        </div>
        <div v-if="open" class="mt-1.5 grid gap-1 text-sm">
          <p class="text-muted">
            {{ current.what }}
          </p>
          <p class="text-xs text-dimmed">
            <b>Who:</b> {{ current.who }} · <b>You get:</b> {{ current.output }}
          </p>
          <p v-if="note" class="text-xs text-primary">
            {{ note }}
          </p>
        </div>
      </div>
    </div>
  </nav>
</template>
