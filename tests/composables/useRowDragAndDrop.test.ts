import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useRowDragAndDrop } from "../../src/composables/useRowDragAndDrop"
import type { ChartRow } from "../../src/types"

describe("useRowDragAndDrop", () => {
  const mockRows: ChartRow[] = [
    { id: "1", label: "Row 1", bars: [] },
    { id: "2", label: "Row 2", bars: [] },
    { id: "3", label: "Row 3", bars: [] }
  ]

  const mockUpdateRows = vi.fn()
  const mockEmit = vi.fn()

  const setupDragAndDrop = (isSorted = false) => {
    const rows = ref([...mockRows]) // Create a fresh copy for each test
    return {
      ...useRowDragAndDrop(rows, ref(isSorted), mockUpdateRows, mockEmit),
      rows
    }
  }

  const createMockDragEvent = (type: string, clientY: number = 0): MouseEvent => {
    const mockEvent = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientY
    })

    // Mock prevention methods
    mockEvent.preventDefault = vi.fn()
    mockEvent.stopPropagation = vi.fn()

    return mockEvent
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize drag state correctly", () => {
      const { dragState } = setupDragAndDrop()

      expect(dragState.value).toEqual({
        isDragging: false,
        draggedRow: null,
        dropTarget: {
          row: null,
          position: "before"
        }
      })
    })
  })

  describe("handleDragStart", () => {
    it("should not start drag when sorting is active", () => {
      const { handleDragStart } = setupDragAndDrop(true)
      const mockEvent = createMockDragEvent("dragstart")

      handleDragStart(mockRows[0], mockEvent)
      expect(mockEvent.preventDefault).not.toHaveBeenCalled()
    })

    it("should set drag state correctly", () => {
      const { handleDragStart, dragState } = setupDragAndDrop()
      const mockEvent = createMockDragEvent("dragstart")

      handleDragStart(mockRows[0], mockEvent)

      expect(dragState.value.isDragging).toBe(true)
      expect(dragState.value.draggedRow).toStrictEqual(mockRows[0])
    })

    it("should store original row order", () => {
      const { handleDragStart, dragState } = setupDragAndDrop()
      const mockEvent = createMockDragEvent("dragstart")

      handleDragStart(mockRows[0], mockEvent)

      expect(dragState.value.isDragging).toBe(true)
      expect(dragState.value.draggedRow).toStrictEqual(mockRows[0])
    })
  })

  describe("handleDrop", () => {
    it("should not handle drop when sorting is active", () => {
      const { handleDrop } = setupDragAndDrop(true)
      handleDrop()
      expect(mockUpdateRows).not.toHaveBeenCalled()
      expect(mockEmit).not.toHaveBeenCalled()
    })

    it("should update row order and emit row-drop event", () => {
      const { handleDragStart, handleDragOver, handleDrop, rows } = setupDragAndDrop()

      // Setup drag start
      const dragStartEvent = createMockDragEvent("dragstart")
      handleDragStart(rows.value[0], dragStartEvent)

      // Setup drag over
      const dragOverEvent = createMockDragEvent("dragover", 90)
      const mockTarget = document.createElement("div")
      Object.defineProperty(mockTarget, "getBoundingClientRect", {
        value: () => ({
          top: 0,
          height: 100
        })
      })
      Object.defineProperty(dragOverEvent, "currentTarget", { value: mockTarget })

      handleDragOver(rows.value[1], dragOverEvent)
      handleDrop()

      expect(mockUpdateRows).toHaveBeenCalledWith(expect.any(Array))
      expect(mockEmit).toHaveBeenCalledWith("row-drop", expect.any(Object))
    })
  })

  describe("resetOrder", () => {
    it("should do nothing if no original order is stored", () => {
      const { resetOrder } = setupDragAndDrop()
      resetOrder()
      expect(mockUpdateRows).not.toHaveBeenCalled()
    })
  })
})
