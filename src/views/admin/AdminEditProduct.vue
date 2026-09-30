<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCategories, getProduct, toFormData, updateProduct } from '../../services/api'
import { resolveImageUrl } from '../../utils/product'
import { useToast } from '../../composables/toast'
import { isRealImage } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const { show: showToast } = useToast()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

const fileInput = ref(null)
const imagePreview = ref('')
const imageError = ref('')
const dragging = ref(false)
const selectedFile = ref(null)
const saving = ref(false)
const formError = ref('')
const categories = ref([])
const product = ref(null)
const loading = ref(true)

const form = reactive({
  name: '',
  category_id: '',
  price: '',
  old_price: '',
  stock: '',
  status: 'active',
  description: '',
  brand: '',
  cpu: '',
  ram: '',
  storage: '',
  display: '',
  gpu: '',
  warranty: ''
})

const errors = reactive({ name: '', category_id: '', price: '', stock: '' })
const notFound = computed(() => !loading.value && !product.value)

function fillForm(record) {
  Object.assign(form, {
    name: record.name || '',
    category_id: record.category_id ?? '',
    price: record.price ?? '',
    old_price: record.old_price ?? '',
    stock: record.stock ?? '',
    status: record.status || 'active',
    description: record.description || '',
    brand: record.brand || '',
    cpu: record.cpu || '',
    ram: record.ram || '',
    storage: record.storage || '',
    display: record.display || '',
    gpu: record.gpu || '',
    warranty: record.warranty || ''
  })
  imagePreview.value = resolveImageUrl(record.image) || ''
  imageError.value = ''
  selectedFile.value = null
  clearErrors()
  formError.value = ''
}

function clearErrors() {
  errors.name = ''
  errors.category_id = ''
  errors.price = ''
  errors.stock = ''
}

async function load(id) {
  loading.value = true
  try {
    product.value = await getProduct(id)
    fillForm(product.value)
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
}

getCategories()
  .then((list) => {
    categories.value = list
  })
  .catch(() => {
    categories.value = []
  })

watch(
  () => route.params.id,
  (id) => load(id),
  { immediate: true }
)

function validateImage(file) {
  if (!file) return 'Only JPG, PNG, and WEBP images are allowed.'
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, and WEBP images are allowed.'
  if (file.size > MAX_SIZE) return 'Image size must be less than 2MB.'
  return ''
}

function readFile(file) {
  imageError.value = ''
  if (!file) return

  const error = validateImage(file)
  if (error) {
    imageError.value = error
    selectedFile.value = null
    return
  }

  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    imagePreview.value = String(reader.result)
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
}

function onDrop(event) {
  dragging.value = false
  const file = event.dataTransfer && event.dataTransfer.files[0]
  readFile(file)
}

async function save() {
  formError.value = ''
  clearErrors()

  errors.name = form.name.trim() ? '' : 'Product name is required.'
  errors.category_id = form.category_id !== '' ? '' : 'Category is required.'
  errors.price = form.price !== '' && Number(form.price) >= 0 ? '' : 'Enter a valid price (0 or more).'
  errors.stock = Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 ? '' : 'Enter a valid stock quantity.'

  if (Object.values(errors).some((m) => m)) return

  saving.value = true
  try {
    const payload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      price: Number(form.price),
      old_price: Number(form.old_price) || 0,
      stock: Number(form.stock),
      status: form.status,
      description: form.description.trim(),
      brand: form.brand.trim(),
      cpu: form.cpu.trim(),
      ram: form.ram.trim(),
      storage: form.storage.trim(),
      display: form.display.trim(),
      gpu: form.gpu.trim(),
      warranty: form.warranty.trim()
    }

    /*
     * Only send `image` when a new file was picked. Leaving it out keeps the
     * picture that is already stored, so the existing path is never overwritten
     * with a preview URL or a data: string.
     */
    if (selectedFile.value) {
      payload.image = selectedFile.value
    }

    await updateProduct(route.params.id, toFormData(payload))
    showToast('Product updated successfully!')
    router.push('/admin/products')
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/admin/products')
}
</script>

<template>
  <div>
    <template v-if="!notFound">
      <div class="dash-head">
        <div>
          <h1>Edit Product</h1>
          <p>Update this product's information.</p>
        </div>
        <div class="dash-head-actions">
          <RouterLink to="/admin/products" class="btn btn-outline btn-sm">
            <i class="bi bi-arrow-left"></i> Back to Products
          </RouterLink>
        </div>
      </div>

      <section class="data-card admin-form-card">
        <div class="admin-form-body">
          <div v-if="formError" class="auth-alert auth-alert--danger">{{ formError }}</div>
          <div v-else-if="loading" class="auth-alert">Loading product...</div>

          <div class="form-group">
            <label class="form-label" for="prod-name">Product Name</label>
            <input
              id="prod-name"
              v-model="form.name"
              class="form-control"
              :class="{ 'form-control--error': errors.name }"
              placeholder="e.g. MacBook Air M4"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-cat">Category</label>
            <select
              id="prod-cat"
              v-model="form.category_id"
              class="form-control"
              :class="{ 'form-control--error': errors.category_id }"
            >
              <option value="" disabled>Select category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <span v-if="errors.category_id" class="field-error">{{ errors.category_id }}</span>
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
                <small class="image-upload-hint">JPG, PNG, WEBP · Max 2MB</small>
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
              {{ imageError || 'Leave empty to keep the current image. Or drag & drop an image onto this area.' }}
            </p>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prod-price">Price ($)</label>
              <input
                id="prod-price"
                v-model.number="form.price"
                class="form-control"
                :class="{ 'form-control--error': errors.price }"
                type="number"
                min="0"
                step="0.01"
                placeholder="1099"
              />
              <span v-if="errors.price" class="field-error">{{ errors.price }}</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="prod-old-price">Original Price ($)</label>
              <input
                id="prod-old-price"
                v-model.number="form.old_price"
                class="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="1299"
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prod-stock">Stock</label>
              <input
                id="prod-stock"
                v-model.number="form.stock"
                class="form-control"
                :class="{ 'form-control--error': errors.stock }"
                type="number"
                min="0"
                step="1"
                placeholder="15"
              />
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
            <textarea
              id="prod-desc"
              v-model="form.description"
              class="form-control form-textarea"
              rows="3"
              placeholder="Short product description"
            ></textarea>
          </div>

          <div class="data-head">
            <h3 class="data-head-title">
              <i class="bi bi-list-check"></i>
              Specifications
            </h3>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prod-brand">Brand</label>
              <input id="prod-brand" v-model="form.brand" class="form-control" placeholder="e.g. Apple" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prod-cpu">CPU</label>
              <input id="prod-cpu" v-model="form.cpu" class="form-control" placeholder="e.g. Apple M4" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prod-ram">RAM</label>
              <input id="prod-ram" v-model="form.ram" class="form-control" placeholder="e.g. 16GB" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prod-storage">Storage</label>
              <input id="prod-storage" v-model="form.storage" class="form-control" placeholder="e.g. 512GB SSD" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="prod-display">Display</label>
              <input id="prod-display" v-model="form.display" class="form-control" placeholder="e.g. 14.2 inch" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prod-gpu">GPU</label>
              <input id="prod-gpu" v-model="form.gpu" class="form-control" placeholder="e.g. 10-core GPU" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="prod-warranty">Warranty</label>
            <input id="prod-warranty" v-model="form.warranty" class="form-control" placeholder="e.g. 1 Year" />
          </div>
        </div>

        <div class="admin-form-actions">
          <button type="button" class="btn btn-outline" @click="cancel">
            <i class="bi bi-x-circle"></i> Cancel
          </button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
            <i class="bi" :class="saving ? 'bi-arrow-repeat' : 'bi-check2-circle'"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </section>
    </template>

    <div v-else class="dash-head">
      <div>
        <h1>Product Not Found</h1>
        <p>The product you're trying to edit does not exist.</p>
      </div>
      <RouterLink to="/admin/products" class="btn btn-primary btn-sm">
        <i class="bi bi-arrow-left"></i> Back to Products
      </RouterLink>
    </div>
  </div>
</template>
