<script setup lang="ts">
definePageMeta({ ownPanel: true, middleware: 'admin' })
useSeoMeta({ title: 'Feature switches | Admin' })
const refreshConfig = () => refreshNuxtData('bq-config')
</script>

<template>
  <UDashboardPanel id="admin-features">
    <template #header>
      <UDashboardNavbar title="Feature switches" />
    </template>
    <template #body>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-plug"
        title="The company website can flip these too"
        description="Create an API key under Website integration; the website admin can then switch calculators on/off through PUT /api/integration/features/{key}."
      />
      <AdminRefTable
        name="flags"
        pk="key"
        title="Features"
        description="Switch whole calculators and capabilities on or off. Changes apply immediately."
        :can-create="false"
        :can-delete="false"
        :columns="[
          { key: 'label', label: 'Feature' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'category', label: 'Category', createOnly: true },
          { key: 'enabled', label: 'Enabled', type: 'boolean', inline: true }
        ]"
        @changed="refreshConfig"
      />
      <AdminRefTable
        name="modules"
        pk="key"
        title="Material calculator modules"
        description="Switch individual modules on or off, and set their order. Default input values are edited under Calculator settings."
        :can-create="false"
        :can-delete="false"
        :columns="[
          { key: 'key', label: 'Module', createOnly: true },
          { key: 'sort', label: 'Order', type: 'number', step: 1 },
          { key: 'enabled', label: 'Enabled', type: 'boolean', inline: true }
        ]"
        @changed="refreshConfig"
      />
    </template>
  </UDashboardPanel>
</template>
