import DefaultTheme from 'vitepress/theme'
import { defineClientComponent } from 'vitepress'
import './custom.css'
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"
import weekOfYear from "dayjs/plugin/weekOfYear"
import dayOfYear from "dayjs/plugin/dayOfYear.js"
import utc from "dayjs/plugin/utc"


export function extendDayjs() {
  dayjs.extend(isSameOrBefore)
  dayjs.extend(isSameOrAfter)
  dayjs.extend(isBetween)
  dayjs.extend(weekOfYear)
  dayjs.extend(isoWeek)
  dayjs.extend(dayOfYear)
  dayjs.extend(utc)
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

const BarSlotGanttDemo = defineClientComponent(() => {
  return import('./components/BarSlotGanttDemo.vue')
})

const OtherGanttDemo = defineClientComponent(() => {
  return import('./components/OtherGanttDemo.vue')
})

const MultiColumnDemo= defineClientComponent(() => {
  return import('./components/MultiColumnDemo.vue')
})

const HolidayGanttDemo = defineClientComponent(() => {
  return import('./components/HolidayGanttDemo.vue')
})

const GroupingGanttDemo = defineClientComponent(() => {
  return import('./components/GroupingGanttDemo.vue')
})

const EventsGanttDemo = defineClientComponent(() => {
  return import('./components/EventsGanttDemo.vue')
})

const CommandsGanttDemo = defineClientComponent(() => {
  return import('./components/CommandsGanttDemo.vue')
})

const AdvancedGanttDemo = defineClientComponent(() => {
  return import('./components/AdvancedGanttDemo.vue')
})


export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    extendDayjs()
    app.component('BasicGanttDemo', GanttDemo)
    app.component('ConnectionsGanttDemo', ConnectionsGanttDemo)
    app.component('TimeGanttDemo', TimeGanttDemo)
    app.component('BarSlotGanttDemo', BarSlotGanttDemo)
    app.component('OtherGanttDemo', OtherGanttDemo)
    app.component('MultiColumnDemo', MultiColumnDemo)
    app.component('HolidayGanttDemo', HolidayGanttDemo)
    app.component('GroupingGanttDemo', GroupingGanttDemo)
    app.component('EventsGanttDemo', EventsGanttDemo)
    app.component('CommandsGanttDemo',CommandsGanttDemo)
    app.component('AdvancedGanttDemo',AdvancedGanttDemo)
  }
}
