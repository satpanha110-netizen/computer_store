<script setup>
import { onMounted, ref } from 'vue'
import { useToast } from '../../composables/toast'

const { show: showToast } = useToast()

const SETTINGS_KEY = 'techstore_settings_v1'

const settings = ref({
  storeName: 'TechStore',
  lowStockAlert: true,
  lowStockThreshold: 5
})

function load() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (raw) settings.value = { ...settings.value, ...JSON.parse(raw) }
  } catch {
    // keep defaults
  }
}

function save() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  } catch {
    // storage unavailable
  }
  showToast('Settings saved!')
}

onMounted(load)
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <h1>Settings</h1>
        <p>Store configuration and preferences.</p>
      </div>
    </div>

    <section class="data-card settings-card">
      <div class="data-head">
        <h3 class="data-head-title">
          <i class="bi bi-sliders"></i>
          General
        </h3>
      </div>

      <div class="settings-row">
        <label class="form-label settings-row-label" for="set-name">
          <i class="bi bi-shop"></i>
          Store Name
        </label>
        <input id="set-name" v-model="settings.storeName" class="form-control settings-input" placeholder="TechStore" />
      </div>

      <div class="settings-row settings-row--switch">
        <div>
          <div class="settings-row-switch-text">
            <i class="bi bi-exclamation-triangle"></i>
            <strong class="cell-strong">Low Stock Alerts</strong>
          </div>
          <small class="cell-sub">Warn when a product falls below the threshold.</small>
        </div>
        <label class="toggle">
          <input v-model="settings.lowStockAlert" type="checkbox" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <div class="settings-row" v-if="settings.lowStockAlert">
        <label class="form-label settings-row-label" for="set-threshold">
          <i class="bi bi-speedometer2"></i>
          Low Stock Threshold
        </label>
        <input
          id="set-threshold"
          v-model.number="settings.lowStockThreshold"
          class="form-control settings-input"
          type="number"
          min="1"
        />
      </div>

      <div class="settings-save">
        <button class="btn btn-primary" @click="save">
          <i class="bi bi-check2-circle"></i> Save Changes
        </button>
      </div>
    </section>
  </div>
</template>