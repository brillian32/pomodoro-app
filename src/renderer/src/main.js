import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import App from './App.vue'
import TimerView from './views/TimerView.vue'
import TasksView from './views/TasksView.vue'
import StatsView from './views/StatsView.vue'
import MiniView from './views/MiniView.vue'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/timer' },
    { path: '/timer', component: TimerView },
    { path: '/tasks', component: TasksView },
    { path: '/stats', component: StatsView },
    { path: '/mini', component: MiniView }
  ]
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('VChart', ECharts)
app.mount('#app')
