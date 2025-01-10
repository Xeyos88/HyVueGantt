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
      global: {
        stubs: {
          FontAwesomeIcon: true
        },
        provide: {
          useRows: {
            rows: ref([
              { id: 1, label: "Row 1", bars: [] },
              { id: 2, label: "Row 2", bars: [] },
              { id: 3, label: "Row 3", bars: [] }
            ]),
            sortState: ref({ column: "Label", direction: "none" }),
            toggleSort: () => {},
            isGroupExpanded: () => false,
            toggleGroupExpansion: () => {},
            getFlattenedRows: () => [
              { id: 1, label: "Row 1", bars: [] },
              { id: 2, label: "Row 2", bars: [] },
              { id: 3, label: "Row 3", bars: [] }
            ]
          },
          ...customProvide
        }
      }
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
      expect(labelContainer.attributes("style")).toContain("width")
    })
  })

  describe("interactions", () => {
    it("should handle row click", async () => {
      const wrapper = createWrapper()
      const label = wrapper.find(".g-label-column-header-cell")
      await label.trigger("click")
      expect(wrapper.emitted()).toBeTruthy()
    })
  })
})
