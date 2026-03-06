# GitHub Copilot 仓库指令

## 项目概述
本项目是一个基于 **Electron + Vue 3** 的桌面番茄时钟应用。
- **技术栈**：Electron 35、Vue 3（Composition API）、Pinia、Vue Router、electron-vite、ECharts
- **目录结构**：`src/main`（主进程）、`src/preload`（预加载）、`src/renderer`（渲染进程 Vue 应用）
- **状态管理**：Pinia stores 位于 `src/renderer/src/stores/`
- **IPC 通信**：`src/main/ipc/` 各模块，通过 `src/preload/index.js` 暴露给渲染层

---

## 语言要求
**默认用中文回答**，除非我明确要求英文。

---

## A. 强制工作法（每次任务都要遵守）

### 1. 先记录再实施
任何实现/修复/重构/配置变更，都必须先说明计划要点（目标、范围、步骤、测试策略、验证方式、回滚方案），再动手修改文件。

### 2. 默认 TDD（Red → Green → Refactor）
- **新功能**：先描述失败测试定义行为 → 写最小实现 → 在测试保护下重构
- **修 Bug**：必须先描述能复现 bug 的回归测试（修复前为红），再修复
- **无法 TDD 时**：明确说明原因，并给出替代策略（characterization tests / 集成测试 / 合约测试等）

### 3. 原子提交（Atomic Commits）
- 每次任务必须给出提交拆分方案（Copilot 不能替用户 commit，但必须输出计划）
- 提交节奏与 TDD 对齐：`test → feat/fix → refactor`（必要时加 docs/chore）
- **禁止**把无关格式化、无关重命名、顺手修的小问题混入同一提交

---

## B. 每次"实现/修改/修复/重构"请求的必要输出结构

### 1) Plans 更新
- 目标、变更范围、实施步骤、测试策略、验证方式、回滚方案

### 2) 测试清单（TDD）
- **Red**：先写哪些测试（核心用例 + 关键边界/失败分支）
- **Green**：最小实现策略
- **Refactor**：预计重构点（保持行为不变）

### 3) 实施步骤（小步可验证）
- 分步骤列出将修改/新增的文件与原因
- 每步给出对应的验证命令（`npm run dev` / `npm run build` / 测试命令等）

### 4) 提交计划（必须具体）
提供两套方案：
- **保守拆分**（更细粒度）
- **精简拆分**（更少但仍原子）

每条 commit 包含：
- Conventional Commits 格式的 message（如 `test(timer): ...` / `fix(stats): ...`）
- 提交目的
- 验证命令

---

## C. 基本约束

- **不引入新依赖**，除非用户明确同意；若必须引入，先说明原因、替代方案、影响面与回滚策略
- **不做无关改动**：所有变更必须与当前任务目标直接相关，禁止顺手重构/格式化无关代码
- **安全优先**：遵循 OWASP Top 10，IPC 通信必须在预加载层做输入校验，避免 nodeIntegration 直接暴露
- **实现而非建议**：用户要求修改时，直接使用工具编辑文件，而不只是描述该怎么做

---

## D. 项目特定规范

### IPC 通信模式
```js
// preload: contextBridge 暴露
ipcRenderer.invoke('channel:action', payload)
// main: ipcMain.handle('channel:action', handler)
```

### Vue 3 Composition API 风格
```js
// 使用 <script setup> 语法
// store 使用 storeToRefs 解构响应式属性
const { data } = storeToRefs(useMyStore())
```

### 提交消息规范（Conventional Commits）
```
feat(scope): 新功能描述
fix(scope): bug 修复描述
test(scope): 测试相关
refactor(scope): 重构（不改变行为）
chore(scope): 构建/工具链
docs(scope): 文档
```

---

## E. UI/UX 工作规范（已安装 ui-ux-pro-max skill）

进行 UI 相关工作时，使用以下命令获取设计系统建议：
```bash
python skills/ui-ux-pro-max/scripts/search.py "<关键词>" --design-system -p "Pomodoro App"
python skills/ui-ux-pro-max/scripts/search.py "<关键词>" --domain ux --stack vue
```
- 图标使用 SVG（推荐 Heroicons/Lucide），禁止用 emoji 代替图标
- 确保触摸目标最小 44×44px，文字对比度满足 WCAG AA（4.5:1）
