<template>
  <div class="timer-view">
    <!-- Phase-change flash overlay (UX-4) -->
    <Transition name="flash">
      <div v-if="flashActive" class="phase-flash-overlay" :style="{ background: store.phaseColor + '22' }" />
    </Transition>

    <div class="timer-center">
      <!-- Progress Ring with integrated play/pause -->
      <CircleProgress
        :progress="store.progress"
        :color="store.phaseColor"
        :size="store.circleSize"
        :stroke-width="Math.max(8, Math.round(store.circleSize * 0.04))"
        :paused="!store.isRunning && store.phase !== 'idle'"
      >
        <div class="timer-display" @click="togglePlay" :title="store.isRunning ? t('timer.pause') : t('timer.start')">
          <div class="phase-label" :style="{ color: store.phaseColor }">{{ phaseLabel }}</div>
          <div class="time-text" :style="{ fontSize: Math.max(28, Math.round(store.circleSize * 0.2)) + 'px' }">{{ store.formattedTime }}</div>
          <div class="play-hint">
            <svg v-if="!store.isRunning" :width="Math.round(store.circleSize*0.1)" :height="Math.round(store.circleSize*0.1)" viewBox="0 0 24 24" fill="currentColor" class="hint-icon"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg v-else :width="Math.round(store.circleSize*0.1)" :height="Math.round(store.circleSize*0.1)" viewBox="0 0 24 24" fill="currentColor" class="hint-icon"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </div>
          <div class="count-text" v-if="store.pomodoroCount > 0">{{ t('timer.pomodoroCount', { count: store.pomodoroCount }) }}</div>
        </div>
      </CircleProgress>

      <!-- Pomodoro dots -->
      <PomodoroCounter />

      <!-- Controls (reset + skip only) -->
      <TimerControls />

      <!-- Daily goal progress -->
      <div class="daily-goal" v-if="store.dailyGoal > 0">
        <div class="daily-goal-bar">
          <div
            class="daily-goal-fill"
            :style="{ width: Math.min(100, (store.todayCount / store.dailyGoal) * 100) + '%' }"
            :class="{ done: store.todayCount >= store.dailyGoal }"
          />
        </div>
        <span class="daily-goal-text">
          {{ t('timer.todayProgress', { today: store.todayCount, goal: store.dailyGoal }) }}
          <span v-if="store.todayCount >= store.dailyGoal" class="goal-achieved">{{ t('timer.goalAchieved') }}</span>
        </span>
      </div>

      <!-- Settings button -->
      <button class="settings-btn" @click="showSettings = true" :title="t('timer.settings')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
        </svg>
        {{ t('timer.settings') }}
      </button>

      <!-- Current task or quick task picker (UX-2) -->
      <div v-if="currentTask" class="current-task glass">
        <span class="ct-dot" />
        <span class="ct-text">{{ currentTask.title }}</span>
        <button class="ct-clear" @click="timerStore.setTask(null)">✕</button>
      </div>
      <div v-else class="task-picker-row">
        <button class="task-picker-toggle" @click="showTaskPicker = !showTaskPicker">
          {{ t('timer.linkTask') }}
        </button>
        <Transition name="fade">
          <div v-if="showTaskPicker" class="task-picker-popup glass">
            <div v-if="availableTasks.length === 0" class="picker-empty">{{ t('timer.noTasks') }}</div>
            <div
              v-for="task in availableTasks"
              :key="task.id"
              class="picker-item"
              @click="pickTask(task)"
            >
              <span class="picker-title">{{ task.title }}</span>
              <span class="picker-pomo">🍅{{ task.completedPomodoros }}/{{ task.estimatedPomodoros }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Settings Modal -->
    <TimerSettings v-model="showSettings" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import CircleProgress from '@renderer/components/timer/CircleProgress.vue'
import TimerControls from '@renderer/components/timer/TimerControls.vue'
import PomodoroCounter from '@renderer/components/timer/PomodoroCounter.vue'
import TimerSettings from '@renderer/components/timer/TimerSettings.vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useTasksStore } from '@renderer/stores/tasksStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const store = useTimerStore()
const timerStore = store
const tasksStore = useTasksStore()
const { t } = useI18nStore()
const showSettings = ref(false)
const showTaskPicker = ref(false)

const phaseLabel = computed(() => t('timer.phase.' + (store.phase || 'idle')))

const currentTask = computed(() => store.currentTaskId
  ? tasksStore.tasks.find((t) => t.id === store.currentTaskId) : null)

const availableTasks = computed(() =>
  tasksStore.tasks.filter((t) => !t.completed).slice(0, 10)
)

function togglePlay() {
  if (store.isRunning) store.pause()
  else store.start()
}

function pickTask(task) {
  timerStore.setTask(task.id)
  showTaskPicker.value = false
}

// UX-4: Phase-change flash
const flashActive = ref(false)
watch(() => store.phase, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    flashActive.value = true
    setTimeout(() => { flashActive.value = false }, 600)
  }
})

onMounted(() => {
  store.init()
  tasksStore.fetchTasks()
})
</script>

<style scoped>
.timer-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
}
.phase-flash-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.flash-leave-active { transition: opacity 0.6s ease-out; }
.flash-leave-to { opacity: 0; }
.flash-enter-from { opacity: 1; }
.timer-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.timer-display {
  text-align: center;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: background 0.2s;
  user-select: none;
}
.timer-display:hover .hint-icon {
  opacity: 1;
  transform: scale(1.15);
}
.phase-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
}
.time-text {
  font-weight: 700;
  color: #fff;
  letter-spacing: -2px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.play-hint {
  margin-top: 8px;
  display: none;
  justify-content: center;
  color: rgba(255,255,255,0.45);
}
.hint-icon {
  opacity: 0.45;
  transition: opacity 0.2s, transform 0.2s;
}
.count-text {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin-top: 6px;
}
.settings-btn {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6);
  padding: 7px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.settings-btn:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.current-task {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  max-width: 300px;
}
.ct-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-work);
  flex-shrink: 0;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.ct-text {
  flex: 1;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ct-clear {
  background: none; border: none; color: rgba(255,255,255,0.4);
  cursor: pointer; font-size: 12px; padding: 2px;
  transition: color 0.2s;
}
.ct-clear:hover { color: #fff; }

/* FEAT-3: Daily goal progress */
.daily-goal {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 200px;
}
.daily-goal-bar {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}
.daily-goal-fill {
  height: 100%;
  background: var(--color-work);
  border-radius: 4px;
  transition: width 0.5s ease;
}
.daily-goal-fill.done { background: var(--color-break); }
.daily-goal-text {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  gap: 6px;
}
.goal-achieved { color: var(--color-break); font-weight: 600; }

/* FEAT-3: Today goal */
.today-goal {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 180px;
}
.today-label { font-size: 12px; color: rgba(255,255,255,0.55); }
.goal-bar {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}
.goal-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* UX-2: Quick task picker */
.task-picker-row {
  margin-top: 16px;
  position: relative;
}
.task-picker-toggle {
  padding: 7px 16px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px dashed rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.task-picker-toggle:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85);
  border-style: solid;
}
.task-picker-popup {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  max-width: 300px;
  border-radius: 14px;
  padding: 6px;
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}
.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}
.picker-item:hover { background: rgba(255,255,255,0.1); }
.picker-title { font-size: 13px; color: rgba(255,255,255,0.85); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-pomo { font-size: 11px; color: rgba(255,255,255,0.4); flex-shrink: 0; }
.picker-empty { font-size: 13px; color: rgba(255,255,255,0.35); padding: 12px; text-align: center; }
</style>
