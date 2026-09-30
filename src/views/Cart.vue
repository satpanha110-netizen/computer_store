<script setup>
import { ref } from 'vue'
import { useCart } from '../composables/cart'
import { useStore } from '../composables/useStore'
import { useToast } from '../composables/toast'
import { isRealImage } from '../utils/format'

const { items, total, increaseItem, decreaseItem, removeItem, clear } = useCart()
const { addOrder } = useStore()
const { show: showToast } = useToast()

const placing = ref(false)

function formatMoney(value) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  })
}

/**
 * Place the order through POST /api/orders. The controller prices each line
 * from the products table, records the order items and takes the stock off in
 * one transaction — so the cart is only emptied once the database has the
 * order. If the request fails the cart is left untouched and the reason is
 * shown, instead of losing the items to a sale that was never recorded.
 */
async function checkout() {
  if (items.value.length === 0 || placing.value) return

  placing.value = true

  try {
    const order = await addOrder({
      items: items.value.map((item) => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      payment_method: 'Cash on delivery',
      shipping_address: ''
    })

    clear()
    showToast(`Order ${order.id} placed! Thank you for shopping with TechStore.`)
  } catch (err) {
    showToast(err.message)
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <div>

    <div class="page-head">
      <div class="container">
        <h1>Shopping Cart</h1>
        <p>
          {{ items.length > 0
            ? `${items.length} product${items.length === 1 ? '' : 's'} in your cart`
            : 'Your cart is empty' }}
        </p>
      </div>
    </div>

    <!-- CART WITH ITEMS -->
    <div v-if="items.length > 0" class="section">
      <div class="container cart-layout">

        <div class="cart-items">
          <div v-for="item in items" :key="item.id" class="cart-item">

            <RouterLink :to="`/product/${item.id}`" class="cart-item-media">
              <img
                v-if="isRealImage(item.image)"
                class="cart-item-img"
                :src="item.image"
                :alt="item.name"
              />
              <span v-else>{{ item.image }}</span>
            </RouterLink>

            <div class="cart-item-info">
              <RouterLink :to="`/product/${item.id}`" class="cart-item-name">
                {{ item.name }}
              </RouterLink>
              <span class="cart-item-price">{{ formatMoney(item.price) }}</span>
              <span v-if="item.stock <= 10" class="cart-item-stock">
                Only {{ item.stock }} left in stock
              </span>
            </div>

            <div class="qty">
              <button
                type="button"
                aria-label="Decrease quantity"
                @click="decreaseItem(item.id)"
              >−</button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                @click="increaseItem(item.id)"
              >+</button>
            </div>

            <div class="cart-item-subtotal">
              <strong>{{ formatMoney(item.price * item.quantity) }}</strong>
              <button
                type="button"
                class="cart-remove"
                @click="removeItem(item.id)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                Remove
              </button>
            </div>

          </div>
        </div>

        <aside class="cart-summary">
          <h3>Order Summary</h3>

          <div class="summary-row">
            <span>Subtotal</span>
            <strong>{{ formatMoney(total) }}</strong>
          </div>

          <div class="summary-row">
            <span>Shipping</span>
            <strong class="summary-free">Free</strong>
          </div>

          <div class="summary-row summary-total">
            <span>Total</span>
            <strong>{{ formatMoney(total) }}</strong>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-lg btn-block"
            :disabled="placing"
            @click="checkout"
          >
            {{ placing ? 'Placing order…' : 'Checkout' }}
          </button>

          <RouterLink
            to="/products"
            class="btn btn-outline btn-lg btn-block cart-continue"
          >
            Continue Shopping
          </RouterLink>
        </aside>

      </div>
    </div>

    <!-- EMPTY CART -->
    <div v-else class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          </div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet. Browse our products and find your next setup.</p>
          <RouterLink to="/products" class="btn btn-primary">
            Continue Shopping
          </RouterLink>
        </div>
      </div>
    </div>

  </div>
</template>