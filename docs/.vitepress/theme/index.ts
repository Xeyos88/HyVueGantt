import DefaultTheme from 'vitepress/theme'
import { defineClientComponent } from 'vitepress'
import './custom.css'

const GanttDemo = defineClientComponent(() => {
  return import('./components/BasicGanttDemo.vue')
})

const ConnectionsGanttDemo = defineClientComponent(() => {
  return import('./components/ConnectionsGanttDemo.vue')
})

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BasicGanttDemo', GanttDemo)
    app.component('ConnectionsGanttDemo', ConnectionsGanttDemo)

  }
}