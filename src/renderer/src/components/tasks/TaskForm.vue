<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :title="editTask ? t('tasks.editTask') : t('tasks.newTask')">
    <form @submit.prevent="submit" class="task-form">
      <div class="field">
        <label>{{ t('tasks.nameLabel') }}</label>
        <input
          v-model="form.title"
          type="text"
          class="glass-input"
          :placeholder="t('tasks.namePlaceholder')"
          maxlength="200"
          required
          autofocus
        />
      </div>
      <div class="field">
        <label>{{ t('tasks.pomodoroLabel') }}</label>
        <div class="tomato-picker">
          <button type="button" class="step-btn" @click="form.estimatedPomodoros = Math.max(1, form.estimatedPomodoros - 1)">−</button>
          <span class="tomato-count">{{ form.estimatedPomodoros }} 🍅</span>
          <button type="button" class="step-btn" @click="form.estimatedPomodoros = Math.min(20, form.estimatedPomodoros + 1)">+</button>
        </div>
      </div>
      <div class="field">
        <label>{{ t('tasks.dateLabel') }}</label>
        <input
          v-model="form.date"
          type="date"
          class="glass-input date-input"
        />
      </div>
      <div class="actions">
        <button type="button" class="btn-cancel" @click="$emit('update:modelValue', false)">{{ t('tasks.cancel') }}</button>
        <button type="submit" class="btn-submit">{{ editTask ? t('tasks.save') : t('tasks.create') }}</button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '@renderer/components/common/BaseModal.vue'
import { useI18nStore } from '@renderer/stores/i18nStore.js'

const { t } = useI18nStore()

const props = defineProps({
  modelValue: Boolean,
  editTask: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({ title: '', estimatedPomodoros: 1, date: '' })

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

watch(() => props.modelValue, (v) => {
  if (v) {
    form.title = props.editTask?.title || ''
    form.estimatedPomodoros = props.editTask?.estimatedPomodoros || 1
    // For editing: use existing date; for new task: default to today
    form.date = props.editTask?.createdAt
      ? props.editTask.createdAt.slice(0, 10)
      : todayStr()
  }
})

function submit() {
  if (!form.title.trim()) return
  // Build ISO timestamp from selected date (use noon to avoid TZ issues)
  const createdAt = form.date
    ? new Date(`${form.date}T12:00:00`).toISOString()
    : new Date().toISOString()
  emit('save', { title: form.title.trim(), estimatedPomodoros: form.estimatedPomodoros, id: props.editTask?.id, createdAt })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.task-form { display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
label { font-size: 13px; color: rgba(255,255,255,0.6); }

.glass-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  color: #fff;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.glass-input:focus { border-color: var(--color-work); }
.glass-input::placeholder { color: rgba(255,255,255,0.3); }

.date-input {
  color-scheme: dark;
  cursor: pointer;
}

.tomato-picker { display: flex; align-items: center; gap: 16px; }
.step-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; font-size: 18px; cursor: pointer; line-height: 1;
  transition: all 0.2s;
}
.step-btn:hover { background: rgba(167,139,250,0.3); }
.tomato-count { font-size: 16px; font-weight: 600; color: #fff; min-width: 60px; text-align: center; }

.actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel {
  padding: 9px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
  background: transparent; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 14px;
  transition: all 0.2s;
}
.btn-cancel:hover { background: rgba(255,255,255,0.08); color: #fff; }
.btn-submit {
  padding: 9px 24px; border-radius: 10px; border: none;
  background: var(--color-work); color: #fff; cursor: pointer; font-size: 14px; font-weight: 600;
  transition: all 0.2s;
}
.btn-submit:hover { filter: brightness(1.1); transform: translateY(-1px); }
</style>
