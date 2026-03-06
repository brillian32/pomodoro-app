import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import zh from '../locales/zh.js'
import en from '../locales/en.js'

const catalog = { zh, en }

export const useI18nStore = defineStore('i18n', () => {
  // Fast initial value from localStorage to avoid flicker
  const locale = ref(localStorage.getItem('pomodoro-locale') || 'zh')

  const msgs = computed(() => catalog[locale.value] || catalog.zh)

  function t(key, params = {}) {
    const parts = key.split('.')
    let val = msgs.value
    for (const part of parts) {
      val = val?.[part]
      if (val === undefined) break
    }

    if (val === undefined) {
      val = zh
      for (const part of parts) {
        val = val?.[part]
        if (val === undefined) break
      }
    }

    if (typeof val !== 'string') return val ?? key
    return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`))
  }

  async function setLocale(lang) {
    if (lang !== 'zh' && lang !== 'en') return
    locale.value = lang
    localStorage.setItem('pomodoro-locale', lang)
    await window.electronAPI.setSettings({ language: lang })
  }

  async function init() {
    try {
      const s = await window.electronAPI.getSettings()
      const lang = s.language === 'en' ? 'en' : 'zh'
      locale.value = lang
      localStorage.setItem('pomodoro-locale', lang)
    } catch {
      // keep default locale
    }
  }

  return { locale, t, setLocale, init }
})
