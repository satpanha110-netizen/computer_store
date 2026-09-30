import { resolveImageUrl } from './product'

/* The database stores order states in snake_case ("paid", "cancelled") and
   prices as DECIMAL strings ("1099.00"), while the tables and badge classes in
   the templates compare against Title Case values ("Paid", "Completed"). The
   normalizers below bridge the two so no view has to know which side it is
   talking to. */
export const ORDER_STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled']
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed']

function titleCase(value) {
  const text = String(value ?? '').trim()
  if (!text) return 'Pending'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/** "cancelled" -> "Cancelled". Anything unknown falls back to Pending. */
export function normalizeStatus(value) {
  return titleCase(value)
}

/** "paid" -> "Paid". */
export function normalizePaymentStatus(value) {
  return titleCase(value)
}

/** "cancelled" -> "Cancelled" for the status dropdown sent back to the API. */
export function toApiStatus(value) {
  return String(value ?? '').trim().toLowerCase()
}

/** The walk-in note the cashier screen records, if any. */
export function isWalkInOrder(order) {
  return String(order?.note || '').toLowerCase().includes('walk-in')
}

function normalizeItem(item) {
  const product = item.product || {}

  return {
    id: item.id,
    productId: item.product_id,
    name: product.name || 'Removed product',
    price: Number(item.price || 0),
    image: resolveImageUrl(product.image) || '📦',
    quantity: Number(item.quantity || 0),
    subtotal: Number(item.subtotal || 0)
  }
}

/**
 * Turn one order from /api/orders or /api/staff/orders into the shape the
 * order tables already expect.
 *
 * `id` becomes a display label ("ORD-12") because that is what the tables
 * render and search on; `apiId` keeps the numeric primary key for the
 * status/payment calls, which address orders by that id.
 */
export function normalizeOrder(order) {
  if (!order) return null

  const items = (order.items || []).map(normalizeItem)
  const discount = Number(order.discount || 0)

  /* The staff routes load `user`; the customer routes do not, so fall back to
     the order note — a cashier records a walk-in sale without an account. */
  const customer = order.user?.name || (isWalkInOrder(order) ? 'Walk-in Customer' : 'Customer')

  return {
    ...order,
    apiId: order.id,
    id: `ORD-${order.id}`,
    customer,
    email: order.user?.email || (isWalkInOrder(order) ? 'walkin@techstore.local' : ''),
    date: order.created_at,
    items,
    /* Sum of the lines, not total_amount, because the tables show the
       subtotal next to the discount. */
    subtotal: Number(order.total_amount || 0) + discount,
    discount,
    total: Number(order.total_amount || 0),
    payment: order.payment_method || 'Cash',
    payment_status: normalizePaymentStatus(order.payment_status),
    status: normalizeStatus(order.status),
    shipping_address: order.shipping_address || '',
    note: order.note || ''
  }
}

export function normalizeOrders(orders) {
  return (orders || []).map(normalizeOrder).filter(Boolean)
}
