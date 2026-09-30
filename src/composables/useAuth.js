import { computed, ref } from 'vue'
import {
  clearToken,
  createStaffUser,
  deleteStaffUser,
  getCurrentUser,
  getStaffUsers,
  getToken,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
  updateStaffUser
} from '../services/api'
import { normalizeRole, normalizeStatus, normalizeUser, normalizeUsers } from '../utils/user'

const SESSION_KEY = 'techstore_session_v1'

/* ------------------------------------------------------------------
   Auth runs against the Laravel API (Sanctum personal access tokens):

       Vue component  ->  useAuth composable  ->  services/api.js  ->  Laravel
       login()/register()                       /api/login           users table
                                               /api/register
                                               /api/logout
       Admin -> Users / Customers               /api/staff/users

   The account list used to live in localStorage, which meant an account
   created in another browser never appeared and an "Add User" row could not
   log in. Everything now comes from the users table; `status`
   (active/suspended) is a real column, so suspending an account blocks its
   login server-side instead of only in the browser that clicked the button.

   What stays in the browser is the session (who is signed in), because a
   reload should not force another login. It is reconciled with the database
   by refreshUser(), so a suspension or role change made by another admin
   takes effect on the next page load.
------------------------------------------------------------------- */

function readStore(storage, key) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStore(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable — session stays in memory
  }
}

function removeStore(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

function readSession() {
  const local = readStore(window.localStorage, SESSION_KEY)
  if (local) return local
  return readStore(window.sessionStorage, SESSION_KEY)
}

/** "remember me" decides which storage the session lives in for the next read. */
function persistSession(state) {
  const storage = window.localStorage.getItem(SESSION_KEY)
    ? window.localStorage
    : window.sessionStorage

  writeStore(storage, SESSION_KEY, state)
}

function forgetSession() {
  removeStore(window.localStorage, SESSION_KEY)
  removeStore(window.sessionStorage, SESSION_KEY)
}

/* Rebuilt from the stored session on reload so a refresh does not sign the
   user out; refreshUser() then checks it against the database. */
const user = ref(readSession() ? normalizeUser(readSession()) : null)

const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')

const isLoggedIn = computed(() => Boolean(user.value))

function homeForRole(role = 'customer') {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'cashier') return '/cashier/dashboard'
  return '/'
}

/* The database id is the single identity now, so the "you" tag, the edit form
   and the API all address the same row. */
function toSessionState(record, loggedInAt) {
  const normalized = normalizeUser(record)
  if (!normalized) return null

  return { ...normalized, logged_in_at: loggedInAt || new Date().toISOString() }
}

/* ---------- account list (Admin -> Users / Customers) ---------- */

/* Concurrent calls (e.g. two components mounting together) share one request
   instead of hitting the API twice. */
let pendingUsers = null

/**
 * Load every account from /api/staff/users.
 *
 * A customer calling this gets 403 from the `staff` middleware. That is not an
 * error worth surfacing — the router already keeps customers off the admin
 * screens — so the rejection is swallowed and the list simply stays empty.
 */
async function loadUsers() {
  if (pendingUsers) return pendingUsers

  usersLoading.value = true
  usersError.value = ''

  pendingUsers = getStaffUsers()
    .then((list) => {
      users.value = normalizeUsers(list)
      return users.value
    })
    .catch((err) => {
      if (err.status !== 403) usersError.value = err.message
      return users.value
    })
    .finally(() => {
      usersLoading.value = false
      pendingUsers = null
    })

  return pendingUsers
}

/** Swap one row in the list for the copy the API just saved. */
function replaceUser(fresh) {
  const normalized = normalizeUser(fresh)
  if (!normalized) return null

  const index = users.value.findIndex((u) => Number(u.id) === Number(normalized.id))

  if (index === -1) users.value.push(normalized)
  else users.value[index] = { ...users.value[index], ...normalized }

  /* Keep the cached session in step so the header and the router see a role or
     status change as soon as the admin makes it to their own row. */
  if (Number(user.value?.id) === Number(normalized.id)) {
    user.value = toSessionState(normalized, user.value.logged_in_at)
    persistSession(user.value)
  }

  return normalized
}

/**
 * Create an account. The API hashes the password, so nothing about it is kept
 * in the browser the way the old localStorage version did.
 */
async function createUser({ name, email, phone = '', address = '', password, role = 'customer', status = 'active' }) {
  try {
    const created = await createStaffUser({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
      address: String(address || '').trim(),
      password,
      role,
      status
    })

    return { ok: true, user: replaceUser(created) }
  } catch (err) {
    return { ok: false, error: err.message, fieldErrors: err.fieldErrors ?? null }
  }
}

/**
 * Partial update. A blank password is left out of the payload entirely so the
 * controller keeps the stored hash instead of rejecting an empty string.
 */
async function updateUserRecord(id, { name, email, phone, address, role, status, password }) {
  const payload = {}

  if (name !== undefined) payload.name = String(name).trim()
  if (email !== undefined) payload.email = String(email).trim()
  if (phone !== undefined) payload.phone = String(phone).trim()
  if (address !== undefined) payload.address = String(address).trim()
  if (role !== undefined) payload.role = role
  if (status !== undefined) payload.status = status
  if (password) payload.password = password

  try {
    const saved = await updateStaffUser(id, payload)
    return { ok: true, user: replaceUser(saved) }
  } catch (err) {
    return { ok: false, error: err.message, fieldErrors: err.fieldErrors ?? null }
  }
}

async function deleteUser(id) {
  if (Number(id) === Number(user.value?.id)) {
    return { ok: false, error: 'You cannot delete your own account.' }
  }

  try {
    await deleteStaffUser(id)
    users.value = users.value.filter((u) => Number(u.id) !== Number(id))
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/** Customers are just accounts with the customer role — one source of truth. */
const customers = computed(() => users.value.filter((u) => u.role === 'customer'))

/* ---------- session ---------- */

async function register({ name, email, phone = '', address = '', password, passwordConfirmation = '' }) {
  const result = await registerRequest({ name, email, phone, address, password, passwordConfirmation })

  if (!result.ok) {
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors }
  }

  /* Registration does not sign the user in: the API hands back a token, but
     the form sends them to the login page to authenticate. */
  return { ok: true, user: normalizeUser(result.user) }
}

async function login({ email, password, remember = false }) {
  const result = await loginRequest({ email, password })

  /* The API refuses a suspended account with 403 and revokes its tokens, so
     the reason arrives here already formatted for the form. */
  if (!result.ok) {
    return { ok: false, error: result.error, fieldErrors: result.fieldErrors }
  }

  const sessionState = toSessionState(result.user)

  if (remember) writeStore(window.localStorage, SESSION_KEY, sessionState)
  else writeStore(window.sessionStorage, SESSION_KEY, sessionState)

  user.value = sessionState

  return { ok: true, user: sessionState }
}

/**
 * Re-read the signed-in account from the database, so the header shows the
 * stored name, role and status rather than the copy cached at login. This is
 * how a suspension or role change made by another admin is picked up.
 */
async function refreshUser() {
  if (!getToken()) return user.value

  try {
    const fresh = toSessionState(await getCurrentUser(), user.value?.logged_in_at)
    if (!fresh) return user.value

    persistSession(fresh)
    user.value = fresh

    return fresh
  } catch (err) {
    /* 401/403 means the server no longer accepts this session — a revoked or
       suspended token — so the cached copy is dropped and the next guarded
       route sends the user to the login page. A network error keeps the
       session: the API being down is not a reason to sign someone out. */
    if (err.status === 401 || err.status === 403) {
      forgetSession()
      user.value = null
      clearToken()
    }

    return null
  }
}

function getUserProfile() {
  if (!user.value) return null

  return {
    id: user.value.id,
    name: user.value.name,
    email: user.value.email,
    phone: user.value.phone || '',
    address: user.value.address || '',
    role: normalizeRole(user.value.role),
    status: normalizeStatus(user.value.status),
    created_at: user.value.created_at || ''
  }
}

async function updateProfile({ name, email, phone = '', address = '' }) {
  if (!user.value) return { ok: false, error: 'Not logged in.' }

  try {
    const saved = await updateProfileRequest({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
      address: String(address || '').trim()
    })

    const sessionState = toSessionState({ ...user.value, ...saved }, user.value.logged_in_at)

    persistSession(sessionState)
    user.value = sessionState

    /* The admin list shows the same row, so keep it in step. */
    const index = users.value.findIndex((u) => Number(u.id) === Number(sessionState.id))
    if (index !== -1) users.value[index] = { ...users.value[index], ...sessionState }

    return { ok: true, user: sessionState }
  } catch (err) {
    return { ok: false, error: err.message, fieldErrors: err.fieldErrors ?? null }
  }
}

function logout() {
  forgetSession()
  user.value = null

  /* Revokes the Sanctum token server-side. The session is already gone, so a
     failure here is ignored and the token is cleared either way. */
  return logoutRequest()
}

export function useAuth() {
  return {
    user,
    isLoggedIn,
    users,
    usersLoading,
    usersError,
    customers,
    loadUsers,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    getUserProfile,
    createUser,
    updateUserRecord,
    deleteUser,
    homeForRole
  }
}
