import { Notification } from 'electron'
import { readData } from './store.js'

const messages = {
  zh: {
    work_start: { title: '🍅 开始工作', body: '专注时间开始！加油～' },
    short_break_start: { title: '☕ 短暂休息', body: '很棒！休息 5 分钟吧' },
    long_break_start: { title: '🌙 长休息', body: '完成了 4 个番茄！好好休息 15 分钟' }
  },
  en: {
    work_start: { title: '🍅 Work Time', body: "Focus session started! Let's go!" },
    short_break_start: { title: '☕ Short Break', body: 'Great job! Take a 5-minute break.' },
    long_break_start: { title: '🌙 Long Break', body: '4 pomodoros done! Enjoy a 15-minute break.' }
  }
}

export function sendNotification(type) {
  if (!Notification.isSupported()) return
  const settings = readData('settings') || {}
  const lang = settings.language === 'en' ? 'en' : 'zh'
  const msg = messages[lang][type]
  if (!msg) return
  new Notification({ title: msg.title, body: msg.body }).show()
}
