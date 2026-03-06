import { ipcMain } from 'electron'
import { readData, writeData } from '../store.js'

export function registerSettingsIpc(onSettingsApplied) {
  ipcMain.handle('settings:get', () => readData('settings'))

  ipcMain.handle('settings:set', (_, updates) => {
    const current = readData('settings')
    const allowed = ['workDuration', 'shortBreakDuration', 'longBreakDuration', 'longBreakInterval', 'autoStartBreak', 'autoStartWork', 'soundEnabled', 'circleSize', 'dailyGoal', 'miniSize', 'miniOpacity']
    const merged = { ...current }
    allowed.forEach((key) => {
      if (key in updates) merged[key] = updates[key]
    })
    // Clamp numeric values
    merged.workDuration = Math.max(0.5, Math.min(60, Number(merged.workDuration)))
    merged.shortBreakDuration = Math.max(0.5, Math.min(30, Number(merged.shortBreakDuration)))
    merged.longBreakDuration = Math.max(0.5, Math.min(60, Number(merged.longBreakDuration)))
    merged.longBreakInterval = Math.max(2, Math.min(8, Number(merged.longBreakInterval)))
    if ('circleSize' in merged) merged.circleSize = Math.max(180, Math.min(400, Number(merged.circleSize)))
    if ('dailyGoal' in merged) merged.dailyGoal = Math.max(1, Math.min(20, Number(merged.dailyGoal)))
    if ('miniSize' in merged) merged.miniSize = Math.max(120, Math.min(400, Number(merged.miniSize)))
    if ('miniOpacity' in merged) merged.miniOpacity = Math.max(0.1, Math.min(1.0, Number(merged.miniOpacity)))
    if ('hotkeys' in updates && updates.hotkeys && typeof updates.hotkeys === 'object') {
      merged.hotkeys = {
        toggleTimer: String(updates.hotkeys.toggleTimer || '').slice(0, 60),
        skipPhase: String(updates.hotkeys.skipPhase || '').slice(0, 60)
      }
    }
    writeData('settings', merged)
    if (onSettingsApplied) onSettingsApplied(merged)
    return merged
  })
}
