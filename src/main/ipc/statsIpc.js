import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readData, writeData } from '../store.js'
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

function getDateRange(period) {
  const now = new Date()
  const start = new Date()
  if (period === 'day') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { start, end: now }
}

function aggregateRecords(records, start, end) {
  const filtered = records.filter((r) => {
    const t = new Date(r.startTime)
    return t >= start && t <= end && r.type === 'work'
  })
  const totalPomodoros = filtered.filter((r) => r.completed).length
  const totalMinutes = filtered
    .filter((r) => r.completed)
    .reduce((sum, r) => {
      const s = new Date(r.startTime)
      const e = new Date(r.endTime)
      return sum + Math.round((e - s) / 60000)
    }, 0)
  const tasks = readData('tasks')
  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // daily breakdown for chart (use local date to avoid UTC offset)
  const daily = {}
  filtered.forEach((r) => {
    if (!r.completed) return
    const day = new Date(r.startTime).toLocaleDateString('en-CA')
    daily[day] = (daily[day] || 0) + 1
  })

  return { totalPomodoros, totalMinutes, completedTasks, totalTasks, completionRate, daily }
}

function calculateStreak(records) {
  const completedDays = new Set()
  records.forEach((r) => {
    if (r.completed && r.type === 'work') {
      completedDays.add(new Date(r.startTime).toLocaleDateString('en-CA'))
    }
  })
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (completedDays.has(d.toLocaleDateString('en-CA'))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function registerStatsIpc() {
  ipcMain.handle('stats:get', (_, period = 'day') => {
    const allRecords = readData('records')
    const { start, end } = getDateRange(period)
    const result = aggregateRecords(allRecords, start, end)
    result.streak = calculateStreak(allRecords)
    return result
  })

  ipcMain.handle('record:save', (_, record) => {
    const records = readData('records')
    records.push({
      id: randomUUID(),
      taskId: record.taskId || null,
      type: record.type,
      startTime: record.startTime,
      endTime: new Date().toISOString(),
      completed: Boolean(record.completed)
    })
    writeData('records', records)
    return true
  })

  ipcMain.handle('stats:export', async (event, { format = 'json' }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win, {
      defaultPath: `pomodoro-export.${format}`,
      filters: format === 'json'
        ? [{ name: 'JSON', extensions: ['json'] }]
        : [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (result.canceled || !result.filePath) return false

    try {
      const records = readData('records')
      const tasks = readData('tasks')
      let content
      if (format === 'json') {
        content = JSON.stringify({ records, tasks }, null, 2)
      } else {
        const header = 'id,taskId,type,startTime,endTime,completed'
        const rows = records.map((r) =>
          `${r.id},${r.taskId || ''},${r.type},${r.startTime},${r.endTime},${r.completed}`
        )
        content = [header, ...rows].join('\n')
      }
      writeFileSync(result.filePath, content, 'utf-8')
      return true
    } catch (e) {
      console.error('Export failed:', e)
      return null
    }
  })
}
