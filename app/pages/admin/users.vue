<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'admin' })
useSeoMeta({ title: 'Users | Admin' })

interface U { id: string, email: string, name: string, role: 'admin' | 'professional' | 'member', organisation: string, active: boolean, lastLoginAt: string | null }
const { data: users, refresh } = await useFetch<U[]>('/api/admin/users', { default: () => [], server: false })
const { call, toast } = useApi()
const roles = [
  { label: 'Administrator', value: 'admin', description: 'Back-office, all projects, approve & issue' },
  { label: 'Professional (QS / engineer)', value: 'professional', description: 'Own projects, approve & issue BQs' },
  { label: 'Member', value: 'member', description: 'Own projects; submit for review' }
]

const open = ref(false)
const editing = ref<U | null>(null)
const form = reactive({ name: '', email: '', organisation: '', role: 'member' as U['role'], password: '', active: true })
function startCreate() {
  editing.value = null
  Object.assign(form, { name: '', email: '', organisation: '', role: 'member', password: '', active: true })
  open.value = true
}
function startEdit(u: U) {
  editing.value = u
  Object.assign(form, { name: u.name, email: u.email, organisation: u.organisation, role: u.role, password: '', active: u.active })
  open.value = true
}
async function save() {
  if (editing.value) {
    const { email: _e, password, ...rest } = form
    await call(`/api/admin/users/${editing.value.id}`, { method: 'PUT', body: { ...rest, ...(password ? { password } : {}) } })
  }
  else {
    const { active: _a, ...rest } = form
    await call('/api/admin/users', { method: 'POST', body: rest })
  }
  open.value = false
  toast.add({ title: 'User saved', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #right>
          <UButton icon="i-lucide-user-plus" label="Add user" @click="startCreate" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div class="overflow-x-auto">
          <table class="bq-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Organisation</th><th>Role</th><th>Status</th><th>Last sign-in</th><th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="font-medium">
                  {{ u.name }}
                </td>
                <td>{{ u.email }}</td>
                <td class="text-muted">
                  {{ u.organisation }}
                </td>
                <td><UBadge variant="subtle" :color="u.role === 'admin' ? 'primary' : u.role === 'professional' ? 'info' : 'neutral'" :label="roles.find(r => r.value === u.role)?.label" /></td>
                <td><UBadge variant="subtle" :color="u.active ? 'success' : 'error'" :label="u.active ? 'Active' : 'Disabled'" /></td>
                <td class="text-muted">
                  {{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-KE') : 'Never' }}
                </td>
                <td class="text-right">
                  <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" aria-label="Edit user" @click="startEdit(u)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UModal v-model:open="open" :title="editing ? `Edit ${editing.name}` : 'Add user'">
        <template #body>
          <form id="user-form" class="space-y-4" @submit.prevent="save">
            <UFormField label="Full name" required>
              <UInput v-model="form.name" class="w-full" />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="form.email" type="email" :disabled="!!editing" class="w-full" />
            </UFormField>
            <UFormField label="Organisation">
              <UInput v-model="form.organisation" class="w-full" />
            </UFormField>
            <UFormField label="Role">
              <USelect v-model="form.role" :items="roles" class="w-full" />
            </UFormField>
            <UFormField :label="editing ? 'New password' : 'Password'" :help="editing ? 'Leave blank to keep the current password.' : 'At least 8 characters.'" :required="!editing">
              <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" />
            </UFormField>
            <USwitch v-if="editing" v-model="form.active" label="Account active" />
          </form>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
            <UButton type="submit" form="user-form" label="Save" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
