<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/toast'

const router = useRouter()
const { register } = useAuth()
const { show: showToast } = useToast()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirm: ''
})
const errors = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirm: ''
})

const showPassword = ref(false)
const showConfirm = ref(false)
const submitError = ref('')
const submitting = ref(false)
const success = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* Must match the API's `password` => min:8 rule. */
const MIN_PASSWORD_LENGTH = 8

function isValidPhone(value) {
  const normalized = String(value).replace(/[\s\-()]/g, '')
  return /^(?:0\d{8,9}|\+855\d{8,9})$/.test(normalized)
}

function clearError(field) {
  errors[field] = ''
}

async function onSubmit() {
  if (submitting.value) return

  submitError.value = ''
  errors.name = form.name.trim() ? '' : 'Full name is required.'
  errors.email = emailPattern.test(form.email)
    ? ''
    : 'Please enter a valid email address.'
  errors.phone = isValidPhone(form.phone)
    ? ''
    : 'Please enter a valid Cambodian phone number (e.g. 012 345 678 or +855 12 123 456).'
  errors.address = form.address.trim()
    ? ''
    : 'Address is required.'
  /* The API rejects anything under 8 characters, so the form matches it. */
  errors.password = form.password.length >= MIN_PASSWORD_LENGTH
    ? ''
    : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  errors.confirm = form.password && form.password === form.confirm
    ? ''
    : form.confirm
      ? 'Passwords do not match.'
      : 'Please confirm your password.'

  if (Object.values(errors).some((msg) => msg)) return

  submitting.value = true

  const result = await register({
    name: form.name,
    email: form.email,
    phone: form.phone,
    address: form.address,
    password: form.password,
    passwordConfirmation: form.confirm
  })

  submitting.value = false

  if (!result.ok) {
    /* Laravel validates on the server too — surface the exact field. */
    for (const field of ['name', 'email', 'phone', 'address', 'password']) {
      if (result.fieldErrors?.[field]) errors[field] = result.fieldErrors[field][0]
    }
    submitError.value = result.error
    return
  }

  success.value = true
  showToast('Account created! Please login to continue.')
  setTimeout(() => router.push('/login'), 1400)
}
</script>

<template>
  <div class="auth-page">

    <div class="auth-card">
      <div class="auth-card-head">
        <div class="auth-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
        </div>
        <h1 class="auth-title">Create your account</h1>
        <p class="auth-sub">Join TechStore to check out faster and track your orders.</p>
      </div>

      <div v-if="success" class="auth-alert auth-alert--success">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Account created successfully! Redirecting to login...
      </div>

      <div v-else-if="submitError" class="auth-alert auth-alert--danger">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        {{ submitError }}
      </div>

      <form v-if="!success" class="auth-form" novalidate @submit.prevent="onSubmit">

        <div class="form-group">
          <label class="form-label" for="reg-name">Full Name</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">👤</span>
            <input
              id="reg-name"
              v-model="form.name"
              class="form-control"
              :class="{ 'form-control--error': errors.name }"
              type="text"
              placeholder="John Doe"
              autocomplete="name"
              @input="clearError('name')"
            />
          </div>
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-email">Email</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">✉️</span>
            <input
              id="reg-email"
              v-model="form.email"
              class="form-control"
              :class="{ 'form-control--error': errors.email }"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              @input="clearError('email')"
            />
          </div>
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-phone">Phone Number</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">📱</span>
            <input
              id="reg-phone"
              v-model="form.phone"
              class="form-control"
              :class="{ 'form-control--error': errors.phone }"
              type="tel"
              placeholder="+855 12 345 678"
              autocomplete="tel"
              @input="clearError('phone')"
            />
          </div>
          <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-address">Address</label>
          <div class="input-wrap input-wrap--area">
            <span class="input-icon" aria-hidden="true">📍</span>
            <textarea
              id="reg-address"
              v-model="form.address"
              class="form-control form-textarea"
              :class="{ 'form-control--error': errors.address }"
              rows="2"
              placeholder="Enter your address"
              autocomplete="street-address"
              @input="clearError('address')"
            ></textarea>
          </div>
          <span v-if="errors.address" class="field-error">{{ errors.address }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-password">Password</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">🔒</span>
            <input
              id="reg-password"
              v-model="form.password"
              class="form-control"
              :class="{ 'form-control--error': errors.password }"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Minimum 8 characters"
              autocomplete="new-password"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="eye-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-confirm">Confirm Password</label>
          <div class="input-wrap">
            <span class="input-icon" aria-hidden="true">🔒</span>
            <input
              id="reg-confirm"
              v-model="form.confirm"
              class="form-control"
              :class="{ 'form-control--error': errors.confirm }"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Re-enter your password"
              autocomplete="new-password"
              @input="clearError('confirm')"
            />
            <button
              type="button"
              class="eye-toggle"
              :aria-label="showConfirm ? 'Hide password' : 'Show password'"
              @click="showConfirm = !showConfirm"
            >
              <svg v-if="!showConfirm" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
          </div>
          <span v-if="errors.confirm" class="field-error">{{ errors.confirm }}</span>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg btn-block auth-submit"
          :disabled="submitting"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          {{ submitting ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-alt">
        Already have an account?
        <RouterLink to="/login" class="auth-link-inline">Login</RouterLink>
      </p>
    </div>

  </div>
</template>