import { app, ipcMain, screen, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { join } from 'path'
import { createMainWindow } from './windows/mainWindow.js'
import { createMiniWindow } from './windows/miniWindow.js'
import { createTray } from './tray.js'
import { registerTimerIpc, getTrayControls, startTimer, pauseTimer, skipPhase, onSettingsChanged } from './ipc/timerIpc.js'
import { registerTasksIpc } from './ipc/tasksIpc.js'
import { registerStatsIpc } from './ipc/statsIpc.js'
import { registerSettingsIpc } from './ipc/settingsIpc.js'
import { readData, writeData } from './store.js'

// Chromium accelerator 不支持 "ArrowXxx"，需转换为 "Up/Down/Left/Right"
function normalizeAccelerator(accel) {
  if (!accel) return accel
  return accel.replace(/Arrow(Up|Down|Left|Right)/g, '$1')
}

function applyHotkeys(hotkeys) {
  globalShortcut.unregisterAll()
  if (!hotkeys) return
  try {
    if (hotkeys.toggleTimer && hotkeys.toggleTimer.trim()) {
      const ok = globalShortcut.register(normalizeAccelerator(hotkeys.toggleTimer), () => {
        const c = getTrayControls()
        if (c.isRunning) pauseTimer()
        else startTimer()
      })
      if (!ok) console.warn('[hotkey] Could not register:', hotkeys.toggleTimer)
    }
    if (hotkeys.skipPhase && hotkeys.skipPhase.trim()) {
      const ok = globalShortcut.register(normalizeAccelerator(hotkeys.skipPhase), () => skipPhase())
      if (!ok) console.warn('[hotkey] Could not register:', hotkeys.skipPhase)
    }
  } catch (e) {
    console.error('[hotkey] Registration error:', e)
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.pomodoro.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createMainWindow()
  const miniWindow = createMiniWindow()

  // Save mini window size on resize (guarded: not during IPC drag or programmatic resize)
  let miniDragging = false
  let miniResizing = false
  miniWindow.on('resized', () => {
    if (miniWindow.isDestroyed() || miniDragging || miniResizing) return
    const [w] = miniWindow.getSize()
    const s = readData('settings')
    writeData('settings', { ...s, miniSize: w })
  })

  // Window switch: minimize → show mini
  mainWindow.on('minimize', (e) => {
    e.preventDefault()
    mainWindow.hide()
    miniWindow.show()
  })

  mainWindow.on('close', () => {
    app.quit()
  })

  // IPC: window controls
  ipcMain.on('window:showMain', () => {
    miniWindow.hide()
    mainWindow.show()
    mainWindow.focus()
  })

  ipcMain.on('window:showMini', () => {
    mainWindow.hide()
    miniWindow.show()
  })

  // IPC: mini window drag — event-driven (no polling, no timer jitter)
  // Captures cursor-to-window offset at drag start so the window never jumps.
  let dragOffset = null   // { x, y, w } relative offset of cursor from window top-left

  // dragLock is sent on mousedown (before any movement) to immediately disable
  // native resize handles -- this prevents Windows from resizing the transparent
  // window before our custom drag begins, which was the root cause of the
  // intermittent "window suddenly becomes larger on drag" bug.
  ipcMain.on('window:dragLock', () => {
    if (miniWindow.isDestroyed()) return
    miniDragging = true
    miniWindow.setResizable(false)
  })

  ipcMain.on('window:startDrag', () => {
    if (miniWindow.isDestroyed()) return
    miniDragging = true
    const cursor = screen.getCursorScreenPoint()
    const [wx, wy] = miniWindow.getPosition()
    const [initialW] = miniWindow.getSize()
    dragOffset = { x: cursor.x - wx, y: cursor.y - wy, w: initialW }
  })

  ipcMain.on('window:dragMove', () => {
    if (!dragOffset || miniWindow.isDestroyed()) return
    const cursor = screen.getCursorScreenPoint()
    // Use setBounds (position + size atomically) to prevent Windows from
    // drifting the transparent window size on each SetWindowPos call
    miniWindow.setBounds({
      x: Math.round(cursor.x - dragOffset.x),
      y: Math.round(cursor.y - dragOffset.y),
      width: dragOffset.w,
      height: dragOffset.w
    })
  })

  ipcMain.on('window:stopDrag', () => {
    miniDragging = false
    dragOffset = null
    if (!miniWindow.isDestroyed()) miniWindow.setResizable(true)
  })

  registerTimerIpc()
  registerTasksIpc()
  registerStatsIpc()
  registerSettingsIpc((merged) => {
    if (merged.hotkeys) applyHotkeys(merged.hotkeys)
    onSettingsChanged()
    if (!miniWindow.isDestroyed()) {
      if ('miniSize' in merged) {
        const sz = Math.max(120, Math.min(400, merged.miniSize))
        miniResizing = true
        miniWindow.setSize(sz, sz)
        setTimeout(() => { miniResizing = false }, 500)
      }
      // Push opacity + size to mini renderer via IPC (setOpacity conflicts with
      // per-pixel alpha on transparent Windows windows)
      miniWindow.webContents.send('mini:settingsUpdated', {
        miniOpacity: merged.miniOpacity,
        miniSize: merged.miniSize
      })
    }
  })

  // Apply initial global hotkeys from saved settings
  const initSettings = readData('settings')
  applyHotkeys(initSettings.hotkeys)

  const iconPath = join(__dirname, '../../resources/icon.png')
  createTray(iconPath, { ...getTrayControls(), quit: () => app.quit() })

  app.on('activate', () => {
    mainWindow.show()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
