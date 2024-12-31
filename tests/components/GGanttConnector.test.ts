import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttConnector from "../../src/components/GGanttConnector.vue"
import type { BarPosition } from "../../src/types"

describe("GGanttConnector", () => {
  const mockSourceBar: BarPosition = {
    id: "source1",
    x: 0,
    y: 0,
    width: 100,
    height: 40
  }

  const mockTargetBar: BarPosition = {
    id: "target1",
    x: 150,
    y: 100,
    width: 100,
    height: 40
  }

  const createWrapper = (props = {}) => {
    return mount(GGanttConnector, {
      props: {
        sourceBar: mockSourceBar,
        targetBar: mockTargetBar,
        type: "straight",
        color: "#ff0000",
        strokeWidth: 2,
        pattern: "solid",
        animated: false,
        animationSpeed: "normal",
        ...props
      }
    })
  }

  describe("rendering", () => {
    it("should render SVG correctly", () => {
      const wrapper = createWrapper()
      expect(wrapper.find("svg").exists()).toBe(true)
      expect(wrapper.find("path").exists()).toBe(true)
    })

    it("should apply correct style to SVG", () => {
      const wrapper = createWrapper()
      const svg = wrapper.find("svg")
      expect(svg.attributes("style")).toContain("position: absolute")
      expect(svg.attributes("style")).toContain("pointer-events: none")
    })

    it("should apply specified color", () => {
      const customColor = "#00ff00"
      const wrapper = createWrapper({ color: customColor })
      const path = wrapper.find("path")
      expect(path.attributes("stroke")).toBe(customColor)
    })
  })

  describe("connection types", () => {
    it("should render straight line", () => {
      const wrapper = createWrapper({ type: "straight" })
      const path = wrapper.find("path")
      expect(path.attributes("d")).toContain("M")
      expect(path.attributes("d")).toContain("L")
    })

    it("should render bezier curve", () => {
      const wrapper = createWrapper({ type: "bezier" })
      const path = wrapper.find("path")
      expect(path.attributes("d")).toContain("C")
    })

    it("should render squared line", () => {
      const wrapper = createWrapper({ type: "squared" })
      const path = wrapper.find("path")
      const d = path.attributes("d")
      expect(d).toContain("L")
      expect(d?.split("L").length).toBeGreaterThan(2)
    })
  })

  describe("pattern", () => {
    it("should apply dash pattern", () => {
      const wrapper = createWrapper({ pattern: "dash", animated: false })
      const path = wrapper.find("path")
      expect(path.attributes("stroke-dasharray")).toBe("8,8")
    })

    it("should apply dot pattern", () => {
      const wrapper = createWrapper({ pattern: "dot", animated: false })
      const path = wrapper.find("path")
      expect(path.attributes("stroke-dasharray")).toBe("2,6")
    })

    it("should apply dashdot pattern", () => {
      const wrapper = createWrapper({ pattern: "dashdot", animated: false })
      const path = wrapper.find("path")
      expect(path.attributes("stroke-dasharray")).toBe("12,6,3,6")
    })
  })

  describe("animations", () => {
    it("should render gradient for solid animation", () => {
      const wrapper = createWrapper({ animated: true, pattern: "solid" })
      expect(wrapper.find("linearGradient").exists()).toBe(true)
      expect(wrapper.find("animate").exists()).toBe(true)
    })

    it("should apply correct animation class", () => {
      const wrapper = createWrapper({
        animated: true,
        pattern: "dash",
        animationSpeed: "slow"
      })
      const path = wrapper.find("path")
      expect(path.classes()).toContain("connector-animated-dash-slow")
    })

    it("should use specified animation speed", () => {
      const wrapper = createWrapper({
        animated: true,
        pattern: "solid",
        animationSpeed: "fast"
      })
      const animate = wrapper.find("animate")
      expect(animate.attributes("dur")).toBe("1s")
    })
  })

  describe("path calculation", () => {
    it("should calculate start point correctly", () => {
      const wrapper = createWrapper()
      const path = wrapper.find("path")
      const d = path.attributes("d")
      expect(d?.startsWith(`M ${mockSourceBar.x + mockSourceBar.width}`)).toBe(true)
    })

    it("should update path when positions change", async () => {
      const wrapper = createWrapper()
      const newSourceBar = { ...mockSourceBar, x: 50 }
      await wrapper.setProps({ sourceBar: newSourceBar })
      const path = wrapper.find("path")
      const d = path.attributes("d")
      expect(d?.startsWith(`M ${newSourceBar.x + newSourceBar.width}`)).toBe(true)
    })
  })

  describe("accessibility", () => {
    it("should not interfere with mouse events", () => {
      const wrapper = createWrapper()
      const svg = wrapper.find("svg")
      expect(svg.attributes("style")).toContain("pointer-events: none")
    })
  })
})
