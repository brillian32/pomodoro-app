import { Notification } from 'electron'

const messages = {
  work_start: { title: '🍅 开始工作', body: '专注时间开始！加油～' },
  short_break_start: { title: '☕ 短暂休息', body: '很棒！休息 5 分钟吧' },
  long_break_start: { title: '🌙 长休息', body: '完成了 4 个番茄！好好休息 15 分钟' }
}

export function sendNotification(type) {
  const msg = messages[type]
  if (!msg || !Notification.isSupported()) return
  new Notification({ title: msg.title, body: msg.body }).show()
}
