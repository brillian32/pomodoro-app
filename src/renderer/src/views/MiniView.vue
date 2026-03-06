<template>
  <div
    class="mini-window"
    @dblclick="restore"
    @mousedown="startDrag"
    :style="rootStyle"
  >
    <CircleProgress
      :progress="store.progress"
      :color="store.phaseColor"
      :size="circleSize"
      :stroke-width="strokeW"
      :paused="!store.isRunning && store.phase !== 'idle'"
    >
      <div class="mini-inner">
        <div class="mini-time" :style="{ fontSize: timeFontPx + 'px' }">{{ store.formattedTime }}</div>
        <div class="mini-phase" :style="{ fontSize: phaseFontPx + 'px' }">{{ miniPhaseLabel }}</div>
        <div v-if="miniTaskName" class="mini-task" :style="{ fontSize: taskFontPx + 'px', maxWidth: taskMaxW + 'px' }">{{ miniTaskName }}</div>
      </div>
    </CircleProgress>

    <!-- Play/Pause overlay -->
    <button class="mini-btn" @click.stop="togglePlay" :title="store.isRunning ? '暂停' : '开始'" :style="btnPlayStyle">
      <svg v-if="!store.isRunning" :width="btnSvgSize" :height="btnSvgSize" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <svg v-else :width="btnSvgSize" :height="btnSvgSize" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    </button>

    <!-- Skip button -->
    <button class="mini-btn" @click.stop="skip" title="跳过" :style="btnSkipStyle">
      <svg :width="btnSvgSize - 2" :height="btnSvgSize - 2" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><rect x="17" y="4" width="3" height="16"/></svg>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import CircleProgress from '@renderer/components/timer/CircleProgress.vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useTasksStore } from '@renderer/stores/tasksStore.js'

const store = useTimerStore()
const tasksStore = useTasksStore()

// Reactive window size — drives all proportional sizing
const winSize = ref(window.innerWidth || 180)
function onWinResize() { winSize.value = window.innerWidth }

// Reactive opacity (CSS-based, works on transparent windows)
const miniOpacity = ref(1.0)

// Derived sizes: all proportional to winSize
const circleSize  = computed(() => winSize.value - 20)
const strokeW     = computed(() => Math.max(5, Math.round(winSize.value * 0.045)))
const timeFontPx  = computed(() => Math.max(16, Math.round(winSize.value * 0.165)))
const phaseFontPx = computed(() => Math.max(8,  Math.round(winSize.value * 0.063)))
const taskFontPx  = computed(() => Math.max(7,  Math.round(winSize.value * 0.05)))
const taskMaxW    = computed(() => Math.round(winSize.value * 0.5))
const btnSize     = computed(() => Math.max(20, Math.round(winSize.value * 0.145)))
const btnSvgSize  = computed(() => Math.max(10, Math.round(winSize.value * 0.075)))
const btnBottom   = computed(() => Math.round(winSize.value * 0.127))
const btnSide     = computed(() => Math.round(winSize.value * 0.19))

const rootStyle = computed(() => ({
  '--phase-color': store.phaseColor,
  width:   winSize.value + 'px',
  height:  winSize.value + 'px',
  opacity: miniOpacity.value
}))
const btnPlayStyle = computed(() => ({
  width:  btnSize.value + 'px',
  height: btnSize.value + 'px',
  bottom: btnBottom.value + 'px',
  left:   btnSide.value + 'px'
}))
const btnSkipStyle = computed(() => ({
  width:  btnSize.value + 'px',
  height: btnSize.value + 'px',
  bottom: btnBottom.value + 'px',
  right:  btnSide.value + 'px'
}))

const miniPhaseLabel = computed(() => {
  const map = { work: '工作', short_break: '休息', long_break: '长休', idle: '就绪' }
  return map[store.phase] || ''
})

const miniTaskName = computed(() => {
  if (!store.currentTaskId) return ''
  const t = tasksStore.tasks.find((task) => task.id === store.currentTaskId)
  if (!t) return ''
  const maxChars = Math.max(4, Math.floor(winSize.value / 20))
  return t.title.length > maxChars ? t.title.slice(0, maxChars) + '…' : t.title
})

// --- Drag with threshold (don't move on single click) ---
let dragOrigin = null   // { x, y } screen coords at mousedown
let dragging = false
const DRAG_THRESHOLD = 5  // px

function startDrag(e) {
  if (e.target.closest('.mini-btn')) return
  // Lock native resize immediately on mousedown (before any movement threshold)
  // to prevent Windows from resizing the transparent window before our drag begins.
  window.electronAPI.dragLock()
  dragOrigin = { x: e.screenX, y: e.screenY }
  dragging = false
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!dragOrigin) return
  const dx = e.screenX - dragOrigin.x
  const dy = e.screenY - dragOrigin.y
  if (!dragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    dragging = true
    window.electronAPI.startDrag()
  }
  if (dragging) {
    window.electronAPI.dragMove()
  }
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (dragging) {
    window.electronAPI.stopDrag()
    dragging = false
  } else {
    // No actual drag happened (just a click), but we still locked — unlock now.
    window.electronAPI.stopDrag()
  }
  dragOrigin = null
}

function restore() {
  window.electronAPI.showMain()
}

function togglePlay() {
  if (store.isRunning) store.pause()
  else store.start()
}

function skip() {
  store.skip()
}

let cleanupMiniSettings = null

onMounted(() => {
  store.init()
  tasksStore.fetchTasks()
  window.addEventListener('resize', onWinResize)
  // Load initial opacity from saved settings
  window.electronAPI.getSettings().then(s => {
    if (s.miniOpacity != null) miniOpacity.value = s.miniOpacity
  })
  // Listen for real-time settings updates pushed from main process
  cleanupMiniSettings = window.electronAPI.onMiniSettingsUpdated((data) => {
    if (data.miniOpacity != null) miniOpacity.value = data.miniOpacity
    // 同步小窗口内部布局尺寸（OS 窗口大小可能在隐藏状态下已被修改）
    if (data.miniSize != null) winSize.value = data.miniSize
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', onWinResize)
  cleanupMiniSettings?.()
})
</script>

<style scoped>
.mini-window {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-app-region: no-drag;
  border-radius: 50%;
  background: rgba(30, 27, 75, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid var(--phase-color, rgba(255,255,255,0.15));
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(167,139,250,0.15);
  position: relative;
  transition: border-color 0.5s ease;
  /* width/height set by :style binding */
}
.mini-window:active { cursor: grabbing; }

.mini-inner { text-align: center; }
.mini-time {
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  /* font-size set by :style binding */
}
.mini-phase {
  color: var(--phase-color);
  margin-top: 2px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  /* font-size set by :style binding */
}
.mini-task {
  color: rgba(255,255,255,0.45);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  /* font-size + max-width set by :style binding */
}

.mini-btn {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  /* width/height/position set by :style binding */
}
.mini-btn:hover {
  background: var(--phase-color);
  border-color: var(--phase-color);
  transform: scale(1.1);
}
</style>
