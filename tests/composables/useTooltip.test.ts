import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useTooltip } from "../../src/composables/useTooltip"
import type { GanttBarObject } from "../../src/types"

describe("useTooltip", () => {
  let mockBar: GanttBarObject

  beforeEach(() => {
    vi.useFakeTimers()
    mockBar = {
      ganttBarConfig: {
        id: "bar1",
        label: "Test Bar"
      },
      start: "2024-01-01",
      end: "2024-01-02"
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { showTooltip, tooltipBar } = useTooltip()
      expect(showTooltip.value).toBe(false)
      expect(tooltipBar.value).toBeUndefined()
    })
  })

  describe("initTooltip", () => {
    it("should set tooltipBar immediately", () => {
      const { tooltipBar, initTooltip } = useTooltip()
      initTooltip(mockBar)
      expect(tooltipBar.value).toStrictEqual(mockBar)
    })

    it("should show tooltip after delay", async () => {
      const { showTooltip, initTooltip } = useTooltip()
      initTooltip(mockBar)
      expect(showTooltip.value).toBe(false)

      vi.advanceTimersByTime(800)
      expect(showTooltip.value).toBe(true)
    })

    it("should clear previous timeout when called multiple times", () => {
      const { showTooltip, initTooltip } = useTooltip()
      
      initTooltip(mockBar)
      vi.advanceTimersByTime(400)
      
      const mockBar2 = { ...mockBar, ganttBarConfig: { ...mockBar.ganttBarConfig, id: "bar2" } }
      initTooltip(mockBar2)
      vi.advanceTimersByTime(400)
      
      expect(showTooltip.value).toBe(false)
      vi.advanceTimersByTime(400)
      expect(showTooltip.value).toBe(true)
    })
  })

  describe("clearTooltip", () => {
    it("should hide tooltip", () => {
      const { showTooltip, clearTooltip } = useTooltip()
      showTooltip.value = true
      clearTooltip()
      expect(showTooltip.value).toBe(false)
    })

    it("should cancel pending tooltip display", () => {
      const { showTooltip, initTooltip, clearTooltip } = useTooltip()
      
      initTooltip(mockBar)
      clearTooltip()
      vi.advanceTimersByTime(800)
      
      expect(showTooltip.value).toBe(false)
    })
  })

  describe("timeout handling", () => {
    it("should respect 800ms delay", () => {
      const { showTooltip, initTooltip } = useTooltip()
      
      initTooltip(mockBar)
      vi.advanceTimersByTime(799)
      expect(showTooltip.value).toBe(false)
      
      vi.advanceTimersByTime(1)
      expect(showTooltip.value).toBe(true)
    })

    it("should clear timeout on component cleanup", () => {
      const { initTooltip } = useTooltip()
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      
      initTooltip(mockBar)
      clearTimeoutSpy.mockClear()
      
      initTooltip(mockBar)
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe("tooltip state management", () => {
    it("should handle multiple bars correctly", () => {
      const { tooltipBar, initTooltip } = useTooltip()
      
      const mockBar1 = { ...mockBar }
      const mockBar2 = { ...mockBar, ganttBarConfig: { ...mockBar.ganttBarConfig, id: "bar2" } }
      
      initTooltip(mockBar1)
      expect(tooltipBar.value).toStrictEqual(mockBar1)
      
      initTooltip(mockBar2)
      expect(tooltipBar.value).toStrictEqual(mockBar2)
    })

    it("should maintain tooltip state during delay", () => {
      const { showTooltip, tooltipBar, initTooltip } = useTooltip()
      
      initTooltip(mockBar)
      expect(tooltipBar.value).toStrictEqual(mockBar)
      expect(showTooltip.value).toBe(false)
      
      vi.advanceTimersByTime(400)
      expect(tooltipBar.value).toStrictEqual(mockBar)
      expect(showTooltip.value).toBe(false)
    })
  })
})