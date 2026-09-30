<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCart } from './composables/cart'
import { useToast } from './composables/toast'
import { useAuth } from './composables/useAuth'

const mobileOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')

const route = useRoute()
const router = useRouter()

const cart = useCart()
const { visible: toastVisible, message: toastMessage, show: showToast } = useToast()

const { user, isLoggedIn, logout } = useAuth()

const badgeCount = computed(() =>
  cart.count.value > 99 ? '99+' : cart.count.value
)

const isDashboard = computed(
  () => route.path.startsWith('/admin') || route.path.startsWith('/cashier')
)

const firstName = computed(() =>
  String(user.value?.name || '').split(' ')[0]
)

const initial = computed(() =>
  String(user.value?.name || '?').charAt(0).toUpperCase()
)

function handleLogout() {
  logout()
  showToast('You have been logged out.')
  router.push('/login')
}

function isActive(to) {
  if (to === '/') return route.path === '/'
  if (to === '/products') {
    return route.path === '/products' || route.path.startsWith('/product/')
  }
  return route.path === to
}

function submitSearch() {
  router.push({
    path: '/products',
    query: searchQuery.value.trim() ? { q: searchQuery.value.trim() } : {}
  })
  searchOpen.value = false
  mobileOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
    searchOpen.value = false
  }
)
</script>

<template>
  <div class="site">

    <!-- NAVBAR -->
    <header v-if="!isDashboard" class="navbar">
      <div class="container navbar-inner">

        <RouterLink to="/" class="logo">
          <span class="logo-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
          <span class="logo-name">Tech<span>Store</span></span>
        </RouterLink>

        <nav class="nav-links" aria-label="Main navigation">
          <RouterLink
            to="/"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/') }"
          >Home</RouterLink>
            <RouterLink
            to="/categories"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/categories') }"
          >Categories</RouterLink>
          <RouterLink
            to="/products"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/products') }"
          >Products</RouterLink>
        
          <RouterLink
            to="/about"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/about') }"
          >About</RouterLink>
          <RouterLink
            to="/contact"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/contact') }"
          >Contact</RouterLink>
        </nav>

        <div class="nav-actions">

          <button
            class="icon-btn"
            :class="{ 'is-open': searchOpen }"
            title="Search"
            aria-label="Search products"
            @click="searchOpen = !searchOpen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <div class="nav-auth">
            <template v-if="!isLoggedIn">
              <RouterLink
                to="/login"
                class="auth-link"
                :class="{ 'nav-link--active': isActive('/login') }"
              >Login</RouterLink>
              <RouterLink
                to="/register"
                class="auth-link auth-link--solid"
                :class="{ 'auth-link--active': isActive('/register') }"
              >Register</RouterLink>
            </template>

            <template v-else>
              <RouterLink
                to="/profile"
                class="user-chip"
                :title="user.name"
              >
                <span class="avatar">{{ initial }}</span>
                <span class="user-chip-name">{{ firstName }}</span>
                <svg class="user-chip-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </RouterLink>
              <button
                class="icon-btn user-logout"
                title="Logout"
                aria-label="Logout"
                @click="handleLogout"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </button>
            </template>
          </div>

          <button
            class="icon-btn"
            title="Cart"
            aria-label="Shopping cart"
            @click="router.push('/cart')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span v-if="cart.count > 0" class="cart-badge">{{ badgeCount }}</span>
          </button>

          <button
            class="menu-toggle"
            :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="mobileOpen"
            @click="mobileOpen = !mobileOpen"
          >
            <svg v-if="!mobileOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

        </div>

      </div>

      <!-- Search panel -->
      <Transition name="navpop">
        <div v-if="searchOpen" class="nav-search-panel">
          <div class="container">
            <form class="nav-search-form" @submit.prevent="submitSearch">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search laptops, gaming PCs, monitors..."
                autofocus
              />
              <button class="btn btn-primary" type="submit">Search</button>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Mobile menu -->
      <Transition name="navpop">
        <div v-if="mobileOpen" class="container mobile-menu" aria-label="Mobile navigation">
          <RouterLink
            to="/"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/') }"
          >Home</RouterLink>
          <RouterLink
            to="/products"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/products') }"
          >Products</RouterLink>
          <RouterLink
            to="/categories"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/categories') }"
          >Categories</RouterLink>
          <RouterLink
            to="/about"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/about') }"
          >About</RouterLink>
          <RouterLink
            to="/contact"
            class="nav-link"
            :class="{ 'nav-link--active': isActive('/contact') }"
          >Contact</RouterLink>

          <div class="mobile-auth">
            <template v-if="!isLoggedIn">
              <RouterLink
                to="/login"
                class="nav-link mobile-auth-link"
                :class="{ 'nav-link--active': isActive('/login') }"
              >Login</RouterLink>
              <RouterLink
                to="/register"
                class="nav-link mobile-auth-link"
                :class="{ 'nav-link--active': isActive('/register') }"
              >Register</RouterLink>
            </template>

            <template v-else>
              <RouterLink
                to="/profile"
                class="mobile-user"
                :title="user.name"
              >
                <span class="avatar">{{ initial }}</span>
                <span>{{ user.name }}</span>
              </RouterLink>
              <RouterLink
                to="/profile"
                class="nav-link mobile-auth-link"
                :class="{ 'nav-link--active': isActive('/profile') }"
              >Profile</RouterLink>
              <button class="btn btn-outline btn-block" @click="handleLogout">Logout</button>
            </template>
          </div>

          <form class="mobile-search" @submit.prevent="submitSearch">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
            />
            <button class="btn btn-primary" type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      </Transition>

    </header>

    <!-- PAGE -->
    <main>
      <RouterView />
    </main>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast" role="status">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- FOOTER -->
    <footer v-if="!isDashboard" id="contact" class="footer">
      <div class="container footer-grid">

        <div class="footer-brand">
          <RouterLink to="/" class="logo">
            <span class="logo-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span class="logo-name">Tech<span>Store</span></span>
          </RouterLink>
          <p>
            Your trusted destination for premium computers, laptops and
            technology — quality products at competitive prices.
          </p>
          <div class="socials">
            <a href="#" aria-label="Facebook">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="#" aria-label="X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.2l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L6.8 3.7H5L17.8 20z" /></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 0 0-2-2C18.5 4 12 4 12 4s-6.5 0-8.5.4a2.9 2.9 0 0 0-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 0 0 2 2C5.5 20 12 20 12 20s6.5 0 8.5-.4a2.9 2.9 0 0 0 2-2C23 15.8 23 12 23 12zm-13.5 3.5V8.5L16 12l-6.5 3.5z" /></svg>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Shop</h4>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/products">All Products</RouterLink>
          <RouterLink :to="{ path: '/products', query: { category: 'Laptops' } }">Laptops</RouterLink>
          <RouterLink :to="{ path: '/products', query: { category: 'Gaming PCs' } }">Gaming PCs</RouterLink>
        </div>

        <div class="footer-col">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Shipping & Delivery</a>
          <a href="#">Returns & Refunds</a>
          <a href="#">Warranty</a>
        </div>

        <div class="footer-col">
          <h4>Contact</h4>
          <ul class="footer-contact">
            <li>
              <svg class="c-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Phnom Penh, Cambodia
            </li>
            <li>
              <svg class="c-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></svg>
              +855 12 345 678
            </li>
            <li>
              <svg class="c-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              info@computerhub.com
            </li>
          </ul>
        </div>

      </div>

      <div class="footer-bottom">
        <div class="container">
          © 2026 TechStore. All rights reserved. Built with Vue 3 & Vite.
        </div>
      </div>
    </footer>

  </div>
</template>