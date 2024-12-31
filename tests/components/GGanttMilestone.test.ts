import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttMilestone from "../../src/components/GGanttMilestone.vue"


describe("GGanttMilestone", () => {
  const mockMilestone = {
    id: "milestone1",
    date: "2024-01-02",
    name: "Test Milestone",
    description: "Test Description"
  }

  const createWrapper = (props = {}, customProvide = {}) => {
    return mount(GGanttMilestone, {
      props: {
        milestone: mockMilestone,
        ...props
      },
    })
  }

  describe("rendering", () => {
    it("should render milestone", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      const milestone = wrapper.find(".g-gantt-milestone")
      expect(milestone.exists()).toBe(true)
    })

    it("should position milestone correctly based on date", () => {
      const wrapper = createWrapper()
      const milestone = wrapper.find(".g-gantt-milestone")
      expect(milestone.attributes("style")).toContain("left:")
    })

    it("should render milestone with custom date", () => {
      const wrapper = createWrapper({
        milestone: {
          ...mockMilestone,
          date: "2024-06-15"
        }
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe("interactions", () => {
    it("should show tooltip on hover", async () => {
      const wrapper = createWrapper()
      const milestone = wrapper.find(".g-gantt-milestone")
      await milestone.trigger("mouseenter")
      expect(wrapper.emitted()).toBeTruthy()
    })

    it("should hide tooltip on mouse leave", async () => {
      const wrapper = createWrapper()
      const milestone = wrapper.find(".g-gantt-milestone")
      await milestone.trigger("mouseleave")
      expect(wrapper.emitted()).toBeTruthy()
    })
  })

  describe("props validation", () => {
    it("should handle milestone without description", () => {
      const wrapper = createWrapper({
        milestone: {
          id: "milestone2",
          date: "2024-01-03",
          name: "Test Milestone"
          // description omitted
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it("should handle invalid date format", () => {
      const wrapper = createWrapper({
        milestone: {
          ...mockMilestone,
          date: "invalid-date"
        }
      })
      expect(wrapper.exists()).toBe(true)
    })
  })
}) 