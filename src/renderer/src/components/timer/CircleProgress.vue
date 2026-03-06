<template>
  <div class="circle-wrap">
    <svg :width="size" :height="size" class="circle-svg">
      <!-- Track -->
      <circle
        :cx="center" :cy="center" :r="radius"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        :stroke-width="strokeWidth"
      />
      <!-- Progress arc -->
      <circle
        :cx="center" :cy="center" :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90)"
        :transform-origin="`${center} ${center}`"
        :class="['progress-arc', { 'progress-arc-paused': paused }]"
      />
    </svg>
    <!-- Center content slot -->
    <div class="circle-center">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },   // 0–1
  color: { type: String, default: 'var(--color-work)' },
  size: { type: Number, default: 260 },
  strokeWidth: { type: Number, default: 10 },
  paused: { type: Boolean, default: false }
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth * 2) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - props.progress))
</script>

<style scoped>
.circle-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.circle-svg { display: block; }
.progress-arc { transition: stroke-dashoffset 0.8s ease, stroke 0.5s ease; }
@keyframes breath {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.progress-arc-paused { animation: breath 2.5s ease-in-out infinite; }
.circle-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
