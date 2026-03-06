# 番茄时钟 — 功能增强、Bug修复与交互优化实施计划

> 版本日期: 2026-03-06  
> 声音方案: Web Audio API beep（默认，零文件依赖）  
> 氛围音: 不实施  
> 全局热键: 支持用户自定义  

---

## Phase 1 — Bug 修复

### BUG-1 · 声音提醒完全失效 ⚠️ 高优先级
**根因**: `soundEnabled` 设置存在于 UI 和 store，但没有任何音频播放代码。

**方案**:
- `timerStore.js` 的 `init()` 中缓存 `soundEnabled` 设置
- 在 `onPhaseChange` 回调中调用 `playBeep()`
- `playBeep()`: 用 Web Audio API 生成 440Hz 正弦波，持续 0.3s，受 `soundEnabled` 控制

**涉及文件**:
- `src/renderer/src/stores/timerStore.js`

---

### BUG-2 · 统计日期时区偏移
**根因**: `toISOString().slice(0, 10)` 使用 UTC 日期，本地跨午夜的记录会统计到错误的日期。

**方案**: 替换为 `new Date(r.startTime).toLocaleDateString('en-CA')` 获得本地 YYYY-MM-DD。

**涉及文件**:
- `src/main/ipc/statsIpc.js`

---

### BUG-3 · Mini 窗口拖拽 Interval 泄漏
**根因**: `ipcMain.once('window:stopDrag', ...)` 是单次监听，若渲染进程意外重载，stop 事件丢失，16ms 定时器永不停止。

**方案**: 在 `startDrag` 的 interval 内增加 30s 超时自动停止：
```js
if (Date.now() - dragStartTime > 30000) { dragging = false; clearInterval(dragInterval) }
```

**涉及文件**:
- `src/main/index.js`

---

### BUG-4 · 数据导出无错误反馈
**根因**: `ExportButton.vue` 调用 `exportStats()` 后无任何成功/失败提示。

**方案**: 调用结果接入 Toast 系统，显示「导出成功 ✓」或「导出失败，请重试」。

**涉及文件**:
- `src/renderer/src/components/stats/ExportButton.vue`

---

### BUG-5 · resetTimer 逻辑不一致
**根因**: `const wasWork = state.phase === 'work' && state.isRunning` 未检查 `startTime` 是否为 null。

**方案**: 改为 `const wasWork = state.phase === 'work' && state.isRunning && !!state.startTime`

**涉及文件**:
- `src/main/ipc/timerIpc.js`

---

## Phase 2 — 新功能

### FEAT-1 · 全局热键（用户可自定义）
**功能**: App 失焦时也能通过快捷键控制计时器。

**数据模型** (settings.json 新增字段):
```json
{
  "hotkeys": {
    "toggleTimer": "Ctrl+Alt+Space",
    "skipPhase":   "Ctrl+Alt+S"
  }
}
```

**实现**:
1. `src/main/store.js` — DEFAULTS.settings 增加 `hotkeys` 字段
2. `src/main/ipc/settingsIpc.js` — allowed 列表增加 `hotkeys`
3. `src/main/index.js` — app ready 后注册 globalShortcut；settings 变化后重新注册；will-quit 时注销
4. `src/renderer/src/components/timer/TimerSettings.vue` — 增加「快捷键」区域（显示当前组合键，点击捕获新快捷键）

---

### FEAT-2 · 应用内键盘快捷键
**涉及文件**: `src/renderer/src/App.vue`

| 键 | 动作 |
|----|------|
| `Space` | 播放 / 暂停 |
| `R` | 重置 |
| `S` | 跳过 |
| `Esc` | 关闭最顶层 Modal |

非 input/textarea 聚焦时生效。

---

### FEAT-3 · 今日目标 + 进度显示
**数据模型**: settings 新增 `dailyGoal: 8`（0 = 不显示）

**实现**:
1. `src/main/store.js` — DEFAULTS 增加 `dailyGoal: 8`
2. `src/main/ipc/settingsIpc.js` — 允许 dailyGoal 字段，clamp 0-20
3. `src/renderer/src/stores/timerStore.js` — todayCount ref，init 时加载，phaseChange 后自增
4. `src/renderer/src/views/TimerView.vue` — PomodoroCounter 下方增加今日进度条
5. `src/renderer/src/components/timer/TimerSettings.vue` — 增加「每日目标」滑块（0–20）

---

### FEAT-4 · 连续打卡 Streak 统计
**实现**:
1. `src/main/ipc/statsIpc.js` — aggregateRecords 新增 `streak` 字段
2. `src/renderer/src/components/stats/StatsCards.vue` — 新增「🔥 连续 N 天」卡片

---

### FEAT-5 · 任务过滤 & 排序（纯前端）
**涉及文件**: `src/renderer/src/components/tasks/TaskList.vue`

- 顶部 Tab：全部 / 进行中 / 已完成
- 排序下拉：创建时间 / 剩余番茄数

---

### FEAT-6 · Mini 窗口显示当前任务名
**涉及文件**: `src/renderer/src/views/MiniView.vue`

初始化 tasksStore，computed 查任务名，超过 8 字截断加省略号。

---

## Phase 3 — 交互优化

### UX-1 · Toast 通知系统
- 新增 `src/renderer/src/stores/toastStore.js`
- 新增 `src/renderer/src/components/common/Toast.vue`（slide-up 动画，3s 消失）
- `src/renderer/src/App.vue` 挂载

### UX-2 · 计时器视图快速关联任务
**涉及文件**: `src/renderer/src/views/TimerView.vue`

无关联任务时显示「+ 关联任务」，点击展开下拉选择已有任务或快速创建。

### UX-3 · 暂停时圆盘呼吸动画
**涉及文件**: `src/renderer/src/components/timer/CircleProgress.vue`

新增 `paused` prop；paused 时进度弧加 `animation: breath 3s ease-in-out infinite`

### UX-4 · 阶段切换颜色 Flash
**涉及文件**: `src/renderer/src/views/TimerView.vue`

watch phase 变化，触发 0.4s 背景 Flash 动画。

### UX-5 · 空状态引导
- `TaskList.vue`: tasks 空时显示引导语
- `StatsView.vue`: 无记录时显示激励文案

---

## 涉及文件完整清单

| 文件 | 改动 |
|------|------|
| `src/main/index.js` | BUG-3 拖拽保护, FEAT-1 全局热键 |
| `src/main/store.js` | FEAT-1 hotkeys DEFAULTS, FEAT-3 dailyGoal |
| `src/main/ipc/timerIpc.js` | BUG-5 |
| `src/main/ipc/statsIpc.js` | BUG-2 时区, FEAT-4 streak |
| `src/main/ipc/settingsIpc.js` | FEAT-1 hotkeys, FEAT-3 dailyGoal |
| `src/renderer/src/App.vue` | FEAT-2 快捷键, UX-1 Toast挂载 |
| `src/renderer/src/stores/timerStore.js` | BUG-1 声音, FEAT-3 todayCount |
| `src/renderer/src/stores/toastStore.js` | UX-1 **新建** |
| `src/renderer/src/components/common/Toast.vue` | UX-1 **新建** |
| `src/renderer/src/components/timer/TimerSettings.vue` | FEAT-1 热键配置, FEAT-3 dailyGoal |
| `src/renderer/src/components/timer/CircleProgress.vue` | UX-3 呼吸动画 |
| `src/renderer/src/components/stats/StatsCards.vue` | FEAT-4 streak卡片 |
| `src/renderer/src/components/stats/ExportButton.vue` | BUG-4 Toast反馈 |
| `src/renderer/src/views/TimerView.vue` | FEAT-3 今日进度, UX-2 快速任务, UX-4 Flash |
| `src/renderer/src/views/MiniView.vue` | FEAT-6 任务名 |
| `src/renderer/src/views/StatsView.vue` | UX-5 空状态 |
| `src/renderer/src/components/tasks/TaskList.vue` | FEAT-5 过滤排序, UX-5 空状态 |

---

## 验证步骤

1. `npm run build` 零报错
2. Phase 切换时播放 beep；设置关闭声音后静音
3. 日统计显示正确本地日期（非 UTC 偏移）
4. 快速多次拖拽 Mini 窗口，进程无残留 CPU
5. 最小化后用自定义热键切换计时状态；更改热键后旧键失效
6. 设置今日目标 8，完成 1 个番茄显示「今日 1 / 8 🍅」
7. 连续 2 天有记录，Streak 显示 🔥 2
8. 任务列表过滤「进行中」只显示未完成任务
