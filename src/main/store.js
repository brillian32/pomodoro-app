import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

const userDataPath = app.getPath('userData')

const DEFAULTS = {
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreak: false,
    autoStartWork: false,
    soundEnabled: true,
    circleSize: 280,
    dailyGoal: 8,
    miniSize: 180,
    miniOpacity: 0.92,
    hotkeys: {
      toggleTimer: 'Ctrl+Alt+Space',
      skipPhase: 'Ctrl+Alt+S'
    }
  },
  tasks: [],
  records: []
}

function getFilePath(name) {
  return join(userDataPath, `${name}.json`)
}

function ensureFile(name) {
  const filePath = getFilePath(name)
  if (!existsSync(filePath)) {
    mkdirSync(userDataPath, { recursive: true })
    writeFileSync(filePath, JSON.stringify(DEFAULTS[name], null, 2), 'utf-8')
  }
}

export function readData(name) {
  ensureFile(name)
  try {
    const data = JSON.parse(readFileSync(getFilePath(name), 'utf-8'))
    // Merge with DEFAULTS so new fields are always present
    if (name === 'settings') return { ...DEFAULTS.settings, ...data }
    return data
  } catch {
    return DEFAULTS[name]
  }
}

export function writeData(name, data) {
  mkdirSync(userDataPath, { recursive: true })
  writeFileSync(getFilePath(name), JSON.stringify(data, null, 2), 'utf-8')
}
