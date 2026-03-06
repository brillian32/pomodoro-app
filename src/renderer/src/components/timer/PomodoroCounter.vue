<template>
  <div class="pomodoro-counter">
    <div
      v-for="i in store.longBreakInterval"
      :key="i"
      class="dot"
      :class="dotClass(i)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'

const store = useTimerStore()

// positionInCycle: 当前轮次中已完成的第几个（0 ~ longBreakInterval-1）
// e.g. pomodoroCount=5, interval=4 → 5%4=1 → 本轮已完成1个
function dotClass(i) {
  const interval = store.longBreakInterval || 4
  const completedInCycle = store.pomodoroCount % interval
  // 刚完成整轮时 completedInCycle===0，但 phase 已切到 break，视为全部完成
  const justFinishedCycle =
    store.pomodoroCount > 0 &&
    completedInCycle === 0 &&
    store.phase !== 'work' &&
    store.phase !== 'idle'
  const done = justFinishedCycle ? true : i <= completedInCycle
  const current = !done && store.phase === 'work' && i === completedInCycle + 1
  return { 'dot-done': done, 'dot-current': current }
}
</script>

<style scoped>
.pomodoro-counter {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
}
.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.dot-done {
  background: var(--color-work);
  border-color: var(--color-work);
  box-shadow: 0 0 6px rgba(167,139,250,0.6);
}
.dot-current {
  background: rgba(167,139,250,0.4);
  border-color: var(--color-work);
  transform: scale(1.2);
}
</style>
