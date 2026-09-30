<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from '../../composables/useStore'
import { useToast } from '../../composables/toast'
import { formatDateTime, formatMoney } from '../../utils/format'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../utils/order'

const { orders, ordersLoading, ordersError, loadOrders, updateOrder } = useStore()
const { show: showToast } = useToast()

onMounted(loadOrders)

const search = ref('')
const statusFilter = ref('')

const statuses = ORDER_STATUSES
const payments = PAYMENT_STATUSES

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orders.value.filter((o) => {
    const matchQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q)
    const matchStatus = !statusFilter.value || o.status === statusFilter.value
    return matchQuery && matchStatus
  })
})

function itemsSummary(order) {
  return order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
}

function statusBadge(s) {
  return s === 'Completed' ? 'success' : s === 'Cancelled' ? 'danger' : s === 'Processing' ? 'info' : 'warning'
}

function paymentBadge(p) {
  return p === 'Paid' ? 'success' : p === 'Failed' ? 'danger' : 'warning'
}

/* The dropdown is re-rendered from the order once Laravel confirms the
   change, so a rejected update snaps back to the stored value instead of
   showing a state the database never accepted. */
async function setStatus(order, status) {
  try {
    await updateOrder(order.apiId, { status })
    showToast(`${order.id} status → ${status}`)
  } catch (err) {
    showToast(err.message)
  }
}

async function setPayment(order, payment) {
  try {
    await updateOrder(order.apiId, { payment_status: payment })
    showToast(`${order.id} payment → ${payment}`)
  } catch (err) {
    showToast(err.message)
  }
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Orders</h1>
        <p>Manage orders, payment and fulfilment.</p>
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
            placeholder="Search by order ID or customer..."
          />
        </div>
        <div class="filter-box">
          <i class="bi bi-funnel"></i>
          <select v-model="statusFilter" class="table-filter">
            <option value="">All statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Products</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ordersLoading">
              <td colspan="7" class="cell-empty">Loading orders…</td>
            </tr>
            <tr v-else-if="ordersError">
              <td colspan="7" class="cell-empty">{{ ordersError }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="7" class="cell-empty">No orders found.</td>
            </tr>
            <tr v-for="order in filtered" :key="order.id">
              <td class="cell-strong">
                <span class="cell-icon">
                  <i class="bi bi-receipt"></i>
                  {{ order.id }}
                </span>
              </td>
              <td>
                <strong class="cell-strong">{{ order.customer }}</strong>
                <small class="cell-sub">{{ order.email }}</small>
              </td>
              <td class="cell-muted">{{ formatDateTime(order.date) }}</td>
              <td class="cell-wrap" :title="itemsSummary(order)">
                {{ itemsSummary(order) }}
              </td>
              <td class="cell-strong">{{ formatMoney(order.total) }}</td>
              <td>
                <select
                  class="table-select"
                  :class="`badge-select badge-select--${paymentBadge(order.payment_status)}`"
                  :value="order.payment_status"
                  @change="setPayment(order, $event.target.value)"
                >
                  <option v-for="p in payments" :key="p" :value="p">{{ p }}</option>
                </select>
              </td>
              <td>
                <select
                  class="table-select"
                  :class="`badge-select badge-select--${statusBadge(order.status)}`"
                  :value="order.status"
                  @change="setStatus(order, $event.target.value)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>