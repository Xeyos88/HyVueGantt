import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import useBarDragLimit from "../../src/composables/useBarDragLimit"
import type { GanttBarObject, ChartRow } from "../../src/types"

const createMockBar = (id: string, immobile = false, bundle?: string): GanttBarObject => ({
  ganttBarConfig: {
    id,
    immobile,
    bundle,
    pushOnOverlap: true,
    pushOnConnect: true
  }
})

vi.mock("../../src/provider/provideConfig", () => ({
  default: () => ({
    pushOnOverlap: ref(true),
    pushOnConnect: ref(true)
  })
}))

vi.mock("../../src/composables/useBarDragManagement", () => ({
  default: () => ({
    getConnectedBars: vi.fn().mockImplementation((bar: GanttBarObject) => {
      if (bar.ganttBarConfig.bundle) {
        return [
          {
            ganttBarConfig: {
              id: 'connected1',
              pushOnOverlap: true,
              pushOnConnect: true
            }
          }
        ]
      }
      return []
    })
  })
}))

describe("useBarDragLimit", () => {

  vi.mock("vue", async () => {
    const actual = await vi.importActual("vue")
    return {
      ...(actual as any),
      inject: () => ({
        rows: ref<ChartRow[]>([
          {
            label: "Row 1",
            bars: [
              createMockBar("bar1"),
              createMockBar("bar2"),
              createMockBar("bar3", true) 
            ]
          }
        ])
      })
    }
  })

  const createMockBarElement = (left: number, width: number) => ({
    offsetLeft: left,
    offsetWidth: width
  })

  beforeEach(() => {
    vi.clearAllMocks()
    document.getElementById = vi.fn()
  })

  describe("setDragLimitsOfGanttBar", () => {
    it("should not set limits when pushOnOverlap is false", () => {      
      const { setDragLimitsOfGanttBar } = useBarDragLimit()
      const bar = createMockBar("test")
      
      setDragLimitsOfGanttBar(bar)
      expect(bar.ganttBarConfig.dragLimitLeft).toBeUndefined()
      expect(bar.ganttBarConfig.dragLimitRight).toBeUndefined()
    })

    it("should not set limits when bar has pushOnOverlap set to false", () => {
      const bar = {
        ...createMockBar("test"),
        ganttBarConfig: {
          id: "test",
          pushOnOverlap: false,
          pushOnConnect: true
        }
      }
      
      const { setDragLimitsOfGanttBar } = useBarDragLimit()
      setDragLimitsOfGanttBar(bar)
      
      expect(bar.ganttBarConfig.dragLimitLeft).toBeUndefined()
      expect(bar.ganttBarConfig.dragLimitRight).toBeUndefined()
    })

    it("should handle bundled bars correctly", () => {
      document.getElementById = vi.fn().mockImplementation((id) => {
        const positions: Record<string, any> = {
          "bar1": createMockBarElement(100, 50),
          "bar2": createMockBarElement(200, 50),
          "bundle1": createMockBarElement(300, 50)
        }
        return positions[id]
      })

      const bundledBar1 = createMockBar("bar1", false, "group1")
      const bundledBar2 = createMockBar("bar2", false, "group1")
      
      const { setDragLimitsOfGanttBar } = useBarDragLimit()
      setDragLimitsOfGanttBar(bundledBar1)

      expect(bundledBar1.ganttBarConfig.dragLimitLeft).toBe(bundledBar2.ganttBarConfig.dragLimitLeft)
      expect(bundledBar1.ganttBarConfig.dragLimitRight).toBe(bundledBar2.ganttBarConfig.dragLimitRight)
    })


    it("should handle missing DOM elements gracefully", () => {
      document.getElementById = vi.fn().mockReturnValue(null)

      const bar = createMockBar("bar1")
      const { setDragLimitsOfGanttBar } = useBarDragLimit()
      
      setDragLimitsOfGanttBar(bar)
      
      expect(bar.ganttBarConfig.dragLimitLeft).toBeUndefined()
      expect(bar.ganttBarConfig.dragLimitRight).toBeUndefined()
    })

    it("should apply same limits to all bars in a bundle", () => {
      document.getElementById = vi.fn().mockImplementation((id) => {
        const positions: Record<string, any> = {
          "bar1": createMockBarElement(100, 50),
          "bar2": createMockBarElement(200, 50),
          "immobile": createMockBarElement(300, 50)
        }
        return positions[id]
      })

      const bundledBar1 = createMockBar("bar1", false, "group1")
      const bundledBar2 = createMockBar("bar2", false, "group1")
      
      const { setDragLimitsOfGanttBar } = useBarDragLimit()
      setDragLimitsOfGanttBar(bundledBar1)

      expect(bundledBar1.ganttBarConfig.dragLimitLeft)
        .toBe(bundledBar2.ganttBarConfig.dragLimitLeft)
      expect(bundledBar1.ganttBarConfig.dragLimitRight)
        .toBe(bundledBar2.ganttBarConfig.dragLimitRight)
    })
  })
})