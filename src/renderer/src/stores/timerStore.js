import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// BUG-1: Web Audio beep for phase-change notifications
let _audioCtx = null
let _soundEnabled = true

function playBeep() {
  if (!_soundEnabled) return
  try {
    if (!_audioCtx) _audioCtx = new AudioContext()
    const osc = _audioCtx.createOscillator()
    const gain = _audioCtx.createGain()
    osc.connect(gain)
    gain.connect(_audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.28, _audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.4)
    osc.start()
    osc.stop(_audioCtx.currentTime + 0.4)
  } catch (e) { /* AudioContext may be unavailable in subframes */ }
}

export const useTimerStore = defineStore('timer', () => {
  const phase = ref('idle')
  const remaining = ref(0)
  const totalSeconds = ref(1500)
  const isRunning = ref(false)
  const pomodoroCount = ref(0)
  const currentTaskId = ref(null)
  const longBreakInterval = ref(4)
  const circleSize = ref(280)
  const todayCount = ref(0)   // today completed pomodoros
  const dailyGoal = ref(8)    // daily goal (number of pomodoros)

  const progress = computed(() => {
    if (totalSeconds.value === 0) return 0
    return 1 - remaining.value / totalSeconds.value
  })

  const formattedTime = computed(() => {
    const m = Math.floor(remaining.value / 60).toString().padStart(2, '0')
    const s = (remaining.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  const phaseColor = computed(() => {
    if (phase.value === 'work') return 'var(--color-work)'
    if (phase.value === 'short_break') return 'var(--color-break)'
    return 'var(--color-long)'
  })

  const phaseLabel = computed(() => {
    const labels = { work: '工作', short_break: '短休息', long_break: '长休息', idle: '就绪' }
    return labels[phase.value] || '就绪'
  })

  function syncState(data) {
    phase.value = data.phase
    remaining.value = data.remaining
    totalSeconds.value = data.totalSeconds
    isRunning.value = data.isRunning
    pomodoroCount.value = data.pomodoroCount
    if (data.currentTaskId !== undefined) currentTaskId.value = data.currentTaskId
    if (data.longBreakInterval !== undefined) longBreakInterval.value = data.longBreakInterval
  }

  let _initialized = false
  function init() {
    if (_initialized) return
    _initialized = true
    window.electronAPI.getTimerState().then(syncState)
    window.electronAPI.onTimerTick(syncState)
    window.electronAPI.onPhaseChange(({ phase: p, pomodoroCount: c }) => {
      const prevPhase = phase.value
      phase.value = p
      pomodoroCount.value = c
      // BUG-1: play beep on every phase transition
      playBeep()
      // FEAT-3: increment today count when leaving work phase
      if (prevPhase === 'work' && p !== 'work') {
        todayCount.value++
      }
    })
    window.electronAPI.getSettings().then((s) => {
      circleSize.value = s.circleSize || 280
      _soundEnabled = s.soundEnabled !== false
      dailyGoal.value = s.dailyGoal || 8
    })
    window.electronAPI.getStats('day').then((stats) => {
      todayCount.value = stats?.totalPomodoros || 0
    })
  }

  function applySettings(s) {
    if (!s) return
    _soundEnabled = s.soundEnabled !== false
    if (s.circleSize) circleSize.value = s.circleSize
    if (s.dailyGoal) dailyGoal.value = s.dailyGoal
  }

  const start = () => window.electronAPI.startTimer()
  const pause = () => window.electronAPI.pauseTimer()
  const reset = () => window.electronAPI.resetTimer()
  const skip = () => window.electronAPI.skipTimer()
  const setTask = (id) => {
    currentTaskId.value = id
    window.electronAPI.setTimerTask(id)
  }

  return { phase, remaining, totalSeconds, isRunning, pomodoroCount, currentTaskId, longBreakInterval, circleSize, todayCount, dailyGoal, progress, formattedTime, phaseColor, phaseLabel, syncState, init, applySettings, start, pause, reset, skip, setTask }
})
