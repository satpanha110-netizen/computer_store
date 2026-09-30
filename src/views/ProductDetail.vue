<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct } from '../services/api'
import { normalizeProduct } from '../utils/product'
import { useCart } from '../composables/cart'
import { useToast } from '../composables/toast'
import { isRealImage } from '../utils/format'

const route = useRoute()
const router = useRouter()

const { addItem: addToCartStore } = useCart()
const { show: showToast } = useToast()

const quantity = ref(1)
const added = ref(false)
const activeThumb = ref(0)

const product = ref(null)
const loading = ref(true)
const loadError = ref('')

async function load(id) {
  loading.value = true
  loadError.value = ''
  try {
    product.value = normalizeProduct(await getProduct(id))
  } catch (err) {
    product.value = null
    loadError.value = err.message
  } finally {
    loading.value = false
  }
}

load(route.params.id)

const thumbs = computed(() => [
  product.value?.image,
  /monitor/i.test(product.value?.category || '') ? '📺' : '💻',
  '📦'
])

const discountPercent = computed(() =>
  product.value.oldPrice
    ? Math.round(((product.value.oldPrice - product.value.price) / product.value.oldPrice) * 100)
    : 0
)

const stockStatus = computed(() => {
  if (product.value.stock === 0) return { label: 'Out of stock', cls: 'out' }
  if (product.value.stock <= 10) return { label: `Only ${product.value.stock} left in stock`, cls: 'low' }
  return { label: 'In stock', cls: 'in' }
})

const stars = computed(() => {
  const rating = product.value ? Math.round(Number(product.value.rating) || 0) : 0
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
})

const specifications = computed(() => product.value?.specifications || {})

function increaseQuantity() {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function addToCart() {
  addToCartStore(product.value, quantity.value)
  added.value = true
  showToast(`${quantity.value} × ${product.value.name} added to cart`)
  setTimeout(() => {
    added.value = false
  }, 1800)
}

function buyNow() {
  addToCartStore(product.value, quantity.value)
  showToast(`${quantity.value} × ${product.value.name} added to cart`)
  router.push('/cart')
}

watch(
  () => route.params.id,
  (id) => {
    quantity.value = 1
    activeThumb.value = 0
    added.value = false
    product.value = null
    load(id)
  }
)
</script>

<template>

  <div
    v-if="product"
    class="detail-page"
  >

    <div class="container">

      <!-- BREADCRUMB -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <RouterLink to="/">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/products">Products</RouterLink>
        <span>/</span>
        <RouterLink :to="{ path: '/products', query: { category: product.category } }">
          {{ product.category }}
        </RouterLink>
        <span>/</span>
        <span class="current">{{ product.name }}</span>
      </nav>

      <!-- MAIN -->
      <div class="detail-grid">

        <!-- GALLERY -->
        <div class="gallery">
          <div class="main-image">
            <span class="category-label">{{ product.category }}</span>
            <span v-if="product.oldPrice" class="discount-badge">
              -{{ discountPercent }}% OFF
            </span>
            <span class="product-emoji" v-if="!isRealImage(thumbs[activeThumb])">
              {{ thumbs[activeThumb] || '📷' }}
            </span>
            <img
              v-else
              class="main-img"
              :src="thumbs[activeThumb]"
              :alt="product.name"
            />
          </div>

          <div class="thumbs">
            <button
              v-for="(thumb, index) in thumbs"
              :key="index"
              class="thumb"
              :class="{ active: activeThumb === index }"
              :aria-label="`View image ${index + 1}`"
              @click="activeThumb = index"
            >
              <img v-if="isRealImage(thumb)" class="thumb-img" :src="thumb" :alt="`Product image ${index + 1}`" />
              <span v-else>{{ thumb }}</span>
            </button>
          </div>
        </div>

        <!-- INFO -->
        <div class="detail-info">
          <span class="detail-category">{{ product.category }}</span>

          <h1>{{ product.name }}</h1>

          <div class="detail-rating">
            <span class="stars">{{ stars }}</span>
            <span class="rating-value">{{ product.rating ?? 0 }}</span>
            <span class="rating-count">({{ product.reviews ?? 0 }} reviews)</span>
          </div>

          <p class="detail-description">{{ product.description || 'No description available.' }}</p>

          <div class="price-area">
            <span class="price">${{ product.price }}</span>
            <span v-if="product.oldPrice" class="old-price">${{ product.oldPrice }}</span>
            <span v-if="product.oldPrice" class="discount">
              Save ${{ product.oldPrice - product.price }}
            </span>
          </div>

          <div class="stock" :class="stockStatus.cls">
            <span class="dot"></span>
            {{ stockStatus.label }}
          </div>

          <!-- PURCHASE -->
          <div class="purchase-row">
            <div class="qty">
              <button
                type="button"
                :disabled="quantity <= 1"
                aria-label="Decrease quantity"
                @click="decreaseQuantity"
              >−</button>
              <span>{{ quantity }}</span>
              <button
                type="button"
                :disabled="product.stock === 0"
                aria-label="Increase quantity"
                @click="increaseQuantity"
              >+</button>
            </div>

            <button
              class="btn btn-primary btn-lg"
              :disabled="product.stock === 0"
              @click="addToCart"
            >
              <svg v-if="added" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              {{ added ? 'Added to Cart' : 'Add to Cart' }}
            </button>

            <button
              class="btn btn-dark btn-lg"
              :disabled="product.stock === 0"
              @click="buyNow"
            >
              Buy Now
            </button>
          </div>

          <div class="shortcuts">
            <span class="shortcut-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 5 20 19 16 16" /><line x1="15" y1="3" x2="23" y2="3" /></svg>
              Free delivery over $500
            </span>
            <span class="shortcut-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Secure checkout
            </span>
            <span class="shortcut-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.5L1 10" /></svg>
              30-day returns
            </span>
          </div>

          <!-- SPECIFICATIONS -->
          <div class="spec-section">
            <h2>Specifications</h2>
            <table class="spec-table">
              <tbody>
                <tr v-for="(value, key) in specifications" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
                <tr v-if="Object.keys(specifications).length === 0">
                  <td colspan="2" class="spec-empty">No specifications on file.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <!-- BENEFITS -->
      <section class="benefits">
        <div class="benefits-grid">
          <div class="benefit-item">
            <span class="b-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 5 20 19 16 16" /><line x1="15" y1="3" x2="23" y2="3" /></svg>
            </span>
            <div>
              <strong>Free Delivery</strong>
              <p>Orders over $500</p>
            </div>
          </div>

          <div class="benefit-item">
            <span class="b-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <div>
              <strong>Secure Payment</strong>
              <p>100% safe checkout</p>
            </div>
          </div>

          <div class="benefit-item">
            <span class="b-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.5L1 10" /></svg>
            </span>
            <div>
              <strong>30-Day Returns</strong>
              <p>Easy return policy</p>
            </div>
          </div>

          <div class="benefit-item">
            <span class="b-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </span>
            <div>
              <strong>Official Warranty</strong>
              <p>{{ specifications.warranty || '12 Months' }}</p>
            </div>
          </div>
        </div>
      </section>

    </div>

  </div>

  <!-- LOADING -->
  <div v-else-if="loading" class="container not-found">
    <p>Loading product...</p>
  </div>

  <!-- NOT FOUND -->
  <div v-else class="container not-found">
    <div class="nf-code">404</div>
    <h1>Product Not Found</h1>
    <p>The product you're looking for doesn't exist or has been removed.</p>
    <RouterLink to="/products" class="btn btn-primary">
      Back to Products
    </RouterLink>
  </div>

</template>