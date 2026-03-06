import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Timer
  getTimerState: () => ipcRenderer.invoke('timer:getState'),
  startTimer: () => ipcRenderer.send('timer:start'),
  pauseTimer: () => ipcRenderer.send('timer:pause'),
  resetTimer: () => ipcRenderer.send('timer:reset'),
  skipTimer: () => ipcRenderer.send('timer:skip'),
  setTimerTask: (taskId) => ipcRenderer.send('timer:setTask', taskId),
  onTimerTick: (cb) => {
    ipcRenderer.on('timer:tick', (_, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('timer:tick')
  },
  onPhaseChange: (cb) => {
    ipcRenderer.on('timer:phaseChange', (_, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('timer:phaseChange')
  },

  // Tasks
  getTasks: () => ipcRenderer.invoke('tasks:getAll'),
  createTask: (data) => ipcRenderer.invoke('tasks:create', data),
  updateTask: (data) => ipcRenderer.invoke('tasks:update', data),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  onTaskUpdated: (cb) => {
    ipcRenderer.on('tasks:taskUpdated', (_, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('tasks:taskUpdated')
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (data) => ipcRenderer.invoke('settings:set', data),

  // Stats
  getStats: (period) => ipcRenderer.invoke('stats:get', period),
  exportStats: (format) => ipcRenderer.invoke('stats:export', { format }),

  // Window
  showMain: () => ipcRenderer.send('window:showMain'),
  showMini: () => ipcRenderer.send('window:showMini'),
  startDrag: () => ipcRenderer.send('window:startDrag'),
  dragMove: () => ipcRenderer.send('window:dragMove'),
  stopDrag: () => ipcRenderer.send('window:stopDrag'),

  // Mini window settings push
  onMiniSettingsUpdated: (cb) => {
    ipcRenderer.on('mini:settingsUpdated', (_, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('mini:settingsUpdated')
  }
})
