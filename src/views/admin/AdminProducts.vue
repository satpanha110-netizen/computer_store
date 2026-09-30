<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct
} from '../../services/api'
import { normalizeProduct } from '../../utils/product'
import { useToast } from '../../composables/toast'
import { formatMoney, isRealImage } from '../../utils/format'

const router = useRouter()
const { show: showToast } = useToast()

const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const products = ref([])
const categories = ref([])

const fileInput = ref(null)
const imagePreview = ref('')
const imageError = ref('')
const dragging = ref(false)
const selectedFile = ref(null)

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const blank = { name: '', category: '', price: '', discount: '', stock: '', image: '📦', description: '', status: 'active' }
const form = reactive({ ...blank })
const errors = reactive({ name: '', category: '', price: '', stock: '' })

async function load() {
  try {
    const [list, cats] = await Promise.all([getProducts(), getCategories()])
    products.value = list.map(normalizeProduct)
    categories.value = cats
  } catch (err) {
    showToast(err.message)
  }
}

onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
  )
})

function statusBadge(status) {
  return status === 'inactive' ? 'muted' : 'success'
}

function clearErrors() {
  errors.name = ''
  errors.category = ''
  errors.price = ''
  errors.stock = ''
}

function openAdd() {
  editingId.value = null
  Object.assign(form, blank)
  clearErrors()
  formError.value = ''
  imagePreview.value = ''
  imageError.value = ''
  selectedFile.value = null
  modalOpen.value = true
}

function openEdit(product) {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    category: product.category,
    price: product.price,
    discount: product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : '',
    stock: product.stock,
    image: product.image || '📦',
    description: product.description || '',
    status: product.status || 'active'
  })
  imagePreview.value = product.image || '📦'
  imageError.value = ''
  selectedFile.value = null
  clearErrors()
  formError.value = ''
  modalOpen.value = true
}

function goEdit(product) {
  router.push(`/admin/products/edit/${product.id}`)
}

function validateImage(file) {
  if (!file) return 'Only JPG, PNG, and WEBP images are allowed.'
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, and WEBP images are allowed.'
  if (file.size > MAX_SIZE) return 'Image size must be less than 5MB.'
  return ''
}

function readFile(file) {
  imageError.value = ''
  if (!file) return

  const error = validateImage(file)
  if (error) {
    imageError.value = error
    return
  }

  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    imagePreview.value = String(reader.result)
    form.image = imagePreview.value
  }
  reader.onerror = () => {
    imageError.value = 'Could not read the image file. Please try again.'
  }
  reader.readAsDataURL(file)
}

function pickImage() {
  imageError.value = ''
  fileInput.value.value = ''
  fileInput.value.click()
}

function onImageChange(event) {
  const file = event.target.files && event.target.files[0]
  readFile(file)
  event.target.value = ''
}

function removeImage() {
  imagePreview.value = ''
  imageError.value = ''
  selectedFile.value = null
  form.image = '📦'
}

function onDrop(event) {
  dragging.value = false
  const file = event.dataTransfer && event.dataTransfer.files[0]
  readFile(file)
}

async function save() {
  formError.value = ''
  errors.name = form.name.trim() ? '' : 'Product name is required.'
  errors.category = form.category ? '' : 'Category is required.'
  errors.price = form.price !== '' && Number(form.price) >= 0
    ? ''
    : 'Enter a valid price (0 or more).'
  errors.stock = Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0
    ? ''
    : 'Enter a valid stock quantity.'

  if (Object.values(errors).some((m) => m)) return

  const price = Number(form.price)
  const discount = Number(form.discount) || 0
  const oldPrice = discount > 0 ? Math.round(price * (1 + discount / 100)) : 0

  const match = categories.value.find((c) => c.name === form.category)
  if (!match) {
    formError.value = 'The selected category no longer exists.'
    return
  }

  const payload = {
    category_id: match.id,
    name: form.name.trim(),
    price,
    old_price: oldPrice,
    stock: Number(form.stock),
    status: form.status,
    description: form.description.trim()
  }

  if (selectedFile.value) {
    payload.image = selectedFile.value
  } else if (editingId.value === null) {
    payload.image = '📦'
  }

  saving.value = true
  try {
    if (editingId.value === null) {
      await createProduct(payload)
      showToast('Product added successfully!')
    } else {
      await updateProduct(editingId.value, payload)
      showToast('Product updated successfully!')
    }
    modalOpen.value = false
    await load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function remove(product) {
  if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
  try {
    await deleteProduct(product.id)
    products.value = products.value.filter((p) => p.id !== product.id)
    showToast('Product deleted.')
  } catch (err) {
    showToast(err.message)
  }
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Products</h1>
        <p>{{ products.length }} products in your catalog.</p>
      </div>
      <div class="dash-head-actions">
        <button class="btn btn-primary btn-sm" @click="openAdd">
          <i class="bi bi-plus-circle"></i> Add Product
        </button>
      </div>
    </div>

    <section class="data-card">
      <div class="toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            v-model="search"
            class="table-search"
            type="search"
            placeholder="Search products..."
          />
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="7" class="cell-empty">No products found.</td>
            </tr>
            <tr v-for="product in filtered" :key="product.id">
              <td>
                <img
                  v-if="isRealImage(product.image)"
                  class="table-image table-image--img"
                  :src="product.image"
                  :alt="product.name"
                />
                <span v-else class="table-image">{{ product.image || '📦' }}</span>
              </td>
              <td>
                <strong class="cell-strong">{{ product.name }}</strong>
                <small class="cell-sub">{{ product.oldPrice ? `Save ${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%` : 'No discount' }}</small>
              </td>
              <td>{{ product.category }}</td>
              <td class="cell-strong">{{ formatMoney(product.price) }}</td>
              <td>
                <span :class="{ 'stock-low': Number(product.stock) <= 5 }">
                  {{ product.stock }}
                </span>
                <i
                  v-if="Number(product.stock) <= 5"
                  class="bi bi-exclamation-triangle stock-warn"
                  title="Low stock"
                ></i>
              </td>
              <td>
                <span class="badge" :class="`badge--${statusBadge(product.status)}`">
                  {{ product.status === 'inactive' ? 'Inactive' : 'Active' }}
                </span>
              </td>
              <td class="th-actions">
                <button class="btn btn-outline btn-sm" @click="goEdit(product)">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button class="btn btn-danger-ghost btn-sm" @click="remove(product)">
                  <i class="bi bi-trash3"></i> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Add / Edit modal -->
    <Transition name="modal">
      <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
        <div class="modal">
          <div class="modal-head">
            <h3 class="data-head-title">
              <i class="bi" :class="editingId === null ? 'bi-box-arrow-in-up' : 'bi-pencil-square'"></i>
              {{ editingId === null ? 'Add Product' : 'Edit Product' }}
            </h3>
            <button class="modal-close" aria-label="Close" @click="modalOpen = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="formError" class="auth-alert auth-alert--danger">{{ formError }}</div>

            <div class="form-group">
              <label class="form-label" for="prod-name">Product Name</label>
              <input id="prod-name" v-model="form.name" class="form-control" :class="{ 'form-control--error': errors.name }" placeholder="e.g. MacBook Air M4" />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="prod-cat">Category</label>
              <select id="prod-cat" v-model="form.category" class="form-control" :class="{ 'form-control--error': errors.category }">
                <option value="" disabled>Select category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
              </select>
              <span v-if="errors.category" class="field-error">{{ errors.category }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Product Image</label>
              <div
                class="image-upload"
                :class="{ 'image-upload--over': dragging, 'image-upload--has': Boolean(imagePreview) }"
                @dragover.prevent.stop="dragging = true"
                @dragleave="dragging = false"
                @drop.prevent.stop="onDrop"
              >
                <template v-if="imagePreview">
                  <img
                    v-if="isRealImage(imagePreview)"
                    class="image-upload-preview"
                    :src="imagePreview"
                    alt="Product image preview"
                  />
                  <span v-else class="image-upload-emoji-preview">{{ imagePreview }}</span>
                  <div class="image-upload-actions">
                    <button type="button" class="btn btn-outline btn-sm" @click="pickImage">
                      <i class="bi bi-arrow-repeat"></i> Change Image
                    </button>
                    <button type="button" class="btn btn-danger-ghost btn-sm" @click="removeImage">
                      <i class="bi bi-trash3"></i> Remove Image
                    </button>
                  </div>
                </template>

                <template v-else>
                  <span class="image-upload-icon"><i class="bi bi-cloud-arrow-up"></i></span>
                  <strong class="image-upload-title">Upload Product Image</strong>
                  <small class="image-upload-hint">JPG, PNG, WEBP · Max 5MB</small>
                  <button type="button" class="btn btn-outline btn-sm" @click="pickImage">
                    <i class="bi bi-image"></i> Choose Image
                  </button>
                </template>

                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="image-upload-input"
                  @change="onImageChange"
                  @click.stop
                />
              </div>
              <p class="image-upload-tip" :class="{ 'image-upload-tip--error': imageError }">
                {{ imageError || 'Or drag & drop an image onto this area.' }}
              </p>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="prod-price">Price ($)</label>
                <input id="prod-price" v-model.number="form.price" class="form-control" :class="{ 'form-control--error': errors.price }" type="number" min="0" step="0.01" placeholder="1099" />
                <span v-if="errors.price" class="field-error">{{ errors.price }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="prod-discount">Discount (%)</label>
                <input id="prod-discount" v-model.number="form.discount" class="form-control" type="number" min="0" max="90" placeholder="10" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="prod-stock">Stock</label>
                <input id="prod-stock" v-model.number="form.stock" class="form-control" :class="{ 'form-control--error': errors.stock }" type="number" min="0" step="1" placeholder="15" />
                <span v-if="errors.stock" class="field-error">{{ errors.stock }}</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="prod-status">Status</label>
                <select id="prod-status" v-model="form.status" class="form-control">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="prod-desc">Description</label>
              <textarea id="prod-desc" v-model="form.description" class="form-control form-textarea" rows="3" placeholder="Short product description"></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="modalOpen = false">
              <i class="bi bi-x-circle"></i> Cancel
            </button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
              <i class="bi" :class="saving ? 'bi-arrow-repeat' : 'bi-check2-circle'"></i>
              {{ saving ? 'Saving...' : editingId === null ? 'Add Product' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>