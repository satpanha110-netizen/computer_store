<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'
import { isRealImage } from '../utils/format'

const { categories, catalogLoading, loadCatalog, productsInCategory } = useStore()

const router = useRouter()

const search = ref('')

const categoryLink = (id) => `/category/${id}`

function viewCategory(category) {
  router.push(`/category/${category.id}`)
}

const activeCategories = computed(() =>
  categories.value.filter((category) => category.status !== 'inactive')
)

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  return activeCategories.value
    .filter(
      (category) =>
        !q ||
        (category.name || '').toLowerCase().includes(q) ||
        (category.description || '').toLowerCase().includes(q)
    )
    .map((category) => ({
      ...category,
      productCount: productsInCategory(category.name)
    }))
})

const hasActiveCategories = computed(() => activeCategories.value.length > 0)

function clearSearch() {
  search.value = ''
}

onMounted(loadCatalog)
</script>

<template>
  <div>

    <!-- PAGE HEAD -->
    <div class="page-head">
      <div class="container">
        <h1>Categories</h1>
        <p>Explore our computer products by category.</p>
      </div>
    </div>

    <div class="container" style="padding-bottom: 72px;">

      <!-- SEARCH TOOLBAR -->
      <div class="toolbar">
        <div class="search-field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search categories..."
          />
        </div>
        <span class="count">
          {{ items.length }} categor{{ items.length === 1 ? 'y' : 'ies' }}
        </span>
      </div>

      <!-- CATEGORY CARDS -->
      <div v-if="catalogLoading" class="empty-state">
        <h3>Loading categories…</h3>
      </div>

      <div v-else-if="items.length > 0" class="cat-grid">
        <article
          v-for="category in items"
          :key="category.id"
          class="cat-card"
        >
          <RouterLink
            :to="categoryLink(category.id)"
            class="cat-media"
            :aria-label="`View ${category.name} products`"
          >
            <img
              v-if="isRealImage(category.image)"
              :src="category.image"
              :alt="category.name"
              loading="lazy"
            />
            <span v-else-if="category.image" class="cat-media-emoji">{{ category.image }}</span>
            <span v-else class="cat-media-placeholder">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            </span>
          </RouterLink>

          <div class="cat-body">
            <h3 class="cat-card-title">{{ category.name }}</h3>
            <p class="cat-card-tagline">{{ category.description || 'Browse products in this category.' }}</p>

            <div class="cat-card-foot">
              <span class="cat-card-count">
                {{ category.productCount }} Product{{ category.productCount === 1 ? '' : 's' }}
              </span>
            </div>

            <button
              type="button"
              class="btn btn-primary cat-view-btn"
              @click="viewCategory(category)"
            >
              View Category
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </article>
      </div>

      <!-- EMPTY STATE -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
        </div>
        <h3>{{ hasActiveCategories ? 'No categories found' : 'No categories yet' }}</h3>
        <p v-if="hasActiveCategories">We couldn't find any category matching your search. Try a different keyword.</p>
        <p v-else>Categories will appear here once the store is set up.</p>
        <button
          v-if="search && hasActiveCategories"
          class="btn btn-primary"
          @click="clearSearch"
        >
          Clear Search
        </button>
      </div>

    </div>

    <!-- CTA -->
    <div class="section">
      <div class="container">
        <div class="cta-banner">
          <div>
            <h2>Not sure what you need?</h2>
            <p>Talk to our experts and find the right setup for your work or play.</p>
          </div>
          <RouterLink to="/contact" class="btn btn-white btn-lg">Get Advice</RouterLink>
        </div>
      </div>
    </div>

  </div>
</template>