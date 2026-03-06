<template>
  <nav class="navbar glass">
    <div class="brand">{{ t('nav.brand') }}</div>
    <div class="tabs">
      <router-link to="/timer" class="tab" active-class="tab-active">
        <span class="tab-icon">⏱</span>
        <span class="tab-label">{{ t('nav.timer') }}</span>
      </router-link>
      <router-link to="/tasks" class="tab" active-class="tab-active">
        <span class="tab-icon">📋</span>
        <span class="tab-label">{{ t('nav.tasks') }}</span>
      </router-link>
      <router-link to="/stats" class="tab" active-class="tab-active">
        <span class="tab-icon">📊</span>
        <span class="tab-label">{{ t('nav.stats') }}</span>
      </router-link>
    </div>
    <div class="spacer" />
  </nav>
</template>

<script setup>
import { useI18nStore } from '@renderer/stores/i18nStore.js'
const { t } = useI18nStore()
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 56px;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.brand {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  margin-right: 32px;
  -webkit-app-region: drag;
}

.tabs {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 10px;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab:hover {
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.08);
}

.tab-active {
  color: #fff;
  background: rgba(167, 139, 250, 0.25);
}

.tab-icon { font-size: 16px; }
.spacer { flex: 1; }
</style>
