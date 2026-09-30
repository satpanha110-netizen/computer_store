<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from '../../composables/useStore'
import { useAuth } from '../../composables/useAuth'
import { formatMoney, formatDateTime } from '../../utils/format'

const { products, categories, catalogLoading, loadCatalog, orders, loadOrders } = useStore()
const { customers, loadUsers } = useAuth()

onMounted(() => {
  loadCatalog()
  loadOrders()
  loadUsers()
})

const revenue = computed(() =>
  orders.value
    .filter((o) => o.payment_status === 'Paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
)

const lowStock = computed(
  () => products.value.filter((p) => Number(p.stock) <= 5).length
)

const stats = computed(() => [
  { label: 'Total Products', value: products.value.length, icon: 'bi-box-seam', tint: 'blue' },
  { label: 'Total Categories', value: categories.value.length, icon: 'bi-tags', tint: 'violet' },
  { label: 'Total Orders', value: orders.value.length, icon: 'bi-cart3', tint: 'green' },
  /* One source of truth: customers are accounts with the customer role, so
     adding the local demo list used to double-count everyone. */
  { label: 'Total Customers', value: customers.value.length, icon: 'bi-people', tint: 'amber' },
  { label: 'Total Revenue', value: formatMoney(revenue.value), icon: 'bi-currency-dollar', tint: 'blue' },
  { label: 'Low Stock', value: lowStock.value, icon: 'bi-exclamation-triangle', tint: 'amber' }
])

const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
)

const statusBadge = {
  Pending: 'warning',
  Processing: 'info',
  Completed: 'success',
  Cancelled: 'danger'
}

const paymentBadge = {
  Pending: 'warning',
  Paid: 'success',
  Failed: 'danger'
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Dashboard</h1>
        <p>Overview of your store performance.</p>
      </div>
      <div class="dash-head-actions">
        <RouterLink to="/admin/products" class="btn btn-outline btn-sm">
          <i class="bi bi-box-seam"></i> Products
        </RouterLink>
        <RouterLink to="/admin/reports" class="btn btn-primary btn-sm">
          <i class="bi bi-bar-chart-line"></i> View Reports
        </RouterLink>
      </div>
    </div>

    <div v-if="catalogLoading" class="data-card">
      Loading catalog…
    </div>

    <div v-else class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-icon" :class="`stat-icon--${stat.tint}`"><i class="bi" :class="stat.icon"></i></span>
        <div class="stat-body">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <div class="dash-grid-2">
      <section class="data-card">
        <div class="data-head">
          <h3 class="data-head-title">
            <i class="bi bi-receipt"></i>
            Recent Orders
          </h3>
          <RouterLink to="/admin/orders" class="link-arrow">
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
              <tr v-for="order in recentOrders" :key="order.id">
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
                  <span class="badge" :class="`badge--${paymentBadge[order.payment_status] || 'muted'}`">
                    {{ order.payment_status }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="`badge--${statusBadge[order.status] || 'muted'}`">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="data-card">
        <div class="data-head">
          <h3 class="data-head-title">
            <i class="bi bi-lightning-charge"></i>
            Quick Actions
          </h3>
        </div>

        <div class="quick-grid">
          <RouterLink to="/admin/products" class="quick-link">
            <span class="quick-icon"><i class="bi bi-box-seam"></i></span>
            <div><strong>Manage Products</strong><small>Add, edit or remove stock</small></div>
          </RouterLink>
          <RouterLink to="/admin/orders" class="quick-link">
            <span class="quick-icon"><i class="bi bi-clipboard-check"></i></span>
            <div><strong>Process Orders</strong><small>Update payment &amp; status</small></div>
          </RouterLink>
          <RouterLink to="/admin/users" class="quick-link">
            <span class="quick-icon"><i class="bi bi-person-gear"></i></span>
            <div><strong>Manage Users</strong><small>Roles &amp; access control</small></div>
          </RouterLink>
          <RouterLink to="/admin/reports" class="quick-link">
            <span class="quick-icon"><i class="bi bi-bar-chart-line"></i></span>
            <div><strong>View Reports</strong><small>Sales &amp; top products</small></div>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>