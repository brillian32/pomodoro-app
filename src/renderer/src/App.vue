<template>
  <div v-if="isMini" class="mini-root">
    <router-view />
  </div>
  <div v-else class="app-root">
    <NavBar />
    <main class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
  <Toast />
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/common/NavBar.vue'
import Toast from './components/common/Toast.vue'
import { useTimerStore } from './stores/timerStore.js'

const route = useRoute()
const isMini = computed(() => route.path === '/mini')
const timerStore = useTimerStore()

function handleKeydown(e) {
  if (isMini.value) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (document.activeElement?.isContentEditable) return

  switch (e.key) {
    case ' ':
      e.preventDefault()
      if (timerStore.isRunning) timerStore.pause()
      else timerStore.start()
      break
    case 'r':
    case 'R':
      timerStore.reset()
      break
    case 's':
    case 'S':
      timerStore.skip()
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style>
html, body, #app { height: 100%; width: 100%; }

.app-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a5f 70%, #0f172a 100%);
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.mini-root {
  width: 100vw;
  height: 100vh;
  background: transparent;
  overflow: hidden;
}
</style>

