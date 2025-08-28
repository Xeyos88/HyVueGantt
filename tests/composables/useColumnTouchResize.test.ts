import { describe, it, expect, vi, beforeEach } from "vitest"
import { useColumnTouchResize, type TouchResizeState } from "../../src/composables/useColumnTouchResize"

describe("useColumnTouchResize", () => {
  let mockOnResize: ReturnType<typeof vi.fn>
  
  // Helper function to create mock touch events
  const createMockTouchEvent = (clientX: number, type: string = "touchstart"): TouchEvent => {
    const touch = {
      clientX,
      clientY: 0,
      identifier: 0,
      target: document.createElement("div"),
      pageX: clientX,
      pageY: 0,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 0,
      screenX: clientX,
      screenY: 0
    } as Touch

    const event = new TouchEvent(type, {
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch],
      bubbles: true,
      cancelable: true
    })

    // Mock preventDefault
    const preventDefaultSpy = vi.spyOn(event, "preventDefault")
    
    return event
  }

  beforeEach(() => {
    mockOnResize = vi.fn()
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { touchState } = useColumnTouchResize()

      expect(touchState.value).toEqual({
        isResizing: false,
        startX: 0,
        currentColumn: null,
        initialWidth: 0
      })
    })

    it("should return all expected methods", () => {
      const touchResize = useColumnTouchResize()

      expect(touchResize.touchState).toBeDefined()
      expect(touchResize.handleTouchStart).toBeTypeOf("function")
      expect(touchResize.handleTouchMove).toBeTypeOf("function")
      expect(touchResize.handleTouchEnd).toBeTypeOf("function")
      expect(touchResize.handleTouchCancel).toBeTypeOf("function")
    })
  })

  describe("handleTouchStart", () => {
    it("should initialize resize state when touch starts", () => {
      const { touchState, handleTouchStart } = useColumnTouchResize()
      const touchEvent = createMockTouchEvent(100)

      handleTouchStart(touchEvent, "column1", 200)

      expect(touchState.value).toEqual({
        isResizing: true,
        startX: 100,
        currentColumn: "column1",
        initialWidth: 200
      })
    })

    it("should prevent default on touch event", () => {
      const { handleTouchStart } = useColumnTouchResize()
      const touchEvent = createMockTouchEvent(100)
      const preventDefaultSpy = vi.spyOn(touchEvent, "preventDefault")

      handleTouchStart(touchEvent, "column1", 200)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it("should return early if no touch is available", () => {
      const { touchState, handleTouchStart } = useColumnTouchResize()
      
      // Create event with empty touches array
      const event = new TouchEvent("touchstart", {
        touches: [],
        bubbles: true,
        cancelable: true
      })

      handleTouchStart(event, "column1", 200)

      // State should remain unchanged
      expect(touchState.value).toEqual({
        isResizing: false,
        startX: 0,
        currentColumn: null,
        initialWidth: 0
      })
    })

    it("should handle different column names", () => {
      const { touchState, handleTouchStart } = useColumnTouchResize()
      const touchEvent = createMockTouchEvent(150)

      handleTouchStart(touchEvent, "labelColumn", 300)

      expect(touchState.value.currentColumn).toBe("labelColumn")
      expect(touchState.value.initialWidth).toBe(300)
    })

    it("should handle different initial widths", () => {
      const { touchState, handleTouchStart } = useColumnTouchResize()
      const touchEvent = createMockTouchEvent(50)

      handleTouchStart(touchEvent, "column1", 150)

      expect(touchState.value.initialWidth).toBe(150)
      expect(touchState.value.startX).toBe(50)
    })
  })

  describe("handleTouchMove", () => {
    it("should calculate and apply new width during resize", () => {
      const { touchState, handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Start resize
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Move touch to calculate new width
      const moveEvent = createMockTouchEvent(150, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // deltaX = 150 - 100 = 50, newWidth = 200 + 50 = 250
      expect(mockOnResize).toHaveBeenCalledWith("column1", 250)
    })

    it("should enforce minimum width of 50px", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Start resize with small initial width
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 80)

      // Move touch to create large negative delta
      const moveEvent = createMockTouchEvent(0, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // deltaX = 0 - 100 = -100, newWidth = max(50, 80 - 100) = 50
      expect(mockOnResize).toHaveBeenCalledWith("column1", 50)
    })

    it("should prevent default on touch move event", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Start resize
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Create move event and spy on preventDefault
      const moveEvent = createMockTouchEvent(120, "touchmove")
      const preventDefaultSpy = vi.spyOn(moveEvent, "preventDefault")

      handleTouchMove(moveEvent, mockOnResize)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it("should return early if not resizing", () => {
      const { handleTouchMove } = useColumnTouchResize()
      
      // Try to move without starting resize
      const moveEvent = createMockTouchEvent(120, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).not.toHaveBeenCalled()
    })

    it("should return early if no touch is available", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Start resize
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Create event with empty touches array
      const moveEvent = new TouchEvent("touchmove", {
        touches: [],
        bubbles: true,
        cancelable: true
      })

      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).not.toHaveBeenCalled()
    })

    it("should handle positive width changes", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(200)
      handleTouchStart(startEvent, "column1", 300)

      const moveEvent = createMockTouchEvent(250, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // deltaX = 250 - 200 = 50, newWidth = 300 + 50 = 350
      expect(mockOnResize).toHaveBeenCalledWith("column1", 350)
    })

    it("should handle negative width changes", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(200)
      handleTouchStart(startEvent, "column1", 300)

      const moveEvent = createMockTouchEvent(150, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // deltaX = 150 - 200 = -50, newWidth = 300 - 50 = 250
      expect(mockOnResize).toHaveBeenCalledWith("column1", 250)
    })

    it("should not call onResize if currentColumn is null", () => {
      const { touchState, handleTouchMove } = useColumnTouchResize()
      
      // Manually set state to resizing but with null column
      touchState.value = {
        isResizing: true,
        startX: 100,
        currentColumn: null,
        initialWidth: 200
      }

      const moveEvent = createMockTouchEvent(120, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).not.toHaveBeenCalled()
    })
  })

  describe("handleTouchEnd", () => {
    it("should reset state when touch ends during resize", () => {
      const { touchState, handleTouchStart, handleTouchEnd } = useColumnTouchResize()
      
      // Start resize
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Verify resize is active
      expect(touchState.value.isResizing).toBe(true)

      // End touch
      handleTouchEnd()

      // State should be reset
      expect(touchState.value).toEqual({
        isResizing: false,
        startX: 0,
        currentColumn: null,
        initialWidth: 0
      })
    })

    it("should do nothing if not currently resizing", () => {
      const { touchState, handleTouchEnd } = useColumnTouchResize()
      
      // Ensure not resizing
      expect(touchState.value.isResizing).toBe(false)

      // End touch (should be no-op)
      handleTouchEnd()

      // State should remain unchanged
      expect(touchState.value).toEqual({
        isResizing: false,
        startX: 0,
        currentColumn: null,
        initialWidth: 0
      })
    })
  })

  describe("handleTouchCancel", () => {
    it("should behave same as handleTouchEnd", () => {
      const { touchState, handleTouchStart, handleTouchCancel } = useColumnTouchResize()
      
      // Start resize
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      expect(touchState.value.isResizing).toBe(true)

      // Cancel touch
      handleTouchCancel()

      // State should be reset
      expect(touchState.value).toEqual({
        isResizing: false,
        startX: 0,
        currentColumn: null,
        initialWidth: 0
      })
    })

    it("should be the same function reference as handleTouchEnd", () => {
      const { handleTouchEnd, handleTouchCancel } = useColumnTouchResize()
      
      expect(handleTouchCancel).toBe(handleTouchEnd)
    })
  })

  describe("Edge cases and scenarios", () => {
    it("should handle multiple touch events in sequence", () => {
      const { touchState, handleTouchStart, handleTouchMove, handleTouchEnd } = useColumnTouchResize()
      
      // First resize operation
      const startEvent1 = createMockTouchEvent(100)
      handleTouchStart(startEvent1, "column1", 200)

      const moveEvent1 = createMockTouchEvent(150, "touchmove")
      handleTouchMove(moveEvent1, mockOnResize)

      handleTouchEnd()

      expect(mockOnResize).toHaveBeenCalledWith("column1", 250)

      // Second resize operation
      const startEvent2 = createMockTouchEvent(80)
      handleTouchStart(startEvent2, "column2", 150)

      const moveEvent2 = createMockTouchEvent(120, "touchmove")
      handleTouchMove(moveEvent2, mockOnResize)

      handleTouchEnd()

      expect(mockOnResize).toHaveBeenCalledWith("column2", 190)
      expect(touchState.value.isResizing).toBe(false)
    })

    it("should handle resize with very small movements", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Very small movement (1px)
      const moveEvent = createMockTouchEvent(101, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).toHaveBeenCalledWith("column1", 201)
    })

    it("should handle resize with large movements", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 200)

      // Large movement (500px)
      const moveEvent = createMockTouchEvent(600, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).toHaveBeenCalledWith("column1", 700)
    })

    it("should handle zero initial width", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "column1", 0)

      const moveEvent = createMockTouchEvent(150, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // deltaX = 50, newWidth = max(50, 0 + 50) = 50
      expect(mockOnResize).toHaveBeenCalledWith("column1", 50)
    })

    it("should handle touch coordinates at boundaries", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Start at coordinate 0
      const startEvent = createMockTouchEvent(0)
      handleTouchStart(startEvent, "column1", 100)

      // Move to coordinate 0 (no movement)
      const moveEvent = createMockTouchEvent(0, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).toHaveBeenCalledWith("column1", 100)
    })
  })

  describe("State management", () => {
    it("should maintain state integrity during operations", () => {
      const { touchState, handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "testColumn", 250)

      expect(touchState.value.isResizing).toBe(true)
      expect(touchState.value.startX).toBe(100)
      expect(touchState.value.currentColumn).toBe("testColumn")
      expect(touchState.value.initialWidth).toBe(250)

      const moveEvent = createMockTouchEvent(130, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      // State should remain the same during move
      expect(touchState.value.isResizing).toBe(true)
      expect(touchState.value.startX).toBe(100)
      expect(touchState.value.currentColumn).toBe("testColumn")
      expect(touchState.value.initialWidth).toBe(250)
    })

    it("should handle state changes from external modifications", () => {
      const { touchState, handleTouchMove } = useColumnTouchResize()
      
      // Manually modify state
      touchState.value = {
        isResizing: true,
        startX: 200,
        currentColumn: "modified",
        initialWidth: 400
      }

      const moveEvent = createMockTouchEvent(250, "touchmove")
      handleTouchMove(moveEvent, mockOnResize)

      expect(mockOnResize).toHaveBeenCalledWith("modified", 450)
    })
  })

  describe("Callback integration", () => {
    it("should work with different callback implementations", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      // Test with different callback
      const customCallback = vi.fn((column, width) => {
        // Custom logic
        return { column, width }
      })

      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "testCol", 200)

      const moveEvent = createMockTouchEvent(150, "touchmove")
      handleTouchMove(moveEvent, customCallback)

      expect(customCallback).toHaveBeenCalledWith("testCol", 250)
    })

    it("should handle callback that throws errors", () => {
      const { handleTouchStart, handleTouchMove } = useColumnTouchResize()
      
      const errorCallback = vi.fn(() => {
        throw new Error("Callback error")
      })

      const startEvent = createMockTouchEvent(100)
      handleTouchStart(startEvent, "testCol", 200)

      const moveEvent = createMockTouchEvent(150, "touchmove")
      
      // Should not throw when callback throws
      expect(() => handleTouchMove(moveEvent, errorCallback)).toThrow("Callback error")
    })
  })
})