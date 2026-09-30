import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'techstore_cart_v1'

function readStored() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        Number.isFinite(item.id) &&
        typeof item.name === 'string' &&
        Number.isFinite(item.price) &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    )
  } catch {
    return []
  }
}

const items = ref(readStored())

watch(
  items,
  (value) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // storage unavailable — cart state stays in memory
    }
  },
  { deep: true }
)

function maxQuantity(product, quantity) {
  const stock = Number.isFinite(product.stock) && product.stock > 0 ? product.stock : 99
  return Math.min(Math.max(1, Math.floor(quantity)), stock)
}

function addItem(product, quantity = 1) {
  const qty = maxQuantity(product, quantity)
  const existing = items.value.find((item) => item.id === product.id)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, existing.stock)
  } else {
    items.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: Number.isFinite(product.stock) ? product.stock : 99,
      quantity: qty
    })
  }
}

function increaseItem(id) {
  const item = items.value.find((i) => i.id === id)
  if (item && item.quantity < item.stock) item.quantity++
}

function decreaseItem(id) {
  const item = items.value.find((i) => i.id === id)
  if (!item) return
  if (item.quantity > 1) {
    item.quantity--
  } else {
    removeItem(id)
  }
}

function setQuantity(id, quantity) {
  const item = items.value.find((i) => i.id === id)
  if (!item) return
  const qty = Math.min(Math.max(1, Math.floor(quantity)), item.stock)
  item.quantity = qty
}

function removeItem(id) {
  items.value = items.value.filter((item) => item.id !== id)
}

function clear() {
  items.value = []
}

const count = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity, 0)
)

const total = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

export function useCart() {
  return {
    items,
    count,
    total,
    addItem,
    increaseItem,
    decreaseItem,
    setQuantity,
    removeItem,
    clear
  }
}