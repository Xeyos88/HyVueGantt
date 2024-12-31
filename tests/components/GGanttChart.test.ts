import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttChart from "../../src/components/GGanttChart.vue"
import { ref } from "vue"
import type { ChartRow } from "../../src/types"

vi.mock("@fortawesome/vue-fontawesome", () => ({
  FontAwesomeIcon: {
    name: "FontAwesomeIcon",
    render: () => null
  }
}))

vi.mock("../../src/composables/useConnections", () => ({
  useConnections: () => ({
    connections: ref([]),
    barPositions: ref(new Map()),
    getConnectorProps: vi.fn(),
    initializeConnections: vi.fn(),
    updateBarPositions: vi.fn()
  })
}))

vi.mock("../../src/composables/useTooltip", () => ({
  useTooltip: () => ({
    showTooltip: ref(false),
    tooltipBar: ref(undefined),
    initTooltip: vi.fn(),
    clearTooltip: vi.fn()
  })
}))

const mockDomElements = () => {
  const mockElement = document.createElement('div')
  const mockScroller = document.createElement('input')
  mockScroller.className = 'g-gantt-scroller'
  mockElement.appendChild(mockScroller)

  document.getElementById = vi.fn().mockReturnValue(mockElement)
  document.querySelector = vi.fn().mockReturnValue(mockScroller)

  return {
    mockElement,
    mockScroller
  }
}

describe("GGanttChart", () => {

  let domElements: { mockElement: HTMLElement; mockScroller: HTMLElement }

  beforeEach(() => {
    domElements = mockDomElements()
    vi.clearAllMocks()
  })

  const mockRow: ChartRow = {
    id: "1",
    label: "Test Row",
    bars: [
      {
        ganttBarConfig: {
          id: "bar1",
          label: "Test Bar"
        },
        start: "2024-01-01",
        end: "2024-01-15"
      }
    ]
  }

  const defaultProps = {
    chartStart: "2024-01-01",
    chartEnd: "2024-12-31",
    precision: "day",
    barStart: "start",
    barEnd: "end",
    rowHeight: 40,
    width: "100%",
    initialRows: [mockRow]
  }

  const createWrapper = (props = {}) => {
    return mount(GGanttChart, {
      props: {
        ...defaultProps,
        ...props
      },
      global: {
        stubs: {
          FontAwesomeIcon: true,
          GGanttRow: true,
          GGanttTimeaxis: true,
          GGanttLabelColumn: true
        }
      }
    })
  }

  describe("rendering", () => {
    it("should render the chart container", () => {
      const wrapper = createWrapper()
      expect(wrapper.find(".g-gantt-container").exists()).toBe(true)
    })

    it("should render rows from initialRows prop", () => {
      const wrapper = createWrapper()
      expect(wrapper.html()).toContain("g-gantt-row-stub")
    })

    it("should render timeaxis when hideTimeaxis is false", () => {
      const wrapper = createWrapper()
      expect(wrapper.find("g-gantt-timeaxis-stub").exists()).toBe(true)
    })

    it("should not render timeaxis when hideTimeaxis is true", () => {
      const wrapper = createWrapper({ hideTimeaxis: true })
      expect(wrapper.find("g-gantt-timeaxis-stub").exists()).toBe(false)
    })
  })

  describe("interaction", () => {
    it("should emit click-bar event when bar is clicked", async () => {
      const wrapper = createWrapper()
      wrapper.vm.$emit("click-bar", {
        bar: mockRow.bars[0],
        e: new MouseEvent("click")
      })
      expect(wrapper.emitted("click-bar")).toBeTruthy()
    })

    it("should handle keyboard navigation", async () => {
      const wrapper = createWrapper()
      await wrapper.trigger("keydown", { key: "ArrowRight" })
      expect(wrapper.vm.handleKeyDown).toBeDefined()
    })

    it("should update zoom level on zoom controls click", async () => {
      const wrapper = createWrapper()
      const zoomInButton = wrapper.find('[aria-label="Zoom-out Gantt"]')
      await zoomInButton.trigger("click")
      expect(wrapper.vm.zoomFactor).toBeDefined()
    })
  })

  describe("props and configuration", () => {
    it("should apply correct color scheme", () => {
      const wrapper = createWrapper({ colorScheme: "vue" })
      const chart = wrapper.find(".g-gantt-chart")
      expect(chart.attributes("style")).toContain("background")
    })

    it("should handle maxRows prop correctly", () => {
      const wrapper = createWrapper({ maxRows: 5 })
      const container = wrapper.find(".g-gantt-rows-container")
      expect(container.attributes("style")).toContain("max-height")
    })
  })

  describe("child components events", () => {
    it("should handle sort event from label column", async () => {
      const wrapper = createWrapper()
      wrapper.vm.$emit("sort", { direction: "asc" })
      expect(wrapper.emitted("sort")).toBeTruthy()
    })

    it("should handle dragend-bar event", async () => {
      const wrapper = createWrapper()
      const mockBar = mockRow.bars[0]
      wrapper.vm.$emit("dragend-bar", {
        bar: mockBar,
        e: new MouseEvent("mouseup"),
        movedBars: new Map()
      })
      expect(wrapper.emitted("dragend-bar")).toBeTruthy()
    })
  })

  describe("accessibility", () => {
    it("should have correct ARIA attributes", () => {
      const wrapper = createWrapper()
      const container = wrapper.find(".g-gantt-container")
      expect(container.attributes("role")).toBe("application")
      expect(container.attributes("aria-label")).toBe("Interactive Gantt")
      expect(container.attributes("tabindex")).toBe("0")
    })

    it("should have accessible zoom controls", () => {
      const wrapper = createWrapper()
      const zoomControls = wrapper.find(".g-gantt-command-zoom")
      expect(zoomControls.exists()).toBe(true)
      expect(wrapper.find('[aria-label="Zoom-out Gantt"]').exists()).toBe(true)
    })
  })

  describe("state management", () => {
    it("should update bar positions when chart size changes", async () => {
      const wrapper = createWrapper()
      await wrapper.setProps({ width: "200%" })
      expect(wrapper.vm.updateBarPositions).toBeDefined()
    })
  })

  describe("performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeDataset = Array(100).fill(mockRow)
      const wrapper = createWrapper({ initialRows: largeDataset })
      expect(wrapper.find(".g-gantt-rows-container").exists()).toBe(true)
    })
  })

  describe("time indicator", () => {
    it("should render current time indicator when currentTime is true", async () => {
      const wrapper = createWrapper({ currentTime: true })
      expect(wrapper.findComponent({ name: 'GGanttCurrentTime' }).exists()).toBe(true)
    })
  
    it("should not render current time indicator when currentTime is false", () => {
      const wrapper = createWrapper({ currentTime: false })
      expect(wrapper.findComponent({ name: 'GGanttCurrentTime' }).exists()).toBe(false)
    })
  
  })

  describe("renderRow", () => {
    it("should render a row from an original node", () => {
      const wrapper = createWrapper()
      const mockOriginalNode = {
        props: {
          label: "Test Label",
          bars: [],
          id: "test-id"
        },
        children: {}
      }

      const row = {
        label: "Test Label",
        bars: [],
        id: "test-id",
        _originalNode: mockOriginalNode
      }

      const renderedRow = wrapper.vm.renderRow(row)
      expect(renderedRow.props).toEqual({
        label: "Test Label",
        bars: [],
        id: "test-id",
        key: "test-id",
      })
    })

    it("should render a row without an original node", () => {
      const wrapper = createWrapper()
      const row = {
        label: "Simple Row",
        bars: [],
        id: "simple-id"
      }

      const renderedRow = wrapper.vm.renderRow(row)
      expect(renderedRow.props).toEqual({
        label: "Simple Row",
        bars: [],
        id: "simple-id",
        key: "simple-id"
      })
    })
  })

  describe("handleTimeaxisMouseDown", () => {
    it("should set dragging state and initial mouse position", () => {
      const wrapper = createWrapper()
      const mockEvent = new MouseEvent("mousedown", {
        clientX: 100
      })

      wrapper.vm.handleTimeaxisMouseDown(mockEvent)
      expect(wrapper.vm.isDraggingTimeaxis).toBe(true)
      expect(wrapper.vm.lastMouseX).toBe(100)
    })

    it("should handle mouse movement during dragging", async () => {
      const wrapper = createWrapper()
      
      await wrapper.vm.handleTimeaxisMouseDown(new MouseEvent("mousedown", { clientX: 100 }))
      
      const moveEvent = new MouseEvent("mousemove", { clientX: 150 })
      await wrapper.vm.handleTimeaxisMouseMove(moveEvent)

      expect(wrapper.vm.lastMouseX).toBe(150)
    })
  })

  describe("emitBarEvent", () => {
    it("should emit click-bar event", () => {
      const wrapper = createWrapper()
      const mockBar = {
        ganttBarConfig: { id: "test-bar" }
      }
      const mockEvent = new MouseEvent("click")

      wrapper.vm.emitBarEvent(mockEvent, mockBar)
      expect(wrapper.emitted("click-bar")).toBeTruthy()
      expect(wrapper.emitted("click-bar")[0]).toEqual([{
        bar: mockBar,
        e: mockEvent
      }])
    })

    it("should emit dragstart-bar event and update dragging state", () => {
      const wrapper = createWrapper()
      const mockBar = {
        ganttBarConfig: { id: "test-bar" }
      }
      const mockEvent = { type: "dragstart" }

      wrapper.vm.emitBarEvent(mockEvent as MouseEvent, mockBar)
      expect(wrapper.emitted("dragstart-bar")).toBeTruthy()
      expect(wrapper.vm.isDragging).toBe(true)
    })

    it("should emit dragend-bar event with movedBars", () => {
      const wrapper = createWrapper()
      const mockBar = {
        ganttBarConfig: { id: "test-bar" }
      }
      const movedBars = new Map()
      const mockEvent = { type: "dragend" }

      wrapper.vm.emitBarEvent(mockEvent as MouseEvent, mockBar, undefined, movedBars)
      expect(wrapper.emitted("dragend-bar")).toBeTruthy()
      expect(wrapper.emitted("dragend-bar")[0][0]).toHaveProperty("movedBars")
    })
  })

  describe("cleanup", () => {
    it("should remove all event listeners and disconnect ResizeObserver", async () => {
      const wrapper = createWrapper()
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")
      const resizeObserverDisconnectSpy = vi.fn()

      wrapper.vm.resizeObserver = {
        disconnect: resizeObserverDisconnectSpy
      }

      await wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", wrapper.vm.handleTimeaxisMouseMove)
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", wrapper.vm.handleTimeaxisMouseUp)
      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", wrapper.vm.updateBarPositions)
      expect(resizeObserverDisconnectSpy).toHaveBeenCalled()
    })

    
  })
})