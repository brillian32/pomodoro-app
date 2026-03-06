<template>
  <BaseModal v-model="show" title="计时器设置">
    <div class="settings-form">
      <div class="field" v-for="item in fields" :key="item.key">
        <label>{{ item.label }}</label>
        <div class="slider-row">
          <input
            type="range"
            :min="item.min" :max="item.max" :step="item.step"
            v-model.number="form[item.key]"
            @input="onSliderInput(item.key)"
            @change="save"
          />
          <span class="val">{{ displayVal(item) }}</span>
        </div>
      </div>

      <div class="field">
        <label>自动开始休息</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.autoStartBreak" @change="save" />
          <span class="slider" />
        </label>
      </div>
      <div class="field">
        <label>自动开始工作</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.autoStartWork" @change="save" />
          <span class="slider" />
        </label>
      </div>
      <div class="field">
        <label>声音提醒</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.soundEnabled" @change="save" />
          <span class="slider" />
        </label>
      </div>

      <!-- Mini window section -->
      <div class="section-divider">小窗口</div>
      <div class="field" v-for="item in miniFields" :key="item.key">
        <label>{{ item.label }}</label>
        <div class="slider-row">
          <input
            type="range"
            :min="item.min" :max="item.max" :step="item.step"
            v-model.number="form[item.key]"
            @change="save"
          />
          <span class="val">{{ displayVal(item) }}</span>
        </div>
      </div>

      <!-- Hotkeys section -->
      <div class="section-divider">快捷键</div>
      <div class="field" v-for="hk in hotkeyFields" :key="hk.key">
        <label>{{ hk.label }}</label>
        <button
          class="hotkey-btn"
          :class="{ capturing: capturing === hk.key }"
          @click="startCapture(hk.key)"
        >
          {{ capturing === hk.key ? '按下组合键 (Esc取消)…' : (form.hotkeys && form.hotkeys[hk.key]) || '未设置' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import BaseModal from '@renderer/components/common/BaseModal.vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'

const show = defineModel({ default: false })
const timerStore = useTimerStore()

const form = reactive({
  workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, longBreakInterval: 4,
  autoStartBreak: false, autoStartWork: false, soundEnabled: true,
  circleSize: 280, dailyGoal: 8,
  miniSize: 180, miniOpacity: 0.92,
  hotkeys: { toggleTimer: 'Ctrl+Alt+Space', skipPhase: 'Ctrl+Alt+S' }
})

const fields = [
  { key: 'workDuration', label: '工作时长', min: 0.5, max: 60, step: 0.5 },
  { key: 'shortBreakDuration', label: '短休息时长', min: 0.5, max: 30, step: 0.5 },
  { key: 'longBreakDuration', label: '长休息时长', min: 0.5, max: 60, step: 0.5 },
  { key: 'longBreakInterval', label: '长休息间隔', min: 2, max: 8, step: 1 },
  { key: 'circleSize', label: '圆盘大小', min: 180, max: 400, step: 10 },
  { key: 'dailyGoal', label: '今日目标', min: 1, max: 20, step: 1 }
]

const miniFields = [
  { key: 'miniSize', label: '小窗口大小', min: 120, max: 400, step: 10 },
  { key: 'miniOpacity', label: '小窗口透明度', min: 0.1, max: 1.0, step: 0.05 }
]

const hotkeyFields = [
  { key: 'toggleTimer', label: '播放/暂停' },
  { key: 'skipPhase', label: '跳过阶段' }
]

const capturing = ref(null)

function displayVal(item) {
  const v = form[item.key]
  if (item.key === 'longBreakInterval') return `${v} 个番茄`
  if (item.key === 'circleSize') return `${v} px`
  if (item.key === 'dailyGoal') return `${v} 个番茄`
  if (item.key === 'miniSize') return `${v} px`
  if (item.key === 'miniOpacity') return `${Math.round(v * 100)} %`
  if (v < 1) return `${Math.round(v * 60)} 秒`
  return `${v} 分钟`
}

watch(show, async (v) => {
  if (v) {
    const s = await window.electronAPI.getSettings()
    Object.assign(form, s)
    if (!form.hotkeys) form.hotkeys = { toggleTimer: 'Ctrl+Alt+Space', skipPhase: 'Ctrl+Alt+S' }
    timerStore.circleSize = s.circleSize || 280
    if (s.dailyGoal) timerStore.dailyGoal = s.dailyGoal
  } else {
    // Clean up any pending capture when modal closes
    cancelCapture()
  }
})

function onSliderInput(key) {
  if (key === 'circleSize') timerStore.circleSize = form.circleSize
  if (key === 'dailyGoal') timerStore.dailyGoal = form.dailyGoal
}

async function save() {
  const result = await window.electronAPI.setSettings({ ...form })
  timerStore.applySettings(result)
}

// --- Hotkey capture ---
function startCapture(key) {
  capturing.value = key
  window.removeEventListener('keydown', onCaptureKey)
  window.addEventListener('keydown', onCaptureKey)
}

function cancelCapture() {
  capturing.value = null
  window.removeEventListener('keydown', onCaptureKey)
}

function onCaptureKey(e) {
  e.preventDefault()
  window.removeEventListener('keydown', onCaptureKey)
  const key = capturing.value
  capturing.value = null

  if (e.key === 'Escape') return

  const parts = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')

  const k = e.key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(k)) {
    parts.push(k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k)
  }

  // Require at least one modifier
  if (parts.length >= 2) {
    form.hotkeys[key] = parts.join('+')
    save()
  }
}
</script>

<style scoped>
.settings-form { display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
label { font-size: 14px; color: rgba(255,255,255,0.8); min-width: 100px; }
.slider-row { display: flex; align-items: center; gap: 10px; flex: 1; }

input[type=range] {
  flex: 1; accent-color: var(--color-work);
  cursor: pointer; height: 4px;
}
.val { font-size: 13px; color: var(--color-work); min-width: 54px; text-align: right; }

/* Section divider */
.section-divider {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.08);
  margin-top: 4px;
}

/* Hotkey button */
.hotkey-btn {
  padding: 5px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  font-family: monospace;
  cursor: pointer;
  min-width: 160px;
  text-align: center;
  transition: all 0.2s;
}
.hotkey-btn:hover { background: rgba(255,255,255,0.12); }
.hotkey-btn.capturing {
  border-color: var(--color-work);
  color: var(--color-work);
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0.5; } }

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: 44px;
  min-width: 44px;
  height: 24px;
  cursor: pointer;
}
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle .slider {
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.15);
  border-radius: 24px;
  transition: 0.3s;
  border: 1px solid rgba(255,255,255,0.2);
}
.toggle .slider::before {
  content: '';
  position: absolute; height: 18px; width: 18px;
  left: 3px; bottom: 2px;
  background: #fff; border-radius: 50%;
  transition: 0.3s;
}
.toggle input:checked + .slider { background: var(--color-work); border-color: var(--color-work); }
.toggle input:checked + .slider::before { transform: translateX(20px); }
</style>
