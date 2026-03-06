import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { readData } from '../store.js'

let miniWindow = null

export function createMiniWindow() {
  const settings = readData('settings')
  const savedSize = Math.max(120, Math.min(400, settings.miniSize || 180))

  const savedOpacity = Math.max(0.1, Math.min(1.0, settings.miniOpacity ?? 0.92))

  miniWindow = new BrowserWindow({
    width: savedSize,
    height: savedSize,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minWidth: 120,
    minHeight: 120,
    maxWidth: 400,
    maxHeight: 400,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Enforce square aspect ratio
  miniWindow.setAspectRatio(1)
  miniWindow.setOpacity(savedOpacity)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    miniWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/mini')
  } else {
    miniWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/mini'
    })
  }

  return miniWindow
}

export function getMiniWindow() {
  return miniWindow
}
