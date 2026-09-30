import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

import Home from '../views/Home.vue'
import Products from '../views/Products.vue'
import ProductDetail from '../views/ProductDetail.vue'
import CategoryDetail from '../views/CategoryDetail.vue'
import Categories from '../views/Categories.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import Cart from '../views/Cart.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'

import AdminLayout from '../components/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminCategories from '../views/admin/AdminCategories.vue'
import AdminAddCategory from '../views/admin/AdminAddCategory.vue'
import AdminEditCategory from '../views/admin/AdminEditCategory.vue'
import AdminEditProduct from '../views/admin/AdminEditProduct.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import AdminCustomers from '../views/admin/AdminCustomers.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'
import AdminReports from '../views/admin/AdminReports.vue'
import AdminSettings from '../views/admin/AdminSettings.vue'

import CashierLayout from '../components/cashier/CashierLayout.vue'
import CashierDashboard from '../views/cashier/CashierDashboard.vue'
import CashierPOS from '../views/cashier/CashierPOS.vue'
import CashierOrders from '../views/cashier/CashierOrders.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/categories',
    name: 'Categories',
    component: Categories
  },
  {
    path: '/category/:id',
    name: 'CategoryDetail',
    component: CategoryDetail
  },
  {
    path: '/products',
    name: 'Products',
    component: Products
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: AdminDashboard },
      { path: 'products', name: 'AdminProducts', component: AdminProducts },
      { path: 'products/edit/:id', name: 'AdminEditProduct', component: AdminEditProduct },
      { path: 'categories', name: 'AdminCategories', component: AdminCategories },
      { path: 'categories/create', name: 'AdminAddCategory', component: AdminAddCategory },
      { path: 'categories/edit/:id', name: 'AdminEditCategory', component: AdminEditCategory },
      { path: 'orders', name: 'AdminOrders', component: AdminOrders },
      { path: 'customers', name: 'AdminCustomers', component: AdminCustomers },
      { path: 'users', name: 'AdminUsers', component: AdminUsers },
      { path: 'reports', name: 'AdminReports', component: AdminReports },
      { path: 'settings', name: 'AdminSettings', component: AdminSettings }
    ]
  },
  {
    path: '/cashier',
    component: CashierLayout,
    meta: { requiresAuth: true, roles: ['admin', 'cashier'] },
    children: [
      { path: '', redirect: '/cashier/dashboard' },
      { path: 'dashboard', name: 'CashierDashboard', component: CashierDashboard },
      { path: 'pos', name: 'CashierPOS', component: CashierPOS },
      { path: 'orders', name: 'CashierOrders', component: CashierOrders }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

/* The cached session is what keeps a reload from asking for a login again, but
   it can be stale: an admin may have suspended the account or changed its role
   in another browser. Reconciling it with the database once per page load —
   before the first guarded route is checked — makes that change stick. */
let sessionChecked = false

router.beforeEach(async (to) => {
  const { isLoggedIn, refreshUser, user } = useAuth()

  if (!sessionChecked && isLoggedIn.value) {
    sessionChecked = true
    await refreshUser()
  }

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return {
      path: '/login',
      query: { redirect: to.fullPath, message: 'Please login to continue.' }
    }
  }

  if (to.meta.roles && isLoggedIn.value) {
    const role = user.value?.role || 'customer'
    if (!to.meta.roles.includes(role)) {
      if (role === 'admin') return { path: '/admin/dashboard' }
      if (role === 'cashier') return { path: '/cashier/dashboard' }
      return { path: '/' }
    }
  }

  return true
})

export default router