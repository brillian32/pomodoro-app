<template>
  <div class="tasks-view">
    <div class="tasks-header">
      <div class="title-area">
        <div class="title-accent"></div>
        <h2 class="page-title">{{ t('tasks.title') }}</h2>
      </div>
      <div class="header-actions">
        <button class="export-btn" @click="exportMarkdown" :title="t('tasks.exportTooltip')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ t('tasks.export') }}
        </button>
        <button class="add-btn" @click="showForm = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ t('tasks.newTask') }}
        </button>
      </div>
    </div>

    <div class="tasks-container">
      <TaskList
        @edit="openEdit"
        @select="selectTask"
        @start="startTask"
      />
    </div>

    <TaskForm
      v-model="showForm"
      :edit-task="editingTask"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TaskList from '@renderer/components/tasks/TaskList.vue'
import TaskForm from '@renderer/components/tasks/TaskForm.vue'
import { useTasksStore } from '@renderer/stores/tasksStore.js'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'
import { storeToRefs } from 'pinia'

const store = useTasksStore()
const timerStore = useTimerStore()
const router = useRouter()
const i18nStore = useI18nStore()
const { t } = i18nStore
const { locale } = storeToRefs(i18nStore)
const showForm = ref(false)
const editingTask = ref(null)

onMounted(() => {
  store.fetchTasks()
  store.initTaskListener()
})

function openEdit(task) {
  editingTask.value = task
  showForm.value = true
}

function selectTask(task) {
  timerStore.setTask(task.id)
}

function startTask(task) {
  timerStore.setTask(task.id)
  router.push('/timer')
}

async function handleSave({ id, title, estimatedPomodoros, createdAt }) {
  if (id) {
    await store.updateTask({ id, title, estimatedPomodoros, createdAt })
  } else {
    await store.createTask({ title, estimatedPomodoros, createdAt })
  }
  editingTask.value = null
}

function dateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return t('tasks.today')
  if (dateStr === yesterday) return t('tasks.yesterday')
  const d = new Date(dateStr + 'T12:00:00')
  if (locale.value === 'zh') return `${d.getMonth() + 1}月${d.getDate()}日`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function exportMarkdown() {
  const groups = {}
  for (const task of store.tasks) {
    const date = task.createdAt ? task.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(task)
  }

  const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))

  let md = `${t('tasks.exportTitle')}\n\n> ${new Date().toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')}\n\n`
  for (const [date, tasks] of sorted) {
    const completed = tasks.filter((t) => t.completed).length
    md += `## ${dateLabel(date)} (${date})  ${completed}/${tasks.length} ${t('tasks.exportDone')}\n\n`
    for (const task of [...tasks].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))) {
      const check = task.completed ? 'x' : ' '
      const filled = '🍅'.repeat(task.completedPomodoros || 0)
      const empty = '⬜'.repeat(Math.max(0, (task.estimatedPomodoros || 1) - (task.completedPomodoros || 0)))
      md += `- [${check}] ${task.title}  ${filled}${empty} (${task.completedPomodoros}/${task.estimatedPomodoros})\n`
    }
    md += '\n'
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.tasks-view { height: 100%; padding: 20px 24px; overflow-y: auto; }

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-accent {
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, var(--color-work), rgba(167, 139, 250, 0.4));
  border-radius: 2px;
  flex-shrink: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
}

.header-actions { display: flex; align-items: center; gap: 8px; }

.export-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 13px; border-radius: 10px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.export-btn:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.9);
}

.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px;
  background: linear-gradient(135deg, var(--color-work), #7c3aed);
  border: 1px solid rgba(167, 139, 250, 0.4);
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(167, 139, 250, 0.25);
  white-space: nowrap;
}
.add-btn:hover {
  filter: brightness(1.12);
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(167, 139, 250, 0.4);
}
.add-btn:active { transform: translateY(0); filter: brightness(0.97); }

.tasks-container { max-width: 640px; margin: 0 auto; }
</style>
