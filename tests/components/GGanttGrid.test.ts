import { mount } from "@vue/test-utils"
import { describe, it, expect, vi } from "vitest"
import GGanttGrid from "../../src/components/GGanttGrid.vue"

vi.mock("../../src/provider/provideConfig", () => ({
  default: () => ({
    colors: {
      hoverHighlight: "yellow"
    }
  })
}))

vi.mock("../../src/provider/provideBooleanConfig", () => ({
  default: () => ({
    enableMinutes: false
  })
}))

let mockPrecision = "hour"
vi.mock("../../src/composables/useTimeaxisUnits", () => ({
  default: () => ({
    timeaxisUnits: {
      result: {
        lowerUnits: [
          { label: "1", value: "1", width: "10px" },
          { label: "2", value: "2", width: "10px" }
        ],
        minutesUnits: [
          { label: "1", width: "10px" },
          { label: "2", width: "10px" }
        ]
      }
    },
    internalPrecision: { value: mockPrecision }
  })
}))

describe("GGanttGrid.vue", () => {
  it("should render with hour precision", () => {
    mockPrecision = "hour"
    const wrapper = mount(GGanttGrid)
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with day precision", () => {
    mockPrecision = "day"
    const wrapper = mount(GGanttGrid)
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with week precision", () => {
    mockPrecision = "week"
    const wrapper = mount(GGanttGrid)
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with month precision", () => {
    mockPrecision = "month"
    const wrapper = mount(GGanttGrid)
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with month precision", () => {
    mockPrecision = "undefined"
    const wrapper = mount(GGanttGrid)
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })
})
