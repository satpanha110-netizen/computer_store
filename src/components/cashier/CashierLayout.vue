<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/toast'
import { initialsOf } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()
const { show: showToast } = useToast()

const sidebarOpen = ref(false)

const nav = [
  { to: '/cashier/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
  { to: '/cashier/pos', label: 'New Sale', icon: 'bi-cart3' },
  { to: '/cashier/orders', label: 'Orders', icon: 'bi-list-task' }
]

function isActive(to) {
  if (to === '/cashier/dashboard') {
    return route.path === '/cashier/dashboard'
  }
  return route.path === to
}

function handleLogout() {
  logout()
  showToast('You have been logged out.')
  router.push('/login')
}
</script>

<template>
  <div class="dash">

    <aside class="dash-sidebar" :class="{ 'dash-sidebar--open': sidebarOpen }">
      <RouterLink to="/" class="dash-logo">
        <span class="logo-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
        </span>
        <span class="logo-name">Tech<span>Store</span></span>
      </RouterLink>

      <nav class="dash-nav" aria-label="Cashier navigation">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="dash-nav-item"
          :class="{ 'dash-nav-item--active': isActive(item.to) }"
        >
          <span class="dash-nav-icon"><i class="bi" :class="item.icon"></i></span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="dash-side-foot">
        <RouterLink to="/profile" class="dash-nav-item">
          <span class="dash-nav-icon"><i class="bi bi-person"></i></span>
          <span>Profile</span>
        </RouterLink>
        <button class="dash-nav-item dash-nav-item--logout" @click="handleLogout">
          <span class="dash-nav-icon"><i class="bi bi-box-arrow-right"></i></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="dash-mask" @click="sidebarOpen = false"></div>

    <div class="dash-main">
      <header class="dash-topbar">
        <button class="dash-menu-btn" aria-label="Toggle sidebar" @click="sidebarOpen = !sidebarOpen">
          <i class="bi bi-list"></i>
        </button>

        <div class="dash-topbar-title">Cashier Panel</div>

        <div class="dash-topbar-right">
          <RouterLink to="/profile" class="dash-user" :title="user.name">
            <span class="avatar">{{ initialsOf(user.name) }}</span>
            <span class="dash-user-name">{{ user.name }}</span>
          </RouterLink>

          <button class="dash-logout-btn" title="Logout" aria-label="Logout" @click="handleLogout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      <main class="dash-content">
        <RouterView />
      </main>
    </div>

  </div>
</template>