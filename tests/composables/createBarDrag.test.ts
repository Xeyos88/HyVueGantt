import { describe, it, expect, vi, beforeEach } from "vitest"
import { nextTick } from "vue"
import createBarDrag from "../../src/composables/createBarDrag"
import type { GanttBarObject } from "../../src/types"
import useBarSelector from "../../src/composables/useBarSelector"

vi.mock("../../src/composables/useBarSelector")

vi.mock("../../src/composables/useTimePositionMapping", () => ({
  default: () => ({
    mapTimeToPosition: vi.fn().mockReturnValue(100),
    mapPositionToTime: vi.fn().mockReturnValue("2024-01-01")
  })
}))

vi.mock("../../src/composables/useDayjsHelper", () => ({
  default: () => ({
    toDayjs: vi.fn().mockReturnValue({
      format: vi.fn().mockReturnValue("2024-01-01 10:00"),
      add: vi.fn().mockReturnValue({
        format: vi.fn().mockReturnValue("2024-01-01 11:00")
      }),
      diff: vi.fn().mockReturnValue(60),
      isSameOrAfter: vi.fn().mockReturnValue(false),
      isSameOrBefore: vi.fn().mockReturnValue(false)
    }),
    format: vi.fn().mockReturnValue("2024-01-01 10:00")
  })
}))

describe("createBarDrag", () => {
  const setupDragElements = () => {
    const barContainer = document.createElement("div")
    barContainer.className = "g-gantt-row-bars-container"
    barContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 100,
      right: 1000,
      bottom: 100,
      x: 0,
      y: 0
    })

    const barElement = document.createElement("div")
    barElement.className = "g-gantt-bar"
    barElement.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 100,
      top: 50,
      width: 200,
      height: 30,
      right: 300,
      bottom: 80,
      x: 100,
      y: 50
    })

    const leftHandle = document.createElement("div")
    leftHandle.className = "g-gantt-bar-handle-left"
    const rightHandle = document.createElement("div")
    rightHandle.className = "g-gantt-bar-handle-right"

    barElement.appendChild(leftHandle)
    barElement.appendChild(rightHandle)
    barContainer.appendChild(barElement)

    vi.mocked(useBarSelector).mockImplementation(() => ({
      findBarElement: vi.fn().mockReturnValue(barElement)
    }))

    return { barContainer, barElement, leftHandle, rightHandle }
  }

  const mockConfig = {
    barStart: { value: "start" },
    barEnd: { value: "end" },
    chartStart: { value: "2024-01-01" },
    chartEnd: { value: "2024-12-31" },
    chartSize: {
      width: { value: 1000 },
      height: { value: 500 }
    },
    dateFormat: { value: "YYYY-MM-DD HH:mm" }
  }

  const mockBar: GanttBarObject = {
    ganttBarConfig: {
      id: "test-bar",
      immobile: false
    },
    start: "2024-01-01",
    end: "2024-01-15"
  }

  const mockGanttId = "test-gantt"

  const createMouseEvent = (
    type: string,
    options: {
      clientX: number
      target?: Element
      currentTarget?: Element
    }
  ): MouseEvent => {
    const event = new MouseEvent(type, {
      clientX: options.clientX,
      bubbles: true
    })

    Object.defineProperties(event, {
      target: { get: () => options.target },
      currentTarget: { get: () => options.currentTarget }
    })

    return event
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.cursor = ""
  })

  describe("initialization", () => {
    it("should not initialize dragging if the bar is immobile", () => {
      const { barElement } = setupDragElements()
      const immobileBar = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, immobile: true }
      }

      const { initDrag } = createBarDrag(
        immobileBar,
        vi.fn(),
        vi.fn(),
        mockConfig,
        { moveBar: vi.fn().mockReturnValue({ success: true }) },
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: barElement,
          currentTarget: barElement
        })
      )

      expect(document.body.style.cursor).not.toBe("grab")
    })
  })

  describe("drag operations", () => {
    it("should handle normal bar dragging", async () => {
      const { barElement } = setupDragElements()
      const mockOnDrag = vi.fn()

      const { initDrag, isDragging } = createBarDrag(
        mockBar,
        mockOnDrag,
        vi.fn(),
        mockConfig,
        { moveBar: vi.fn().mockReturnValue({ success: true }) },
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: barElement,
          currentTarget: barElement
        })
      )

      window.dispatchEvent(
        createMouseEvent("mousemove", {
          clientX: 200,
          target: barElement,
          currentTarget: barElement
        })
      )

      await nextTick()
      expect(isDragging.value).toBe(true)
      expect(mockOnDrag).toHaveBeenCalled()
    })

    it("should handle left handle dragging", async () => {
      const { barElement, leftHandle } = setupDragElements()
      const mockOnDrag = vi.fn()

      const { initDrag } = createBarDrag(
        mockBar,
        mockOnDrag,
        vi.fn(),
        mockConfig,
        { moveBar: vi.fn().mockReturnValue({ success: true }) },
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: leftHandle,
          currentTarget: barElement
        })
      )

      expect(document.body.style.cursor).toBe("ew-resize")
      expect(mockOnDrag).not.toHaveBeenCalled()
    })

    it("should handle right handle dragging", async () => {
      const { barElement, rightHandle } = setupDragElements()
      const mockOnDrag = vi.fn()

      const { initDrag } = createBarDrag(
        mockBar,
        mockOnDrag,
        vi.fn(),
        mockConfig,
        { moveBar: vi.fn().mockReturnValue({ success: true }) },
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: rightHandle,
          currentTarget: barElement
        })
      )

      expect(document.body.style.cursor).toBe("ew-resize")
      expect(mockOnDrag).not.toHaveBeenCalled()
    })

    it("should restore state if movement is not allowed", async () => {
      const { barElement } = setupDragElements()
      const originalStart = "2024-01-01"
      const originalEnd = "2024-01-15"
      const testBar = { ...mockBar, start: originalStart, end: originalEnd }
      const failingMovementAPI = { moveBar: vi.fn().mockReturnValue({ success: false }) }

      const { initDrag } = createBarDrag(
        testBar,
        vi.fn(),
        vi.fn(),
        mockConfig,
        failingMovementAPI,
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: barElement,
          currentTarget: barElement
        })
      )

      window.dispatchEvent(
        createMouseEvent("mousemove", {
          clientX: 200,
          target: barElement,
          currentTarget: barElement
        })
      )

      await nextTick()
      expect(testBar.start).toBe(originalStart)
      expect(testBar.end).toBe(originalEnd)
      expect(failingMovementAPI.moveBar).toHaveBeenCalled()
    })

    it("should handle drag end correctly", async () => {
      const { barElement } = setupDragElements()
      const mockOnEndDrag = vi.fn()

      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        mockOnEndDrag,
        mockConfig,
        { moveBar: vi.fn().mockReturnValue({ success: true }) },
        mockGanttId
      )

      initDrag(
        createMouseEvent("mousedown", {
          clientX: 150,
          target: barElement,
          currentTarget: barElement
        })
      )

      window.dispatchEvent(
        createMouseEvent("mouseup", {
          clientX: 200,
          target: barElement,
          currentTarget: barElement
        })
      )

      await nextTick()
      expect(mockOnEndDrag).toHaveBeenCalled()
      expect(document.body.style.cursor).toBe("")
    })
  })
})
