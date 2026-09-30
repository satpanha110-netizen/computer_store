export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }

const TOKEN_KEY = 'techstore_token_v1'

/* Sanctum personal access tokens. Kept in localStorage so the session
   survives a page reload, mirroring how the session object is persisted. */
export const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable — token stays in memory for this page load
  }
}

export const clearToken = () => setToken(null)

const isFile = (value) => value instanceof File || value instanceof Blob

const hasFile = (payload) =>
  Object.values(payload || {}).some((value) => isFile(value) || (Array.isArray(value) && value.some(isFile)))

/**
 * Turn a plain object into FormData. Files are appended as-is, everything
 * else is stringified. `Content-Type` is deliberately NOT set on the request
 * so the browser can add the multipart boundary itself.
 */
export function toFormData(payload) {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload || {})) {
    if (value === undefined || value === null) continue
    if (isFile(value)) form.append(key, value)
    else if (typeof value === 'object') form.append(key, JSON.stringify(value))
    else form.append(key, String(value))
  }

  return form
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? getToken() : null
  const options = {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }

  if (body instanceof FormData) {
    /*
     * PHP only parses multipart/form-data bodies on POST requests, so a real
     * PUT with a file would reach Laravel with an empty request. Method
     * spoofing keeps the PUT/PATCH semantics while the body stays readable.
     */
    if (method !== 'POST') {
      if (!body.has('_method')) body.append('_method', method)
      options.method = 'POST'
    }
    options.body = body
  } else if (body !== undefined) {
    if (hasFile(body)) {
      options.body = toFormData(body)
    } else {
      options.headers = { ...options.headers, ...JSON_HEADERS }
      options.body = JSON.stringify(body)
    }
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new Error(`Cannot reach the API at ${API_URL}. Is the Laravel server running?`)
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(result.message || `Request failed with status ${response.status}`)

    /* Laravel answers 422 with { message, errors: { field: [messages] } }.
       Keep the per-field map so forms can highlight the exact inputs. */
    if (response.status === 422 && result.errors) {
      error.fieldErrors = result.errors
      error.status = 422
    } else {
      error.status = response.status
    }

    throw error
  }

  return result
}

export const getProducts = async () => {
  const result = await request('/products')
  return result.data
}

export const getProduct = async (id) => {
  const result = await request(`/products/${id}`)
  return result.data
}

export const createProduct = async (payload) => {
  const result = await request('/products', { method: 'POST', body: payload })
  return result.data
}

/**
 * Update a product at http://127.0.0.1:8000/api/products/{id}
 *
 * `payload` may be a plain object (sent as JSON with PUT) or a FormData
 * (sent as POST + _method=PUT so the file upload survives PHP's parsing).
 * The backend only writes the fields that are present, so a FormData
 * carrying just `image` replaces the picture and nothing else.
 */
export const updateProduct = async (id, payload) => {
  const result = await request(`/products/${id}`, { method: 'PUT', body: payload })
  return result.data
}

export const deleteProduct = async (id) => {
  const result = await request(`/products/${id}`, { method: 'DELETE' })
  return result.data ?? result
}

export const getCategories = async () => {
  const result = await request('/categories')
  return result.data
}

export const getCategory = async (id) => {
  const result = await request(`/categories/${id}`)
  return result.data
}

export const createCategory = async (payload) => {
  const result = await request('/categories', { method: 'POST', body: payload })
  return result.data
}

export const updateCategory = async (id, payload) => {
  const result = await request(`/categories/${id}`, { method: 'PUT', body: payload })
  return result.data
}

export const deleteCategory = async (id) => {
  const result = await request(`/categories/${id}`, { method: 'DELETE' })
  return result.data ?? result
}

/* ------------------------------------------------------------------
   Orders — customer side. These only ever touch the caller's own orders,
   which is what the controller scopes them to:

     GET  /api/orders        list the signed-in user's orders
     POST /api/orders        { items: [{ product_id, quantity }],
                               payment_method, payment_status, shipping_address,
                               note, discount }
     GET  /api/orders/{id}   one of the user's orders
     PUT  /api/orders/{id}/cancel

   Prices and totals are computed by the controller from the products table,
   so a client cannot dictate what an order costs.
------------------------------------------------------------------- */

export const getOrders = async () => {
  const result = await request('/orders')
  return result.data
}

export const getOrder = async (id) => {
  const result = await request(`/orders/${id}`)
  return result.data
}

export const createOrder = async (payload) => {
  const result = await request('/orders', { method: 'POST', body: payload })
  return result.data
}

export const cancelOrder = async (id) => {
  const result = await request(`/orders/${id}/cancel`, { method: 'PUT' })
  return result.data ?? result
}

/* ------------------------------------------------------------------
   Orders — staff side. The `staff` middleware answers 403 for customers,
   so these are only called from the admin and cashier screens:

     GET  /api/staff/orders[?search=&status=]
     GET  /api/staff/orders/{id}
     PUT  /api/staff/orders/{id}/status   { status }
     PUT  /api/staff/orders/{id}/payment  { payment_status }

   Unlike the customer routes these return every order in the shop, each
   with `user` and `items.product` already loaded.
------------------------------------------------------------------- */

export const getStaffOrders = async ({ search = '', status = '' } = {}) => {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  if (status) query.set('status', status.toLowerCase())

  const suffix = query.toString() ? `?${query}` : ''
  const result = await request(`/staff/orders${suffix}`)
  return result.data
}

export const updateOrderStatus = async (id, status) => {
  const result = await request(`/staff/orders/${id}/status`, {
    method: 'PUT',
    body: { status: String(status).toLowerCase() }
  })
  return result.data
}

export const updateOrderPayment = async (id, paymentStatus) => {
  const result = await request(`/staff/orders/${id}/payment`, {
    method: 'PUT',
    body: { payment_status: String(paymentStatus).toLowerCase() }
  })
  return result.data
}

/* ------------------------------------------------------------------
   Accounts — Admin -> Users and Admin -> Customers.

     GET    /api/staff/users           every account + orders_count
                                        (any staff member)
     POST   /api/staff/users           admin only
     PUT    /api/staff/users/{id}      admin only, partial
     DELETE /api/staff/users/{id}      admin only

   `password` is only sent when the admin is actually resetting it; the
   controller hashes it and never returns it.
------------------------------------------------------------------- */

export const getStaffUsers = async () => {
  const result = await request('/staff/users')
  return result.data
}

export const createStaffUser = async (payload) => {
  const result = await request('/staff/users', { method: 'POST', body: payload })
  return result.data
}

export const updateStaffUser = async (id, payload) => {
  const result = await request(`/staff/users/${id}`, { method: 'PUT', body: payload })
  return result.data
}

export const deleteStaffUser = async (id) => {
  const result = await request(`/staff/users/${id}`, { method: 'DELETE' })
  return result.data ?? result
}

/** The signed-in account, straight from the database (not the cached session). */
export const getCurrentUser = async () => {
  const result = await request('/user')
  return result.data
}

/** PUT /api/user/profile — a customer editing their own details. */
export const updateProfileRequest = async (payload) => {
  const result = await request('/user/profile', { method: 'PUT', body: payload })
  return result.data
}

/* ------------------------------------------------------------------
   Auth — Laravel Sanctum personal access tokens.

   POST /api/register  { name, email, phone, address, password, password_confirmation }
   POST /api/login     { email, password }
   POST /api/logout    (Bearer token, revokes the current token)
   GET  /api/user      (Bearer token, returns the authenticated user)
   PUT  /api/user/profile

   Every response looks like { success, message, data: { user, token } }.
------------------------------------------------------------------- */

const firstMessage = (error) =>
  (error?.fieldErrors && Object.values(error.fieldErrors).flat()[0]) || error?.message || 'Something went wrong.'

export const loginRequest = async ({ email, password }) => {
  try {
    const result = await request('/login', {
      method: 'POST',
      auth: false,
      body: { email: String(email || '').trim(), password }
    })

    setToken(result.data?.token)
    return { ok: true, user: result.data?.user ?? null }
  } catch (error) {
    return { ok: false, error: firstMessage(error), fieldErrors: error?.fieldErrors ?? null }
  }
}

export const registerRequest = async ({ name, email, phone, address, password, passwordConfirmation }) => {
  try {
    const result = await request('/register', {
      method: 'POST',
      auth: false,
      body: {
        name: String(name || '').trim(),
        email: String(email || '').trim(),
        phone: String(phone || '').trim(),
        address: String(address || '').trim(),
        password,
        password_confirmation: passwordConfirmation ?? password
      }
    })

    setToken(result.data?.token)
    return { ok: true, user: result.data?.user ?? null }
  } catch (error) {
    return { ok: false, error: firstMessage(error), fieldErrors: error?.fieldErrors ?? null }
  }
}

export const logoutRequest = async () => {
  try {
    if (getToken()) await request('/logout', { method: 'POST' })
    return { ok: true }
  } catch {
    // a dead token must never block the client-side logout
    return { ok: false }
  } finally {
    clearToken()
  }
}
