import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttRow from "../../src/components/GGanttRow.vue"
import type { GanttBarObject } from "../../src/types"
import { h } from "vue"

describe("GGanttRow", () => {
  const mockBar: GanttBarObject = {
    ganttBarConfig: {
      id: "1",
      label: "Test Bar"
    },
    start: "2024-01-01",
    end: "2024-01-02"
  }

  const createWrapper = (props = {}, options = {}) => {
    return mount(GGanttRow, {
      props: {
        label: "Test Row",
        bars: [mockBar],
        ...props
      },
      ...options
    })
  }

  it("should render with basic props", () => {
    const wrapper = createWrapper()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.props("label")).toBe("Test Row")
    expect(wrapper.classes()).toContain("g-gantt-row")
  })

  it("should emit drop event when an item is dropped", () => {
    const wrapper = createWrapper()

    wrapper.vm.$emit("drop", {
      e: new Event("drop"),
      datetime: "2024-01-01"
    })

    expect(wrapper.emitted("drop")).toBeTruthy()
    const emittedEvent = wrapper.emitted("drop")?.[0][0]
    expect(emittedEvent).toBeDefined()
    if (emittedEvent && typeof emittedEvent === "object" && "datetime" in emittedEvent) {
      expect((emittedEvent as { datetime: string }).datetime).toBe("2024-01-01")
    }
  })

  it("should highlight on hover when highlightOnHover prop is true", async () => {
    const wrapper = createWrapper({
      highlightOnHover: true
    })

    await wrapper.trigger("mouseover")
    await wrapper.trigger("mouseleave")

    expect(wrapper.classes()).toContain("g-gantt-row")
  })

  it("should render bars correctly", () => {
    const wrapper = createWrapper()

    const barContainer = wrapper.find(".g-gantt-row-bars-container")
    expect(barContainer.exists()).toBe(true)
    expect(wrapper.props("bars")).toHaveLength(1)
    expect(wrapper.props("bars")[0].ganttBarConfig.id).toBe("1")
  })

  it("should display custom label when provided through slot", () => {
    const CustomLabel = {
      template: '<div class="custom-label">Custom Label</div>'
    }

    const wrapper = mount(GGanttRow, {
      props: {
        label: "Test Row",
        bars: [mockBar]
      },
      slots: {
        label: h(CustomLabel)
      }
    })

    const customLabel = wrapper.find(".g-gantt-bar-label")
    expect(customLabel.exists()).toBe(true)
  })
})
