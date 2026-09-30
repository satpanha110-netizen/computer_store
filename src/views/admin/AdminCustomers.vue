<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from '../../composables/useStore'
import { useAuth } from '../../composables/useAuth'
import { formatMoney } from '../../utils/format'
import { statusLabel } from '../../utils/user'

const { orders, loadOrders } = useStore()
const { customers, loadUsers, usersLoading, usersError } = useAuth()

/* Customers are accounts with the customer role, so both halves of this screen
   come from the database: the buyer list from /api/staff/users and the spend
   figures from /api/staff/orders. */
onMounted(() => {
  loadUsers()
  loadOrders()
})

const search = ref('')

const customerRows = computed(() =>
  customers.value
    .map((c) => {
      const userOrders = orders.value.filter((o) => Number(o.user_id) === Number(c.id))

      return {
        ...c,
        /* orders_count comes pre-computed from the API, so the column is right
           even before the order list has finished loading. */
        totalOrders: c.ordersCount || userOrders.length,
        totalSpent: userOrders
          .filter((o) => o.payment_status === 'Paid' && o.status !== 'Cancelled')
          .reduce((sum, o) => sum + Number(o.total || 0), 0)
      }
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return customerRows.value
  return customerRows.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
  )
})

function statusBadge(status) {
  return status === 'suspended' ? 'danger' : 'success'
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Customers</h1>
        <p>{{ customerRows.length }} registered customers.</p>
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
            placeholder="Search customers..."
          />
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="usersLoading">
              <td colspan="7" class="cell-empty">Loading customers…</td>
            </tr>
            <tr v-else-if="usersError">
              <td colspan="7" class="cell-empty">{{ usersError }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="7" class="cell-empty">No customers found.</td>
            </tr>
            <tr v-for="c in filtered" :key="c.id">
              <td>
                <div class="cell-user">
                  <span class="table-avatar">{{ c.name.charAt(0).toUpperCase() }}</span>
                  <strong class="cell-strong">{{ c.name }}</strong>
                </div>
              </td>
              <td class="cell-muted">{{ c.email }}</td>
              <td>{{ c.phone || '—' }}</td>
              <td class="cell-wrap">{{ c.address || '—' }}</td>
              <td>
                <span class="cell-icon">
                  <i class="bi bi-cart3"></i>
                  <span class="count-pill">{{ c.totalOrders }}</span>
                </span>
              </td>
              <td class="cell-strong">{{ formatMoney(c.totalSpent) }}</td>
              <td>
                <span class="badge" :class="`badge--${statusBadge(c.status)}`">
                  {{ statusLabel(c.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>