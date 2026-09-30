<script setup>
import { ref, onMounted } from 'vue'
import { getProducts } from '../services/api'
import { normalizeProduct } from '../utils/product'
import { useCart } from '../composables/cart'
import { useToast } from '../composables/toast'
import { isRealImage } from '../utils/format'

const products = ref([])
const loading = ref(true)
const error = ref('')

const { addItem } = useCart()
const { show: showToast } = useToast()

const loadProducts = async () => {
  try {
    const list = await getProducts()
    products.value = list.map(normalizeProduct)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function addToCart(product) {
  addItem(product, 1)
  showToast(`${product.name} added to cart`)
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="container py-5">

    <h1 class="mb-4">Our Products</h1>

    <div v-if="loading">
      Loading products...
    </div>

    <div v-else-if="error">
      {{ error }}
    </div>

    <div v-else class="row g-4">

      <div
        v-for="product in products"
        :key="product.id"
        class="col-md-4"
      >
        <div class="card h-100">

          <img
            v-if="isRealImage(product.image)"
            :src="product.image"
            class="card-img-top"
            :alt="product.name"
          >

          <div
            v-else
            class="card-img-top card-img-top--emoji"
          >
            {{ product.image || '📦' }}
          </div>

          <div class="card-body">
            <h5 class="card-title">
              {{ product.name }}
            </h5>

            <p class="text-muted">
              {{ product.brand }}
            </p>

            <h4>
              ${{ product.price }}
            </h4>

            <p>
              Stock: {{ product.stock }}
            </p>

            <div class="product-actions">
              <RouterLink
                :to="`/product/${product.id}`"
                class="btn btn-outline"
              >
                View Details
              </RouterLink>

              <button
                class="btn btn-primary"
                :disabled="product.stock === 0"
                @click="addToCart(product)"
              >
                Add to Cart
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>

  </div>
</template>