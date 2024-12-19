import DefaultTheme from 'vitepress/theme'
import { defineClientComponent } from 'vitepress'
import './custom.css'
import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"


export function extendDayjs() {
  dayjs.extend(isSameOrBefore)
  dayjs.extend(isSameOrAfter)
  dayjs.extend(isBetween)
}

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
    extendDayjs()
    app.component('BasicGanttDemo', GanttDemo)
    app.component('ConnectionsGanttDemo', ConnectionsGanttDemo)
    app.component('TimeGanttDemo', TimeGanttDemo)
    app.component('AdvancedGanttDemo',AdvancedGanttDemo)
    app.component('OtherGanttDemo', OtherGanttDemo)
  }
}