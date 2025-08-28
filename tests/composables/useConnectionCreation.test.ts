import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useConnectionCreation } from "../../src/composables/useConnectionCreation"
import type { GGanttChartConfig, GanttBarObject, ChartRow } from "../../src/types"

describe("useConnectionCreation", () => {
  let mockConfig: GGanttChartConfig
  let mockRowManager: any
  let mockEmit: any
  let mockReinitializeConnections: any
  let mockSourceBar: GanttBarObject
  let mockTargetBar: GanttBarObject

  beforeEach(() => {
    mockConfig = {
      defaultConnectionType: ref("straight"),
      defaultConnectionColor: ref("#333333"),
      defaultConnectionPattern: ref("solid"),
      defaultConnectionAnimated: ref(false),
      defaultConnectionAnimationSpeed: ref("normal"),
      defaultConnectionLabel: ref("Default Label"),
      defaultConnectionLabelAlwaysVisible: ref(true),
      defaultConnectionLabelStyle: ref({ fontSize: "12px" })
    } as GGanttChartConfig

    mockSourceBar = {
      ganttBarConfig: {
        id: "source-bar",
        label: "Source Bar",
        connections: []
      },
      start: "2024-01-01",
      end: "2024-01-02"
    }

    mockTargetBar = {
      ganttBarConfig: {
        id: "target-bar", 
        label: "Target Bar",
        connections: []
      },
      start: "2024-01-03",
      end: "2024-01-04"
    }

    mockRowManager = {
      rows: ref<ChartRow[]>([
        {
          label: "Row 1",
          bars: [mockSourceBar, mockTargetBar]
        }
      ]),
      updateRows: vi.fn()
    }

    mockEmit = vi.fn()
    mockReinitializeConnections = vi.fn()

    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with default connection state", () => {
      const { connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      expect(connectionState.value).toEqual({
        isCreating: false,
        sourceBar: null,
        sourcePoint: null,
        mouseX: 0,
        mouseY: 0
      })
    })

    it("should initialize with default hover state", () => {
      const { hoverState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      expect(hoverState.value).toEqual({
        isVisible: false,
        barId: null,
        point: null
      })
    })
  })

  describe("startConnectionCreation", () => {
    it("should set connection state and emit start event", () => {
      const { startConnectionCreation, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      const mockEvent = new MouseEvent("mousedown", { clientX: 100, clientY: 200 })
      startConnectionCreation(mockSourceBar, "start", mockEvent)

      expect(connectionState.value).toEqual({
        isCreating: true,
        sourceBar: mockSourceBar,
        sourcePoint: "start",
        mouseX: 100,
        mouseY: 200
      })

      expect(mockEmit).toHaveBeenCalledWith("connection-start", {
        sourceBar: mockSourceBar,
        connectionPoint: "start",
        e: mockEvent
      })
    })

    it("should handle end connection point", () => {
      const { startConnectionCreation, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      const mockEvent = new MouseEvent("mousedown", { clientX: 150, clientY: 250 })
      startConnectionCreation(mockSourceBar, "end", mockEvent)

      expect(connectionState.value.sourcePoint).toBe("end")
      expect(connectionState.value.mouseX).toBe(150)
      expect(connectionState.value.mouseY).toBe(250)
    })
  })

  describe("updateConnectionDrag", () => {
    it("should update mouse position during drag", () => {
      const { startConnectionCreation, updateConnectionDrag, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Start connection first
      const startEvent = new MouseEvent("mousedown", { clientX: 100, clientY: 200 })
      startConnectionCreation(mockSourceBar, "start", startEvent)

      // Update drag
      const dragEvent = new MouseEvent("mousemove", { clientX: 150, clientY: 250 })
      updateConnectionDrag(dragEvent)

      expect(connectionState.value.mouseX).toBe(150)
      expect(connectionState.value.mouseY).toBe(250)
      expect(mockEmit).toHaveBeenCalledWith("connection-drag", {
        sourceBar: mockSourceBar,
        connectionPoint: "start",
        currentX: 150,
        currentY: 250,
        e: dragEvent
      })
    })

    it("should not update when not creating connection", () => {
      const { updateConnectionDrag, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      const dragEvent = new MouseEvent("mousemove", { clientX: 150, clientY: 250 })
      updateConnectionDrag(dragEvent)

      expect(connectionState.value.mouseX).toBe(0)
      expect(connectionState.value.mouseY).toBe(0)
      expect(mockEmit).not.toHaveBeenCalledWith("connection-drag", expect.anything())
    })
  })

  describe("completeConnection", () => {
    it("should create valid connection and emit completion event", () => {
      const { startConnectionCreation, completeConnection, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Start connection
      const startEvent = new MouseEvent("mousedown", { clientX: 100, clientY: 200 })
      startConnectionCreation(mockSourceBar, "end", startEvent)

      // Complete connection
      const completeEvent = new MouseEvent("mouseup", { clientX: 200, clientY: 300 })
      completeConnection(mockTargetBar, "start", completeEvent)

      // Check connection was added
      expect(mockSourceBar.ganttBarConfig.connections).toHaveLength(1)
      expect(mockSourceBar.ganttBarConfig.connections![0]).toEqual({
        targetId: "target-bar",
        type: "straight",
        color: "#333333",
        pattern: "solid",
        animated: false,
        animationSpeed: "normal",
        relation: "FS",
        label: "Default Label",
        labelAlwaysVisible: true,
        labelStyle: { fontSize: "12px" }
      })

      // Check emit calls
      expect(mockEmit).toHaveBeenCalledWith("connection-complete", {
        sourceBar: mockSourceBar,
        targetBar: mockTargetBar,
        sourcePoint: "end",
        targetPoint: "start",
        e: completeEvent
      })

      // Check state reset
      expect(connectionState.value.isCreating).toBe(false)
      expect(connectionState.value.sourceBar).toBeNull()

      // Check other calls
      expect(mockRowManager.updateRows).toHaveBeenCalled()
      expect(mockReinitializeConnections).toHaveBeenCalled()
    })

    it("should handle different relation types", () => {
      const { startConnectionCreation, completeConnection } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      const testCases = [
        { sourcePoint: "end", targetPoint: "start", expectedRelation: "FS" },
        { sourcePoint: "start", targetPoint: "start", expectedRelation: "SS" },
        { sourcePoint: "end", targetPoint: "end", expectedRelation: "FF" },
        { sourcePoint: "start", targetPoint: "end", expectedRelation: "SF" }
      ]

      testCases.forEach(({ sourcePoint, targetPoint, expectedRelation }, index) => {
        const testSourceBar = {
          ganttBarConfig: { id: `source-${index}`, connections: [] },
          start: "2024-01-01",
          end: "2024-01-02"
        }

        const testTargetBar = {
          ganttBarConfig: { id: `target-${index}`, connections: [] },
          start: "2024-01-03", 
          end: "2024-01-04"
        }

        startConnectionCreation(testSourceBar, sourcePoint as any, new MouseEvent("mousedown"))
        completeConnection(testTargetBar, targetPoint as any, new MouseEvent("mouseup"))

        expect(testSourceBar.ganttBarConfig.connections![0].relation).toBe(expectedRelation)
      })
    })

    it("should not create connection to same bar", () => {
      const { startConnectionCreation, completeConnection, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      completeConnection(mockSourceBar, "end", new MouseEvent("mouseup"))

      expect(mockSourceBar.ganttBarConfig.connections).toHaveLength(0)
      expect(mockEmit).not.toHaveBeenCalledWith("connection-complete", expect.anything())
      expect(connectionState.value.isCreating).toBe(false)
    })

    it("should not create duplicate connection", () => {
      const { startConnectionCreation, completeConnection } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Add existing connection
      mockSourceBar.ganttBarConfig.connections = [{ targetId: "target-bar", type: "straight" }]

      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      completeConnection(mockTargetBar, "end", new MouseEvent("mouseup"))

      expect(mockSourceBar.ganttBarConfig.connections).toHaveLength(1)
      expect(mockEmit).not.toHaveBeenCalledWith("connection-complete", expect.anything())
    })

    it("should handle missing source bar", () => {
      const { completeConnection, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      completeConnection(mockTargetBar, "start", new MouseEvent("mouseup"))

      expect(mockEmit).not.toHaveBeenCalledWith("connection-complete", expect.anything())
      expect(connectionState.value.isCreating).toBe(false)
    })

    it("should handle missing source point", () => {
      const { completeConnection, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      connectionState.value.sourceBar = mockSourceBar
      connectionState.value.sourcePoint = null

      completeConnection(mockTargetBar, "start", new MouseEvent("mouseup"))

      expect(mockEmit).not.toHaveBeenCalledWith("connection-complete", expect.anything())
    })

    it("should initialize connections array if not present", () => {
      const { startConnectionCreation, completeConnection } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Remove connections array
      delete mockSourceBar.ganttBarConfig.connections

      startConnectionCreation(mockSourceBar, "end", new MouseEvent("mousedown"))
      completeConnection(mockTargetBar, "start", new MouseEvent("mouseup"))

      expect(mockSourceBar.ganttBarConfig.connections).toBeDefined()
      expect(mockSourceBar.ganttBarConfig.connections).toHaveLength(1)
    })
  })

  describe("cancelConnectionCreation", () => {
    it("should emit cancel event and reset state", () => {
      const { startConnectionCreation, cancelConnectionCreation, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Start connection
      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      expect(connectionState.value.isCreating).toBe(true)

      // Cancel connection
      const cancelEvent = new MouseEvent("keydown")
      cancelConnectionCreation(cancelEvent)

      expect(mockEmit).toHaveBeenCalledWith("connection-cancel", {
        sourceBar: mockSourceBar,
        connectionPoint: "start",
        e: cancelEvent
      })

      expect(connectionState.value.isCreating).toBe(false)
      expect(connectionState.value.sourceBar).toBeNull()
    })

    it("should handle canceling when no connection is active", () => {
      const { cancelConnectionCreation, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      cancelConnectionCreation(new MouseEvent("keydown"))

      expect(mockEmit).not.toHaveBeenCalledWith("connection-cancel", expect.anything())
      expect(connectionState.value.isCreating).toBe(false)
    })

    it("should handle canceling with missing source point", () => {
      const { cancelConnectionCreation, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      connectionState.value.sourceBar = mockSourceBar
      connectionState.value.sourcePoint = null

      cancelConnectionCreation(new MouseEvent("keydown"))

      expect(mockEmit).not.toHaveBeenCalledWith("connection-cancel", expect.anything())
    })
  })

  describe("handleConnectionPointHover", () => {
    it("should set hover state when entering", () => {
      const { handleConnectionPointHover, hoverState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      handleConnectionPointHover("test-bar", "start", true)

      expect(hoverState.value).toEqual({
        isVisible: true,
        barId: "test-bar",
        point: "start"
      })
    })

    it("should clear hover state when leaving", () => {
      const { handleConnectionPointHover, hoverState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // First set hover state
      handleConnectionPointHover("test-bar", "start", true)
      expect(hoverState.value.isVisible).toBe(true)

      // Then clear it
      handleConnectionPointHover("test-bar", "start", false)

      expect(hoverState.value).toEqual({
        isVisible: false,
        barId: null,
        point: null
      })
    })

    it("should handle different connection points", () => {
      const { handleConnectionPointHover, hoverState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      handleConnectionPointHover("test-bar", "end", true)

      expect(hoverState.value.point).toBe("end")
    })

    it("should handle null connection point", () => {
      const { handleConnectionPointHover, hoverState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      handleConnectionPointHover("test-bar", null, true)

      expect(hoverState.value.point).toBeNull()
    })
  })

  describe("canBeConnectionTarget", () => {
    it("should return false when no source bar", () => {
      const { canBeConnectionTarget } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      const result = canBeConnectionTarget.value(mockTargetBar)
      expect(result).toBe(false)
    })

    it("should return true for valid target", () => {
      const { startConnectionCreation, canBeConnectionTarget } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      const result = canBeConnectionTarget.value(mockTargetBar)
      expect(result).toBe(true)
    })

    it("should return false for same bar", () => {
      const { startConnectionCreation, canBeConnectionTarget } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      const result = canBeConnectionTarget.value(mockSourceBar)
      expect(result).toBe(false)
    })

    it("should return false for existing connection", () => {
      const { startConnectionCreation, canBeConnectionTarget } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Add existing connection
      mockSourceBar.ganttBarConfig.connections = [{ targetId: "target-bar", type: "straight" }]

      startConnectionCreation(mockSourceBar, "start", new MouseEvent("mousedown"))
      const result = canBeConnectionTarget.value(mockTargetBar)
      expect(result).toBe(false)
    })
  })

  describe("edge cases and error handling", () => {
    it("should handle missing config values gracefully", () => {
      const incompleteConfig = {
        defaultConnectionType: ref("straight"),
        defaultConnectionColor: ref("#333333"),
        defaultConnectionPattern: ref("solid"),
        defaultConnectionAnimated: ref(false),
        defaultConnectionAnimationSpeed: ref("normal")
      } as GGanttChartConfig

      const { startConnectionCreation, completeConnection } = useConnectionCreation(
        incompleteConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      startConnectionCreation(mockSourceBar, "end", new MouseEvent("mousedown"))
      completeConnection(mockTargetBar, "start", new MouseEvent("mouseup"))

      expect(mockSourceBar.ganttBarConfig.connections![0]).toEqual({
        targetId: "target-bar",
        type: "straight",
        color: "#333333",
        pattern: "solid",
        animated: false,
        animationSpeed: "normal",
        relation: "FS",
        label: undefined,
        labelAlwaysVisible: undefined,
        labelStyle: undefined
      })
    })

    it("should use default relation type for invalid combinations", () => {
      // This test covers the default case in determineRelationType by forcing an invalid state
      const { startConnectionCreation, completeConnection, connectionState } = useConnectionCreation(
        mockConfig,
        mockRowManager,
        mockEmit,
        mockReinitializeConnections
      )

      // Create test bars
      const testSourceBar = {
        ganttBarConfig: { id: "test-source", connections: [] },
        start: "2024-01-01",
        end: "2024-01-02"
      }

      const testTargetBar = {
        ganttBarConfig: { id: "test-target", connections: [] },
        start: "2024-01-03",
        end: "2024-01-04"
      }

      // Start connection with a valid point
      startConnectionCreation(testSourceBar, "start", new MouseEvent("mousedown"))
      
      // Manually modify the state to create an invalid combination that would trigger default case
      // We'll force a sourcePoint that doesn't match any of the specific conditions
      connectionState.value.sourcePoint = "invalid" as any
      
      completeConnection(testTargetBar, "start", new MouseEvent("mouseup"))
      
      // Should default to "FS" relation
      expect((testSourceBar.ganttBarConfig.connections![0] as any).relation).toBe("FS")
    })
  })
})