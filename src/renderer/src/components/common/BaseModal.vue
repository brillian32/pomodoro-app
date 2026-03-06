<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <transition name="slide-up">
          <div v-if="modelValue" class="modal-box glass rounded-2xl">
            <div class="modal-header">
              <span class="modal-title">{{ title }}</span>
              <button class="close-btn" @click="$emit('update:modelValue', false)">✕</button>
            </div>
            <div class="modal-body">
              <slot />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({ modelValue: Boolean, title: String })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: min(480px, 90vw);
  max-height: 80vh;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.modal-title { font-size: 16px; font-weight: 600; color: #fff; }
.close-btn {
  background: none; border: none; color: rgba(255,255,255,0.5);
  cursor: pointer; font-size: 16px; padding: 4px; line-height: 1;
  transition: color 0.2s;
}
.close-btn:hover { color: #fff; }
.modal-body { padding: 20px; overflow-y: auto; }
</style>
