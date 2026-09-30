<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from '../../composables/useStore'
import { formatDateTime, formatMoney } from '../../utils/format'

const { orders, loadOrders } = useStore()

onMounted(loadOrders)

const todayKey = new Date().toDateString()

const todayOrders = computed(() =>
  orders.value.filter((o) => new Date(o.date).toDateString() === todayKey)
)

const todaySales = computed(() =>
  todayOrders.value
    .filter((o) => o.payment_status === 'Paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
)

const pending = computed(() => orders.value.filter((o) => o.status === 'Pending'))
const completed = computed(() => orders.value.filter((o) => o.status === 'Completed'))

const stats = computed(() => [
  { label: "Today's Sales", value: formatMoney(todaySales.value), icon: 'bi-graph-up-arrow', tint: 'green' },
  { label: "Today's Orders", value: todayOrders.value.length, icon: 'bi-cart3', tint: 'blue' },
  { label: 'Pending Orders', value: pending.value.length, icon: 'bi-hourglass-split', tint: 'amber' },
  { label: 'Completed Orders', value: completed.value.length, icon: 'bi-check2-circle', tint: 'violet' }
])

const recent = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
)

const payTone = (p) => (p === 'Paid' ? 'success' : p === 'Failed' ? 'danger' : 'warning')
const statusTone = (s) =>
  s === 'Completed' ? 'success' : s === 'Cancelled' ? 'danger' : s === 'Processing' ? 'info' : 'warning'
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Cashier Dashboard</h1>
        <p>Start a sale or review today's activity.</p>
      </div>
      <div class="dash-head-actions">
        <RouterLink to="/cashier/orders" class="btn btn-outline btn-sm">
          <i class="bi bi-list-task"></i> Orders
        </RouterLink>
        <RouterLink to="/cashier/pos" class="btn btn-primary btn-sm">
          <i class="bi bi-cart3"></i> New Sale
        </RouterLink>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-icon" :class="`stat-icon--${stat.tint}`"><i class="bi" :class="stat.icon"></i></span>
        <div class="stat-body">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <section class="data-card">
      <div class="data-head">
        <h3 class="data-head-title">
          <i class="bi bi-receipt"></i>
          Today's Orders
        </h3>
        <RouterLink to="/cashier/orders" class="link-arrow">
          View all <i class="bi bi-arrow-right"></i>
        </RouterLink>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recent.length === 0">
              <td colspan="6" class="cell-empty">No orders yet.</td>
            </tr>
            <tr v-for="order in recent" :key="order.id">
              <td class="cell-strong">
                <span class="cell-icon">
                  <i class="bi bi-receipt"></i>
                  {{ order.id }}
                </span>
              </td>
              <td>{{ order.customer }}</td>
              <td class="cell-muted">{{ formatDateTime(order.date) }}</td>
              <td class="cell-strong">{{ formatMoney(order.total) }}</td>
              <td>
                <span class="badge" :class="`badge--${payTone(order.payment_status)}`">{{ order.payment_status }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${statusTone(order.status)}`">{{ order.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>