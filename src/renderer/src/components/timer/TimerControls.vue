<template>
  <div class="controls">
    <button class="ctrl-btn secondary" :disabled="!canReset" @click="store.reset()" :title="t('controls.reset')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>

    <button class="ctrl-btn primary" @click="togglePlay" :title="store.isRunning ? t('timer.pause') : t('timer.start')">
      <svg v-if="!store.isRunning" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    </button>

    <button class="ctrl-btn secondary" @click="store.skip()" :title="t('controls.skip')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const store = useTimerStore()
const { t } = useI18nStore()
const canReset = computed(() => store.phase !== 'idle')

function togglePlay() {
  if (store.isRunning) store.pause()
  else store.start()
}
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 20px;
}
.ctrl-btn {
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.primary {
  width: 64px; height: 64px;
  background: var(--color-work);
  color: #fff;
  box-shadow: 0 4px 20px rgba(167,139,250,0.45);
}
.primary:hover {
  filter: brightness(1.12);
  transform: scale(1.06);
  box-shadow: 0 6px 28px rgba(167,139,250,0.6);
}

.secondary {
  width: 48px; height: 48px;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.15);
}
.secondary:hover:not(:disabled) {
  background: rgba(255,255,255,0.18);
  color: #fff;
  transform: scale(1.05);
}
</style>
