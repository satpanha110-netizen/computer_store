<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from '../composables/useStore'
import { useCart } from '../composables/cart'
import { useToast } from '../composables/toast'
import { isRealImage } from '../utils/format'

const { products, catalogLoading, loadCatalog } = useStore()
const { addItem } = useCart()
const { show: showToast } = useToast()

const featuredProducts = computed(() => products.value.slice(0, 4))

onMounted(loadCatalog)

function addToCart(product) {
  addItem(product, 1)
  showToast(`${product.name} added to cart`)
}

function discountPercent(product) {
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
}

function stars(rating) {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}
</script>

<template>
  <div>

    <!-- HERO -->
    <section class="hero">
      <div class="container hero-grid">

        <div class="hero-text">
          <span class="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            New 2026 lineup is here
          </span>

          <h1 class="hero-title">
            Find Your <span>Perfect Computer</span>
          </h1>

          <p class="hero-sub">
            Powerful laptops, gaming PCs, desktops and monitors — engineered for
            work, study and play, backed by real warranty and local support.
          </p>

          <div class="hero-actions">
            <RouterLink to="/products" class="btn btn-primary btn-lg">
              Shop Now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </RouterLink>

            <RouterLink
              to="/categories"
              class="btn btn-outline btn-lg"
            >
              Explore Categories
            </RouterLink>
          </div>

          <div class="hero-stats">
            <div class="hero-stat">
              <strong>500+</strong>
              <span>Products in stock</span>
            </div>
            <div class="hero-stat">
              <strong>10K+</strong>
              <span>Happy customers</span>
            </div>
            <div class="hero-stat">
              <strong>4.9★</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="monitor">
            <div class="float-card fc-1">
              <span class="f-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </span>
              <span>
                High Performance
                <small>Up to 180 FPS</small>
              </span>
            </div>

            <div class="monitor-screen">
              <div class="monitor-display">
                <span class="monitor-code">&lt;/&gt;</span>
                <span class="monitor-tag">Power • Speed • Reliability</span>
              </div>
            </div>
            <div class="monitor-stand"></div>
            <div class="monitor-base"></div>

            <div class="float-card fc-2">
              <span class="f-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </span>
              <span>
                Best Price
                <small>Save up to 20%</small>
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>

   

    <!-- FEATURED PRODUCTS -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head-left">
          <div>
            <span class="section-kicker">Featured</span>
            <h2 class="section-title">Our Best Sellers</h2>
          </div>
          <RouterLink to="/products" class="link-arrow">
            View All Products
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </RouterLink>
        </div>

        <div v-if="catalogLoading" class="empty-state">
          <h3>Loading products…</h3>
        </div>

        <div v-else-if="featuredProducts.length" class="product-grid">
          <article
            v-for="product in featuredProducts"
            :key="product.id"
            class="product-card"
          >
            <div class="product-media">
              <span class="product-badge">Featured</span>
              <span v-if="product.oldPrice" class="discount-badge">
                -{{ discountPercent(product) }}%
              </span>
              <img
                v-if="isRealImage(product.image)"
                class="product-img"
                :src="product.image"
                :alt="product.name"
              />
              <span v-else class="product-emoji">{{ product.image || '💻' }}</span>
            </div>

            <div class="product-body">
              <span class="product-category">{{ product.category }}</span>
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-desc">{{ product.description }}</p>

              <div class="rating">
                <span class="stars">{{ stars(product.rating) }}</span>
                <span class="rating-value">{{ product.rating }}</span>
                <span class="rating-count">({{ product.reviews }})</span>
              </div>

              <div class="price-row">
                <span class="price">${{ product.price }}</span>
                <span v-if="product.oldPrice" class="old-price">${{ product.oldPrice }}</span>
              </div>

              <div class="product-actions">
                <RouterLink :to="`/product/${product.id}`" class="btn btn-outline">
                  View Details
                </RouterLink>
                <button class="btn btn-primary" @click="addToCart(product)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
          </div>
          <h3>No products available.</h3>
        </div>
      </div>
    </section>

    <!-- WHY CHOOSE US -->
    <section id="about" class="section">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">Why Choose Us</span>
          <h2 class="section-title">The TechStore Advantage</h2>
          <p class="section-sub">We go beyond selling computers — we deliver a complete, trusted experience.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <span class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 5 20 19 16 16" /><line x1="15" y1="3" x2="23" y2="3" /></svg>
            </span>
            <h3>Free Delivery</h3>
            <p>Free express delivery on all orders over $500.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <h3>Secure Payment</h3>
            <p>Encrypted, 100% secure payment at checkout.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.5L1 10" /></svg>
            </span>
            <h3>Easy Returns</h3>
            <p>30-day hassle-free return policy on every order.</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
            </span>
            <h3>24/7 Support</h3>
            <p>Real experts ready to help whenever you need us.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container">
        <div class="cta-banner">
          <div>
            <h2>Ready to upgrade your setup?</h2>
            <p>Browse the full catalog and find the computer that fits your life.</p>
          </div>
          <RouterLink to="/products" class="btn btn-white btn-lg">
            View All Products
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </RouterLink>
        </div>
      </div>
    </section>

  </div>
</template>