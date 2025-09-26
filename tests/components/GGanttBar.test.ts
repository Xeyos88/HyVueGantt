import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"
import GGanttBar from "../../src/components/GGanttBar.vue"
import type { GanttBarObject } from "../../src/types"
import {
  CONFIG_KEY,
  EMIT_BAR_EVENT_KEY,
  GANTT_ID_KEY,
  BAR_CONTAINER_KEY
} from "../../src/provider/symbols"
import { ref } from "vue"

describe("GGanttBar", () => {
  const defaultBar: GanttBarObject = {
    ganttBarConfig: {
      id: "A1",
      label: "Test Bar",
      style: { background: "blue" }
    },
    start: "2024-01-01",
    end: "2024-01-15"
  }

  const mockConnectionCreation = {
    connectionState: { value: { isCreating: false } },
    hoverState: { value: { isVisible: false } },
    startConnectionCreation: vi.fn(),
    updateConnectionDrag: vi.fn(),
    completeConnection: vi.fn(),
    cancelConnectionCreation: vi.fn(),
    handleConnectionPointHover: vi.fn(),
    canBeConnectionTarget: { value: () => false }
  }

  const barContainerElement = document.createElement("div")
  barContainerElement.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0
  }))

  const mockUseRows = {
    rows: ref([]),
    updateRows: vi.fn(),
    sortState: ref({ column: "Label", direction: "none" }),
    toggleSort: vi.fn(),
    getChartRows: vi.fn(),
    onSortChange: vi.fn(),
    toggleGroupExpansion: vi.fn(),
    isGroupExpanded: vi.fn(),
    getFlattenedRows: vi.fn(),
    onGroupExpansionChange: vi.fn(),
    customOrder: ref(new Map()),
    resetCustomOrder: vi.fn(),
    expandAllGroups: vi.fn(),
    collapseAllGroups: vi.fn(),
    canUndo: ref(false),
    canRedo: ref(false),
    undo: vi.fn(),
    redo: vi.fn(),
    clearHistory: vi.fn(),
    onBarMove: vi.fn(),
    areAllGroupsExpanded: ref(false),
    areAllGroupsCollapsed: ref(false)
  }

  const mockConfig = {
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD"),
    rowHeight: ref(40),
    colors: ref({
      primary: "#eeeeee",
      secondary: "#E0E0E0",
      barContainer: "#000000",
      text: "#000000"
    }),
    width: ref("100%"),
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    precision: ref("day"),
    chartSize: {
      width: ref(1000)
    },
    showLabel: ref(true),
    showGroupLabel: ref(true),
    showProgress: ref(true),
    defaultProgressResizable: ref(true),
    enableConnectionCreation: ref(false),
    barLabelEditable: ref(false),
    locale: ref("en"),
    utc: ref(false),
    pushOnOverlap: ref(false),
    pushOnConnect: ref(false),
    noOverlap: ref(false),
    showPlannedBars: ref(false)
  }

  const mockEmitBarEvent = vi.fn()

  const createWrapper = (bar = defaultBar, customConfig = {}) => {
    const configToUse = { ...mockConfig, ...customConfig }

    const wrapper = mount(GGanttBar, {
      props: { bar },
      attachTo: document.body,
      global: {
        provide: {
          connectionCreation: mockConnectionCreation,
          [CONFIG_KEY]: configToUse,
          [EMIT_BAR_EVENT_KEY]: mockEmitBarEvent,
          [GANTT_ID_KEY]: "test-gantt-id",
          [BAR_CONTAINER_KEY]: ref(barContainerElement),
          useRows: mockUseRows
        }
      }
    })

    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render with basic props", () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(".g-gantt-bar").exists()).toBe(true)
    })

    it("should apply custom styles from ganttBarConfig", () => {
      const wrapper = createWrapper()
      const barElement = wrapper.find(".g-gantt-bar")
      expect(barElement.attributes("style")).toContain("background: blue")
    })

    it("should render bar label correctly", () => {
      const wrapper = createWrapper()
      const label = wrapper.find(".g-gantt-bar-label")
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe("Test Bar")
    })

    it("should render handles when hasHandles is true", () => {
      const barWithHandles: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          hasHandles: true
        }
      }
      const wrapper = createWrapper(barWithHandles)
      expect(wrapper.find(".g-gantt-bar-handle-left").exists()).toBe(true)
      expect(wrapper.find(".g-gantt-bar-handle-right").exists()).toBe(true)
    })
  })

  describe("events", () => {
    it("should handle click event", async () => {
      const wrapper = createWrapper()
      const barElement = wrapper.find(".g-gantt-bar")
      await barElement.trigger("click")
      expect(wrapper.emitted("click")).toBeTruthy()
    })

    it("should handle mouseenter and mouseleave events", async () => {
      const wrapper = createWrapper()
      const barElement = wrapper.find(".g-gantt-bar")
      await barElement.trigger("mouseenter")
      await barElement.trigger("mouseleave")
      // Verify the events are properly handled internally
      // Since these are internal state changes, we just ensure no errors occur
      expect(barElement.exists()).toBe(true)
    })
  })

  describe("immobile behavior", () => {
    it("should not be draggable when immobile is true", () => {
      const immobileBar: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          immobile: true
        }
      }
      const wrapper = createWrapper(immobileBar)
      const barElement = wrapper.find(".g-gantt-bar")
      expect(barElement.attributes("style")).not.toContain("cursor: grab")
    })
  })

  describe("drag preparation", () => {
    it("should set up mousemove event listener on mousedown", async () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")
      const wrapper = createWrapper()
      const barElement = wrapper.find(".g-gantt-bar")

      await barElement.trigger("mousedown")

      expect(addEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function), {
        once: true
      })
    })

    it("should not set up drag for immobile bars", async () => {
      const immobileBar: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          immobile: true
        }
      }

      const wrapper = createWrapper(immobileBar)
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")

      await wrapper.trigger("mousedown")

      expect(addEventListenerSpy).not.toHaveBeenCalledWith("mousemove", expect.any(Function), {
        once: true
      })
    })
  })

  describe("progress bar functionality", () => {
    it("should render progress bar when progress is provided", () => {
      const barWithProgress: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          progress: 50
        }
      }
      const wrapper = createWrapper(barWithProgress)
      expect(wrapper.find(".g-gantt-progress-bar").exists()).toBe(true)
    })

    it("should set progress bar width correctly", () => {
      const barWithProgress: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          progress: 75
        }
      }
      const wrapper = createWrapper(barWithProgress)
      const progressBar = wrapper.find(".g-gantt-progress-bar")
      expect(progressBar.attributes("style")).toContain("width: 75%")
    })

    it("should add event listeners when starting progress drag", () => {
      const barWithProgress: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          progress: 50,
          progressResizable: true
        }
      }

      const wrapper = createWrapper(barWithProgress)
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")

      const mockEvent = {
        clientX: 50,
        stopPropagation: vi.fn()
      }

      wrapper.vm.handleProgressDragStart(mockEvent)

      expect(addEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
      expect(wrapper.vm.isProgressDragging).toBe(true)
    })

    it("should update progress value during drag", () => {
      const barWithProgress: GanttBarObject = {
        ...defaultBar,
        ganttBarConfig: {
          ...defaultBar.ganttBarConfig,
          progress: 50,
          progressResizable: true
        }
      }

      const wrapper = createWrapper(barWithProgress)

      wrapper.vm.isProgressDragging = true
      wrapper.vm.progressDragStart = 0
      wrapper.vm.initialProgress = 50

      const barElement = document.createElement("div")
      barElement.getBoundingClientRect = () => ({
        width: 100
      })

      vi.spyOn(window.document, "getElementById").mockReturnValue(barElement)

      const mockEvent = { clientX: 20 }

      wrapper.vm.handleProgressDrag(mockEvent)

      expect(barWithProgress.ganttBarConfig.progress).toBe(50) // Verrà arrotondato in handleProgressDrag
    })
  })

  describe("connection points handling", () => {
    it("should handle connection point mouse enter", () => {
      const wrapper = createWrapper(defaultBar, {
        enableConnectionCreation: ref(true)
      })

      wrapper.vm.handleConnectionPointMouseEnter("start")

      expect(wrapper.vm.startPointHover).toBe(true)
      expect(mockConnectionCreation.handleConnectionPointHover).toHaveBeenCalledWith(
        defaultBar.ganttBarConfig.id,
        "start",
        true
      )
    })

    it("should handle connection point mouse leave", () => {
      const wrapper = createWrapper(defaultBar, {
        enableConnectionCreation: ref(true)
      })

      wrapper.vm.handleConnectionPointMouseLeave("end")

      expect(wrapper.vm.endPointHover).toBe(false)
      expect(mockConnectionCreation.handleConnectionPointHover).toHaveBeenCalledWith(
        defaultBar.ganttBarConfig.id,
        "end",
        false
      )
    })
  })

  describe("label editing functionality", () => {
    it("should update label when saving", () => {
      const wrapper = createWrapper(defaultBar, {
        barLabelEditable: ref(true)
      })

      wrapper.vm.isEditing = true
      wrapper.vm.editedLabel = "Nuovo Label"

      wrapper.vm.saveLabel()

      expect(wrapper.vm.isEditing).toBe(false)
      expect(wrapper.vm.bar.ganttBarConfig.label).toBe("Nuovo Label")
    })
  })

  describe("utility functions", () => {
    it("should convert hex color to RGB", () => {
      const wrapper = createWrapper()

      const rgb = wrapper.vm.hexToRgb("#ff0000")

      expect(rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    })

    it("should parse RGB color string", () => {
      const wrapper = createWrapper()

      const rgb = wrapper.vm.parseRgb("255, 0, 0")

      expect(rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    })

    it("should generate SVG path for group bars", () => {
      const wrapper = createWrapper()

      const path = wrapper.vm.getGroupBarPath(100, 40)

      expect(typeof path).toBe("string")
      expect(path.length).toBeGreaterThan(0)
    })
  })
})
