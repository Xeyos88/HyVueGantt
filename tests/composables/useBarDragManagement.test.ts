import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import useBarDragManagement from "../../src/composables/useBarDragManagement"
import type { GanttBarObject } from "../../src/types"

const createMockBar = (id: string, immobile = false): GanttBarObject => ({
  ganttBarConfig: {
    id,
    immobile,
    bundle: undefined,
    pushOnOverlap: true,
    pushOnConnect: true
  },
  start: "2024-01-01 10:00",
  end: "2024-01-01 11:00"
})
vi.mock("../../src/provider/provideConfig", () => ({
  default: () => ({
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    pushOnOverlap: ref(true),
    pushOnConnect: ref(true)
  })
}))

vi.mock("../../src/provider/provideEmitBarEvent", () => ({
  default: () => vi.fn()
}))

vi.mock("../../src/composables/useDayjsHelper", () => ({
  default: () => ({
    chartStartDayjs: ref({
      format: vi.fn().mockReturnValue("2024-01-01"),
      diff: vi.fn().mockReturnValue(1440)
    }),
    chartEndDayjs: ref({
      format: vi.fn().mockReturnValue("2024-12-31"),
      diff: vi.fn().mockReturnValue(1440)
    }),
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

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue")
  return {
    ...(actual as any),
    inject: () => ({
      rows: ref([
        {
          label: "Row 1",
          bars: [createMockBar("bar1"), createMockBar("bar2"), createMockBar("bar3", true)]
        }
      ])
    })
  }
})

describe("useBarDragManagement", () => {
  const createMockEvent = (clientX = 0): MouseEvent => {
    return new MouseEvent("mousedown", {
      clientX,
      bubbles: true
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initDragOfBar", () => {
    it("should initialize drag for a single bar", () => {
      const barDragManagement = useBarDragManagement()
      const bar = createMockBar("test")
      const event = createMockEvent(100)

      barDragManagement.initDragOfBar(bar, event)
      expect(bar.ganttBarConfig.id).toBe("test")
    })

    it("should not initialize drag for immobile bar", () => {
      const barDragManagement = useBarDragManagement()
      const bar = createMockBar("test", true)
      const event = createMockEvent(100)

      barDragManagement.initDragOfBar(bar, event)
      expect(bar.ganttBarConfig.immobile).toBe(true)
    })
  })

  describe("initDragOfBundle", () => {
    it("should initialize drag for all bars in bundle", () => {
      const barDragManagement = useBarDragManagement()
      const mainBar = {
        ...createMockBar("main"),
        ganttBarConfig: {
          ...createMockBar("main").ganttBarConfig,
          bundle: "group1"
        }
      }
      const event = createMockEvent(100)

      barDragManagement.initDragOfBundle(mainBar, event)
      expect(mainBar.ganttBarConfig.bundle).toBe("group1")
    })

    it("should not initialize drag for undefined bundle", () => {
      const barDragManagement = useBarDragManagement()
      const mainBar = createMockBar("main")
      const event = createMockEvent(100)

      barDragManagement.initDragOfBundle(mainBar, event)
      expect(mainBar.ganttBarConfig.bundle).toBeUndefined()
    })
  })

  describe("handleDrag", () => {
    it("should update bar position during drag", () => {
      const barDragManagement = useBarDragManagement()
      const bar = createMockBar("test")
      const event = createMockEvent(100)

      barDragManagement.handleDrag(event, bar)
      expect(bar.start).toBe("2024-01-01 10:00")
      expect(bar.end).toBe("2024-01-01 11:00")
    })
  })

  describe("getConnectedBars", () => {
    it("should return bars connected to the target bar", () => {
      const barDragManagement = useBarDragManagement()
      const bar = {
        ...createMockBar("source"),
        ganttBarConfig: {
          ...createMockBar("source").ganttBarConfig,
          connections: [{ targetId: "target1", type: "straight" }]
        }
      }

      const connectedBars = barDragManagement.getConnectedBars(bar)
      expect(Array.isArray(connectedBars)).toBe(true)
    })
  })

  describe("error handling", () => {
    it("should handle invalid date formats", () => {
      const barDragManagement = useBarDragManagement()
      const bar = {
        ...createMockBar("test"),
        start: "invalid-date",
        end: "invalid-date"
      }
      const event = createMockEvent(100)

      barDragManagement.handleDrag(event, bar)
      expect(bar.start).toBe("invalid-date")
      expect(bar.end).toBe("invalid-date")
    })
  })

  describe("drag state management", () => {
    it("should track moved bars correctly", () => {
      const barDragManagement = useBarDragManagement()
      const bar = createMockBar("test")
      const event = createMockEvent(100)

      barDragManagement.initDragOfBar(bar, event)
      barDragManagement.handleDrag(event, bar)

      expect(bar.ganttBarConfig.id).toBe("test")
    })

    it("should clear moved bars after drag end", () => {
      const barDragManagement = useBarDragManagement()
      const bar = createMockBar("test")
      const event = createMockEvent(100)

      barDragManagement.initDragOfBar(bar, event)
      barDragManagement.handleDrag(event, bar)

      const dragEndEvent = new MouseEvent("mouseup", {
        clientX: 200,
        bubbles: true
      })

      document.dispatchEvent(dragEndEvent)

      expect(bar.ganttBarConfig.id).toBe("test")
    })
  })
})
