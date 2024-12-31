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
    }
  })
}))

describe("GGanttGrid.vue", () => {
  it("renders lowerUnits when enableMinutes is false", () => {
    const wrapper = mount(GGanttGrid, {
      props: {
        highlightedUnits: [1]
      }
    })
    expect(wrapper.findAll(".g-grid-line").length).toBe(2)
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("width: 10px")
    expect(wrapper.findAll(".g-grid-line")[0].attributes("style")).toContain("background: yellow")
  })
})
