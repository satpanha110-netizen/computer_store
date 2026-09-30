<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from '../../composables/useStore'
import { useToast } from '../../composables/toast'
import { formatDateTime, formatMoney, isRealImage } from '../../utils/format'

const { orders, ordersLoading, ordersError, loadOrders, updateOrder } = useStore()
const { show: showToast } = useToast()

onMounted(loadOrders)

const search = ref('')
const detail = ref(null)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orders.value.filter(
    (o) =>
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer || '').toLowerCase().includes(q)
  )
})

function payTone(p) {
  return p === 'Paid' ? 'success' : p === 'Failed' ? 'danger' : 'warning'
}

function statusTone(s) {
  return s === 'Completed' ? 'success' : s === 'Cancelled' ? 'danger' : s === 'Processing' ? 'info' : 'warning'
}

function openDetail(order) {
  detail.value = order
}

/* Both actions write through the API and refresh the row from the answer, so
   the badge only changes once the database has accepted it. */
async function markPaid(order) {
  try {
    await updateOrder(order.apiId, { payment_status: 'Paid' })
    showToast(`${order.id} payment marked as Paid.`)
  } catch (err) {
    showToast(err.message)
  }
}

async function complete(order) {
  try {
    await updateOrder(order.apiId, { status: 'Completed', payment_status: 'Paid' })
    showToast(`${order.id} completed.`)
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
        <p>View orders, confirm payments and complete sales.</p>
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
            placeholder="Search orders..."
          />
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ordersLoading">
              <td colspan="8" class="cell-empty">Loading orders…</td>
            </tr>
            <tr v-else-if="ordersError">
              <td colspan="8" class="cell-empty">{{ ordersError }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="8" class="cell-empty">No orders found.</td>
            </tr>
            <tr v-for="order in filtered" :key="order.id">
              <td class="cell-strong">
                <span class="cell-icon">
                  <i class="bi bi-receipt"></i>
                  {{ order.id }}
                </span>
              </td>
              <td>{{ order.customer }}</td>
              <td class="cell-muted">{{ formatDateTime(order.date) }}</td>
              <td class="cell-wrap">{{ order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ') }}</td>
              <td class="cell-strong">{{ formatMoney(order.total) }}</td>
              <td>
                <span class="badge" :class="`badge--${payTone(order.payment_status)}`">{{ order.payment_status }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${statusTone(order.status)}`">{{ order.status }}</span>
              </td>
              <td class="th-actions th-actions--wrap">
                <button class="btn btn-outline btn-sm" @click="openDetail(order)">
                  <i class="bi bi-eye"></i> View
                </button>
                <button
                  v-if="order.payment_status !== 'Paid'"
                  class="btn btn-primary btn-sm"
                  @click="markPaid(order)"
                ><i class="bi bi-cash-coin"></i> Mark Paid</button>
                <button
                  v-if="order.status !== 'Completed'"
                  class="btn btn-success btn-sm"
                  @click="complete(order)"
                ><i class="bi bi-check2"></i> Complete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="modal">
      <div v-if="detail" class="modal-overlay" @click.self="detail = null">
        <div class="modal">
          <div class="modal-head">
            <h3 class="data-head-title">
              <i class="bi bi-receipt"></i>
              Order {{ detail.id }}
            </h3>
            <button class="modal-close" aria-label="Close" @click="detail = null">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-meta">
              <div>
                <span class="info-label">Customer</span>
                <strong class="detail-strong">{{ detail.customer }}</strong>
              </div>
              <div>
                <span class="info-label">Date</span>
                <strong class="detail-strong">{{ formatDateTime(detail.date) }}</strong>
              </div>
              <div>
                <span class="info-label">Payment</span>
                <span class="badge" :class="`badge--${payTone(detail.payment_status)}`">{{ detail.payment_status }}</span>
              </div>
              <div>
                <span class="info-label">Status</span>
                <span class="badge" :class="`badge--${statusTone(detail.status)}`">{{ detail.status }}</span>
              </div>
            </div>

            <h4 class="detail-subhead">
              <i class="bi bi-bag"></i>
              Items
            </h4>
            <div class="detail-items">
              <div v-for="item in detail.items" :key="item.productId" class="detail-item">
                <span class="table-image">
                  <img v-if="isRealImage(item.image)" class="table-image--img" :src="item.image" :alt="item.name" />
                  <span v-else>{{ item.image }}</span>
                </span>
                <div class="detail-item-name">
                  <strong>{{ item.name }}</strong>
                  <small>{{ formatMoney(item.price) }} × {{ item.quantity }}</small>
                </div>
                <strong>{{ formatMoney(item.price * item.quantity) }}</strong>
              </div>
            </div>

            <div class="detail-totals">
              <div class="pos-total-row"><span>Subtotal</span><strong>{{ formatMoney(detail.subtotal) }}</strong></div>
              <div class="pos-total-row"><span>Discount</span><strong>{{ formatMoney(detail.discount || 0) }}</strong></div>
              <div class="pos-total-row pos-total-grand"><span>Total</span><strong>{{ formatMoney(detail.total) }}</strong></div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="detail = null">
              <i class="bi bi-x-circle"></i> Close
            </button>
            <button
              v-if="detail.payment_status !== 'Paid'"
              type="button"
              class="btn btn-primary"
              @click="markPaid(detail); detail = null"
            ><i class="bi bi-cash-coin"></i> Mark as Paid</button>
            <button
              v-if="detail.status !== 'Completed'"
              type="button"
              class="btn btn-success"
              @click="complete(detail); detail = null"
            ><i class="bi bi-check2-circle"></i> Complete Order</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>