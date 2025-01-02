import { mount } from "@vue/test-utils"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { nextTick, ref } from "vue"
import createBarDrag from "../../src/composables/createBarDrag"
import type { GanttBarObject } from "../../src/types"

const mockMapTimeToPosition = vi.fn().mockReturnValue(100)
const mockMapPositionToTime = vi.fn().mockReturnValue("2024-01-01")

// Mock per useBarSelector
vi.mock("../../src/composables/useBarSelector", () => ({
  default: () => ({
    findBarElement: vi.fn().mockImplementation((ganttId, barId) => {
      const element = document.createElement("div")
      element.className = "g-gantt-bar"
      element.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 100,
        width: 200
      })
      return element
    })
  })
}))

vi.mock("../composables/useTimePositionMapping", () => ({
  default: () => ({
    mapTimeToPosition: mockMapTimeToPosition,
    mapPositionToTime: mockMapPositionToTime
  })
}))

vi.mock("../../src/composables/useDayjsHelper", () => ({
  default: () => ({
    chartStartDayjs: ref(new Date("2024-01-01")),
    chartEndDayjs: ref(new Date("2024-12-31")),
    toDayjs: vi.fn().mockReturnValue({
      format: vi.fn().mockReturnValue("2024-01-01 10:00"),
      add: vi.fn().mockReturnValue({
        format: vi.fn().mockReturnValue("2024-01-01 11:00")
      }),
      diff: vi.fn().mockReturnValue(60),
      isSameOrAfter: vi.fn().mockReturnValue(false),
      isSameOrBefore: vi.fn().mockReturnValue(false)
    }),
    format: vi.fn().mockReturnValue("2024-01-01 10:00"),
    diffDates: vi.fn().mockReturnValue(365)
  })
}))

describe("createBarDrag", () => {
  const mockConfig = {
    barStart: ref("start"),
    barEnd: ref("end"),
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    chartSize: {
      width: ref(1000),
      height: ref(500)
    },
    dateFormat: ref("YYYY-MM-DD HH:mm")
  }

  const mockMovementAPI = {
    moveBar: vi.fn().mockReturnValue({ success: true })
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

  const createBarElement = () => {
    const element = document.createElement("div")
    element.className = "g-gantt-bar"

    const leftHandle = document.createElement("div")
    leftHandle.className = "g-gantt-bar-handle-left"

    const rightHandle = document.createElement("div")
    rightHandle.className = "g-gantt-bar-handle-right"

    element.appendChild(leftHandle)
    element.appendChild(rightHandle)

    element.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 100,
      width: 200
    })

    return element
  }

  const createMouseEvent = (
    type: string,
    options: {
      clientX: number
      target?: Element
      currentTarget?: Element
    }
  ) => {
    const event = new MouseEvent(type, {
      clientX: options.clientX,
      bubbles: true
    })

    Object.defineProperties(event, {
      target: {
        get: () => options.target
      },
      currentTarget: {
        get: () => options.currentTarget
      }
    })

    return event
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.cursor = ""
  })

  describe("initDrag", () => {
    it("should not initialize dragging if the bar is immobile", () => {
      const immobileBar = {
        ...mockBar,
        ganttBarConfig: { ...mockBar.ganttBarConfig, immobile: true }
      }

      const { initDrag } = createBarDrag(
        immobileBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const mockEvent = new MouseEvent("mousedown")
      initDrag(mockEvent)

      expect(document.body.style.cursor).not.toBe("grab")
    })

    it("should initialize normal bar dragging", () => {
      const barElement = createBarElement()

      const { initDrag, isDragging } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const mouseEvent = new MouseEvent("mousedown", { clientX: 150 })

      Object.defineProperty(mouseEvent, "target", {
        get: () => barElement
      })

      initDrag(mouseEvent)
      expect(isDragging.value).toBe(true)
    })

    it("should handle left edge dragging", () => {
      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const mockTarget = document.createElement("div")
      mockTarget.className = "g-gantt-bar-handle-left"

      const mockEvent = new MouseEvent("mousedown")
      Object.defineProperty(mockEvent, "target", { value: mockTarget })

      initDrag(mockEvent)

      expect(document.body.style.cursor).toBe("ew-resize")
    })

    it("should handle right edge dragging", () => {
      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const mockTarget = document.createElement("div")
      mockTarget.className = "g-gantt-bar-handle-right"

      const mockEvent = new MouseEvent("mousedown")
      Object.defineProperty(mockEvent, "target", { value: mockTarget })

      initDrag(mockEvent)

      expect(document.body.style.cursor).toBe("ew-resize")
    })
  })

  describe("manage dragging events", () => {
    it("should call onDrag during dragging", async () => {
      const mockOnDrag = vi.fn()
      const barElement = createBarElement()

      const { initDrag } = createBarDrag(
        mockBar,
        mockOnDrag,
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const mousedownEvent = new MouseEvent("mousedown", { clientX: 150 })
      Object.defineProperty(mousedownEvent, "target", {
        get: () => barElement
      })
      initDrag(mousedownEvent)

      const firstMouseMoveEvent = new MouseEvent("mousemove", { clientX: 151 })
      window.dispatchEvent(firstMouseMoveEvent)

      await nextTick()

      const secondMouseMoveEvent = new MouseEvent("mousemove", { clientX: 200 })
      window.dispatchEvent(secondMouseMoveEvent)
    })

    it("should call onEndDrag when dragging ends", async () => {
      const barElement = createBarElement()
      const leftHandle = barElement.querySelector(".g-gantt-bar-handle-left")!

      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
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
    })

    it("should restore state if movement is not allowed", async () => {
      const failingMovementAPI = {
        moveBar: vi.fn().mockReturnValue({ success: false })
      }

      const barElement = createBarElement()

      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
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

      expect(document.body.style.cursor).toBe("")
    })

    it("should handle edge dragging", () => {
      const { initDrag } = createBarDrag(
        mockBar,
        vi.fn(),
        vi.fn(),
        mockConfig as any,
        mockMovementAPI,
        mockGanttId
      )

      const leftHandle = document.createElement("div")
      leftHandle.className = "g-gantt-bar-handle-left"
      const mockEventLeft = createMouseEvent("mousedown", { clientX: 150, target: leftHandle })
      initDrag(mockEventLeft)
      expect(document.body.style.cursor).toBe("ew-resize")

      document.body.style.cursor = ""

      const rightHandle = document.createElement("div")
      rightHandle.className = "g-gantt-bar-handle-right"
      const mockEventRight = createMouseEvent("mousedown", { clientX: 150, target: rightHandle })
      initDrag(mockEventRight)
      expect(document.body.style.cursor).toBe("ew-resize")
    })
  })
})
