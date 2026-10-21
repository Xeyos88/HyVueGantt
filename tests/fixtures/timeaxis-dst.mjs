import { createServer } from "vite"
import { effectScope, ref } from "vue"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import isoWeek from "dayjs/plugin/isoWeek.js"

dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

// Load the real composable in a process whose timezone is set before Node starts.
// A parent-process timeout can stop a synchronous infinite loop in the axis.
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null },
  appType: "custom",
  logLevel: "error"
})
const scope = effectScope()
try {
  const { default: useTimeaxisUnits } = await server.ssrLoadModule(
    "/src/composables/useTimeaxisUnits.ts"
  )
  const { start, end, precision = "hour", dates = false } = JSON.parse(process.argv[2])
  const config = Object.fromEntries(Object.entries({
    chartStart: dates ? new Date(start) : start,
    chartEnd: dates ? new Date(end) : end,
    precision,
    barStart: "start",
    barEnd: "end",
    dateFormat: "YYYY-MM-DD HH:mm",
    locale: "en",
    holidayHighlight: "",
    ganttWidth: 1200,
    timeaxisEvents: [],
    baseUnitWidth: 40,
    defaultZoom: 1,
    enableMinutes: false
  }).map(([key, value]) => [key, ref(value)]))
  const axis = scope.run(() => useTimeaxisUnits(config))
  const { lowerUnits, upperUnits } = axis.timeaxisUnits.value.result
  const serialize = (units) => units.map(unit => ({
    label: unit.label,
    time: unit.date.getTime(),
    offset: unit.date.getTimezoneOffset(),
    width: parseFloat(unit.width)
  }))
  console.log(JSON.stringify({ lower: serialize(lowerUnits), upper: serialize(upperUnits) }))
} finally {
  scope.stop()
  await server.close()
}
