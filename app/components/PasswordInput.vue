<script setup lang="ts">
/** Password field with a show/hide (eye) button. Other attributes (autocomplete, required, size…) pass through. */
defineOptions({ inheritAttrs: false })
const model = defineModel<string>({ default: '' })
const show = ref(false)
</script>

<template>
  <UInput v-model="model" v-bind="$attrs" :type="show ? 'text' : 'password'" :ui="{ trailing: 'pe-1' }">
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="show ? 'Hide password' : 'Show password'"
        :aria-pressed="show"
        @click="show = !show"
      />
    </template>
  </UInput>
</template>
