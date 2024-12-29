import { beforeAll } from "vitest"
import { config } from "@vue/test-utils"
import { ref } from "vue"
import { CONFIG_KEY, BOOLEAN_KEY, EMIT_BAR_EVENT_KEY } from "../src/provider/symbols"
import type { ColorScheme } from "../src/types"

const defaultColors: ColorScheme = {
  primary: "#eeeeee",
  secondary: "#E0E0E0",
  ternary: "#F5F5F5",
  quartenary: "#ededed",
  hoverHighlight: "rgba(204, 216, 219, 0.5)",
  markerCurrentTime: "#000",
  text: "#404040",
  background: "white",
  commands: "#eeeeee",
  rangeHighlight: "#000",
  holidayHighlight: "rgba(240, 120, 96, 0.8)"
}

beforeAll(() => {
  config.global.provide = {
    [CONFIG_KEY]: {
      rowHeight: ref(40),
      colors: ref(defaultColors),
      labelColumnTitle: ref(""),
      barStart: ref("start"),
      barEnd: ref("end"),
      chartStart: ref("2024-01-01"),
      chartEnd: ref("2024-12-31"),
      precision: ref("day"),
      dateFormat: ref("YYYY-MM-DD"),
      font: ref("Arial"),
      width: ref("100%"),
      pushOnOverlap: ref(false),
      pushOnConnect: ref(false),
      noOverlap: ref(false),
      currentTime: ref(false),
      currentTimeLabel: ref(""),
      hideTimeaxis: ref(false),
      grid: ref(false),
      rowClass: ref(() => ""),
      rowLabelClass: ref(() => ""),
      chartSize: {
        width: ref(800),
        height: ref(600)
      },
      widthNumber: ref(100),
      milestones: ref([]),
      multiColumnLabel: ref([]),
      holidayHighlight: ref(""),
      dayOptionLabel: ref(["day"])
    },
    [BOOLEAN_KEY]: {
      commands: true,
      enableMinutes: false,
      sortable: true,
      labelResizable: true
    },
    [EMIT_BAR_EVENT_KEY]: () => {},
    useRows: {
      rows: ref([]),
      sortState: ref({ column: "Label", direction: "none" }),
      toggleSort: () => {},
      getChartRows: () => []
    },
    id: "test-id"
  }
})
