<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toastStore.toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
        >
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@renderer/stores/toastStore.js'
const toastStore = useToastStore()
const icons = { success: '✓', error: '✕', info: 'ℹ' }
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  white-space: nowrap;
}
.toast.success { background: rgba(52, 211, 153, 0.25); border: 1px solid rgba(52, 211, 153, 0.5); }
.toast.error   { background: rgba(248, 113, 113, 0.25); border: 1px solid rgba(248, 113, 113, 0.5); }
.toast.info    { background: rgba(167, 139, 250, 0.25); border: 1px solid rgba(167, 139, 250, 0.5); }
.toast-icon    { font-size: 14px; font-weight: 700; }

/* TransitionGroup */
.toast-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(12px); }
.toast-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
