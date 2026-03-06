import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatsStore = defineStore('stats', () => {
  const period = ref('day')
  const data = ref(null)
  const loading = ref(false)

  async function fetchStats(p) {
    if (p) period.value = p
    loading.value = true
    try {
      data.value = await window.electronAPI.getStats(period.value)
    } finally {
      loading.value = false
    }
  }

  async function exportData(format) {
    return window.electronAPI.exportStats(format)
  }

  return { period, data, loading, fetchStats, exportData }
})
