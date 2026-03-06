<template>
  <div class="chart-wrap glass rounded-2xl">
    <div class="chart-title">{{ t('stats.chartTitle') }}</div>
    <VChart v-if="option" :option="option" autoresize style="height: 220px;" />
    <div v-else class="no-data">{{ t('stats.noData') }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const { t } = useI18nStore()
const props = defineProps({ data: { type: Object, default: null } })

const option = computed(() => {
  if (!props.data?.daily) return null
  const entries = Object.entries(props.data.daily).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return null
  const dates = entries.map(([d]) => d.slice(5))   // MM-DD
  const counts = entries.map(([, c]) => c)

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(30,27,75,0.9)', borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff' } },
    grid: { left: 40, right: 20, top: 20, bottom: 24, containLabel: false },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 }, splitLine: { show: false } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } } },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 32,
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#6366f1' }] },
        borderRadius: [6, 6, 0, 0]
      },
      emphasis: { itemStyle: { color: '#c4b5fd' } }
    }]
  }
})
</script>

<style scoped>
.chart-wrap { padding: 16px 20px; }
.chart-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
.no-data { height: 220px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 14px; }
</style>
