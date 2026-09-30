export const ROLES = ['admin', 'cashier', 'customer']

const ROLE_SET = new Set(ROLES)

/** Anything the API does not know about falls back to the least privilege. */
export function normalizeRole(value) {
  const role = String(value ?? '').trim().toLowerCase()
  return ROLE_SET.has(role) ? role : 'customer'
}

export function normalizeStatus(value) {
  return String(value ?? '').trim().toLowerCase() === 'suspended' ? 'suspended' : 'active'
}

/** "suspended" -> "Suspended" for the table badge labels. */
export function statusLabel(value) {
  return normalizeStatus(value) === 'suspended' ? 'Suspended' : 'Active'
}

export function roleLabel(value) {
  const role = normalizeRole(value)
  return role.charAt(0).toUpperCase() + role.slice(1)
}

/**
 * Turn a row from /api/staff/users (or the `user` object on a login/register
 * response) into the shape the admin tables expect.
 *
 * `orders_count` is filled by the controller; `created_at` is what the
 * "member since" column reads. `password` is never present in a response, so
 * there is nothing to strip here.
 */
export function normalizeUser(record) {
  if (!record) return null

  return {
    id: record.id,
    name: record.name || '',
    email: String(record.email || '').toLowerCase(),
    phone: record.phone || '',
    address: record.address || '',
    role: normalizeRole(record.role),
    status: normalizeStatus(record.status),
    ordersCount: Number(record.orders_count || 0),
    created_at: record.created_at || ''
  }
}

export function normalizeUsers(list) {
  return (list || []).map(normalizeUser).filter(Boolean)
}
