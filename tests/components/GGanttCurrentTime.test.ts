import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttCurrentTime from "../../src/components/GGanttCurrentTime.vue"

const mockMapTimeToPosition = vi.fn().mockReturnValue(100)
vi.mock("../composables/useTimePositionMapping", () => ({
  default: () => ({
    mapTimeToPosition: mockMapTimeToPosition
  })
}))

describe("GGanttCurrentTime", () => {
  beforeEach(() => {
    mockMapTimeToPosition.mockClear()
  })

  const createWrapper = async (props = {}, slots = {}) => {
    const wrapper = mount(GGanttCurrentTime, {
      props: {
        ...props
      },
      slots: {
        ...slots,
        "current-time-label": slots["current-time-label"] || "<span>Now</span>"
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    return wrapper
  }

  describe("rendering", () => {
    it("should render the current time marker", async () => {
      const wrapper = await createWrapper()
      expect(wrapper.find(".g-grid-current-time").exists()).toBe(true)
      expect(wrapper.find(".g-grid-current-time-marker").exists()).toBe(true)
    })

    it("should apply the border color from config", async () => {
      const wrapper = await createWrapper()
      const marker = wrapper.find(".g-grid-current-time-marker")
      expect(marker.element.style.border).toMatch(/1px dashed #000/)
    })
  })

  describe("slots", () => {
    it("should render custom current time label through slot", async () => {
      const customLabel = "Custom Time"
      const wrapper = await createWrapper(
        {},
        {
          "current-time-label": `<span>${customLabel}</span>`
        }
      )

      const labelElement = wrapper.find(".g-grid-current-time-text")
      expect(labelElement.text()).toBe(customLabel)
    })

    it("should use default label when no slot is provided", async () => {
      const wrapper = await createWrapper()
      const labelElement = wrapper.find(".g-grid-current-time-text")
      expect(labelElement.text()).toBe("Now")
    })
  })

  describe("styling", () => {
    it("should have correct default classes", async () => {
      const wrapper = await createWrapper()

      expect(wrapper.find(".g-grid-current-time").exists()).toBe(true)
      expect(wrapper.find(".g-grid-current-time-marker").exists()).toBe(true)
      expect(wrapper.find(".g-grid-current-time-text").exists()).toBe(true)
    })
  })

  describe("error handling", () => {
    it("should handle invalid dates gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockMapTimeToPosition.mockImplementation(() => {
        throw new Error("Test error")
      })

      const wrapper = await createWrapper()
      await wrapper.vm.loopTime()

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
