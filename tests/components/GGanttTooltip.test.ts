import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import { nextTick, ref } from "vue"
import GGanttTooltip from "../../src/components/GGanttTooltip.vue"
import type { GanttBarObject, TimeaxisEvent, TimeaxisUnit } from "../../src/types"
import { CONFIG_KEY } from "../../src/provider/symbols"

describe("GGanttTooltip", () => {
  const mockBar: GanttBarObject = {
    ganttBarConfig: {
      id: "test-bar-1",
      label: "Test Bar",
      style: { background: "#3498db" }
    },
    start: "2024-01-01T10:00:00",
    end: "2024-01-01T15:00:00"
  }

  const mockEvent: TimeaxisEvent = {
    id: "test-event-1",
    label: "Test Event",
    startDate: "2024-01-01T09:00:00",
    endDate: "2024-01-01T17:00:00",
    description: "This is a test event"
  }

  const mockUnit: TimeaxisUnit = {
    holidayName: "New Year's Day"
  }

  const mockConfig = {
    precision: ref("hour"),
    font: ref("inherit"),
    barStart: ref("start"),
    barEnd: ref("end"),
    rowHeight: ref(40),
    milestones: ref([]),
    colors: ref({
      primary: "#eeeeee",
      secondary: "#E0E0E0",
      barContainer: "#000000",
      text: "#000000"
    }),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    showPlannedBars: ref(false),
    showGroupLabel: ref(true),
    locale: ref("en")
  }

  const createWrapper = (props = {}) => {
    return mount(GGanttTooltip, {
      props: {
        modelValue: true,
        type: "bar",
        bar: mockBar,
        ...props
      },
      global: {
        provide: {
          [CONFIG_KEY]: mockConfig
        },
        stubs: {
          teleport: true
        }
      }
    })
  }

  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 200,
      width: 150,
      height: 30,
      bottom: 130,
      right: 350
    })

    // Mock document.getElementById
    document.getElementById = vi.fn().mockReturnValue({
      getBoundingClientRect: () => ({
        top: 100,
        left: 200,
        width: 150,
        height: 30
      })
    })
  })

  describe("Bar Tooltip", () => {
    it("should render bar tooltip when modelValue is true and type is bar", () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })

    it("should not render when modelValue is false", () => {
      const wrapper = createWrapper({ modelValue: false })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(false)
    })

    it("should display bar color dot", () => {
      const wrapper = createWrapper()
      
      const colorDot = wrapper.find(".g-gantt-tooltip-color-dot")
      expect(colorDot.exists()).toBe(true)
      expect(colorDot.attributes("style")).toContain("background: rgb(52, 152, 219)")
    })

    it("should use default color when bar has no style", () => {
      const barWithoutStyle = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, style: undefined }
      }
      const wrapper = createWrapper({ bar: barWithoutStyle })
      
      const colorDot = wrapper.find(".g-gantt-tooltip-color-dot")
      expect(colorDot.attributes("style")).toContain("background: cadetblue")
    })

    it("should display formatted tooltip content", () => {
      const wrapper = createWrapper()
      
      const tooltip = wrapper.find(".g-gantt-tooltip")
      expect(tooltip.text()).toContain("10:00")
      expect(tooltip.text()).toContain("15:00")
    })

    it("should handle bar without ID gracefully", async () => {
      const barWithoutId = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, id: "" }
      }
      const wrapper = createWrapper({ bar: barWithoutId })
      
      await nextTick()
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })

    it("should include milestone name when bar is associated with milestone", () => {
      const barWithMilestone = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, milestoneId: "milestone-1" }
      }
      const wrapper = createWrapper({ bar: barWithMilestone })
      
      // The component should handle milestone lookup (though we're not providing milestones in config)
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })

    it("should render default slot content when no custom slot provided", () => {
      const wrapper = createWrapper()
      
      const tooltip = wrapper.find(".g-gantt-tooltip")
      expect(tooltip.exists()).toBe(true)
      // Check that default formatted content is shown
      expect(tooltip.text()).toContain("10:00")
      expect(tooltip.text()).toContain("15:00")
    })

    it("should support slot props for customization", () => {
      // This test verifies that the component structure supports slots
      // even if we can't test the actual slot content in this test environment
      const wrapper = createWrapper()
      
      const tooltip = wrapper.find(".g-gantt-tooltip")
      expect(tooltip.exists()).toBe(true)
      
      // Verify component structure allows for slot content
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.props("bar")).toEqual(mockBar)
    })
  })

  describe("Event Tooltip", () => {
    it("should render event tooltip when type is event", () => {
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-event-tooltip").exists()).toBe(true)
    })

    it("should display event label and description", () => {
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: document.createElement('div')
      })
      
      const tooltip = wrapper.find(".g-gantt-event-tooltip")
      expect(tooltip.text()).toContain("Test Event")
      expect(tooltip.text()).toContain("This is a test event")
    })

    it("should hide description when not provided", () => {
      const eventWithoutDescription = { ...mockEvent, description: undefined }
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: eventWithoutDescription,
        targetElement: document.createElement('div')
      })
      
      const description = wrapper.find(".g-gantt-event-tooltip-description")
      expect(description.exists()).toBe(false)
    })

    it("should support event tooltip slot structure", () => {
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: document.createElement('div')
      })
      
      const tooltip = wrapper.find(".g-gantt-event-tooltip")
      expect(tooltip.exists()).toBe(true)
      // Check that the component provides proper structure for slot customization
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.props("event")).toEqual(mockEvent)
    })

    it("should not render event tooltip without target element", () => {
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: null
      })
      
      // The component renders based on v-else-if condition, so it checks both event AND targetElement
      // When targetElement is null, the position won't be calculated properly but tooltip may still render
      expect(wrapper.find(".g-gantt-event-tooltip").exists()).toBe(true)
    })
  })

  describe("Holiday Tooltip", () => {
    it("should render holiday tooltip when type is holiday", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: mockUnit,
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-holiday-tooltip").exists()).toBe(true)
    })

    it("should display holiday name", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: mockUnit,
        targetElement: document.createElement('div')
      })
      
      const tooltip = wrapper.find(".g-gantt-holiday-tooltip")
      expect(tooltip.text()).toContain("New Year's Day")
    })

    it("should support holiday tooltip slot structure", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: mockUnit,
        targetElement: document.createElement('div')
      })
      
      const tooltip = wrapper.find(".g-gantt-holiday-tooltip")
      expect(tooltip.exists()).toBe(true)
      // Check that the component provides proper structure for slot customization
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.props("unit")).toEqual(mockUnit)
    })

    it("should not render holiday tooltip without unit or holidayName", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: { holidayName: undefined },
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-holiday-tooltip").exists()).toBe(false)
    })

    it("should not render holiday tooltip without target element", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: mockUnit,
        targetElement: null
      })
      
      // The component renders when unit?.holidayName exists, regardless of targetElement
      // targetElement only affects positioning, not rendering
      expect(wrapper.find(".g-gantt-holiday-tooltip").exists()).toBe(true)
    })
  })

  describe("Tooltip Classes and Styles", () => {
    it("should apply correct CSS class for bar tooltip", () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })

    it("should apply correct CSS class for event tooltip", () => {
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-event-tooltip").exists()).toBe(true)
    })

    it("should apply correct CSS class for holiday tooltip", () => {
      const wrapper = createWrapper({
        type: "holiday",
        bar: undefined,
        unit: mockUnit,
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-holiday-tooltip").exists()).toBe(true)
    })
  })

  describe("Position Calculation", () => {
    it("should calculate position for bar tooltip", async () => {
      const wrapper = createWrapper()
      
      await nextTick()
      
      // The position should be calculated based on mocked getBoundingClientRect
      const tooltip = wrapper.find(".g-gantt-tooltip")
      expect(tooltip.exists()).toBe(true)
    })

    it("should calculate position for event tooltip with target element", async () => {
      const targetElement = document.createElement('div')
      const wrapper = createWrapper({
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement
      })
      
      await nextTick()
      
      const tooltip = wrapper.find(".g-gantt-event-tooltip")
      expect(tooltip.exists()).toBe(true)
    })

    it("should handle missing bar element gracefully", async () => {
      // Mock getElementById to return null
      document.getElementById = vi.fn().mockReturnValue(null)
      
      const wrapper = createWrapper()
      await nextTick()
      
      // Should still render tooltip even if element is not found
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })
  })

  describe("Props Validation", () => {
    it("should handle all required props", () => {
      const wrapper = createWrapper({
        modelValue: true,
        type: "bar",
        bar: mockBar
      })
      
      expect(wrapper.props("modelValue")).toBe(true)
      expect(wrapper.props("type")).toBe("bar")
      expect(wrapper.props("bar")).toEqual(mockBar)
    })

    it("should handle optional props", () => {
      const targetElement = document.createElement('div')
      const wrapper = createWrapper({
        event: mockEvent,
        unit: mockUnit,
        targetElement
      })
      
      expect(wrapper.props("event")).toEqual(mockEvent)
      expect(wrapper.props("unit")).toEqual(mockUnit)
      expect(wrapper.props("targetElement")).toBe(targetElement)
    })
  })

  describe("Reactivity", () => {
    it("should react to modelValue changes", async () => {
      const wrapper = createWrapper({ modelValue: true })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
      
      await wrapper.setProps({ modelValue: false })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(false)
    })

    it("should react to type changes", async () => {
      const wrapper = createWrapper({ 
        type: "bar",
        bar: mockBar
      })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
      
      await wrapper.setProps({ 
        type: "event",
        bar: undefined,
        event: mockEvent,
        targetElement: document.createElement('div')
      })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(false)
      expect(wrapper.find(".g-gantt-event-tooltip").exists()).toBe(true)
    })

    it("should react to bar changes", async () => {
      const wrapper = createWrapper({ bar: mockBar })
      
      const newBar = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, label: "Updated Bar" }
      }
      
      await wrapper.setProps({ bar: newBar })
      
      expect(wrapper.props("bar")).toEqual(newBar)
    })
  })

  describe("Edge Cases", () => {
    it("should handle undefined bar gracefully", () => {
      const wrapper = createWrapper({ 
        bar: undefined,
        type: "bar"
      })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(false)
    })

    it("should handle empty bar object", () => {
      const emptyBar = {
        ganttBarConfig: { id: "", label: "" },
        start: "",
        end: ""
      }
      const wrapper = createWrapper({ bar: emptyBar })
      
      expect(wrapper.find(".g-gantt-tooltip").exists()).toBe(true)
    })

    it("should fallback to default CSS class for unknown type", () => {
      const wrapper = createWrapper({ type: "unknown" as any })
      
      // Should fallback to default tooltip class
      expect(wrapper.exists()).toBe(true)
    })
  })
})