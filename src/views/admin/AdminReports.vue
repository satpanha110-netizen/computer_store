<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from '../../composables/useStore'
import { formatMoney, isRealImage } from '../../utils/format'

const { orders, loadOrders } = useStore()

onMounted(loadOrders)

const salesOrders = computed(() =>
  orders.value.filter((o) => o.status !== 'Cancelled' && o.payment_status !== 'Failed')
)

const totalSales = computed(() =>
  salesOrders.value.reduce((sum, o) => sum + Number(o.total || 0), 0)
)

const dailySales = computed(() => {
  const now = new Date()
  return salesOrders.value
    .filter((o) => new Date(o.date).toDateString() === now.toDateString())
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
})

const monthlySales = computed(() => {
  const now = new Date()
  return salesOrders.value
    .filter((o) => {
      const d = new Date(o.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
})

const totalOrders = computed(() => orders.value.length)

const ordersByStatus = computed(() => {
  const map = {}
  for (const o of orders.value) {
    map[o.status] = (map[o.status] || 0) + 1
  }
  return Object.entries(map).map(([label, count]) => ({ label, count }))
})

const topProducts = computed(() => {
  const map = new Map()
  for (const o of orders.value) {
    if (o.status === 'Cancelled') continue
    for (const item of o.items) {
      const key = `${item.name}`
      const current = map.get(key) || { name: item.name, image: item.image, quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += item.quantity * item.price
      map.set(key, current)
    }
  }
  const list = [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 6)
  const max = Math.max(1, ...list.map((p) => p.quantity))
  return list.map((p) => ({ ...p, share: Math.round((p.quantity / max) * 100) }))
})

const stats = computed(() => [
  { label: 'Total Sales', value: formatMoney(totalSales.value), icon: 'bi-graph-up-arrow', tint: 'blue' },
  { label: "Today's Sales", value: formatMoney(dailySales.value), icon: 'bi-calendar-date', tint: 'green' },
  { label: 'Monthly Sales', value: formatMoney(monthlySales.value), icon: 'bi-calendar3', tint: 'amber' },
  { label: 'Total Orders', value: totalOrders.value, icon: 'bi-cart3', tint: 'violet' }
])

const statusTone = (s) => {
  if (s === 'Completed') return 'green'
  if (s === 'Pending') return 'amber'
  if (s === 'Processing') return 'blue'
  return 'red'
}

const statusIcon = (s) => {
  if (s === 'Completed') return 'bi-check-circle'
  if (s === 'Pending') return 'bi-hourglass-split'
  if (s === 'Processing') return 'bi-arrow-repeat'
  if (s === 'Cancelled') return 'bi-x-circle'
  return 'bi-dot'
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Reports</h1>
        <p>Sales analytics and performance.</p>
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

    <div class="dash-grid-2">
      <section class="data-card">
        <div class="data-head">
          <h3 class="data-head-title">
            <i class="bi bi-trophy"></i>
            Top Products
          </h3>
          <span class="cell-muted">by units sold</span>
        </div>

        <div class="rep-list">
          <div v-for="p in topProducts" :key="p.name" class="rep-item">
            <div class="rep-item-top">
              <span class="rep-name">
                <span class="table-image rep-image">
                  <img v-if="isRealImage(p.image)" class="table-image--img" :src="p.image" :alt="p.name" />
                  <span v-else>{{ p.image }}</span>
                </span>
                {{ p.name }}
              </span>
              <span class="rep-count">{{ p.quantity }} sold · {{ formatMoney(p.revenue) }}</span>
            </div>
            <div class="rep-track">
              <div class="rep-bar" :style="{ width: p.share + '%' }"></div>
            </div>
          </div>
          <p v-if="topProducts.length === 0" class="cell-empty">No sales data yet.</p>
        </div>
      </section>

      <section class="data-card">
        <div class="data-head">
          <h3 class="data-head-title">
            <i class="bi bi-pie-chart"></i>
            Orders by Status
          </h3>
        </div>

        <div class="rep-list">
          <div v-for="grp in ordersByStatus" :key="grp.label" class="rep-item">
            <div class="rep-item-top">
              <span class="rep-name">
                <span class="pill-icon">
                  <i class="bi" :class="statusIcon(grp.label)"></i>
                </span>
                {{ grp.label }}
              </span>
              <span class="rep-count">{{ grp.count }}</span>
            </div>
            <div class="rep-track">
              <div
                class="rep-bar"
                :class="`rep-bar--${statusTone(grp.label)}`"
                :style="{ width: Math.max(8, (grp.count / Math.max(1, orders.length)) * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>