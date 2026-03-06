import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { getMainWindow } from './windows/mainWindow.js'

let tray = null
const phaseLabels = { work: '🍅 工作中', short_break: '☕ 短休息', long_break: '🌙 长休息', idle: '⏸ 待机' }

export function createTray(iconPath, timerControls) {
  const img = nativeImage.createFromPath(iconPath)
  tray = new Tray(img.resize({ width: 16, height: 16 }))
  tray.setToolTip('番茄时钟')
  updateTrayMenu(timerControls)

  tray.on('double-click', () => {
    const win = getMainWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })

  return tray
}

export function updateTrayMenu(timerControls) {
  if (!tray) return
  const { phase = 'idle', isRunning = false, start, pause, reset, quit } = timerControls
  const menu = Menu.buildFromTemplate([
    { label: phaseLabels[phase] || '番茄时钟', enabled: false },
    { type: 'separator' },
    {
      label: isRunning ? '暂停' : '开始',
      click: isRunning ? pause : start
    },
    { label: '重置', click: reset },
    { type: 'separator' },
    {
      label: '显示主窗口',
      click: () => {
        const win = getMainWindow()
        if (win) { win.show(); win.focus() }
      }
    },
    { type: 'separator' },
    { label: '退出', click: quit }
  ])
  tray.setContextMenu(menu)
}

export function getTray() {
  return tray
}
