import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttBarTooltip from "../../src/components/GGanttBarTooltip.vue"
import type { GanttBarObject } from "../../src/types"

describe("GGanttBarTooltip", () => {
  const defaultBar: GanttBarObject = {
    ganttBarConfig: {
      id: "1",
      label: "Test Bar",
      style: { background: "blue" }
    },
    start: "2024-01-01 09:00",
    end: "2024-01-02 17:00"
  }

  const createWrapper = (props = {}) => {
    return mount(GGanttBarTooltip, {
      props: {
        modelValue: true,
        bar: defaultBar,
        ...props
      },
      global: {
        stubs: {
          teleport: true
        }
      },
      attachTo: document.body
    })
  }

  describe("rendering", () => {
    it("should render when modelValue is true", () => {
      const wrapper = createWrapper({ modelValue: true })
      expect(wrapper.find("teleport-stub").exists()).toBe(true)
    })

    it("should render with default content", () => {
      const wrapper = createWrapper()
      const content = wrapper.find("teleport-stub")
      expect(content.text()).toContain("09:00")
      expect(content.text()).toContain("17:00")
    })
  })

  describe("date formatting", () => {
    it("should format dates based on precision", async () => {
      const hourBar = {
        ...defaultBar,
        start: "2024-01-01 09:00",
        end: "2024-01-01 17:00"
      }

      const wrapper = createWrapper({ bar: hourBar })
      const content = wrapper.find("teleport-stub")
      expect(content.text()).toContain("09:00")
      expect(content.text()).toContain("17:00")
    })
  })
})
