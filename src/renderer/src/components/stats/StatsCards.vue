<template>
  <div class="stats-cards">
    <div class="stat-card glass" v-for="card in cards" :key="card.label">
      <div class="stat-icon">{{ card.icon }}</div>
      <div class="stat-value">{{ card.value }}</div>
      <div class="stat-label">{{ card.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const { t } = useI18nStore()
const props = defineProps({ data: { type: Object, default: null } })

const cards = computed(() => {
  const d = props.data
  if (!d) return []
  return [
    { icon: '🍅', value: d.totalPomodoros, label: t('stats.pomodoros') },
    { icon: '⏱', value: `${Math.floor(d.totalMinutes / 60)}h ${d.totalMinutes % 60}m`, label: t('stats.duration') },
    { icon: '✅', value: `${d.completedTasks}/${d.totalTasks}`, label: t('stats.tasksCompleted') },
    { icon: '📈', value: `${d.completionRate}%`, label: t('stats.completionRate') },
    { icon: '🔥', value: d.streak ?? 0, label: t('stats.streak') }
  ]
})
</script>

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 700px) { .stats-cards { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .stats-cards { grid-template-columns: repeat(2, 1fr); } }

.stat-card {
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-icon { font-size: 24px; margin-bottom: 8px; }
.stat-value { font-size: 22px; font-weight: 700; color: #fff; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; }
</style>
