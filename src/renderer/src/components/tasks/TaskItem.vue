<template>
  <div
    class="task-item glass"
    :class="{ 'task-done': task.completed, 'task-active': isActive && !selecting, 'task-selected': selecting && selected }"
    @click="handleClick"
  >
    <!-- Check / select indicator -->
    <button
      class="check-btn"
      :class="{ 'select-mode': selecting, 'is-selected': selecting && selected }"
      @click.stop="handleCheckClick"
      :title="selecting ? (selected ? t('tasks.deselect') : t('tasks.select')) : (task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete'))"
    >
      <svg v-if="(selecting && selected) || (!selecting && task.completed)" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" fill="none"/></svg>
    </button>

    <div class="task-body" @dblclick.stop="!selecting && $emit('start', task)" :title="selecting ? '' : t('tasks.dblClickHint')">
      <div class="task-title">{{ task.title }}</div>
      <div class="task-meta">
        <div class="pomo-row">
          <span class="pomo-icon-sm">🍅</span>
          <div class="pomo-bar">
            <div class="pomo-fill" :style="{ width: task.estimatedPomodoros > 0 ? Math.min(100, (task.completedPomodoros / task.estimatedPomodoros) * 100) + '%' : '0%' }"></div>
          </div>
          <span class="pomo-text">{{ task.completedPomodoros }}/{{ task.estimatedPomodoros }}</span>
        </div>
      </div>
    </div>

    <div class="task-actions" v-if="!selecting">
      <button v-if="!task.completed" class="action-btn start" @click.stop="$emit('start', task)" :title="t('tasks.startFocus')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="action-btn" @click.stop="$emit('edit', task)" :title="t('tasks.edit')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="action-btn danger" @click.stop="$emit('delete', task.id)" :title="t('tasks.delete')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  task: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
  selecting: { type: Boolean, default: false },
  selected: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle', 'edit', 'delete', 'select', 'start', 'check'])
import { useI18nStore } from '@renderer/stores/i18nStore.js'
const { t } = useI18nStore()

function handleClick() {
  if (props.selecting) emit('check', props.task.id)
  else emit('select', props.task)
}

function handleCheckClick() {
  if (props.selecting) emit('check', props.task.id)
  else emit('toggle', props.task.id)
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  margin-bottom: 6px;
}
.task-item:hover { background: rgba(255,255,255,0.1) !important; }
.task-active { border-color: var(--color-work) !important; box-shadow: 0 0 12px rgba(167,139,250,0.3); }
.task-done { opacity: 0.5; }
.task-done .task-title { text-decoration: line-through; }
.task-selected { background: rgba(167,139,250,0.18) !important; border-color: rgba(167,139,250,0.5) !important; }

.check-btn {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  background: transparent; cursor: pointer; color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.18s;
}
.task-done .check-btn { background: var(--color-break); border-color: var(--color-break); }
.check-btn:hover { border-color: var(--color-work); }
.check-btn.select-mode { border-color: rgba(167,139,250,0.4); background: rgba(255,255,255,0.05); }
.check-btn.is-selected { background: var(--color-work); border-color: var(--color-work); }

.task-body { flex: 1; min-width: 0; }
.task-title { font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-meta { margin-top: 4px; display: flex; align-items: center; gap: 8px; }
.pomo-row { display: flex; align-items: center; gap: 5px; }
.pomo-icon-sm { font-size: 10px; line-height: 1; }
.pomo-bar { width: 44px; height: 3px; background: rgba(255,255,255,0.12); border-radius: 2px; overflow: hidden; flex-shrink: 0; }
.pomo-fill { height: 100%; background: var(--color-work); border-radius: 2px; transition: width 0.35s ease; }
.pomo-text { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1; }

.task-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.18s; flex-shrink: 0; }
.task-item:hover .task-actions { opacity: 1; }
.action-btn {
  background: none; border: none; cursor: pointer;
  font-size: 14px; padding: 6px; border-radius: 6px; transition: background 0.18s;
  color: rgba(255,255,255,0.55); display: flex; align-items: center; justify-content: center;
}
.action-btn:hover { background: rgba(255,255,255,0.1); }
.action-btn.danger:hover { background: rgba(239,68,68,0.2); }
.action-btn.start { color: var(--color-work); }
.action-btn.start:hover { background: rgba(167,139,250,0.2); }
</style>
