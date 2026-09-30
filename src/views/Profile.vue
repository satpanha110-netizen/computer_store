<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/toast'

const router = useRouter()
const { user, logout, updateProfile, getUserProfile } = useAuth()
const { show: showToast } = useToast()

const profile = reactive({
  ...getUserProfile()
})

const editing = ref(false)
const saving = ref(false)
const submitError = ref('')

const form = reactive({ name: '', email: '', phone: '', address: '' })
const errors = reactive({ name: '', email: '' })

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initials = computed(() => {
  const parts = String(profile.name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

const createdDate = computed(() => {
  if (!profile.created_at) return ''
  const date = new Date(profile.created_at)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function startEdit() {
  submitError.value = ''
  form.name = profile.name
  form.email = profile.email
  form.phone = profile.phone
  form.address = profile.address
  errors.name = ''
  errors.email = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  submitError.value = ''
}

/* Saving hits PUT /api/user/profile, so the change lands in the users table and
   any other device sees it. A rejected email (duplicate) comes back as a 422
   with a field message, which is surfaced on the input. */
async function saveChanges() {
  submitError.value = ''
  errors.name = form.name.trim() ? '' : 'Full name is required.'
  errors.email = emailPattern.test(form.email)
    ? ''
    : 'Please enter a valid email address.'

  if (Object.values(errors).some((msg) => msg)) return

  saving.value = true

  const result = await updateProfile({
    name: form.name,
    email: form.email,
    phone: form.phone,
    address: form.address
  })

  saving.value = false

  if (!result.ok) {
    if (result.fieldErrors?.email) errors.email = Object.values(result.fieldErrors.email).flat()[0]
    else if (result.fieldErrors?.name) errors.name = Object.values(result.fieldErrors.name).flat()[0]
    else submitError.value = result.error
    return
  }

  Object.assign(profile, result.user)
  editing.value = false
  showToast('Profile updated successfully!')
}

function handleLogout() {
  logout()
  showToast('You have been logged out.')
  router.push('/login')
}
</script>

<template>
  <div class="profile-page">

    <div class="container">
      <div class="page-head profile-head">
        <h1>My Profile</h1>
        <p>Manage your personal information and account details.</p>
      </div>

      <div class="profile-layout">

        <!-- SIDEBAR -->
        <aside class="profile-card profile-sidebar">
          <div class="profile-avatar">{{ initials }}</div>

          <div class="profile-sidebar-body">
            <h3 class="profile-name">{{ profile.name }}</h3>
            <p class="profile-email">{{ profile.email }}</p>
          </div>

          <div class="profile-sidebar-actions">
            <button
              v-if="!editing"
              class="btn btn-primary btn-block"
              @click="startEdit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Profile
            </button>
            <button
              class="btn btn-outline btn-block profile-logout-btn"
              @click="handleLogout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Logout
            </button>
          </div>
        </aside>

        <!-- MAIN -->
        <section class="profile-card profile-main">

          <div v-if="!editing" class="profile-main-head">
            <div>
              <h2>Personal Information</h2>
              <p>Your account details as registered with TechStore.</p>
            </div>
            <button class="btn btn-outline btn-sm" @click="startEdit">Edit</button>
          </div>

          <div v-if="!editing" class="info-grid">
            <div class="info-item">
              <span class="info-label">Full Name</span>
              <span class="info-value">{{ profile.name || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ profile.email || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Phone</span>
              <span class="info-value">{{ profile.phone || '—' }}</span>
            </div>

            <div class="info-item info-item--full">
              <span class="info-label">Address</span>
              <span class="info-value">{{ profile.address || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Account Created</span>
              <span class="info-value">{{ createdDate || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Account ID</span>
              <span class="info-value info-value--muted">{{ profile.id || '—' }}</span>
            </div>
          </div>

          <!-- EDIT FORM -->
          <form v-else class="profile-form" novalidate @submit.prevent="saveChanges">

            <div class="profile-form-head">
              <h2>Edit Profile</h2>
              <p>Update your details below and hit Save Changes.</p>
            </div>

            <div v-if="submitError" class="auth-alert auth-alert--danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {{ submitError }}
            </div>

            <div class="profile-form-grid">
              <div class="form-group">
                <label class="form-label" for="pf-name">Full Name</label>
                <input
                  id="pf-name"
                  v-model="form.name"
                  class="form-control"
                  :class="{ 'form-control--error': errors.name }"
                  type="text"
                  placeholder="Your full name"
                  autocomplete="name"
                />
                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="pf-email">Email</label>
                <input
                  id="pf-email"
                  v-model="form.email"
                  class="form-control"
                  :class="{ 'form-control--error': errors.email }"
                  type="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
                <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="pf-phone">Phone</label>
                <input
                  id="pf-phone"
                  v-model="form.phone"
                  class="form-control"
                  type="tel"
                  placeholder="+855 12 345 678"
                  autocomplete="tel"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="pf-address">Address</label>
                <input
                  id="pf-address"
                  v-model="form.address"
                  class="form-control"
                  type="text"
                  placeholder="Street, city, country"
                  autocomplete="street-address"
                />
              </div>
            </div>

            <div class="profile-actions">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="saving"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button type="button" class="btn btn-cancel" @click="cancelEdit">Cancel</button>
            </div>
          </form>

        </section>
      </div>
    </div>

  </div>
</template>