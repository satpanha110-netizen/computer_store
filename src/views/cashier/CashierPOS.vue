<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from '../../composables/useStore'
import { useToast } from '../../composables/toast'
import { formatMoney, isRealImage } from '../../utils/format'

const { products, categories, catalogLoading, loadCatalog, addOrder } = useStore()
const { show: showToast } = useToast()

onMounted(loadCatalog)

const search = ref('')
const activeCategory = ref('All')
const payment = ref('Cash')
const discount = ref(0)
const cart = ref([])
const saving = ref(false)

const paymentMethods = [
  { name: 'Cash', icon: 'bi-cash-stack' },
  { name: 'Card', icon: 'bi-credit-card' },
  { name: 'QR Payment', icon: 'bi-qr-code' }
]

const categoryTabs = computed(() => ['All', ...categories.value.filter((c) => c.status === 'active').map((c) => c.name)])

const availableProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value
    .filter((p) => p.status !== 'inactive')
    .filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (activeCategory.value === 'All' || p.category === activeCategory.value)
    )
})

const subtotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const discountNum = computed(() => Math.min(Number(discount.value) || 0, subtotal.value))
const total = computed(() => subtotal.value - discountNum.value)

const isCartEmpty = computed(() => cart.value.length === 0 || total.value <= 0)

function addToCart(product) {
  const existing = cart.value.find((c) => c.productId === product.id)
  if (existing) {
    if (existing.quantity >= product.stock) return
    existing.quantity++
  } else {
    cart.value.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '📦',
      quantity: 1,
      stock: product.stock
    })
  }
}

function increase(item) {
  if (item.quantity < item.stock) item.quantity++
}

function decrease(item) {
  if (item.quantity > 1) {
    item.quantity--
  } else {
    removeItem(item)
  }
}

function removeItem(item) {
  cart.value = cart.value.filter((c) => c.productId !== item.productId)
}

function clearCart() {
  cart.value = []
  discount.value = 0
}

function printReceipt() {
  if (cart.value.length === 0) return
  window.print()
}

async function completeSale() {
  if (isCartEmpty.value || saving.value) return

  saving.value = true

  /* One request records the sale: the controller prices every line from the
     products table, writes the order items and takes the units off the shelf
     inside a single transaction. A failed call leaves the cart untouched
     rather than recording a sale that is not in the database. */
  try {
    await addOrder({
      items: cart.value.map((c) => ({
        product_id: c.productId,
        quantity: c.quantity
      })),
      payment_method: payment.value,
      /* Cash is settled at the till; card and QR are captured later. */
      payment_status: payment.value === 'Cash' ? 'paid' : 'pending',
      status: 'completed',
      discount: discountNum.value,
      note: 'Walk-in Customer'
    })
  } catch (err) {
    showToast(err.message)
    saving.value = false
    return
  }

  /* Stock moved on the server, so the catalog has to be re-read to show the
     new quantities. */
  await loadCatalog()

  showToast('Sale completed successfully! 💰')
  clearCart()
  saving.value = false
}
</script>

<template>
  <div class="pos">
    <div class="pos-catalog">

      <div class="dash-head pos-head">
        <div class="pos-head-left">
          <span class="pos-head-icon"><i class="bi bi-cart3"></i></span>
          <div>
            <h1>New Sale</h1>
            <p>Add products to build the order.</p>
          </div>
        </div>
      </div>

      <div class="pos-toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            v-model="search"
            class="table-search"
            type="search"
            placeholder="Search products..."
          />
        </div>
      </div>

      <div class="pos-tabs" role="tablist">
        <button
          v-for="cat in categoryTabs"
          :key="cat"
          class="pos-tab"
          :class="{ 'pos-tab--active': activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat }}</button>
      </div>

      <div class="pos-grid">
        <div v-if="catalogLoading" class="cell-empty pos-empty">
          Loading products…
        </div>

        <div
          v-for="product in availableProducts"
          :key="product.id"
          class="pos-card"
          :class="{ 'pos-card--out': Number(product.stock) <= 0 }"
        >
          <div class="pos-card-media">
            <img
              v-if="isRealImage(product.image)"
              class="pos-media-img"
              :src="product.image"
              :alt="product.name"
            />
            <span v-else>{{ product.image || '📦' }}</span>
          </div>
          <div class="pos-card-body">
            <strong class="pos-card-name">{{ product.name }}</strong>
            <div class="pos-card-meta">
              <span class="pos-card-price">{{ formatMoney(product.price) }}</span>
              <span class="pos-card-stock" :class="{ 'pos-card-stock--low': Number(product.stock) <= 5 }">
                <i class="bi" :class="Number(product.stock) <= 5 ? 'bi-exclamation-circle' : 'bi-box-seam'"></i>
                {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
              </span>
            </div>
            <button
              class="pos-add"
              :disabled="Number(product.stock) <= 0"
              @click="addToCart(product)"
            ><i class="bi bi-plus-lg"></i> Add</button>
          </div>
        </div>

        <div v-if="!catalogLoading && availableProducts.length === 0" class="cell-empty pos-empty">
          No products match your search.
        </div>
      </div>

    </div>

    <!-- Cart panel -->
    <aside class="pos-cart">
      <div class="pos-cart-head">
        <h3 class="pos-cart-head-title">
          <i class="bi bi-basket"></i>
          Current Sale
        </h3>
        <span class="pos-cart-count">{{ cart.length }} item{{ cart.length === 1 ? '' : 's' }}</span>
      </div>

      <div class="pos-cart-items">
        <div v-if="cart.length === 0" class="pos-cart-empty">
          <i class="bi bi-cart-x"></i>
          <p>Cart is empty. Add products from the catalog.</p>
        </div>

        <div v-for="item in cart" :key="item.productId" class="pos-line">
          <span class="pos-line-media">
            <img v-if="isRealImage(item.image)" class="pos-media-img" :src="item.image" :alt="item.name" />
            <span v-else>{{ item.image }}</span>
          </span>
          <div class="pos-line-info">
            <strong class="pos-line-name">{{ item.name }}</strong>
            <span class="pos-line-price">{{ formatMoney(item.price) }} <span v-if="item.quantity > 1">× {{ item.quantity }}</span></span>
          </div>
          <div class="qty">
            <button aria-label="Decrease quantity" @click="decrease(item)">
              <i class="bi bi-dash-lg"></i>
            </button>
            <span>{{ item.quantity }}</span>
            <button aria-label="Increase quantity" @click="increase(item)">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <strong class="pos-line-subtotal">{{ formatMoney(item.price * item.quantity) }}</strong>
          <button class="pos-line-remove" aria-label="Remove item" @click="removeItem(item)">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>

      <div class="pos-cart-totals">
        <div class="pos-total-row">
          <span class="pos-total-row-label">
            <i class="bi bi-calculator"></i>
            Subtotal
          </span>
          <strong>{{ formatMoney(subtotal) }}</strong>
        </div>
        <div class="pos-total-row pos-total-row--discount">
          <label for="pos-discount" class="pos-total-row-label">
            <i class="bi bi-percent"></i>
            Discount ($)
          </label>
          <input
            id="pos-discount"
            v-model.number="discount"
            class="pos-discount-input"
            type="number"
            min="0"
            placeholder="0.00"
          />
        </div>
        <div class="pos-total-row pos-total-grand">
          <span class="pos-total-row-label">
            <i class="bi bi-wallet2"></i>
            Total
          </span>
          <strong class="pos-total-value">{{ formatMoney(total) }}</strong>
        </div>
      </div>

      <div class="pos-payments">
        <span class="pos-payments-label">
          <i class="bi bi-credit-card"></i>
          Payment method
        </span>
        <div class="pos-payment-row">
          <button
            v-for="p in paymentMethods"
            :key="p.name"
            class="pos-payment-btn"
            :class="{ 'pos-payment-btn--active': payment === p.name }"
            @click="payment = p.name"
          ><i class="bi" :class="p.icon"></i> {{ p.name }}</button>
        </div>
      </div>

      <div class="pos-secondary-actions">
        <button type="button" class="btn btn-outline" :disabled="isCartEmpty" @click="printReceipt">
          <i class="bi bi-printer"></i> Print Receipt
        </button>
        <button type="button" class="btn btn-outline" :disabled="cart.length === 0" @click="clearCart">
          <i class="bi bi-trash3"></i> Clear Cart
        </button>
      </div>

      <button
        class="pos-complete"
        :disabled="isCartEmpty || saving"
        @click="completeSale"
      >
        <i class="bi bi-check2-circle"></i>
        {{ saving ? 'Saving...' : `Checkout · ${formatMoney(total)}` }}
      </button>
    </aside>
  </div>
</template>