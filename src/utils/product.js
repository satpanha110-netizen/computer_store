import { API_URL } from '../services/api'
import { isRealImage } from './format'

const STORAGE_BASE = `${API_URL.replace(/\/api\/?$/, '')}/storage/`

export function resolveImageUrl(value) {
  if (typeof value !== 'string' || value === '') return ''
  if (isRealImage(value)) return value
  if (value.startsWith('/')) return value
  if (value.includes('/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(value)) {
    return `${STORAGE_BASE}${value}`
  }
  return value
}

/* The Laravel API returns a nested `category` object, snake_case `old_price`,
   a storage path for uploaded images, and spec fields as separate columns.
   Flatten all of it into the shape the existing templates already expect. */
export function normalizeProduct(product) {
  if (!product) return null

  const specs = {
    Brand: product.brand,
    CPU: product.cpu,
    RAM: product.ram,
    Storage: product.storage,
    Display: product.display,
    GPU: product.gpu,
    Warranty: product.warranty
  }

  const specifications = Object.fromEntries(
    Object.entries(specs).filter(([, value]) => value !== null && value !== undefined && value !== '')
  )

  return {
    ...product,
    category: product.category?.name || product.category_name || '',
    /* price/old_price come from MySQL DECIMAL columns, so they arrive as
       strings ("1099.00"). Numbers keep the arithmetic in the templates
       (cart totals, discount percentages) exact. */
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || product.oldPrice || 0),
    stock: Number(product.stock || 0),
    reviews: Number(product.reviews || 0),
    image: resolveImageUrl(product.image),
    rating: Number(product.rating || 0),
    specifications
  }
}
