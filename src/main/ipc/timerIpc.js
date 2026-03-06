import { ipcMain, BrowserWindow, app } from 'electron'
import { readData, writeData } from '../store.js'
import { sendNotification } from '../notification.js'
import { updateTrayMenu } from '../tray.js'

// ─── Timer State ──────────────────────────────────────────────────────────────
const state = {
  phase: 'idle',       // 'work' | 'short_break' | 'long_break' | 'idle'
  remaining: 0,        // seconds
  totalSeconds: 0,
  isRunning: false,
  pomodoroCount: 0,    // completed work sessions
  currentTaskId: null,
  startTime: null,
  intervalId: null
}

function getSettings() {
  return readData('settings')
}

function broadcastToAll(channel, payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload)
    }
  })
}

function broadcastTick() {
  const settings = getSettings()
  broadcastToAll('timer:tick', {
    phase: state.phase,
    remaining: state.remaining,
    totalSeconds: state.totalSeconds,
    isRunning: state.isRunning,
    pomodoroCount: state.pomodoroCount,
    currentTaskId: state.currentTaskId,
    longBreakInterval: settings.longBreakInterval || 4
  })
}

function getNextPhase() {
  const settings = getSettings()
  if (state.phase === 'work') {
    // pomodoroCount has already been incremented before this is called
    return state.pomodoroCount % settings.longBreakInterval === 0 ? 'long_break' : 'short_break'
  }
  return 'work'
}

function getPhaseDuration(phase) {
  const s = getSettings()
  if (phase === 'work') return s.workDuration * 60
  if (phase === 'short_break') return s.shortBreakDuration * 60
  return s.longBreakDuration * 60
}

function stopInterval() {
  if (state.intervalId) {
    clearInterval(state.intervalId)
    state.intervalId = null
  }
}

function saveRecord(completed) {
  if (state.phase !== 'work' || !state.startTime) return
  try {
    const records = readData('records')
    records.push({
      id: Date.now().toString(),
      taskId: state.currentTaskId,
      type: state.phase,
      startTime: state.startTime,
      endTime: new Date().toISOString(),
      completed
    })
    writeData('records', records)
    if (completed && state.currentTaskId) {
      const tasks = readData('tasks')
      const task = tasks.find((t) => t.id === state.currentTaskId)
      if (task) {
        task.completedPomodoros = (task.completedPomodoros || 0) + 1
        writeData('tasks', tasks)
        // Notify renderer to update task in real-time
        broadcastToAll('tasks:taskUpdated', { ...task })
      }
    }
  } catch (e) {
    console.error('saveRecord error', e)
  }
}

function advancePhase(fromTimer = false) {
  const wasWork = state.phase === 'work'
  if (wasWork) {
    state.pomodoroCount += 1      // always count when leaving work phase
  }

  const next = getNextPhase()

  // Send notification FIRST, before disk I/O, to eliminate perceived latency
  const notifType = next === 'work' ? 'work_start' : next === 'short_break' ? 'short_break_start' : 'long_break_start'
  sendNotification(notifType)

  // Save record after notification (involves disk I/O)
  if (wasWork) {
    saveRecord(fromTimer)          // true = completed naturally, false = skipped
  }

  const settings = getSettings()

  state.phase = next
  state.totalSeconds = getPhaseDuration(next)
  state.remaining = state.totalSeconds
  state.isRunning = false   // reset before potential autoStart
  state.startTime = null
  stopInterval()

  broadcastToAll('timer:phaseChange', { phase: next, pomodoroCount: state.pomodoroCount })
  broadcastTick()

  const autoStart = next === 'work' ? settings.autoStartWork : settings.autoStartBreak
  if (autoStart) {
    startTimer()
  }

  updateTrayMenu(getTrayControls())
}

function startTimer() {
  if (state.isRunning) return
  if (state.phase === 'idle') {
    const settings = getSettings()
    state.phase = 'work'
    state.totalSeconds = settings.workDuration * 60
    state.remaining = state.totalSeconds
    sendNotification('work_start')
    broadcastToAll('timer:phaseChange', { phase: 'work', pomodoroCount: state.pomodoroCount })
  }
  state.isRunning = true
  state.startTime = state.startTime || new Date().toISOString()

  const wallStart = Date.now()
  const baseRemaining = state.remaining

  state.intervalId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - wallStart) / 1000)
    state.remaining = Math.max(0, baseRemaining - elapsed)
    broadcastTick()
    if (state.remaining <= 0) {
      stopInterval()
      advancePhase(true)
    }
  }, 250)

  broadcastTick()
  updateTrayMenu(getTrayControls())
}

function pauseTimer() {
  if (!state.isRunning) return
  state.isRunning = false
  stopInterval()
  broadcastTick()
  updateTrayMenu(getTrayControls())
}

function resetTimer() {
  const wasWork = state.phase === 'work' && state.isRunning && !!state.startTime
  if (wasWork) saveRecord(false)
  stopInterval()
  const settings = getSettings()
  state.phase = 'work'
  state.totalSeconds = settings.workDuration * 60
  state.remaining = state.totalSeconds
  state.isRunning = false
  state.startTime = null
  broadcastTick()
  updateTrayMenu(getTrayControls())
}

function skipPhase() {
  stopInterval()
  state.isRunning = false
  advancePhase(false)   // saveRecord handled inside advancePhase
}

function getTrayControls() {
  return {
    phase: state.phase,
    isRunning: state.isRunning,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    quit: () => app.quit()
  }
}

/**
 * Called after settings are persisted. If the timer is idle or at the very
 * beginning of a phase (not yet started / remaining == totalSeconds), reset
 * the current-phase duration to the newly saved values and broadcast so the
 * renderer reflects the change immediately.
 */
function onSettingsChanged() {
  const phaseDuration = state.phase === 'idle'
    ? getPhaseDuration('work')
    : getPhaseDuration(state.phase)

  if (!state.isRunning && (state.phase === 'idle' || state.remaining === state.totalSeconds)) {
    state.totalSeconds = phaseDuration
    state.remaining = phaseDuration
  }
  broadcastTick()
}

export { startTimer, pauseTimer, resetTimer, skipPhase, getTrayControls, onSettingsChanged }

export function registerTimerIpc() {
  ipcMain.handle('timer:getState', () => {
    const settings = getSettings()
    return {
      phase: state.phase,
      remaining: state.remaining,
      totalSeconds: state.totalSeconds,
      isRunning: state.isRunning,
      pomodoroCount: state.pomodoroCount,
      currentTaskId: state.currentTaskId,
      longBreakInterval: settings.longBreakInterval || 4
    }
  })

  ipcMain.on('timer:start', () => startTimer())
  ipcMain.on('timer:pause', () => pauseTimer())
  ipcMain.on('timer:reset', () => resetTimer())
  ipcMain.on('timer:skip', () => skipPhase())

  ipcMain.on('timer:setTask', (_, taskId) => {
    state.currentTaskId = taskId
  })
}
