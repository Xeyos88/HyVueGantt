import { beforeAll, vi } from "vitest"
import { config } from "@vue/test-utils"
import { ref } from "vue"
import {
  CONFIG_KEY,
  BOOLEAN_KEY,
  EMIT_BAR_EVENT_KEY,
  BAR_CONTAINER_KEY
} from "../src/provider/symbols"
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

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock

const barContainerElement = document.createElement("div")
barContainerElement.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0,
  toJSON: () => {}
}))

beforeAll(() => {
  config.global.provide = {
    [CONFIG_KEY]: {
      rowHeight: ref(40),
      colors: ref(defaultColors),
      labelColumnTitle: ref("100"),
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
      multiColumnLabel: ref([
        { field: "Label", sortable: true },
        { field: "ID", sortable: false }
      ]),
      holidayHighlight: ref(""),
      dayOptionLabel: ref(["day", "name", "number"]),
      maxRows: ref(0),
      labelColumnWidth: ref(200),
      defaultConnectionPattern: ref("solid"),
      defaultConnectionType: ref("bezier"),
      defaultConnectionColor: ref("#ff0000"),
      defaultConnectionAnimated: ref(false),
      defaultConnectionAnimationSpeed: ref(1000),
      locale: ref("en")
    },
    [BOOLEAN_KEY]: {
      commands: true,
      enableMinutes: false,
      sortable: true,
      labelResizable: true
    },
    [EMIT_BAR_EVENT_KEY]: () => {},
    [BAR_CONTAINER_KEY]: ref(barContainerElement),
    useRows: {
      rows: ref([
        { id: "1", label: "Task 1" },
        { id: "2", label: "Task 2" },
        { id: "3", label: "Task 3" }
      ]),
      sortState: ref({ column: "Label", direction: "none" }),
      toggleSort: () => {},
      getChartRows: () => [
        { id: "1", label: "Task 1" },
        { id: "2", label: "Task 2" },
        { id: "3", label: "Task 3" }
      ]
    },
    id: "test-id",
    milestones: ref([
      {
        id: "milestone1",
        date: "2024-01-02",
        name: "Test Milestone",
        description: "Test Description"
      }
    ])
  }
})
