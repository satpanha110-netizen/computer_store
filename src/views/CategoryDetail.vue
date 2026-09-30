<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'
import { useCart } from '../composables/cart'
import { useToast } from '../composables/toast'
import { formatMoney, isRealImage } from '../utils/format'

const route = useRoute()
const router = useRouter()
const { products, categories, catalogLoading, loadCatalog } = useStore()
const { addItem } = useCart()
const { show: showToast } = useToast()

onMounted(loadCatalog)
watch(() => route.params.id, loadCatalog)

const category = computed(() =>
  categories.value.find((item) => Number(item.id) === Number(route.params.id))
)

const unavailable = computed(() => !category.value || category.value.status === 'inactive')

const categoryProducts = computed(() =>
  category.value
    ? products.value.filter((product) => product.category === category.value.name)
    : []
)

function goToCategories() {
  router.push('/categories')
}

function browseProducts() {
  router.push('/products')
}

function viewProduct(product) {
  router.push(`/product/${product.id}`)
}

function discountPercent(product) {
  if (!product.oldPrice) return 0
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
}

function stars(rating = 0) {
  const full = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)))
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function isOutOfStock(product) {
  const stock = Number(product.stock)
  return !Number.isFinite(stock) || stock <= 0
}

function addToCart(product) {
  if (isOutOfStock(product)) return
  addItem(product, 1)
  showToast(`${product.name} added to cart`)
}
</script>

<template>
  <div>

    <!-- LOADING -->
    <div v-if="catalogLoading" class="container not-found">
      <h1>Loading category…</h1>
    </div>

    <!-- CATEGORY NOT AVAILABLE -->
    <div v-else-if="unavailable" class="container not-found">
      <div class="nf-code">404</div>
      <h1>Category not available</h1>
      <p>This category does not exist or is currently unavailable.</p>
      <button type="button" class="btn btn-primary" @click="goToCategories">
        Back to Categories
      </button>
    </div>

    <!-- CATEGORY DETAIL -->
    <template v-else>
      <div class="page-head">
        <div class="container">
          <h1>{{ category.name }}</h1>
          <p>{{ category.description || 'Browse products in this category.' }}</p>
        </div>
      </div>

      <div class="container" style="padding-bottom: 72px;">

        <!-- HERO -->
        <section class="cat-detail-hero">
          <div class="cat-detail-media">
            <img
              v-if="isRealImage(category.image)"
              :src="category.image"
              :alt="category.name"
            />
            <span v-else-if="category.image" class="cat-detail-emoji">{{ category.image }}</span>
            <span v-else class="cat-detail-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            </span>
          </div>

          <div class="cat-detail-body">
            <span class="section-kicker">Category</span>
            <h2 class="cat-detail-title">{{ category.name }}</h2>
            <p class="cat-detail-desc">{{ category.description || 'Browse products in this category.' }}</p>
            <span class="cat-detail-count">
              {{ categoryProducts.length }} Product{{ categoryProducts.length === 1 ? '' : 's' }}
            </span>

            <div class="cat-detail-actions">
              <button type="button" class="btn btn-primary btn-lg" @click="browseProducts">
                View All Products
              </button>
              <button type="button" class="btn btn-outline btn-lg" @click="goToCategories">
                ← Back to Categories
              </button>
            </div>
          </div>
        </section>

        <!-- PRODUCTS -->
        <section class="cat-detail-products">
          <div class="cat-detail-head">
            <div>
              <span class="section-kicker">Products</span>
              <h2>Products in {{ category.name }}</h2>
            </div>
            <span class="cat-detail-count">
              {{ categoryProducts.length }} Product{{ categoryProducts.length === 1 ? '' : 's' }}
            </span>
          </div>

          <div v-if="categoryProducts.length > 0" class="product-grid cat-detail-product-grid">
            <article
              v-for="product in categoryProducts"
              :key="product.id"
              class="product-card"
            >
              <RouterLink :to="`/product/${product.id}`" class="product-media">
                <span v-if="product.oldPrice" class="discount-badge">
                  -{{ discountPercent(product) }}%
                </span>
                <img
                  v-if="isRealImage(product.image)"
                  class="product-img"
                  :src="product.image"
                  :alt="product.name"
                />
                <span v-else class="product-emoji">{{ product.image || '📷' }}</span>
              </RouterLink>

              <div class="product-body">
                <span class="product-category">{{ product.category }}</span>
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-desc">{{ product.description || 'No description available.' }}</p>

                <span class="product-stock" :class="{ out: isOutOfStock(product) }">
                  {{ isOutOfStock(product) ? 'Out of stock' : `${product.stock} in stock` }}
                </span>

                <div class="rating">
                  <span class="stars">{{ stars(product.rating) }}</span>
                  <span class="rating-value">{{ product.rating ?? 0 }}</span>
                  <span class="rating-count">({{ product.reviews ?? 0 }})</span>
                </div>

                <div class="price-row">
                  <span class="price">{{ formatMoney(product.price) }}</span>
                  <span v-if="product.oldPrice" class="old-price">{{ formatMoney(product.oldPrice) }}</span>
                </div>

                <div class="product-actions">
                  <button type="button" class="btn btn-outline" @click="viewProduct(product)">
                    View Details
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="isOutOfStock(product)"
                    @click="addToCart(product)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- EMPTY -->
          <div v-else class="empty-state">
            <div class="empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </div>
            <h3>No products available in this category.</h3>
            <p>Check back soon or browse our full catalog.</p>
            <button type="button" class="btn btn-primary" @click="browseProducts">
              Browse All Products
            </button>
          </div>
        </section>

      </div>
    </template>

  </div>
</template>