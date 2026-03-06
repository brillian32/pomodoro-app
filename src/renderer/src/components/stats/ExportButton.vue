<template>
  <div class="export-row">
    <span class="export-label">{{ t('stats.exportData') }}</span>
    <div class="btns">
      <button class="export-btn" @click="doExport('json')" :disabled="loading">JSON</button>
      <button class="export-btn" @click="doExport('csv')" :disabled="loading">CSV</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToastStore } from '@renderer/stores/toastStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const loading = ref(false)
const toast = useToastStore()
const { t } = useI18nStore()

async function doExport(format) {
  loading.value = true
  try {
    const result = await window.electronAPI.exportStats(format)
    if (result === true) toast.success(t('stats.exportSuccess'))
    else if (result === null) toast.error(t('stats.exportFail'))
    // false = user canceled dialog, no toast needed
  } catch {
    toast.error(t('stats.exportFail'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.export-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.export-label { font-size: 13px; color: rgba(255,255,255,0.6); }
.btns { display: flex; gap: 8px; }
.export-btn {
  padding: 6px 16px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.8); font-size: 13px; cursor: pointer;
  transition: all 0.2s;
}
.export-btn:hover:not(:disabled) { background: rgba(167,139,250,0.2); border-color: var(--color-work); color: #fff; }
.export-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
