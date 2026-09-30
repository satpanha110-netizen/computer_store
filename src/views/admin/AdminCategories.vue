<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteCategory, getCategories } from '../../services/api'
import { useToast } from '../../composables/toast'
import { isRealImage } from '../../utils/format'

const router = useRouter()
const { show: showToast } = useToast()

const search = ref('')
const viewMode = ref('table')
const categories = ref([])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
  )
})

async function load() {
  try {
    categories.value = await getCategories()
  } catch (err) {
    showToast(err.message)
  }
}

onMounted(load)

function countFor(name) {
  const match = categories.value.find((c) => c.name === name)
  return match && Array.isArray(match.products) ? match.products.length : 0
}

function statusBadge(status) {
  return status === 'inactive' ? 'muted' : 'success'
}

async function remove(category) {
  const count = countFor(category.name)
  if (count > 0) {
    showToast('This category contains products. Please move or delete those products first.')
    return
  }
  if (!window.confirm('Are you sure you want to delete this category?')) return

  try {
    await deleteCategory(category.id)
    categories.value = categories.value.filter((c) => c.id !== category.id)
    showToast('Category deleted.')
  } catch (err) {
    showToast(err.message)
  }
}
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Categories</h1>
        <p>Organise your catalog into categories.</p>
      </div>
      <div class="dash-head-actions">
        <button class="btn btn-primary btn-sm" @click="router.push('/admin/categories/create')">
          <i class="bi bi-folder-plus"></i> Add Category
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
            placeholder="Search categories..."
          />
        </div>
        <div class="view-toggle" role="tablist" aria-label="Category view">
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'table' }"
            aria-label="Table view"
            @click="viewMode = 'table'"
          >
            <i class="bi bi-list-ul"></i>
            Table
          </button>
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'cards' }"
            aria-label="Card view"
            @click="viewMode = 'cards'"
          >
            <i class="bi bi-grid"></i>
            Cards
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div v-if="viewMode === 'table'" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Products</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="cell-empty">No categories found.</td>
            </tr>
            <tr v-for="category in filtered" :key="category.id">
              <td>
                <img
                  v-if="isRealImage(category.image)"
                  class="table-image table-image--img"
                  :src="category.image"
                  :alt="category.name"
                />
                <span v-else class="table-image">{{ category.image || '🏷️' }}</span>
              </td>
              <td>
                <strong class="cell-strong">{{ category.name }}</strong>
              </td>
              <td>
                <span class="cell-wrap">{{ category.description || '—' }}</span>
              </td>
              <td>
                <span class="count-pill">{{ countFor(category.name) }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge--${statusBadge(category.status)}`">
                  {{ category.status === 'inactive' ? 'Inactive' : 'Active' }}
                </span>
              </td>
              <td class="th-actions">
                <RouterLink :to="`/admin/categories/edit/${category.id}`" class="btn btn-outline btn-sm">
                  <i class="bi bi-pencil-square"></i> Edit
                </RouterLink>
                <button class="btn btn-danger-ghost btn-sm" @click="remove(category)">
                  <i class="bi bi-trash3"></i> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CARD VIEW -->
      <div v-else class="cat-admin-grid">
        <article v-for="category in filtered" :key="category.id" class="cat-admin-card">
          <div class="cat-admin-media">
            <img
              v-if="isRealImage(category.image)"
              :src="category.image"
              :alt="category.name"
            />
            <span v-else>{{ category.image || '🏷️' }}</span>
          </div>
          <div class="cat-admin-body">
            <div class="cat-admin-title-row">
              <h3 class="cat-admin-title">{{ category.name }}</h3>
              <span class="badge" :class="`badge--${statusBadge(category.status)}`">
                {{ category.status === 'inactive' ? 'Inactive' : 'Active' }}
              </span>
            </div>
            <p class="cat-admin-desc">{{ category.description || 'No description.' }}</p>
            <span class="cat-admin-count">
              <i class="bi bi-box-seam"></i>
              {{ countFor(category.name) }} Products
            </span>
          </div>
          <div class="cat-admin-actions">
            <RouterLink :to="`/admin/categories/edit/${category.id}`" class="btn btn-outline btn-sm">
              <i class="bi bi-pencil-square"></i> Edit
            </RouterLink>
            <button class="btn btn-danger-ghost btn-sm" @click="remove(category)">
              <i class="bi bi-trash3"></i> Delete
            </button>
          </div>
        </article>
        <div v-if="filtered.length === 0" class="cell-empty cat-admin-empty">No categories found.</div>
      </div>
    </section>
  </div>
</template>