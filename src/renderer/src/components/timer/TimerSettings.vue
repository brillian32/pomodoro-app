<template>
  <BaseModal v-model="show" :title="t('settings.title')">
    <div class="settings-form">
      <div class="field" v-for="item in fields" :key="item.key">
        <label>{{ item.label }}</label>
        <div class="slider-row">
          <input
            type="range"
            :min="item.min" :max="item.max" :step="item.step"
            v-model.number="form[item.key]"
          />
          <span class="val">{{ displayVal(item) }}</span>
        </div>
      </div>

      <div class="field">
        <label>{{ t('settings.autoStartBreak') }}</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.autoStartBreak" />
          <span class="slider" />
        </label>
      </div>
      <div class="field">
        <label>{{ t('settings.autoStartWork') }}</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.autoStartWork" />
          <span class="slider" />
        </label>
      </div>
      <div class="field">
        <label>{{ t('settings.soundEnabled') }}</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.soundEnabled" />
          <span class="slider" />
        </label>
      </div>
      <div class="field">
        <label>{{ t('settings.openAtLogin') }}</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.openAtLogin" />
          <span class="slider" />
        </label>
      </div>

      <!-- Mini window section -->
      <div class="section-divider">{{ t('settings.miniSection') }}</div>
      <div class="field" v-for="item in miniFields" :key="item.key">
        <label>{{ item.label }}</label>
        <div class="slider-row">
          <input
            type="range"
            :min="item.min" :max="item.max" :step="item.step"
            v-model.number="form[item.key]"
          />
          <span class="val">{{ displayVal(item) }}</span>
        </div>
      </div>

      <!-- Hotkeys section -->
      <div class="section-divider">{{ t('settings.hotkeysSection') }}</div>
      <div class="field" v-for="hk in hotkeyFields" :key="hk.key">
        <label>{{ hk.label }}</label>
        <button
          class="hotkey-btn"
          :class="{ capturing: capturing === hk.key }"
          @click="startCapture(hk.key)"
        >
          {{ capturing === hk.key ? t('settings.capturing') : (form.hotkeys && form.hotkeys[hk.key]) || t('settings.notSet') }}
        </button>
      </div>
      <!-- Language section -->
      <div class="section-divider">{{ t('settings.language') }}</div>
      <div class="field">
        <label>{{ t('settings.language') }}</label>
        <div class="lang-switch">
          <button :class="{ active: locale === 'zh' }" @click="changeLanguage('zh')">&#x4E2D;&#x6587;</button>
          <button :class="{ active: locale === 'en' }" @click="changeLanguage('en')">English</button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from 'vue'
import BaseModal from '@renderer/components/common/BaseModal.vue'
import { useTimerStore } from '@renderer/stores/timerStore.js'
import { useI18nStore } from '@renderer/stores/i18nStore.js'
import { storeToRefs } from 'pinia'

const show = defineModel({ default: false })
const timerStore = useTimerStore()
const i18nStore = useI18nStore()
const { t } = i18nStore
const { locale } = storeToRefs(i18nStore)

const form = reactive({
  workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, longBreakInterval: 4,
  autoStartBreak: false, autoStartWork: false, soundEnabled: true,
  circleSize: 280, dailyGoal: 8,
  miniSize: 180, miniOpacity: 0.92,
  hotkeys: { toggleTimer: 'Ctrl+Alt+Space', skipPhase: 'Ctrl+Alt+S' },
  openAtLogin: false
})

const fields = computed(() => [
  { key: 'workDuration', label: t('settings.workDuration'), min: 0.5, max: 60, step: 0.5 },
  { key: 'shortBreakDuration', label: t('settings.shortBreakDuration'), min: 0.5, max: 30, step: 0.5 },
  { key: 'longBreakDuration', label: t('settings.longBreakDuration'), min: 0.5, max: 60, step: 0.5 },
  { key: 'longBreakInterval', label: t('settings.longBreakInterval'), min: 2, max: 8, step: 1 },
  { key: 'circleSize', label: t('settings.circleSize'), min: 180, max: 400, step: 10 },
  { key: 'dailyGoal', label: t('settings.dailyGoal'), min: 1, max: 20, step: 1 }
])

const miniFields = computed(() => [
  { key: 'miniSize', label: t('settings.miniSize'), min: 120, max: 400, step: 10 },
  { key: 'miniOpacity', label: t('settings.miniOpacity'), min: 0.1, max: 1.0, step: 0.05 }
])

const hotkeyFields = computed(() => [
  { key: 'toggleTimer', label: t('settings.toggleTimer') },
  { key: 'skipPhase', label: t('settings.skipPhase') }
])

const capturing = ref(null)
let _saveReady = false
let _saveTimer = null

function displayVal(item) {
  const v = form[item.key]
  if (item.key === 'longBreakInterval') return t('settings.units.pomodoros', { n: v })
  if (item.key === 'circleSize') return t('settings.units.px', { n: v })
  if (item.key === 'dailyGoal') return t('settings.units.pomodoros', { n: v })
  if (item.key === 'miniSize') return t('settings.units.px', { n: v })
  if (item.key === 'miniOpacity') return t('settings.units.percent', { n: Math.round(v * 100) })
  if (v < 1) return t('settings.units.seconds', { n: Math.round(v * 60) })
  return t('settings.units.minutes', { n: v })
}

// Load saved settings when modal opens
watch(show, async (v) => {
  if (v) {
    _saveReady = false
    const s = await window.electronAPI.getSettings()
    Object.assign(form, s)
    if (!form.hotkeys) form.hotkeys = { toggleTimer: 'Ctrl+Alt+Space', skipPhase: 'Ctrl+Alt+S' }
    timerStore.circleSize = s.circleSize || 280
    if (s.dailyGoal) timerStore.dailyGoal = s.dailyGoal
    await nextTick()
    _saveReady = true
  } else {
    _saveReady = false
    clearTimeout(_saveTimer)
    cancelCapture()
  }
})

// Deep watch on form — saves on ANY change (slider, checkbox, hotkey),
// debounced to 200ms to batch rapid slider drags.
// Uses JSON.stringify to observe deep changes and to strip Vue Proxy wrappers.
watch(
  () => JSON.stringify(form),
  () => {
    if (!_saveReady) return
    // Live preview for visual settings
    timerStore.circleSize = form.circleSize
    timerStore.dailyGoal = form.dailyGoal
    // Debounced save
    clearTimeout(_saveTimer)
    _saveTimer = setTimeout(save, 200)
  }
)

async function save() {
  try {
    // JSON round-trip strips Vue reactive Proxy wrappers for clean IPC
    const payload = JSON.parse(JSON.stringify(form))
    const result = await window.electronAPI.setSettings(payload)
    timerStore.applySettings(result)
  } catch (e) {
    console.error('[Settings] save failed:', e)
  }
}

// --- Hotkey capture ---
function startCapture(key) {
  capturing.value = key
  window.removeEventListener('keydown', onCaptureKey)
  window.addEventListener('keydown', onCaptureKey, true)  // useCapture 确保拦截
}

function cancelCapture() {
  capturing.value = null
  window.removeEventListener('keydown', onCaptureKey, true)
}

function onCaptureKey(e) {
  e.preventDefault()
  e.stopPropagation()

  // 仅按下修饰键时保持等待，不终止捕获
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return

  // 非修饰键：结束捕获
  window.removeEventListener('keydown', onCaptureKey, true)
  const key = capturing.value
  capturing.value = null

  if (e.key === 'Escape') return

  const parts = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')

  const k = e.key
  parts.push(k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k)

  // 至少需要一个修饰键
  if (parts.length >= 2) {
    form.hotkeys[key] = parts.join('+')
  }
}

function changeLanguage(lang) {
  i18nStore.setLocale(lang)
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

/* Language switch */
.lang-switch { display: flex; gap: 6px; }
.lang-switch button {
  padding: 5px 14px;
  border-radius: 8px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.65);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.lang-switch button:hover { background: rgba(255,255,255,0.12); color: #fff; }
.lang-switch button.active { background: rgba(167,139,250,0.25); border-color: var(--color-work); color: #fff; }
</style>
