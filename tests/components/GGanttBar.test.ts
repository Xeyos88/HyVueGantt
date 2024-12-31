import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttBar from "../../src/components/GGanttBar.vue"
import type { GanttBarObject } from "../../src/types"

describe("GGanttBar", () => {
  const defaultBar: GanttBarObject = {
    ganttBarConfig: {
      id: "1",
      label: "Test Bar",
      style: { background: "blue" }
    },
    start: "2024-01-01",
    end: "2024-01-15"
  }

  const createWrapper = (bar = defaultBar) => {
    return mount(GGanttBar, {
      props: { bar },
      attachTo: document.body
    })
  }

  describe("rendering", () => {
    it("should render with basic props", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain("g-gantt-bar")
    })

    it("should apply custom styles from ganttBarConfig", () => {
      const wrapper = createWrapper()
      expect(wrapper.attributes("style")).toContain("background: blue")
    })

    it("should render bar label correctly", () => {
      const wrapper = createWrapper()
      const label = wrapper.find(".g-gantt-bar-label")
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe("Test Bar")
    })

    it("should render handles when hasHandles is true", () => {
      const barWithHandles: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          hasHandles: true
        }
      }
      const wrapper = createWrapper(barWithHandles)
      expect(wrapper.find(".g-gantt-bar-handle-left").exists()).toBe(true)
      expect(wrapper.find(".g-gantt-bar-handle-right").exists()).toBe(true)
    })
  })

  describe("events", () => {
    it("should handle click event", async () => {
      const wrapper = createWrapper()
      await wrapper.trigger("click")
      expect(wrapper.emitted("click")).toBeTruthy()
    })

    it("should handle mouseenter and mouseleave events", async () => {
      const wrapper = createWrapper()
      await wrapper.trigger("mouseenter")
      expect(wrapper.emitted("mouseenter")).toBeTruthy()
      await wrapper.trigger("mouseleave")
      expect(wrapper.emitted("mouseleave")).toBeTruthy()
    })
  })

  describe("immobile behavior", () => {
    it("should not be draggable when immobile is true", () => {
      const immobileBar: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          immobile: true
        }
      }
      const wrapper = createWrapper(immobileBar)
      expect(wrapper.attributes("style")).not.toContain("cursor: grab")
    })
  })

  describe("slots", () => {
    it("should render custom content through default slot", () => {
      const wrapper = mount(GGanttBar, {
        props: { bar: defaultBar },
        slots: {
          default: '<div class="custom-content">Custom Bar Content</div>'
        }
      })
      expect(wrapper.find(".custom-content").exists()).toBe(true)
      expect(wrapper.find(".custom-content").text()).toBe("Custom Bar Content")
    })
  })

  describe("keyboard navigation", () => {
    it("should handle keyboard events", async () => {
      const wrapper = createWrapper()
      await wrapper.trigger("keydown", { key: "ArrowRight" })
      expect(wrapper.emitted("keydown")).toBeTruthy()
    })
  })

  describe("accessibility", () => {
    it("should have correct ARIA attributes", () => {
      const wrapper = createWrapper()
      expect(wrapper.attributes("role")).toBe("listitem")
      expect(wrapper.attributes("aria-label")).toContain("Activity")
      expect(wrapper.attributes("tabindex")).toBe("0")
    })
  })

  describe("HTML content", () => {
    it("should render HTML content when provided", () => {
      const barWithHtml: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          html: '<span class="custom-html">HTML Content</span>'
        }
      }
      const wrapper = createWrapper(barWithHtml)
      expect(wrapper.find(".custom-html").exists()).toBe(true)
      expect(wrapper.find(".custom-html").text()).toBe("HTML Content")
    })
  })
})
