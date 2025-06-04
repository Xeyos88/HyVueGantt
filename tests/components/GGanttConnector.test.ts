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
        marker: "forward",
        ...props
      }
    })
  }

  describe("rendering", () => {
    it("should render SVG correctly", () => {
      const wrapper = createWrapper()
      expect(wrapper.find("svg").exists()).toBe(true)
      expect(wrapper.findAll("path").length).toBeGreaterThan(0)
      expect(wrapper.find("marker").exists()).toBe(true)
    })

    it("should apply correct style to SVG", () => {
      const wrapper = createWrapper()
      const svg = wrapper.find("svg")
      const style = svg.attributes("style") || ""
      expect(style).toContain("position: absolute")
      expect(style).toContain("overflow: visible")
    })

    it("should apply specified color", () => {
      const customColor = "#00ff00"
      const wrapper = createWrapper({ color: customColor })

      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      expect(connectorPath.attributes("stroke")).toBe(customColor)

      const markerPath = wrapper.find("marker path")
      expect(markerPath.attributes("fill")).toBe(customColor)
    })
  })

  describe("marker configuration", () => {
    it("should create marker with correct id", () => {
      const wrapper = createWrapper()
      const markerId = `marker-start-${mockSourceBar.id}-${mockTargetBar.id}`
      expect(wrapper.find(`marker[id="${markerId}"]`).exists()).toBe(false)
    })
  })

  describe("connection types", () => {
    it("should render straight line", () => {
      const wrapper = createWrapper({ type: "straight" })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      const d = connectorPath.attributes("d") || ""

      expect(d.includes("M")).toBe(true)
      expect(d.includes("L")).toBe(true)
    })

    it("should render squared path", () => {
      const backwardTargetBar = { ...mockTargetBar, x: -50 }
      const wrapper = createWrapper({
        type: "squared",
        targetBar: backwardTargetBar
      })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      const d = connectorPath.attributes("d") || ""

      expect(d).toContain("M")
      expect(d).toContain("h")
      expect(d).toContain("v")
    })

    it("should render bezier curve", () => {
      const wrapper = createWrapper({ type: "bezier" })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      const d = connectorPath.attributes("d") || ""

      expect(d).toContain("M")
      expect(d).toContain("C")
    })
  })

  describe("pattern and animation", () => {
    it("should apply dash pattern", () => {
      const wrapper = createWrapper({ pattern: "dash", animated: false })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      expect(connectorPath.attributes("stroke-dasharray")).toBe("8,8")
    })

    it("should apply dot pattern", () => {
      const wrapper = createWrapper({ pattern: "dot", animated: false })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      expect(connectorPath.attributes("stroke-dasharray")).toBe("2,6")
    })

    it("should apply dashdot pattern", () => {
      const wrapper = createWrapper({ pattern: "dashdot", animated: false })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      expect(connectorPath.attributes("stroke-dasharray")).toBe("12,6,3,6")
    })
  })

  describe("animations", () => {
    it("should setup gradient for animation", () => {
      const wrapper = createWrapper({
        animated: true,
        pattern: "solid"
      })
      expect(wrapper.find("linearGradient").exists()).toBe(true)
      expect(wrapper.findAll("animate").length).toBe(2)
    })

    it("should apply animation classes", () => {
      const wrapper = createWrapper({
        animated: true,
        pattern: "dash",
        animationSpeed: "slow"
      })
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      expect(connectorPath.classes()).toContain("connector-animated-dash-slow")
    })
  })

  describe("path calculation", () => {
    it("should calculate correct coordinates", () => {
      const wrapper = createWrapper()
      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      const d = connectorPath.attributes("d") || ""

      const expectedStart = mockSourceBar.x + mockSourceBar.width
      expect(d.startsWith(`M ${expectedStart}`)).toBe(true)
    })

    it("should update when positions change", async () => {
      const wrapper = createWrapper()
      const newSourceBar = { ...mockSourceBar, x: 50 }
      await wrapper.setProps({ sourceBar: newSourceBar })

      const paths = wrapper.findAll("path")
      const connectorPath = paths[paths.length - 1]
      const d = connectorPath.attributes("d") || ""

      const expectedStart = newSourceBar.x + newSourceBar.width
      expect(d.startsWith(`M ${expectedStart}`)).toBe(true)
    })
  })
})
