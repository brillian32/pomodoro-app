<template>
  <div class="tasks-view">
    <div class="tasks-header">
      <h2 class="page-title">任务列表</h2>
      <div class="header-actions">
        <button class="export-btn" @click="exportMarkdown" title="导出为 Markdown 文件">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出
        </button>
        <button class="add-btn" @click="showForm = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建任务
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

const store = useTasksStore()
const timerStore = useTimerStore()
const router = useRouter()
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
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function exportMarkdown() {
  const groups = {}
  for (const task of store.tasks) {
    const date = task.createdAt ? task.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(task)
  }

  const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))

  let md = `# 任务列表\n\n> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
  for (const [date, tasks] of sorted) {
    const completed = tasks.filter((t) => t.completed).length
    md += `## ${dateLabel(date)} (${date})  ${completed}/${tasks.length} 完成\n\n`
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
.tasks-view { height: 100%; padding: 24px; overflow-y: auto; }
.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 20px; font-weight: 700; color: #fff; }
.header-actions { display: flex; align-items: center; gap: 10px; }

.export-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.2s;
}
.export-btn:hover {
  background: rgba(255,255,255,0.14);
  border-color: rgba(255,255,255,0.25);
  color: #fff;
}

.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 12px;
  background: var(--color-work); border: none;
  color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
.tasks-container { max-width: 640px; }
</style>
