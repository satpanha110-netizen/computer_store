<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/toast'

const route = useRoute()
const router = useRouter()
const { login, homeForRole } = useAuth()
const { show: showToast } = useToast()

const form = reactive({ email: '', password: '', remember: false })
const errors = reactive({ email: '', password: '' })

const showPassword = ref(false)
const submitError = ref('')
const submitting = ref(false)

const notice = route.query.message ? String(route.query.message) : ''

function clearError(field) {
  errors[field] = ''
}

async function onSubmit() {
  if (submitting.value) return

  submitError.value = ''
  errors.email = form.email.trim() ? '' : 'Email is required.'
  errors.password = form.password ? '' : 'Password is required.'

  if (Object.values(errors).some((msg) => msg)) return

  submitting.value = true

  const result = await login({
    email: form.email,
    password: form.password,
    remember: form.remember
  })

  submitting.value = false

  if (!result.ok) {
    /* Laravel reports a failed login as a 422 on the email field. */
    if (result.fieldErrors?.email) errors.email = result.fieldErrors.email[0]
    if (result.fieldErrors?.password) errors.password = result.fieldErrors.password[0]
    submitError.value = result.error
    return
  }

  const firstName = String(result.user.name).split(' ')[0]
  showToast(`Welcome back, ${firstName}!`)

  const explicitRedirect =
    typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : null

  router.replace(explicitRedirect || homeForRole(result.user.role))
}
</script>

<template>
  <div class="auth-page">

    <div class="auth-card">
      <div class="auth-card-head">
        <div class="auth-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
        </div>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Login to continue shopping with TechStore.</p>
      </div>

      <div v-if="notice" class="auth-alert auth-alert--info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        {{ notice }}
      </div>

      <div v-else-if="submitError" class="auth-alert auth-alert--danger">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        {{ submitError }}
      </div>

      <form class="auth-form" novalidate @submit.prevent="onSubmit">

        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input
            id="login-email"
            v-model="form.email"
            class="form-control"
            :class="{ 'form-control--error': errors.email }"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            @input="clearError('email')"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <div class="input-wrap" :class="{ 'input-wrap--error': errors.password }">
            <input
              id="login-password"
              v-model="form.password"
              class="form-control"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Your password"
              autocomplete="current-password"
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

        <div class="auth-row">
          <label class="auth-checkbox">
            <input v-model="form.remember" type="checkbox" />
            <span class="auth-check-box">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg btn-block auth-submit"
          :disabled="submitting"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
          {{ submitting ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="auth-alt">
        Don't have an account?
        <RouterLink to="/register" class="auth-link-inline">Register</RouterLink>
      </p>
    </div>

  </div>
</template>