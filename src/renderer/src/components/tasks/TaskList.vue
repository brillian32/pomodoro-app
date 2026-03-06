<template>
  <div class="task-list" :class="{ 'is-selecting': selecting }">

    <!-- ====== Toolbar ====== -->
    <div class="toolbar">
      <div class="filter-tabs" v-if="viewMode !== 'month'">
        <button v-for="tab in tabs" :key="tab.value"
          class="filter-tab" :class="{ active: filterTab === tab.value }"
          @click="filterTab = tab.value">{{ tab.label }}</button>
      </div>
      <div v-else class="toolbar-spacer" />

      <div class="toolbar-right">
        <div class="sort-toggle" v-if="viewMode !== 'month'">
          <button class="sort-btn" :class="{ active: sortBy === 'date' }" @click="sortBy = 'date'">时间</button>
          <button class="sort-btn" :class="{ active: sortBy === 'remaining' }" @click="sortBy = 'remaining'">剩余</button>
        </div>
        <div class="view-switch">
          <button class="view-btn" :class="{ active: viewMode === 'day' }" @click="setView('day')" title="日视图">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            日
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'month' }" @click="setView('month')" title="月历">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="10" x2="9" y2="22"/><line x1="15" y1="10" x2="15" y2="22"/></svg>
            月
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'all' }" @click="setView('all')" title="全部任务">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            全部
          </button>
        </div>
        <button v-if="viewMode !== 'month'" class="select-toggle-btn" :class="{ active: selecting }" @click="toggleSelectMode">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          {{ selecting ? '取消' : '选择' }}
        </button>
      </div>
    </div>

    <!-- ====== Loading ====== -->
    <div v-if="store.loading" class="empty">加载中...</div>

    <!-- ====== DAY VIEW ====== -->
    <template v-else-if="viewMode === 'day'">
      <div class="day-nav">
        <button class="nav-arrow" @click="stepDay(-1)" title="前一天">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="day-label">{{ dayNavLabel }}</span>
        <button class="nav-arrow" @click="stepDay(1)" :disabled="viewDateStr >= todayStr" title="后一天">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button v-if="viewDateStr !== todayStr" class="today-jump" @click="jumpToday">今天</button>
      </div>

      <div v-if="dayTasks.length === 0" class="empty">
        <div class="empty-icon">
          <svg v-if="viewDateStr === todayStr" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z"/><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
          <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <p>{{ viewDateStr === todayStr ? '今天还没有任务，点击右上角新建' : '这天没有任务' }}</p>
      </div>
      <TransitionGroup v-else tag="div" class="flat-list" name="task-fade">
        <TaskItem
          v-for="task in dayTasks"
          :key="task.id"
          :task="task"
          :is-active="activeTaskId === task.id"
          :selecting="selecting"
          :selected="selectedIds.has(task.id)"
          @toggle="store.toggleComplete"
          @edit="$emit('edit', $event)"
          @delete="handleDelete"
          @select="$emit('select', $event)"
          @start="$emit('start', $event)"
          @check="toggleSelect"
        />
      </TransitionGroup>
    </template>

    <!-- ====== MONTH VIEW ====== -->
    <template v-else-if="viewMode === 'month'">
      <div class="month-nav">
        <button class="nav-arrow" @click="stepMonth(-1)" title="上个月">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="month-label">{{ viewYear }}年{{ viewMonth + 1 }}月</span>
        <button class="nav-arrow" @click="stepMonth(1)" title="下个月">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="calendar">
        <div class="cal-header" v-for="d in ['一','二','三','四','五','六','日']" :key="d">{{ d }}</div>
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="cal-cell"
          :class="{
            'other-month': !cell.inMonth,
            'is-today': cell.dateStr === todayStr,
            'has-tasks': cell.inMonth && cell.total > 0,
            'all-done': cell.inMonth && cell.total > 0 && cell.done === cell.total
          }"
          @click="cell.inMonth && goToDay(cell.dateStr)"
        >
          <div class="cal-cell-top">
            <span class="cal-day-num">{{ cell.day }}</span>
            <span v-if="cell.inMonth && cell.total > 0" class="cal-count">{{ cell.done }}/{{ cell.total }}</span>
          </div>
          <div v-if="cell.inMonth && cell.taskPreviews.length > 0" class="cal-task-list">
            <div
              v-for="(t, i) in cell.taskPreviews"
              :key="i"
              class="cal-task-pill"
              :class="{ done: t.completed }"
            >{{ t.title }}</div>
          </div>
        </div>
      </div>

      <div class="month-summary">
        <span>本月 <b>{{ monthSummary.total }}</b> 个任务</span>
        <span>已完成 <b class="done-text">{{ monthSummary.done }}</b></span>
        <span>🍅 × <b>{{ monthSummary.pomodoros }}</b></span>
      </div>
    </template>

    <!-- ====== ALL TASKS VIEW ====== -->
    <template v-else>
      <div v-if="allGroupedTasks.length === 0" class="empty">
        <div class="empty-icon">
          <svg v-if="filterTab === 'done'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z"/><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
        </div>
        <p>{{ filterTab === 'done' ? '还没有完成的任务' : filterTab === 'active' ? '没有进行中的任务' : '还没有任务，点击右上角新建' }}</p>
      </div>
      <div v-else class="all-groups">
        <div v-for="group in allGroupedTasks" :key="group.date" class="date-group">
          <div class="group-header" @click="toggleGroup(group.date)">
            <div class="group-title-wrap">
              <span class="group-label">{{ group.label }}</span>
              <span class="group-date-sub">{{ group.date }}</span>
            </div>
            <div class="group-meta">
              <span class="group-progress" :class="{ done: group.completedCount === group.tasks.length }">
                {{ group.completedCount }}/{{ group.tasks.length }}
              </span>
              <span v-if="group.totalPomodoros > 0" class="group-pomo">🍅×{{ group.totalPomodoros }}</span>
              <svg class="chevron" :class="{ open: !collapsed[group.date] }" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
          <Transition name="collapse">
            <div v-show="!collapsed[group.date]" class="group-tasks">
              <TaskItem
                v-for="task in group.tasks"
                :key="task.id"
                :task="task"
                :is-active="activeTaskId === task.id"
                :selecting="selecting"
                :selected="selectedIds.has(task.id)"
                @toggle="store.toggleComplete"
                @edit="$emit('edit', $event)"
                @delete="handleDelete"
                @select="$emit('select', $event)"
                @start="$emit('start', $event)"
                @check="toggleSelect"
              />
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <!-- ====== Multi-select action bar ====== -->
    <Transition name="slide-bar">
      <div v-if="selecting" class="select-bar">
        <span class="select-count">已选 <b>{{ selectedIds.size }}</b></span>
        <button class="bar-btn" @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</button>
        <div class="bar-spacer" />
        <button class="bar-btn" @click="batchComplete" :disabled="selectedIds.size === 0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          完成
        </button>
        <button class="bar-btn danger" @click="batchDelete" :disabled="selectedIds.size === 0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          删除
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import TaskItem from './TaskItem.vue'
import { useTasksStore } from '@renderer/stores/tasksStore.js'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useToastStore } from '@renderer/stores/toastStore.js'

const store = useTasksStore()
const timerStore = useTimerStore()
const toast = useToastStore()
const activeTaskId = computed(() => timerStore.currentTaskId)

defineEmits(['edit', 'select', 'start'])

// ── View mode ──
const viewMode = ref('day')

function setView(mode) {
  if (viewMode.value !== mode && selecting.value) exitSelectMode()
  viewMode.value = mode
}

// ── Filter / sort ──
const filterTab = ref('all')
const sortBy = ref('date')
const tabs = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'done', label: '已完成' }
]

watch(filterTab, () => { if (selecting.value) selectedIds.value = new Set() })

// ── Multi-select ──
const selecting = ref(false)
const selectedIds = ref(new Set())

function toggleSelectMode() {
  selecting.value = !selecting.value
  if (!selecting.value) selectedIds.value = new Set()
}

function exitSelectMode() {
  selecting.value = false
  selectedIds.value = new Set()
}

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

const visibleTaskIds = computed(() => {
  if (viewMode.value === 'day') return dayTasks.value.map(t => t.id)
  if (viewMode.value === 'all') return allGroupedTasks.value.flatMap(g => g.tasks.map(t => t.id))
  return []
})

const isAllSelected = computed(() =>
  visibleTaskIds.value.length > 0 &&
  visibleTaskIds.value.every(id => selectedIds.value.has(id))
)

function toggleSelectAll() {
  selectedIds.value = isAllSelected.value ? new Set() : new Set(visibleTaskIds.value)
}

async function batchComplete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  let count = 0
  for (const id of ids) {
    const task = store.tasks.find(t => t.id === id)
    if (task && !task.completed) { await store.toggleComplete(id); count++ }
  }
  toast.success(`已完成 ${count} 个任务`)
  exitSelectMode()
}

async function batchDelete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  if (!confirm(`确认删除 ${ids.length} 个任务？`)) return
  for (const id of ids) await store.deleteTask(id)
  toast.success(`已删除 ${ids.length} 个任务`)
  exitSelectMode()
}

// ── Day view ──
const todayStr = computed(() => new Date().toLocaleDateString('en-CA'))
const viewDate = ref(new Date())
const viewDateStr = computed(() => viewDate.value.toLocaleDateString('en-CA'))

const dayNavLabel = computed(() => {
  const ds = viewDateStr.value
  if (ds === todayStr.value) return '今天'
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  if (ds === yesterday) return '昨天'
  const d = viewDate.value
  return `${d.getMonth() + 1}月${d.getDate()}日 (${['日','一','二','三','四','五','六'][d.getDay()]})`
})

function stepDay(delta) {
  const d = new Date(viewDate.value)
  d.setDate(d.getDate() + delta)
  if (d.toLocaleDateString('en-CA') > todayStr.value) return
  viewDate.value = d
  if (selecting.value) selectedIds.value = new Set()
}

function jumpToday() {
  viewDate.value = new Date()
  if (selecting.value) selectedIds.value = new Set()
}

function goToDay(dateStr) {
  viewDate.value = new Date(dateStr + 'T12:00:00')
  setView('day')
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (sortBy.value === 'remaining') {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const ra = (a.estimatedPomodoros || 1) - (a.completedPomodoros || 0)
      const rb = (b.estimatedPomodoros || 1) - (b.completedPomodoros || 0)
      return rb - ra
    }
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })
}

const dayTasks = computed(() => {
  let list = store.tasks.filter(t => {
    const d = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA') : todayStr.value
    return d === viewDateStr.value
  })
  if (filterTab.value === 'active') list = list.filter(t => !t.completed)
  else if (filterTab.value === 'done') list = list.filter(t => t.completed)
  return sortTasks(list)
})

// ── All tasks view ──
function dateLabel(dateStr) {
  if (dateStr === todayStr.value) return '今天'
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  if (dateStr === yesterday) return '昨天'
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日 (${['日','一','二','三','四','五','六'][d.getDay()]})`
}

const collapsed = reactive({})

function toggleGroup(date) {
  collapsed[date] = !collapsed[date]
}

const allGroupedTasks = computed(() => {
  let list = [...store.tasks]
  if (filterTab.value === 'active') list = list.filter(t => !t.completed)
  else if (filterTab.value === 'done') list = list.filter(t => t.completed)
  const groups = {}
  for (const task of list) {
    const date = task.createdAt
      ? new Date(task.createdAt).toLocaleDateString('en-CA')
      : todayStr.value
    if (!groups[date]) groups[date] = []
    groups[date].push(task)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, tasks]) => ({
      date,
      label: dateLabel(date),
      tasks: sortTasks(tasks),
      completedCount: tasks.filter(t => t.completed).length,
      totalPomodoros: tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)
    }))
})

watch(allGroupedTasks, (groups) => {
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
  for (const group of groups) {
    if (!(group.date in collapsed)) {
      collapsed[group.date] = group.date !== todayStr.value && group.date !== yesterday
    }
  }
}, { immediate: true })

// ── Month view ──
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

function stepMonth(delta) {
  let m = viewMonth.value + delta
  let y = viewYear.value
  if (m > 11) { m = 0; y++ }
  if (m < 0) { m = 11; y-- }
  viewMonth.value = m
  viewYear.value = y
}

const tasksByDate = computed(() => {
  const map = {}
  for (const t of store.tasks) {
    const d = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA') : todayStr.value
    if (!map[d]) map[d] = { total: 0, done: 0, pomodoros: 0, taskPreviews: [] }
    map[d].total++
    if (t.completed) map[d].done++
    map[d].pomodoros += t.completedPomodoros || 0
    if (map[d].taskPreviews.length < 3) {
      const title = t.title.length > 10 ? t.title.slice(0, 10) + '…' : t.title
      map[d].taskPreviews.push({ title, completed: t.completed })
    }
  }
  return map
})

const calendarCells = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDay = new Date(y, m, 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = []
  const prevDays = new Date(y, m, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDays - i
    const prevM = m === 0 ? 11 : m - 1
    const prevY = m === 0 ? y - 1 : y
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ key: dateStr, day, dateStr, inMonth: false, total: 0, done: 0, taskPreviews: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const info = tasksByDate.value[dateStr] || { total: 0, done: 0, taskPreviews: [] }
    cells.push({ key: dateStr, day: d, dateStr, inMonth: true, total: info.total, done: info.done, taskPreviews: info.taskPreviews || [] })
  }
  const trailing = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= trailing; d++) {
    const nextM = m === 11 ? 0 : m + 1
    const nextY = m === 11 ? y + 1 : y
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: dateStr, day: d, dateStr, inMonth: false, total: 0, done: 0, taskPreviews: [] })
  }
  return cells
})

const monthSummary = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`
  let total = 0, done = 0, pomodoros = 0
  for (const t of store.tasks) {
    const d = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA') : todayStr.value
    if (d.startsWith(prefix)) { total++; if (t.completed) done++; pomodoros += t.completedPomodoros || 0 }
  }
  return { total, done, pomodoros }
})

async function handleDelete(id) {
  if (confirm('确认删除这个任务？')) await store.deleteTask(id)
}
</script>

<style scoped>
.task-list { display: flex; flex-direction: column; gap: 10px; position: relative; }
.task-list.is-selecting { padding-bottom: 58px; }

.empty { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.4); font-size: 14px; }
.empty-icon { margin-bottom: 12px; display: flex; justify-content: center; }

/* ── Toolbar ── */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.toolbar-spacer { flex: 1; }
.toolbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.filter-tabs { display: flex; gap: 3px; }
.filter-tab {
  padding: 6px 14px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.12); background: transparent;
  color: rgba(255,255,255,0.45); font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.filter-tab.active { background: rgba(167,139,250,0.2); border-color: var(--color-work); color: #fff; font-weight: 600; }
.filter-tab:hover:not(.active) { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.75); }

.sort-toggle { display: flex; border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; overflow: hidden; }
.sort-btn { padding: 5px 10px; background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.sort-btn.active { background: rgba(167,139,250,0.2); color: #fff; font-weight: 600; }
.sort-btn:hover:not(.active) { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }

.view-switch { display: flex; border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; overflow: hidden; }
.view-btn { display: flex; align-items: center; gap: 3px; padding: 5px 10px; background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.view-btn.active { background: rgba(167,139,250,0.22); color: #fff; font-weight: 600; }
.view-btn:hover:not(.active) { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.75); }

.select-toggle-btn {
  display: flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.12); background: transparent;
  color: rgba(255,255,255,0.5); font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.select-toggle-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); }
.select-toggle-btn.active { background: rgba(167,139,250,0.22); border-color: var(--color-work); color: var(--color-work); }

/* ── Day navigation ── */
.day-nav { display: flex; align-items: center; gap: 8px; padding: 4px 0 2px; }
.nav-arrow {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.nav-arrow:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
.nav-arrow:disabled { opacity: 0.3; cursor: default; }
.day-label { font-size: 14px; font-weight: 600; color: #fff; flex: 1; text-align: center; }
.today-jump {
  font-size: 11px; padding: 3px 10px; border-radius: 8px;
  background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.35);
  color: var(--color-work); cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.today-jump:hover { background: rgba(167,139,250,0.28); }

.flat-list { display: flex; flex-direction: column; }
.task-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.task-fade-leave-active { transition: opacity 0.15s ease; }
.task-fade-enter-from { opacity: 0; transform: translateY(4px); }
.task-fade-leave-to { opacity: 0; }

/* ── All tasks grouped ── */
.all-groups { display: flex; flex-direction: column; gap: 10px; }
.date-group {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px; overflow: hidden; transition: border-color 0.2s;
}
.date-group:hover { border-color: rgba(255,255,255,0.16); }
.group-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 14px; cursor: pointer; user-select: none; transition: background 0.15s;
}
.group-header:hover { background: rgba(255,255,255,0.05); }
.group-title-wrap { display: flex; align-items: baseline; gap: 8px; }
.group-label { font-size: 13px; font-weight: 700; color: #fff; }
.group-date-sub { font-size: 11px; color: rgba(255,255,255,0.3); }
.group-meta { display: flex; align-items: center; gap: 8px; }
.group-progress { font-size: 12px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; }
.group-progress.done { color: var(--color-break); }
.group-pomo { font-size: 11px; color: rgba(255,255,255,0.4); }
.chevron { color: rgba(255,255,255,0.4); transition: transform 0.25s ease; }
.chevron.open { transform: rotate(180deg); }
.group-tasks { padding: 0 8px 6px; display: flex; flex-direction: column; }
.collapse-enter-active, .collapse-leave-active { transition: opacity 0.2s ease; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; }

/* ── Month view ── */
.month-nav { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.month-label { font-size: 14px; font-weight: 600; color: #fff; flex: 1; text-align: center; }

.calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-header { text-align: center; font-size: 11px; color: rgba(255,255,255,0.35); padding: 4px 0 6px; font-weight: 600; }
.cal-cell {
  border-radius: 8px; padding: 5px 5px 4px;
  display: flex; flex-direction: column; align-items: stretch;
  background: rgba(255,255,255,0.03); border: 1px solid transparent;
  cursor: default; transition: all 0.15s; min-height: 60px;
}
.cal-cell.has-tasks { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); cursor: pointer; }
.cal-cell.has-tasks:hover { background: rgba(167,139,250,0.14); border-color: rgba(167,139,250,0.35); }
.cal-cell.is-today { background: rgba(167,139,250,0.18); border-color: var(--color-work); }
.cal-cell.all-done { border-color: var(--color-break); }
.cal-cell.other-month { opacity: 0.22; }

.cal-cell-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.cal-day-num { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1; }
.cal-cell.is-today .cal-day-num { color: var(--color-work); }
.cal-count { font-size: 9px; color: rgba(255,255,255,0.45); line-height: 1; }
.cal-cell.all-done .cal-count { color: var(--color-break); }

.cal-task-list { display: flex; flex-direction: column; gap: 2px; }
.cal-task-pill {
  font-size: 9px; color: rgba(255,255,255,0.72);
  background: rgba(255,255,255,0.08); border-radius: 3px;
  padding: 2px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
}
.cal-task-pill.done { color: rgba(255,255,255,0.3); text-decoration: line-through; background: transparent; }

.month-summary {
  display: flex; gap: 16px; padding: 8px 4px 2px; font-size: 12px;
  color: rgba(255,255,255,0.45); border-top: 1px solid rgba(255,255,255,0.07);
}
.month-summary b { color: rgba(255,255,255,0.8); }
.month-summary .done-text { color: var(--color-break); }

/* ── Multi-select action bar ── */
.select-bar {
  position: sticky; bottom: 0;
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: rgba(15, 12, 50, 0.94);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(167,139,250,0.3);
  border-radius: 0 0 14px 14px; z-index: 10;
}
.select-count { font-size: 13px; color: rgba(255,255,255,0.6); flex-shrink: 0; }
.select-count b { color: #fff; }
.bar-spacer { flex: 1; }
.bar-btn {
  display: flex; align-items: center; gap: 4px; padding: 6px 13px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.8); font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.bar-btn:hover:not(:disabled) { background: rgba(255,255,255,0.14); color: #fff; }
.bar-btn:disabled { opacity: 0.35; cursor: default; }
.bar-btn.danger { border-color: rgba(239,68,68,0.3); color: rgba(255,130,130,0.9); }
.bar-btn.danger:hover:not(:disabled) { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.55); color: #fff; }

.slide-bar-enter-active { transition: transform 0.25s cubic-bezier(.22,.68,0,1.3), opacity 0.2s ease; }
.slide-bar-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.slide-bar-enter-from, .slide-bar-leave-to { transform: translateY(100%); opacity: 0; }
</style>
