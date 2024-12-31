import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useConnections } from "../../src/composables/useConnections"
import type { ChartRow, GanttBarObject, BarPosition } from "../../src/types"

describe("useConnections", () => {
  const mockRowManager = {
    rows: ref<ChartRow[]>([
      {
        label: "Row 1",
        bars: [
          {
            ganttBarConfig: {
              id: "bar1",
              connections: [
                { targetId: "bar2", type: "straight", color: "#ff0000" }
              ]
            }
          },
          {
            ganttBarConfig: {
              id: "bar2",
              connections: []
            }
          }
        ]
      }
    ])
  }

  const mockProps = {
    defaultConnectionType: "straight",
    defaultConnectionColor: "#000000",
    defaultConnectionPattern: "solid",
    defaultConnectionAnimated: false,
    defaultConnectionAnimationSpeed: "normal"
  }

  const mockId = ref("gantt-1")

  const createMockBar = (id: string, rect: Partial<DOMRect>) => ({
    getAttribute: vi.fn().mockReturnValue(id),
    getBoundingClientRect: () => ({
      left: 100,
      top: 50,
      width: 200,
      height: 30,
      right: 300,
      bottom: 80,
      x: 100,
      y: 50,
      toJSON: () => ({}),
      ...rect
    })
  })

  const createMockRowsContainer = (scrollTop = 0, scrollLeft = 0) => ({
    scrollTop,
    scrollLeft,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
      right: 1000,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  })

  const createMockParentElement = (rowsContainer: any, bars: any[]) => ({
    querySelector: vi.fn().mockReturnValue(rowsContainer),
    querySelectorAll: vi.fn().mockReturnValue(bars)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with empty connections and bar positions", () => {
      const { connections, barPositions } = useConnections(mockRowManager, mockProps, mockId)
      expect(connections.value).toHaveLength(0)
      expect(barPositions.value.size).toBe(0)
    })

    it("should initialize connections from bars", () => {
      const { connections, initializeConnections } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )
      initializeConnections()
      expect(connections.value).toHaveLength(1)
      expect(connections.value[0]).toEqual({
        sourceId: "bar1",
        targetId: "bar2",
        type: "straight",
        color: "#ff0000"
      })
    })
  })

  describe("getConnectorProps", () => {
      it("should merge custom properties with defaults", async () => {
      const mockBars = [
        createMockBar("bar1", {}),
        createMockBar("bar2", {})
      ]
      const mockRowsContainer = createMockRowsContainer()
      const mockParent = createMockParentElement(mockRowsContainer, mockBars)

      document.getElementById = vi.fn().mockImplementation((id) => {
        if (id === "gantt-1") return mockParent
        return mockBars.find(bar => bar.getAttribute("id") === id) || null
      })

      const { getConnectorProps, updateBarPositions } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )

      await updateBarPositions()

      const result = getConnectorProps.value({
        sourceId: "bar1",
        targetId: "bar2",
        type: "bezier",
        color: "#ff0000"
      })

      expect(result).toBeDefined()
      expect(result?.type).toBe("bezier")
      expect(result?.color).toBe("#ff0000")
    })
  })

  describe("updateBarPositions", () => {
    it("should update bar positions with scroll offset", async () => {
      const mockBars = [
        createMockBar("bar1", {
          left: 100,
          top: 50
        })
      ]
      const mockRowsContainer = createMockRowsContainer(100, 50)
      const mockParent = createMockParentElement(mockRowsContainer, mockBars)

      document.getElementById = vi.fn().mockImplementation((id) => {
        if (id === "gantt-1") return mockParent
        return mockBars.find(bar => bar.getAttribute("id") === id) || null
      })

      const { barPositions, updateBarPositions } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )

      await updateBarPositions()

      const firstBar = barPositions.value.get("bar1")
      expect(firstBar).toBeDefined()
      expect(firstBar?.x).toBe(150) // 100 + scrollLeft
      expect(firstBar?.y).toBe(150) // 50 + scrollTop
    })

    it("should clear existing positions before updating", async () => {
      const mockBars = [createMockBar("bar1", {})]
      const mockRowsContainer = createMockRowsContainer()
      const mockParent = createMockParentElement(mockRowsContainer, mockBars)

      document.getElementById = vi.fn().mockImplementation((id) => {
        if (id === "gantt-1") return mockParent
        return mockBars.find(bar => bar.getAttribute("id") === id) || null
      })

      const { barPositions, updateBarPositions } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )

      await updateBarPositions()
      const initialSize = barPositions.value.size
      expect(initialSize).toBe(1)

      await updateBarPositions()
      expect(barPositions.value.size).toBe(1)
    })
  })

  describe("error handling", () => {

    it("should handle missing rows container", async () => {
      const mockParent = createMockParentElement(null, [])
      document.getElementById = vi.fn().mockReturnValue(mockParent)

      const { barPositions, updateBarPositions } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )

      await updateBarPositions()
      expect(barPositions.value.size).toBe(0)
    })

    it("should handle missing bar elements", async () => {
      const mockRowsContainer = createMockRowsContainer()
      const mockParent = createMockParentElement(mockRowsContainer, [])

      document.getElementById = vi.fn().mockImplementation((id) => {
        if (id === "gantt-1") return mockParent
        return null
      })

      const { barPositions, updateBarPositions } = useConnections(
        mockRowManager,
        mockProps,
        mockId
      )

      await updateBarPositions()
      expect(barPositions.value.size).toBe(0)
    })
  })
})