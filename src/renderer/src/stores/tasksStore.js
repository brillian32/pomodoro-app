import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const loading = ref(false)

  async function fetchTasks() {
    loading.value = true
    try {
      tasks.value = await window.electronAPI.getTasks()
    } finally {
      loading.value = false
    }
  }

  // Listen for real-time task updates from main process (e.g. completedPomodoros++)
  function initTaskListener() {
    window.electronAPI.onTaskUpdated((updatedTask) => {
      const idx = tasks.value.findIndex((t) => t.id === updatedTask.id)
      if (idx !== -1) {
        tasks.value[idx] = { ...tasks.value[idx], ...updatedTask }
      }
    })
  }

  async function createTask(data) {
    const task = await window.electronAPI.createTask(data)
    tasks.value.push(task)
    return task
  }

  async function updateTask(data) {
    const updated = await window.electronAPI.updateTask(data)
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === updated.id)
      if (idx !== -1) tasks.value[idx] = updated
    }
    return updated
  }

  async function deleteTask(id) {
    await window.electronAPI.deleteTask(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function toggleComplete(id) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) await updateTask({ id, completed: !task.completed })
  }

  return { tasks, loading, fetchTasks, initTaskListener, createTask, updateTask, deleteTask, toggleComplete }
})
