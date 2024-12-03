import { createApp } from "vue"
import Playground from "./GanttPlayground.vue"
import hyvuegantt from "./hy-vue-gantt"

createApp(Playground).use(hyvuegantt).mount("#app")
