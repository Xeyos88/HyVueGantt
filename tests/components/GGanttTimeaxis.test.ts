import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttTimeaxis from "../../src/components/GGanttTimeaxis.vue"
import { ref } from "vue"
import { CONFIG_KEY } from "../../src/provider/symbols"

vi.mock("../../src/composables/useTimeaxisUnits", () => ({
  capitalizeWords: vi.fn()
}))

describe("GGanttTimeaxis", () => {
  const createWrapper = (customProvide = {}) => {
    return mount(GGanttTimeaxis, {
      props: {
        timeaxisUnits: {
          result: {
            lowerUnits: [
              { label: "1", value: "1", width: "10px", date: new Date() },
              { label: "2", value: "2", width: "10px", date: new Date() }
            ],
            upperUnits: [],
            events: []
          },
          globalMinuteStep: []
        },
        internalPrecision: "day"
      }
    })
  }

  describe("rendering", () => {
    it("should render timeaxis", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      const timeaxis = wrapper.find(".g-timeaxis")
      expect(timeaxis.exists()).toBe(true)
    })

    it("should render with correct width", () => {
      const wrapper = createWrapper()
      const timeaxis = wrapper.find(".g-timeunit")
      expect(timeaxis.attributes("style")).toContain("width: 10px")
    })
  })

  describe("configuration", () => {
    it("should handle different precision settings", () => {
      const wrapper = createWrapper({
        [CONFIG_KEY]: {
          precision: ref("month")
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it("should handle different date formats", () => {
      const wrapper = createWrapper({
        [CONFIG_KEY]: {
          dateFormat: ref("DD/MM/YYYY")
        }
      })
      expect(wrapper.exists()).toBe(true)
    })
  })
})
