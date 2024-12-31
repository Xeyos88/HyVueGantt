import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttHolidayTooltip from "../../src/components/GGanttHolidayTooltip.vue"
import type { Holiday } from "../../src/types"

describe("GGanttHolidayTooltip", () => {
  const createWrapper = (props = {}) => {
    return mount(GGanttHolidayTooltip, {
      props: {
        modelValue: true,
        unit: {
          label: "day",
          value: "1",
          date: new Date("2024-01-01"),
          isHoliday: true,
          holidayName: "New Year's Day",
          holidayType: "public"
        },
        targetElement: document.createElement("div"),
        ...props
      }
    })
  }

  describe("rendering", () => {
    it("should render when modelValue is true", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it("should not render when modelValue is false", () => {
      const wrapper = createWrapper({ modelValue: false })
      expect(wrapper.isVisible()).toBe(false)
    })
    
  })

  describe("model value", () => {
    it("should emit update:modelValue when closing", async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$emit("update:modelValue", false)
      expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false])
    })
  })
})