<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCategory, getCategories } from '../../services/api'
import { useToast } from '../../composables/toast'
import { isRealImage } from '../../utils/format'

const router = useRouter()
const { show: showToast } = useToast()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const fileInput = ref(null)
const imagePreview = ref('')
const imageError = ref('')
const dragging = ref(false)
const saving = ref(false)
const existing = ref([])

const form = reactive({ name: '', description: '', image: '', status: 'active' })
const errors = reactive({ name: '' })

onMounted(async () => {
  try {
    existing.value = await getCategories()
  } catch {
    existing.value = []
  }
})

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
  form.image = ''
}

function onDrop(event) {
  dragging.value = false
  const file = event.dataTransfer && event.dataTransfer.files[0]
  readFile(file)
}

function resolveImage() {
  const value = imagePreview.value
  if (!value) return '🏷️'
  if (isRealImage(value)) {
    imageError.value = 'Image uploads are not supported by the API yet, so the icon will be saved instead.'
    return '🏷️'
  }
  return value
}

async function save() {
  errors.name = form.name.trim() ? '' : 'Category name is required.'
  if (errors.name) return

  const duplicate = existing.value.some(
    (c) => (c.name || '').toLowerCase() === form.name.trim().toLowerCase()
  )
  if (duplicate) {
    errors.name = 'A category with this name already exists.'
    return
  }

  saving.value = true
  try {
    await createCategory({
      name: form.name.trim(),
      description: form.description.trim(),
      image: resolveImage(),
      status: form.status
    })
    showToast('Category added successfully!')
    router.push('/admin/categories')
  } catch (err) {
    errors.name = err.message
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/admin/categories')
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Add Category</h1>
        <p>Create a new category for your catalog.</p>
      </div>
      <div class="dash-head-actions">
        <RouterLink to="/admin/categories" class="btn btn-outline btn-sm">
          <i class="bi bi-arrow-left"></i> Back to Categories
        </RouterLink>
      </div>
    </div>

    <section class="data-card admin-form-card">
      <div class="admin-form-body">
        <div class="form-group">
          <label class="form-label" for="cat-name">Category Name</label>
          <input
            id="cat-name"
            v-model="form.name"
            class="form-control"
            :class="{ 'form-control--error': errors.name }"
            placeholder="e.g. Laptops"
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="cat-desc">Description</label>
          <textarea
            id="cat-desc"
            v-model="form.description"
            class="form-control form-textarea"
            rows="3"
            placeholder="Short description of this category"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Category Image</label>
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
                alt="Category image preview"
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
                <strong class="image-upload-title">Upload Category Image</strong>
                <small class="image-upload-hint">JPG / PNG / WEBP · Max 5MB</small>
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

        <div class="form-group">
          <label class="form-label" for="cat-status">Status</label>
          <select id="cat-status" v-model="form.status" class="form-control">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="admin-form-actions">
        <button type="button" class="btn btn-outline" @click="cancel">
          <i class="bi bi-x-circle"></i> Cancel
        </button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
          <i class="bi" :class="saving ? 'bi-arrow-repeat' : 'bi-folder-plus'"></i>
          {{ saving ? 'Saving...' : 'Add Category' }}
        </button>
      </div>
    </section>
  </div>
</template>