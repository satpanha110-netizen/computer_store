<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/toast'
import { roleLabel, statusLabel } from '../../utils/user'

const { users, usersLoading, usersError, loadUsers, createUser, updateUserRecord, deleteUser, user } = useAuth()
const { show: showToast } = useToast()

onMounted(loadUsers)

const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const formError = ref('')
const saving = ref(false)

const blank = { name: '', email: '', phone: '', address: '', role: 'customer', status: 'active', password: '' }
const form = reactive({ ...blank })
const errors = reactive({ name: '', email: '', password: '' })

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.includes(q)
  )
})

function roleBadge(role) {
  return role === 'admin' ? 'danger' : role === 'cashier' ? 'info' : 'muted'
}

function statusBadge(status) {
  return status === 'suspended' ? 'danger' : 'success'
}

function openAdd() {
  editingId.value = null
  Object.assign(form, blank)
  clearErrors()
  formError.value = ''
  modalOpen.value = true
}

function openEdit(record) {
  editingId.value = record.id
  Object.assign(form, {
    name: record.name,
    email: record.email,
    phone: record.phone || '',
    address: record.address || '',
    role: record.role,
    status: record.status,
    password: ''
  })
  clearErrors()
  formError.value = ''
  modalOpen.value = true
}

function clearErrors() {
  errors.name = ''
  errors.email = ''
  errors.password = ''
}

function firstFieldError(fieldErrors, fallback) {
  if (!fieldErrors) return fallback
  return Object.values(fieldErrors).flat()[0] || fallback
}

/* Every write goes through the API now, so a rejected duplicate email or a
   locked-out account surfaces here instead of quietly diverging. */
async function save() {
  formError.value = ''
  saving.value = true

  errors.name = form.name.trim() ? '' : 'Name is required.'
  errors.email = emailPattern.test(form.email) ? '' : 'Enter a valid email address.'
  errors.password =
    editingId.value !== null || form.password.length >= 8
      ? ''
      : 'Password must be at least 8 characters.'

  if (Object.values(errors).some((m) => m)) {
    saving.value = false
    return
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    role: form.role,
    status: form.status,
    password: form.password
  }

  const result =
    editingId.value === null
      ? await createUser(payload)
      : await updateUserRecord(editingId.value, {
          ...payload,
          password: form.password || undefined
        })

  saving.value = false

  if (!result.ok) {
    /* Laravel answers 422 with { errors: { field: [messages] } }; highlight the
       offending input when the field is one the form knows about. */
    const message = firstFieldError(result.fieldErrors, result.error)

    if (result.fieldErrors?.email) errors.email = message
    else if (result.fieldErrors?.name) errors.name = message
    else formError.value = message

    return
  }

  showToast(editingId.value === null ? 'User created!' : 'User updated!')
  modalOpen.value = false
}

async function remove(record) {
  if (!window.confirm(`Delete user "${record.name}"?`)) return

  const result = await deleteUser(record.id)

  if (!result.ok) {
    showToast(result.error)
    return
  }

  showToast('User deleted.')
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Users</h1>
        <p>Manage staff accounts and roles.</p>
      </div>
      <div class="dash-head-actions">
        <button class="btn btn-primary btn-sm" @click="openAdd">
          <i class="bi bi-person-plus"></i> Add User
        </button>
      </div>
    </div>

    <section class="data-card">
      <div class="toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            v-model="search"
            class="table-search"
            type="search"
            placeholder="Search users..."
          />
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="usersLoading">
              <td colspan="6" class="cell-empty">Loading users…</td>
            </tr>
            <tr v-else-if="usersError">
              <td colspan="6" class="cell-empty">{{ usersError }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="6" class="cell-empty">No users found.</td>
            </tr>
            <tr v-for="record in filtered" :key="record.id">
              <td>
                <div class="cell-user">
                  <span class="table-avatar">{{ record.name.charAt(0).toUpperCase() }}</span>
                  <strong class="cell-strong">
                    {{ record.name }}
                    <span v-if="Number(record.id) === Number(user?.id)" class="you-tag">you</span>
                  </strong>
                </div>
              </td>
              <td class="cell-muted">{{ record.email }}</td>
              <td>{{ record.phone || '—' }}</td>
              <td>
                <span class="badge" :class="`badge--${roleBadge(record.role)}`">
                  {{ roleLabel(record.role) }}
                </span>
              </td>
              <td>
                <span class="badge" :class="`badge--${statusBadge(record.status)}`">
                  {{ statusLabel(record.status) }}
                </span>
              </td>
              <td class="th-actions">
                <button class="btn btn-outline btn-sm" @click="openEdit(record)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button class="btn btn-danger-ghost btn-sm" @click="remove(record)">
                  <i class="bi bi-trash3"></i> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="modal">
      <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
        <div class="modal">
          <div class="modal-head">
            <h3 class="data-head-title">
              <i class="bi" :class="editingId === null ? 'bi-person-plus' : 'bi-person-gear'"></i>
              {{ editingId === null ? 'Add User' : 'Edit User' }}
            </h3>
            <button class="modal-close" aria-label="Close" @click="modalOpen = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="formError" class="auth-alert auth-alert--danger">{{ formError }}</div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="usr-name">Full Name</label>
                <input id="usr-name" v-model="form.name" class="form-control" :class="{ 'form-control--error': errors.name }" placeholder="User name" />
                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="usr-email">Email</label>
                <input id="usr-email" v-model="form.email" class="form-control" :class="{ 'form-control--error': errors.email }" type="email" placeholder="user@example.com" />
                <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="usr-phone">Phone</label>
                <input id="usr-phone" v-model="form.phone" class="form-control" placeholder="+855 12 345 678" />
              </div>
              <div class="form-group">
                <label class="form-label" for="usr-role">Role</label>
                <select id="usr-role" v-model="form.role" class="form-control">
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="usr-address">Address</label>
                <input id="usr-address" v-model="form.address" class="form-control" placeholder="Phnom Penh, Cambodia" />
              </div>
              <div class="form-group">
                <label class="form-label" for="usr-status">Status</label>
                <select id="usr-status" v-model="form.status" class="form-control">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="usr-password">
                {{ editingId === null ? 'Password' : 'New Password (leave blank to keep)' }}
              </label>
              <input id="usr-password" v-model="form.password" class="form-control" :class="{ 'form-control--error': errors.password }" type="password" autocomplete="new-password" placeholder="At least 8 characters" />
              <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="modalOpen = false">
              <i class="bi bi-x-circle"></i> Cancel
            </button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
              <i class="bi bi-check2-circle"></i>
              {{ saving ? 'Saving...' : editingId === null ? 'Add User' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>