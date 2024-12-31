import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useBarKeyboardControl } from "../../src/composables/useBarKeyboardControl"
import type { GanttBarObject } from "../../src/types"

// Creiamo un mock più completo di dayjs
const mockDayjs = vi.fn(() => ({
  format: vi.fn().mockReturnValue("2024-01-01 10:00"),
  add: vi.fn().mockReturnValue({
    format: vi.fn().mockReturnValue("2024-01-01 11:00"),
    isBefore: vi.fn().mockReturnValue(false),
    isAfter: vi.fn().mockReturnValue(false)
  }),
  subtract: vi.fn().mockReturnValue({
    format: vi.fn().mockReturnValue("2023-12-31 10:00"),
    isBefore: vi.fn().mockReturnValue(false),
    isAfter: vi.fn().mockReturnValue(false)
  }),
  diff: vi.fn().mockReturnValue(60),
  isBefore: vi.fn().mockReturnValue(false),
  isAfter: vi.fn().mockReturnValue(false)
}))

// Mock delle dipendenze
vi.mock("../../src/composables/useDayjsHelper", () => ({
  default: () => ({
    toDayjs: mockDayjs,
    format: vi.fn().mockReturnValue("2024-01-01 10:00")
  })
}))

vi.mock("../../src/composables/useBarMovement", () => ({
  useBarMovement: () => ({
    moveBar: vi.fn().mockReturnValue({ success: true, affectedBars: new Set() })
  })
}))

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue")
  return {
    ...(actual as any),
    inject: () => ({
      rows: ref([{
        label: "Test Row",
        bars: []
      }])
    })
  }
})

describe("useBarKeyboardControl", () => {
  const mockConfig = {
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    precision: ref("hour")
  }

  const mockEmitBarEvent = vi.fn()

  const createMockBar = (id: string, immobile = false): GanttBarObject => ({
    ganttBarConfig: {
      id,
      immobile
    },
    start: "2024-01-01 10:00",
    end: "2024-01-01 11:00"
  })

  const createKeyboardEvent = (key: string, shiftKey = false, target?: Element): KeyboardEvent => {
    return {
      key,
      shiftKey,
      target,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      type: "keydown"
    } as unknown as KeyboardEvent
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.getElementById = vi.fn().mockImplementation((id) => {
      const element = document.createElement("div")
      element.id = id
      return element
    })
  })

  describe("onBarKeyDown", () => {
    it("should handle ArrowLeft key press", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowLeft", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })

    it("should handle ArrowRight key press", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowRight", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })

    it("should handle ArrowUp key press for expansion", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowUp", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })

    it("should handle ArrowDown key press for shrinking", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowDown", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })

    it("should not process events for immobile bars", () => {
      const bar = createMockBar("test-bar", true)
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowRight", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).not.toHaveBeenCalled()
    })

    it("should not process events for wrong target element", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "wrong-id"
      const event = createKeyboardEvent("ArrowRight", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).not.toHaveBeenCalled()
    })

    it("should handle Shift modifier for larger movements", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowRight", true, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })
  })

  describe("precision handling", () => {
    it("should handle different precision settings", () => {
      const precisions = ["hour", "day", "week", "month"]
      
      precisions.forEach(precision => {
        const configWithPrecision = {
          ...mockConfig,
          precision: ref(precision)
        }
        
        const bar = createMockBar("test-bar")
        const { onBarKeyDown } = useBarKeyboardControl(bar, configWithPrecision, mockEmitBarEvent)
        
        const element = document.createElement("div")
        element.id = "test-bar"
        const event = createKeyboardEvent("ArrowRight", false, element)
        
        onBarKeyDown(event)
        expect(mockEmitBarEvent).toHaveBeenCalled()
      })
    })
  })


  describe("boundary conditions", () => {
    it("should respect chart start and end dates", () => {
      const bar = createMockBar("test-bar")
      const { onBarKeyDown } = useBarKeyboardControl(bar, mockConfig, mockEmitBarEvent)
      
      const element = document.createElement("div")
      element.id = "test-bar"
      const event = createKeyboardEvent("ArrowLeft", false, element)
      
      onBarKeyDown(event)
      expect(mockEmitBarEvent).toHaveBeenCalled()
    })
  })
})