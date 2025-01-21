import { mount } from "@vue/test-utils"
import { describe, it, expect, vi } from "vitest"
import GGanttGrid from "../../src/components/GGanttGrid.vue"
import { ref } from "vue"
import { TimeUnit } from "../../src/types"

vi.mock("../../src/provider/provideConfig", () => ({
  default: () => ({
    colors: {
      hoverHighlight: "yellow"
    },
    locale: ref("en")
  })
}))

vi.mock("../../src/provider/provideBooleanConfig", () => ({
  default: () => ({
    enableMinutes: false
  })
}))

let mockPrecision = "hour" as TimeUnit

const props = {
  timeaxisUnits: {
    result: {
      lowerUnits: [
        { label: "1", value: "1", width: "10px", date: new Date() },
        { label: "2", value: "2", width: "10px", date: new Date() }
      ],
      upperUnits: []
    },
    globalMinuteStep: []
  },
  internalPrecision: mockPrecision
}

describe("GGanttGrid.vue", () => {
  it("should render with hour precision", () => {
    mockPrecision = "hour"
    const wrapper = mount(GGanttGrid, {
      props: props
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with day precision", () => {
    mockPrecision = "day"
    const wrapper = mount(GGanttGrid, {
      props: props
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with week precision", () => {
    mockPrecision = "week"
    const wrapper = mount(GGanttGrid, {
      props: props
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with month precision", () => {
    mockPrecision = "month"
    const wrapper = mount(GGanttGrid, {
      props: props
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })

  it("should render with month precision", () => {
    mockPrecision = "undefined"
    const wrapper = mount(GGanttGrid, {
      props: props
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
  })
})
