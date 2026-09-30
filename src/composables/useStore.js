import { ref } from 'vue'
import {
  cancelOrder as cancelOrderRequest,
  createCategory,
  createOrder,
  createProduct,
  deleteCategory as deleteCategoryRequest,
  deleteProduct as deleteProductRequest,
  getCategories,
  getOrders,
  getProducts,
  getStaffOrders,
  updateCategory as updateCategoryRequest,
  updateOrderPayment as updateOrderPaymentRequest,
  updateOrderStatus as updateOrderStatusRequest,
  updateProduct as updateProductRequest
} from '../services/api'
import { normalizeProduct } from '../utils/product'
import { normalizeOrder, normalizeOrders } from '../utils/order'
import { useAuth } from './useAuth'

/* ------------------------------------------------------------------
   Products, categories and orders all come from the Laravel API:

      Vue component -> useStore composable -> services/api.js -> Database

   `loadCatalog()` fills `products` and `categories` in one round trip; the
   refs stay shared, so every screen that calls useStore() reads the same
   data and a reload triggered by one screen is visible to the others.

   Orders use two different endpoints depending on who is signed in:
     customer -> GET /api/orders         (their own orders)
     staff    -> GET /api/staff/orders   (every order in the shop)
   Staff only may change a status or a payment, so `updateOrder()` routes to
   /api/staff/orders/{id}/... and the views that use it are role-guarded.

   Customers are not stored here at all — a customer is simply an account with
   the customer role, so useAuth() owns the list and the two stay in step.
------------------------------------------------------------------- */

const STAFF_ROLES = ['admin', 'cashier']

const products = ref([])
const categories = ref([])
const catalogLoading = ref(false)
const catalogError = ref('')

const orders = ref([])
const ordersLoading = ref(false)
const ordersError = ref('')

/* Concurrent calls (e.g. two components mounting at the same time) share one
   request instead of hitting the API twice. */
let pendingCatalog = null

/* ---------- Catalog: products + categories ---------- */

async function loadCatalog() {
  if (pendingCatalog) return pendingCatalog

  catalogLoading.value = true
  catalogError.value = ''

  pendingCatalog = Promise.all([getProducts(), getCategories()])
    .then(([productList, categoryList]) => {
      products.value = productList.map(normalizeProduct)
      categories.value = categoryList
    })
    .catch((err) => {
      catalogError.value = err.message
    })
    .finally(() => {
      catalogLoading.value = false
      pendingCatalog = null
    })

  return pendingCatalog
}

function productById(id) {
  return products.value.find((p) => Number(p.id) === Number(id))
}

function categoryById(id) {
  return categories.value.find((c) => Number(c.id) === Number(id))
}

function productsInCategory(name) {
  return products.value.filter((p) => p.category === name).length
}

/* Mutations take the API payload shape (snake_case keys, category_id) and
   write the server's answer back into the refs, so the screens never show
   a value the database did not accept. */
async function addProduct(payload) {
  const result = await createProduct(payload)
  products.value.unshift(normalizeProduct(result.data))
  return result.data.id
}

async function updateProduct(id, payload) {
  const result = await updateProductRequest(id, payload)
  const fresh = normalizeProduct(result.data)
  const index = products.value.findIndex((p) => Number(p.id) === Number(id))
  if (index !== -1) products.value[index] = fresh
  return fresh
}

async function deleteProduct(id) {
  await deleteProductRequest(id)
  products.value = products.value.filter((p) => Number(p.id) !== Number(id))
}

async function addCategory(payload) {
  const result = await createCategory(payload)
  categories.value.push(result.data)
  return result.data.id
}

async function updateCategory(id, payload) {
  const result = await updateCategoryRequest(id, payload)
  const index = categories.value.findIndex((c) => Number(c.id) === Number(id))
  if (index !== -1) categories.value[index] = { ...categories.value[index], ...result.data }
  return result.data
}

async function deleteCategory(id) {
  await deleteCategoryRequest(id)
  categories.value = categories.value.filter((c) => Number(c.id) !== Number(id))
}

/* ---------- Orders ---------- */

function isStaffRole() {
  const { user } = useAuth()
  return STAFF_ROLES.includes(user.value?.role)
}

/* Orders are addressed by their numeric primary key on the API, but the
   tables render "ORD-12" and pass that label back here. Match either so the
   views can keep using the label they display. */
function findIndexById(id) {
  return orders.value.findIndex(
    (o) => o.apiId === id || o.id === id || String(o.apiId) === String(id)
  )
}

function replaceOrder(fresh) {
  const index = findIndexById(fresh.apiId)
  if (index === -1) orders.value.unshift(fresh)
  else orders.value[index] = fresh
  return fresh
}

/* Same shared-request trick as loadCatalog: mounting two screens at once
   must not produce two identical order queries. */
let pendingOrders = null

/**
 * Load the order list for whoever is signed in. Staff see the whole shop
 * through /api/staff/orders, a customer only their own through /api/orders.
 */
async function loadOrders({ search = '', status = '' } = {}) {
  if (pendingOrders) return pendingOrders

  ordersLoading.value = true
  ordersError.value = ''

  pendingOrders = (isStaffRole()
    ? getStaffOrders({ search, status })
    : getOrders()
  )
    .then((list) => {
      orders.value = normalizeOrders(list)
      return orders.value
    })
    .catch((err) => {
      ordersError.value = err.message
      throw err
    })
    .finally(() => {
      ordersLoading.value = false
      pendingOrders = null
    })

  return pendingOrders
}

/**
 * Record an order. `payload` is already in the API's shape:
 *
 *   { items: [{ product_id, quantity }], payment_method,
 *     payment_status, status, shipping_address, note, discount }
 *
 * The controller prices every line from the products table and returns the
 * saved order with `items.product` loaded, so the ref is filled from the
 * database rather than from the local cart.
 */
async function addOrder(payload) {
  const result = await createOrder(payload)
  return replaceOrder(normalizeOrder(result))
}

/**
 * Change a status and/or a payment state on an existing order. Staff only —
 * the controller answers 403 for customers. Both fields can be sent at once,
 * which is what the cashier screen does when it completes a sale.
 *
 * Each field is written by its own endpoint, so a partially failed update
 * still reports which half went wrong instead of rolling back silently.
 */
async function updateOrder(id, patch) {
  const index = findIndexById(id)
  if (index === -1) throw new Error('Order not found.')

  const current = orders.value[index]

  if (patch.status !== undefined && patch.status !== current.status) {
    const fresh = await updateOrderStatusRequest(current.apiId, patch.status)
    replaceOrder(normalizeOrder(fresh))
  }

  if (patch.payment_status !== undefined && patch.payment_status !== current.payment_status) {
    const fresh = await updateOrderPaymentRequest(current.apiId, patch.payment_status)
    replaceOrder(normalizeOrder(fresh))
  }

  return orderById(current.apiId)
}

/** Cancel one of the signed-in user's own pending orders. */
async function cancelOrder(id) {
  const index = findIndexById(id)
  if (index === -1) throw new Error('Order not found.')

  await cancelOrderRequest(orders.value[index].apiId)
  return loadOrders()
}

function orderById(id) {
  return orders.value.find((o) => o.apiId === id || o.id === id || String(o.apiId) === String(id))
}

function orderTotal(order) {
  return Number(order.total || 0)
}

export function useStore() {
  return {
    products,
    categories,
    catalogLoading,
    catalogError,
    loadCatalog,
    orders,
    ordersLoading,
    ordersError,
    loadOrders,
    productById,
    addProduct,
    updateProduct,
    deleteProduct,
    categoryById,
    addCategory,
    updateCategory,
    deleteCategory,
    productsInCategory,
    addOrder,
    updateOrder,
    cancelOrder,
    orderById,
    orderTotal
  }
}