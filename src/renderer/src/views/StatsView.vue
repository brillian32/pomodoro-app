<template>
  <div class="stats-view">
    <div class="stats-header">
      <h2 class="page-title">{{ t('stats.title') }}</h2>
      <div class="period-tabs">
        <button
          v-for="p in periods" :key="p.value"
          class="period-btn"
          :class="{ active: store.period === p.value }"
          @click="store.fetchStats(p.value)"
        >{{ p.label }}</button>
      </div>
    </div>

    <div v-if="store.loading" class="loading">{{ t('stats.loading') }}</div>
    <template v-else-if="store.data">
      <template v-if="store.data.totalPomodoros > 0">
        <StatsCards :data="store.data" />
        <StatsChart :data="store.data" />
      </template>
      <div v-else class="empty-stats">
        <div class="empty-icon">🍅</div>
        <p class="empty-text">{{ t('stats.empty') }}</p>
      </div>
      <div class="glass rounded-2xl mt-3">
        <ExportButton />
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import StatsCards from '@renderer/components/stats/StatsCards.vue'
import StatsChart from '@renderer/components/stats/StatsChart.vue'
import ExportButton from '@renderer/components/stats/ExportButton.vue'
import { useStatsStore } from '@renderer/stores/statsStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const store = useStatsStore()
const { t } = useI18nStore()
const periods = computed(() => [
  { value: 'day', label: t('stats.today') },
  { value: 'week', label: t('stats.week') },
  { value: 'month', label: t('stats.month') }
])

onMounted(() => store.fetchStats('day'))
</script>

<style scoped>
.stats-view { padding: 24px; height: 100%; overflow-y: auto; }
.stats-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 700; color: #fff; }
.period-tabs { display: flex; gap: 4px; }
.period-btn {
  padding: 6px 16px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent; color: rgba(255,255,255,0.6);
  font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.period-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.period-btn.active { background: rgba(167,139,250,0.25); border-color: var(--color-work); color: #fff; }
.loading { color: rgba(255,255,255,0.4); padding: 40px; text-align: center; }
.mt-3 { margin-top: 12px; }
.empty-stats { text-align: center; padding: 48px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: rgba(255,255,255,0.45); }
</style>
