import DefaultTheme from 'vitepress/theme'
import { defineClientComponent } from 'vitepress'
import './custom.css'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)

const GanttDemo = defineClientComponent(() => {
  return import('./components/BasicGanttDemo.vue')
})

const ConnectionsGanttDemo = defineClientComponent(() => {
  return import('./components/ConnectionsGanttDemo.vue')
})

const TimeGanttDemo = defineClientComponent(() => {
  return import('./components/TimeGanttDemo.vue')
})

const AdvancedGanttDemo = defineClientComponent(() => {
  return import('./components/AdvancedGanttDemo.vue')
})

const OtherGanttDemo = defineClientComponent(() => {
  return import('./components/OtherGanttDemo.vue')
})


export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BasicGanttDemo', GanttDemo)
    app.component('ConnectionsGanttDemo', ConnectionsGanttDemo)
    app.component('TimeGanttDemo', TimeGanttDemo)
    app.component('AdvancedGanttDemo',AdvancedGanttDemo)
    app.component('OtherGanttDemo',OtherGanttDemo)
  }
}