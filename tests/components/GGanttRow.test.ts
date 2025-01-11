import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttRow from "../../src/components/GGanttRow.vue"
import type { GanttBarObject } from "../../src/types"

describe("GGanttRow", () => {
  const mockBar: GanttBarObject = {
    ganttBarConfig: {
      id: "1",
      label: "Test Bar"
    },
    start: "2024-01-01",
    end: "2024-01-02"
  }

  const createWrapper = (props = {}) => {
    return mount(GGanttRow, {
      props: {
        label: "Test Row",
        bars: [mockBar],
        id: "test-row-1",
        ...props
      },
      global: {
        stubs: {
          GGanttBar: {
            name: "GGanttBar",
            template: '<div class="g-gantt-bar">{{ bar.ganttBarConfig.label }}</div>',
            props: ["bar"]
          },
          FontAwesomeIcon: true
        }
      }
    })
  }

  it("should render with basic props", () => {
    const wrapper = createWrapper()
    const row = wrapper.find(".g-gantt-row")
    expect(row.exists()).toBe(true)
    expect(row.classes()).toContain("g-gantt-row")
    const barsContainer = wrapper.find(".g-gantt-row-bars-container")
    expect(barsContainer.exists()).toBe(true)
  })

  it("should emit drop event when an item is dropped", async () => {
    const wrapper = createWrapper()
    await wrapper.find(".g-gantt-row-bars-container").trigger("drop", {
      clientX: 100,
      clientY: 100
    })
    expect(wrapper.emitted("drop")).toBeTruthy()
  })

  it("should highlight on hover when highlightOnHover prop is true", async () => {
    const wrapper = createWrapper({ highlightOnHover: true })
    const row = wrapper.find(".g-gantt-row")
    await row.trigger("mouseover")
    expect(row.classes()).toContain("g-gantt-row")
    await row.trigger("mouseleave")
  })

  it("should render bars correctly", () => {
    const wrapper = createWrapper()
    const barContainer = wrapper.find(".g-gantt-row-bars-container")
    expect(barContainer.exists()).toBe(true)
    expect(wrapper.props("bars")).toHaveLength(1)
  })
})
