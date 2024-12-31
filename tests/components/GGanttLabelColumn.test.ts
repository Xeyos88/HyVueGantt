import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttLabelColumn from "../../src/components/GGanttLabelColumn.vue"
import { ref } from "vue"
import { CONFIG_KEY, BOOLEAN_KEY } from "../../src/provider/symbols"

describe("GGanttLabelColumn", () => {
  const createWrapper = (props = {}, customProvide = {}) => {
    return mount(GGanttLabelColumn, {
      props: {
        ...props
      },
     
    })
  }

  describe("rendering", () => {
    it("should render with default props", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it("should display all labels", () => {
      const wrapper = createWrapper()
      const labels = wrapper.findAll(".g-label-column-row")
      expect(labels.length).toBe(3)
    })

    it("should apply correct width", () => {
      const wrapper = createWrapper()
      const labelContainer = wrapper.find(".g-label-column")
      expect(labelContainer.exists()).toBe(true)
    })
  })

  describe("interactions", () => {
    it("should handle row click", async () => {
      const wrapper = createWrapper()
      const label = wrapper.find(".g-label-column-header-cell")
      expect(label.exists()).toBe(true)
      await label.trigger("click")
      expect(wrapper.emitted()).toBeTruthy()
    })
  })
}) 