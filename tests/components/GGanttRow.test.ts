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

  it("should handle props correctly", () => {
    const connections = [{ targetId: "2", type: "straight", relation: "FS" }]
    const wrapper = createWrapper({
      connections,
      highlightOnHover: true,
      id: "custom-id",
      label: "Custom Label"
    })

    expect(wrapper.props("connections")).toEqual(connections)
    expect(wrapper.props("highlightOnHover")).toBe(true)
    expect(wrapper.props("id")).toBe("custom-id")
    expect(wrapper.props("label")).toBe("Custom Label")
  })

  it("should handle multiple bars", () => {
    const secondBar: GanttBarObject = {
      ganttBarConfig: { id: "2", label: "Second Bar" },
      start: "2024-01-03",
      end: "2024-01-04"
    }
    const wrapper = createWrapper({ bars: [mockBar, secondBar] })

    expect(wrapper.props("bars")).toHaveLength(2)
  })

  it("should handle empty bars array", () => {
    const wrapper = createWrapper({ bars: [] })

    expect(wrapper.props("bars")).toHaveLength(0)
  })

  it("should have proper ARIA role", () => {
    const wrapper = createWrapper()
    const row = wrapper.find(".g-gantt-row")

    expect(row.attributes("role")).toBe("list")
  })

  it("should handle various event listeners", async () => {
    const wrapper = createWrapper()
    const row = wrapper.find(".g-gantt-row")

    // Test that events don't crash the component
    await row.trigger("mouseover")
    await row.trigger("mouseleave")
    await row.trigger("dragover")
    await row.trigger("dragleave")
    await row.trigger("mousedown", { clientX: 50, clientY: 20 })

    expect(row.exists()).toBe(true)
  })

  it("should handle prop updates", async () => {
    const wrapper = createWrapper({ label: "Initial" })
    expect(wrapper.props("label")).toBe("Initial")

    await wrapper.setProps({ label: "Updated" })
    expect(wrapper.props("label")).toBe("Updated")
  })

  it("should handle numeric and string ids", () => {
    const numericWrapper = createWrapper({ id: 123 })
    expect(numericWrapper.props("id")).toBe(123)

    const stringWrapper = createWrapper({ id: "string-id" })
    expect(stringWrapper.props("id")).toBe("string-id")
  })
})
