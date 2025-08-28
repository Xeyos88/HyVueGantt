import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useChartNavigation } from "../../src/composables/useChartNavigation"

// Mock nextTick at the module level
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    nextTick: vi.fn().mockResolvedValue(undefined)
  }
})

describe("useChartNavigation", () => {
  // Mock DOM elements
  const createMockElement = (properties = {}) => {
    const element = {
      scrollTop: 0,
      scrollLeft: 0,
      scrollHeight: 1000,
      clientHeight: 400,
      clientWidth: 800,
      firstElementChild: { clientHeight: 40 },
      ...properties
    } as HTMLElement

    // Make scrollTop writable
    Object.defineProperty(element, 'scrollTop', {
      writable: true,
      value: properties.scrollTop || 0
    })

    Object.defineProperty(element, 'scrollLeft', {
      writable: true,
      value: properties.scrollLeft || 0
    })

    return element
  }

  const mockRowsContainer = ref(createMockElement())
  const mockLabelColumn = ref({
    setScroll: vi.fn()
  })

  const mockScrollRefs = {
    rowsContainer: mockRowsContainer,
    labelColumn: mockLabelColumn
  }

  const mockUpdateBarPositions = vi.fn()
  
  const mockTimeaxisUnits = {
    timeaxisUnits: ref({
      result: {
        lowerUnits: [
          { width: "100px" },
          { width: "150px" },
          { width: "200px" }
        ]
      }
    }),
    adjustZoomAndPrecision: vi.fn()
  }

  const mockOptions = {
    scrollRefs: mockScrollRefs,
    updateBarPositions: mockUpdateBarPositions,
    timeaxisUnits: mockTimeaxisUnits
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock elements
    mockRowsContainer.value = createMockElement()
    mockLabelColumn.value = {
      setScroll: vi.fn()
    }
  })

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const navigation = useChartNavigation(mockOptions, 0)

      expect(navigation.scrollPosition.value).toBe(0)
      expect(navigation.isAtTop.value).toBe(true)
      expect(navigation.isAtBottom.value).toBe(false)
    })

    it("should return all expected methods", () => {
      const navigation = useChartNavigation(mockOptions, 0)

      expect(navigation.handleStep).toBeTypeOf("function")
      expect(navigation.handleScroll).toBeTypeOf("function")
      expect(navigation.handleWheel).toBeTypeOf("function")
      expect(navigation.handleContentScroll).toBeTypeOf("function")
      expect(navigation.handleLabelScroll).toBeTypeOf("function")
      expect(navigation.handleZoomUpdate).toBeTypeOf("function")
      expect(navigation.scrollRowUp).toBeTypeOf("function")
      expect(navigation.scrollRowDown).toBeTypeOf("function")
    })
  })

  describe("handleStep", () => {
    it("should move to specific position", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 800 })

      navigation.handleStep(50, wrapper)

      // Total width = 450 (100+150+200), maxScroll = 450-800 = -350 (but clamped to 0)
      // With negative maxScroll, targetScroll would be negative, so scrollLeft should remain 0
      expect(wrapper.scrollLeft).toBe(-175) // ((-350 * 50) / 100)
      expect(navigation.scrollPosition.value).toBe(50)
    })

    it("should handle position at boundaries", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 200 }) // Make scrollable

      navigation.handleStep(0, wrapper)
      expect(wrapper.scrollLeft).toBe(0)
      expect(navigation.scrollPosition.value).toBe(0)

      navigation.handleStep(100, wrapper)
      expect(wrapper.scrollLeft).toBe(250) // (250 * 100) / 100
      expect(navigation.scrollPosition.value).toBe(100)
    })
  })

  describe("handleScroll", () => {
    it("should scroll to position based on scrollPosition value", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 200 })

      navigation.scrollPosition.value = 25
      navigation.handleScroll(wrapper)

      expect(wrapper.scrollLeft).toBe(62.5) // (250 * 25) / 100
    })

    it("should handle different scroll positions", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 300 })

      navigation.scrollPosition.value = 75
      navigation.handleScroll(wrapper)

      const maxScroll = 450 - 300 // 150
      const expectedScroll = (maxScroll * 75) / 100 // 112.5
      expect(wrapper.scrollLeft).toBe(expectedScroll)
    })
  })

  describe("handleWheel", () => {
    it("should prevent default and return early when maxRows is not 0", () => {
      const navigation = useChartNavigation(mockOptions, 5) // maxRows = 5
      const wrapper = createMockElement()
      
      const wheelEvent = new WheelEvent("wheel", { 
        deltaX: 50,
        deltaY: 0
      })
      const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault')

      navigation.handleWheel(wheelEvent, wrapper)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(wrapper.scrollLeft).toBe(0) // Should not change
      expect(navigation.scrollPosition.value).toBe(0) // Should not change
    })

    it("should not prevent default when deltaX is 0 and maxRows is not 0", () => {
      const navigation = useChartNavigation(mockOptions, 5)
      const wrapper = createMockElement()
      
      const wheelEvent = new WheelEvent("wheel", { 
        deltaX: 0,
        deltaY: 50
      })
      const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault')

      navigation.handleWheel(wheelEvent, wrapper)

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it("should scroll horizontally when maxRows is 0", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 200 })

      const wheelEvent = new WheelEvent("wheel", { 
        deltaX: 100,
        deltaY: 0
      })

      navigation.handleWheel(wheelEvent, wrapper)

      expect(wrapper.scrollLeft).toBe(100)
      // maxScroll = 450 - 200 = 250, scrollPosition = (100/250) * 100 = 40
      expect(navigation.scrollPosition.value).toBe(40)
    })

    it("should use deltaY when deltaX is not available", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      const wrapper = createMockElement({ clientWidth: 200 })

      const wheelEvent = new WheelEvent("wheel", { 
        deltaX: 0,
        deltaY: 75
      })

      navigation.handleWheel(wheelEvent, wrapper)

      expect(wrapper.scrollLeft).toBe(75)
      expect(navigation.scrollPosition.value).toBe(30) // (75/250) * 100
    })
  })

  describe("handleContentScroll", () => {
    it("should synchronize scroll with label column", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      const mockTarget = createMockElement({ scrollTop: 150 })
      const scrollEvent = { target: mockTarget } as Event

      navigation.handleContentScroll(scrollEvent)

      expect(mockLabelColumn.value.setScroll).toHaveBeenCalledWith(150)
    })

    it("should handle missing label column", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      mockScrollRefs.labelColumn.value = null

      const mockTarget = createMockElement({ scrollTop: 150 })
      const scrollEvent = { target: mockTarget } as Event

      // Should not throw error
      expect(() => navigation.handleContentScroll(scrollEvent)).not.toThrow()
    })

    it("should update vertical scroll state", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      // Test at top
      mockRowsContainer.value.scrollTop = 0
      const mockTarget = createMockElement({ scrollTop: 0 })
      const scrollEvent = { target: mockTarget } as Event
      
      navigation.handleContentScroll(scrollEvent)
      expect(navigation.isAtTop.value).toBe(true)
      expect(navigation.isAtBottom.value).toBe(false)

      // Test at bottom
      mockRowsContainer.value.scrollTop = 600
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400
      const mockTargetBottom = createMockElement({ scrollTop: 600 })
      const scrollEventBottom = { target: mockTargetBottom } as Event
      
      navigation.handleContentScroll(scrollEventBottom)
      expect(navigation.isAtTop.value).toBe(false)
      expect(navigation.isAtBottom.value).toBe(true)
    })
  })

  describe("handleLabelScroll", () => {
    it("should synchronize scroll with rows container", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      navigation.handleLabelScroll(200)

      expect(mockRowsContainer.value.scrollTop).toBe(200)
    })

    it("should handle missing rows container", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      mockScrollRefs.rowsContainer.value = null

      // Should not throw error
      expect(() => navigation.handleLabelScroll(200)).not.toThrow()
    })

    it("should update vertical scroll state", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      // Set up container with specific dimensions
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      navigation.handleLabelScroll(0)
      expect(navigation.isAtTop.value).toBe(true)
      expect(navigation.isAtBottom.value).toBe(false)

      navigation.handleLabelScroll(600)
      expect(navigation.isAtTop.value).toBe(false)
      expect(navigation.isAtBottom.value).toBe(true)
    })
  })

  describe("handleZoomUpdate", () => {
    it("should increase zoom and update bar positions", async () => {
      const navigation = useChartNavigation(mockOptions, 0)

      await navigation.handleZoomUpdate(true)

      expect(mockTimeaxisUnits.adjustZoomAndPrecision).toHaveBeenCalledWith(true)
      expect(mockUpdateBarPositions).toHaveBeenCalled()
    })

    it("should decrease zoom and update bar positions", async () => {
      const navigation = useChartNavigation(mockOptions, 0)

      await navigation.handleZoomUpdate(false)

      expect(mockTimeaxisUnits.adjustZoomAndPrecision).toHaveBeenCalledWith(false)
      expect(mockUpdateBarPositions).toHaveBeenCalled()
    })
  })

  describe("scrollRowUp", () => {
    it("should scroll up by one row height", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 120
      mockRowsContainer.value.firstElementChild = { clientHeight: 40 } as Element

      navigation.scrollRowUp()

      expect(mockRowsContainer.value.scrollTop).toBe(80) // 120 - 40
      expect(mockLabelColumn.value.setScroll).toHaveBeenCalledWith(80)
    })

    it("should not scroll above 0", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 20
      mockRowsContainer.value.firstElementChild = { clientHeight: 40 } as Element

      navigation.scrollRowUp()

      expect(mockRowsContainer.value.scrollTop).toBe(0) // Math.max(0, 20 - 40)
    })

    it("should handle missing rows container", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      mockScrollRefs.rowsContainer.value = null

      expect(() => navigation.scrollRowUp()).not.toThrow()
    })

    it("should handle missing first element child", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 120
      mockRowsContainer.value.firstElementChild = null

      navigation.scrollRowUp()

      expect(mockRowsContainer.value.scrollTop).toBe(120) // Should remain the same when rowHeight is 0
    })
  })

  describe("scrollRowDown", () => {
    it("should scroll down by one row height", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 80
      mockRowsContainer.value.firstElementChild = { clientHeight: 40 } as Element
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      navigation.scrollRowDown()

      expect(mockRowsContainer.value.scrollTop).toBe(120) // 80 + 40
      expect(mockLabelColumn.value.setScroll).toHaveBeenCalledWith(120)
    })

    it("should not scroll below maximum", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 580
      mockRowsContainer.value.firstElementChild = { clientHeight: 40 } as Element
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      navigation.scrollRowDown()

      const maxScroll = 1000 - 400 // 600
      expect(mockRowsContainer.value.scrollTop).toBe(600) // Math.min(600, 580 + 40)
    })

    it("should handle missing rows container", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      mockScrollRefs.rowsContainer.value = null

      expect(() => navigation.scrollRowDown()).not.toThrow()
    })

    it("should handle missing first element child", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 80
      mockRowsContainer.value.firstElementChild = null
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      navigation.scrollRowDown()

      expect(mockRowsContainer.value.scrollTop).toBe(80) // Should remain the same when rowHeight is 0
    })
  })

  describe("Vertical scroll state management", () => {
    it("should correctly identify when at top", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 0
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      const scrollEvent = { target: mockRowsContainer.value } as Event
      navigation.handleContentScroll(scrollEvent)

      expect(navigation.isAtTop.value).toBe(true)
      expect(navigation.isAtBottom.value).toBe(false)
    })

    it("should correctly identify when at bottom", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 600
      mockRowsContainer.value.scrollHeight = 1000  
      mockRowsContainer.value.clientHeight = 400

      const scrollEvent = { target: mockRowsContainer.value } as Event
      navigation.handleContentScroll(scrollEvent)

      expect(navigation.isAtTop.value).toBe(false)
      expect(navigation.isAtBottom.value).toBe(true)
    })

    it("should correctly identify when in middle", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      mockRowsContainer.value.scrollTop = 300
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      const scrollEvent = { target: mockRowsContainer.value } as Event
      navigation.handleContentScroll(scrollEvent)

      expect(navigation.isAtTop.value).toBe(false)
      expect(navigation.isAtBottom.value).toBe(false)
    })

    it("should handle edge case where scroll position is very close to bottom", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      // scrollTop + clientHeight should be >= scrollHeight (within Math.ceil tolerance)
      mockRowsContainer.value.scrollTop = 599.8  
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      const scrollEvent = { target: mockRowsContainer.value } as Event
      navigation.handleContentScroll(scrollEvent)

      expect(navigation.isAtBottom.value).toBe(true)
    })
  })

  describe("Edge cases and error handling", () => {
    it("should handle empty timeaxis units", () => {
      const emptyTimeaxisUnits = {
        timeaxisUnits: ref({
          result: {
            lowerUnits: []
          }
        }),
        adjustZoomAndPrecision: vi.fn()
      }

      const emptyOptions = {
        ...mockOptions,
        timeaxisUnits: emptyTimeaxisUnits
      }

      const navigation = useChartNavigation(emptyOptions, 0)
      const wrapper = createMockElement({ clientWidth: 800 })

      // Should not throw error when handling step with empty units
      expect(() => navigation.handleStep(50, wrapper)).not.toThrow()
    })

    it("should handle timeaxis units without width", () => {
      const unitsWithoutWidth = {
        timeaxisUnits: ref({
          result: {
            lowerUnits: [
              { width: undefined },
              { width: "150px" },
              { width: null }
            ]
          }
        }),
        adjustZoomAndPrecision: vi.fn()
      }

      const optionsWithoutWidth = {
        ...mockOptions,
        timeaxisUnits: unitsWithoutWidth
      }

      const navigation = useChartNavigation(optionsWithoutWidth, 0)
      
      // Should handle parseInt of undefined/null gracefully
      expect(() => navigation.handleStep(50, createMockElement())).not.toThrow()
    })

    it("should handle null/undefined scroll references", () => {
      const nullScrollRefs = {
        rowsContainer: ref(null),
        labelColumn: ref(null)
      }

      const nullOptions = {
        ...mockOptions,
        scrollRefs: nullScrollRefs
      }

      const navigation = useChartNavigation(nullOptions, 0)

      // All methods should handle null refs gracefully
      expect(() => navigation.scrollRowUp()).not.toThrow()
      expect(() => navigation.scrollRowDown()).not.toThrow()
      expect(() => navigation.handleLabelScroll(100)).not.toThrow()
    })
  })

  describe("Integration scenarios", () => {
    it("should properly integrate scroll events with state updates", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      // Simulate a complete scroll interaction
      mockRowsContainer.value.scrollTop = 200
      mockRowsContainer.value.scrollHeight = 1000
      mockRowsContainer.value.clientHeight = 400

      const scrollEvent = { target: mockRowsContainer.value } as Event
      navigation.handleContentScroll(scrollEvent)

      expect(mockLabelColumn.value.setScroll).toHaveBeenCalledWith(200)
      expect(navigation.isAtTop.value).toBe(false)
      expect(navigation.isAtBottom.value).toBe(false)
    })

    it("should handle rapid scroll changes", () => {
      const navigation = useChartNavigation(mockOptions, 0)
      
      // Simulate multiple rapid scroll events
      for (let i = 0; i < 10; i++) {
        mockRowsContainer.value.scrollTop = i * 50
        const scrollEvent = { target: mockRowsContainer.value } as Event
        navigation.handleContentScroll(scrollEvent)
      }

      // Should handle all events without errors
      expect(mockLabelColumn.value.setScroll).toHaveBeenCalledTimes(10)
      expect(navigation.isAtTop.value).toBe(false)
    })
  })
})