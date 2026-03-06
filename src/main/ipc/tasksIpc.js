import { ipcMain } from 'electron'
import { readData, writeData } from '../store.js'
import { randomUUID } from 'crypto'

export function registerTasksIpc() {
  ipcMain.handle('tasks:getAll', () => readData('tasks'))

  ipcMain.handle('tasks:create', (_, { title, estimatedPomodoros = 1, createdAt }) => {
    const tasks = readData('tasks')
    const task = {
      id: randomUUID(),
      title: String(title).trim().slice(0, 200),
      estimatedPomodoros: Math.max(1, Math.min(20, Number(estimatedPomodoros))),
      completedPomodoros: 0,
      completed: false,
      createdAt: createdAt && /^\d{4}-\d{2}-\d{2}T/.test(createdAt)
        ? createdAt
        : new Date().toISOString()
    }
    tasks.push(task)
    writeData('tasks', tasks)
    return task
  })

  ipcMain.handle('tasks:update', (_, { id, ...updates }) => {
    const tasks = readData('tasks')
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx === -1) return null
    // Only allow safe fields to be updated
    const allowed = ['title', 'estimatedPomodoros', 'completed', 'completedPomodoros', 'createdAt']
    allowed.forEach((key) => {
      if (key in updates) {
        if (key === 'title') tasks[idx][key] = String(updates[key]).trim().slice(0, 200)
        else if (key === 'createdAt') {
          // Only allow valid ISO date strings
          if (/^\d{4}-\d{2}-\d{2}T/.test(String(updates[key]))) {
            tasks[idx][key] = updates[key]
          }
        } else tasks[idx][key] = updates[key]
      }
    })
    writeData('tasks', tasks)
    return tasks[idx]
  })

  ipcMain.handle('tasks:delete', (_, id) => {
    const tasks = readData('tasks')
    const filtered = tasks.filter((t) => t.id !== id)
    writeData('tasks', filtered)
    return true
  })
}
