import DefaultTheme from 'vitepress/theme'
import { GGanttChart, GGanttRow } from 'hy-vue-gantt'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GGanttChart', GGanttChart)
    app.component('GGanttRow', GGanttRow)
  }
}