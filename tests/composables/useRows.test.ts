import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref, nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { useRows, findBarInRows } from "../../src/composables/useRows"
import type { ChartRow, GanttBarObject, LabelColumnConfig, SortState } from "../../src/types"

describe("useRows", () => {
  let mockSlots: any
  let mockProps: any
  let initialRows: ChartRow[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    initialRows = [
      {
        id: "row1",
        label: "Task 1",
        bars: [
          {
            start: "2024-01-01",
            end: "2024-01-02",
            ganttBarConfig: {
              id: "bar1",
              label: "Bar 1"
            }
          }
        ],
        children: []
      },
      {
        id: "row2", 
        label: "Task 2",
        bars: [
          {
            start: "2024-01-03",
            end: "2024-01-04",
            ganttBarConfig: {
              id: "bar2",
              label: "Bar 2",
              progress: 50
            }
          }
        ],
        children: []
      }
    ]

    mockSlots = {
      default: vi.fn(() => [
        {
          props: {
            id: "row1",
            label: "Task 1", 
            bars: [
              {
                start: "2024-01-01",
                end: "2024-01-02",
                ganttBarConfig: { id: "bar1", label: "Bar 1" }
              }
            ]
          }
        }
      ])
    }

    mockProps = {
      barStart: ref("start"),
      barEnd: ref("end"),
      dateFormat: ref("YYYY-MM-DD"),
      multiColumnLabel: ref<LabelColumnConfig[]>([]),
      onSort: vi.fn(),
      initialSort: { column: "Label", direction: "none" as const },
      onGroupExpansion: vi.fn()
    }
  })

  describe("basic initialization", () => {
    it("should initialize with provided initial rows", () => {
      const initialRowsRef = ref(initialRows)
      const { rows, getChartRows } = useRows(mockSlots, mockProps, initialRowsRef)
      
      expect(rows.value).toHaveLength(2)
      expect(getChartRows()).toHaveLength(2)
      expect(rows.value[0].id).toBe("row1")
      expect(rows.value[1].id).toBe("row2")
    })

    it("should extract rows from slots when no initial rows provided", () => {
      const { rows } = useRows(mockSlots, mockProps)
      
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].id).toBe("row1")
    })

    it("should handle empty slots", () => {
      const emptySlots = { default: vi.fn(() => null) }
      const { rows } = useRows(emptySlots, mockProps)
      
      expect(rows.value).toHaveLength(0)
    })

    it("should handle nested children in slots", () => {
      const nestedSlots = {
        default: vi.fn(() => [
          {
            children: [
              {
                props: {
                  id: "nested1",
                  label: "Nested Task",
                  bars: []
                }
              }
            ]
          }
        ])
      }

      const { rows } = useRows(nestedSlots, mockProps)
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].id).toBe("nested1")
    })
  })

  describe("sorting functionality", () => {
    it("should toggle sort direction correctly", () => {
      const { toggleSort, sortState } = useRows(mockSlots, mockProps, ref(initialRows))
      
      expect(sortState.value.direction).toBe("none")
      
      toggleSort("Label")
      expect(sortState.value.direction).toBe("asc")
      expect(sortState.value.column).toBe("Label")
      
      toggleSort("Label")
      expect(sortState.value.direction).toBe("desc")
      
      toggleSort("Label")
      expect(sortState.value.direction).toBe("none")
    })

    it("should sort by ID field", () => {
      const testRows = [
        { id: "z", label: "Z", bars: [] },
        { id: "a", label: "A", bars: [] }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("Id")
      expect(rows.value[0].id).toBe("a")
      expect(rows.value[1].id).toBe("z")
    })

    it("should sort by Label field", () => {
      const testRows = [
        { id: "1", label: "Zebra", bars: [] },
        { id: "2", label: "Apple", bars: [] }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("Label")
      expect(rows.value[0].label).toBe("Apple")
      expect(rows.value[1].label).toBe("Zebra")
    })

    it("should sort by StartDate field", () => {
      const testRows = [
        {
          id: "1",
          label: "Task 1",
          bars: [{
            start: "2024-01-02",
            end: "2024-01-03",
            ganttBarConfig: { id: "bar1", label: "Bar 1" }
          }]
        },
        {
          id: "2", 
          label: "Task 2",
          bars: [{
            start: "2024-01-01",
            end: "2024-01-02", 
            ganttBarConfig: { id: "bar2", label: "Bar 2" }
          }]
        }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("StartDate")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })

    it("should sort by EndDate field", () => {
      const testRows = [
        {
          id: "1",
          label: "Task 1",
          bars: [{
            start: "2024-01-01",
            end: "2024-01-04",
            ganttBarConfig: { id: "bar1", label: "Bar 1" }
          }]
        },
        {
          id: "2",
          label: "Task 2", 
          bars: [{
            start: "2024-01-01",
            end: "2024-01-02",
            ganttBarConfig: { id: "bar2", label: "Bar 2" }
          }]
        }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("EndDate")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })

    it("should sort by Duration field", () => {
      const testRows = [
        {
          id: "1",
          label: "Task 1",
          bars: [{
            start: "2024-01-01T00:00",
            end: "2024-01-01T02:00",
            ganttBarConfig: { id: "bar1", label: "Bar 1" }
          }]
        },
        {
          id: "2",
          label: "Task 2",
          bars: [{
            start: "2024-01-01T00:00", 
            end: "2024-01-01T01:00",
            ganttBarConfig: { id: "bar2", label: "Bar 2" }
          }]
        }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("Duration")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })

    it("should sort by Progress field", () => {
      const testRows = [
        {
          id: "1",
          label: "Task 1",
          bars: [{
            start: "2024-01-01",
            end: "2024-01-02",
            ganttBarConfig: { id: "bar1", label: "Bar 1", progress: 75 }
          }]
        },
        {
          id: "2",
          label: "Task 2",
          bars: [{
            start: "2024-01-01",
            end: "2024-01-02", 
            ganttBarConfig: { id: "bar2", label: "Bar 2", progress: 25 }
          }]
        }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("Progress")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })

    it("should handle custom column sorting with valueGetter", () => {
      const customProps = {
        ...mockProps,
        multiColumnLabel: ref([{
          field: "custom",
          label: "Custom Field",
          valueGetter: (row: ChartRow) => row.label.toLowerCase()
        }])
      }
      
      const testRows = [
        { id: "1", label: "Zebra", bars: [] },
        { id: "2", label: "Apple", bars: [] }
      ]
      const { toggleSort, rows } = useRows(mockSlots, customProps, ref(testRows))
      
      toggleSort("custom")
      expect(rows.value[0].label).toBe("Apple")
      expect(rows.value[1].label).toBe("Zebra")
    })

    it("should handle custom column sorting with sortFn", () => {
      const customProps = {
        ...mockProps,
        multiColumnLabel: ref([{
          field: "custom",
          label: "Custom Field",
          sortFn: (a: ChartRow, b: ChartRow) => b.label.localeCompare(a.label)
        }])
      }
      
      const testRows = [
        { id: "1", label: "Apple", bars: [] },
        { id: "2", label: "Zebra", bars: [] }
      ]
      const { toggleSort, rows } = useRows(mockSlots, customProps, ref(testRows))
      
      toggleSort("custom")
      expect(rows.value[0].label).toBe("Zebra")
      expect(rows.value[1].label).toBe("Apple")
    })

    it("should handle rows with missing data in sorting", () => {
      const testRows = [
        {
          id: "1",
          label: "Task 1",
          bars: []
        },
        {
          id: "2", 
          label: "Task 2",
          bars: [{
            start: "2024-01-01",
            end: "2024-01-02",
            ganttBarConfig: { id: "bar2", label: "Bar 2" }
          }]
        }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("StartDate")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })

    it("should call onSort callback when sorting", () => {
      const { toggleSort } = useRows(mockSlots, mockProps, ref(initialRows))
      
      toggleSort("Label")
      expect(mockProps.onSort).toHaveBeenCalledWith({
        column: "Label",
        direction: "asc"
      })
    })

    it("should handle onSortChange callbacks", () => {
      const callback = vi.fn()
      const { onSortChange, toggleSort } = useRows(mockSlots, mockProps, ref(initialRows))
      
      const cleanup = onSortChange(callback)
      toggleSort("Label")
      expect(callback).toHaveBeenCalled()
      
      cleanup()
      callback.mockClear()
      toggleSort("Label")
      expect(callback).not.toHaveBeenCalled()
    })

    it("should prioritize groups over non-groups in sorting", () => {
      const testRows = [
        { id: "1", label: "B Task", bars: [], children: [] },
        { id: "2", label: "A Task", bars: [], children: [{ id: "2a", label: "Child", bars: [] }] }
      ]
      const { toggleSort, rows } = useRows(mockSlots, mockProps, ref(testRows))
      
      toggleSort("Label")
      expect(rows.value[0].id).toBe("2")
      expect(rows.value[1].id).toBe("1")
    })
  })

  describe("group expansion functionality", () => {
    let groupRows: ChartRow[]

    beforeEach(() => {
      groupRows = [
        {
          id: "group1",
          label: "Group 1", 
          bars: [],
          children: [
            {
              id: "child1",
              label: "Child 1",
              bars: [{
                start: "2024-01-01",
                end: "2024-01-02",
                ganttBarConfig: { id: "childbar1", label: "Child Bar 1" }
              }]
            },
            {
              id: "child2",
              label: "Child 2",
              bars: [{
                start: "2024-01-03",
                end: "2024-01-04", 
                ganttBarConfig: { id: "childbar2", label: "Child Bar 2" }
              }]
            }
          ]
        }
      ]
    })

    it("should toggle group expansion", () => {
      const { toggleGroupExpansion, isGroupExpanded } = useRows(mockSlots, mockProps, ref(groupRows))
      
      expect(isGroupExpanded("group1")).toBe(false)
      
      toggleGroupExpansion("group1")
      expect(isGroupExpanded("group1")).toBe(true)
      expect(mockProps.onGroupExpansion).toHaveBeenCalledWith("group1")
      
      toggleGroupExpansion("group1") 
      expect(isGroupExpanded("group1")).toBe(false)
    })

    it("should expand all groups", () => {
      const nestedGroups = [
        {
          id: "parent",
          label: "Parent",
          bars: [],
          children: [
            {
              id: "child1",
              label: "Child 1",
              bars: [],
              children: [
                { id: "grandchild1", label: "Grandchild 1", bars: [] }
              ]
            }
          ]
        }
      ]
      
      const { expandAllGroups, isGroupExpanded } = useRows(mockSlots, mockProps, ref(nestedGroups))
      
      expandAllGroups()
      expect(isGroupExpanded("parent")).toBe(true)
      expect(isGroupExpanded("child1")).toBe(true)
    })

    it("should collapse all groups", () => {
      const { expandAllGroups, collapseAllGroups, isGroupExpanded } = useRows(mockSlots, mockProps, ref(groupRows))
      
      expandAllGroups()
      expect(isGroupExpanded("group1")).toBe(true)
      
      collapseAllGroups()
      expect(isGroupExpanded("group1")).toBe(false)
    })

    it("should get flattened rows respecting expansion state", () => {
      const { toggleGroupExpansion, getFlattenedRows } = useRows(mockSlots, mockProps, ref(groupRows))
      
      let flattened = getFlattenedRows()
      expect(flattened).toHaveLength(1)
      expect(flattened[0].id).toBe("group1")
      
      toggleGroupExpansion("group1")
      flattened = getFlattenedRows()
      expect(flattened).toHaveLength(3)
      expect(flattened[0].id).toBe("group1")
      expect(flattened[1].id).toBe("child1")
      expect(flattened[2].id).toBe("child2")
    })

    it("should handle group expansion change callbacks", () => {
      const callback = vi.fn()
      const { onGroupExpansionChange, toggleGroupExpansion } = useRows(mockSlots, mockProps, ref(groupRows))
      
      const cleanup = onGroupExpansionChange(callback)
      toggleGroupExpansion("group1")
      expect(callback).toHaveBeenCalled()
      
      cleanup()
      callback.mockClear()
      toggleGroupExpansion("group1") 
      expect(callback).not.toHaveBeenCalled()
    })

    it("should calculate group bars from children", () => {
      const { rows } = useRows(mockSlots, mockProps, ref(groupRows))
      
      expect(rows.value[0].bars).toHaveLength(1)
      expect(rows.value[0].bars[0].ganttBarConfig.id).toBe("group-group1")
      expect(rows.value[0].bars[0].ganttBarConfig.immobile).toBe(true)
    })

    it("should check if all groups are expanded", () => {
      const { areAllGroupsExpanded, expandAllGroups, toggleGroupExpansion } = useRows(mockSlots, mockProps, ref(groupRows))
      
      expect(areAllGroupsExpanded.value).toBe(false)
      
      expandAllGroups()
      expect(areAllGroupsExpanded.value).toBe(true)
      
      toggleGroupExpansion("group1")
      expect(areAllGroupsExpanded.value).toBe(false)
    })

    it("should check if all groups are collapsed", () => {
      const { areAllGroupsCollapsed, expandAllGroups, collapseAllGroups } = useRows(mockSlots, mockProps, ref(groupRows))
      
      expect(areAllGroupsCollapsed.value).toBe(true)
      
      expandAllGroups()
      expect(areAllGroupsCollapsed.value).toBe(false)
      
      collapseAllGroups()
      expect(areAllGroupsCollapsed.value).toBe(true)
    })

    it("should return false for group states when no groups exist", () => {
      const { areAllGroupsExpanded, areAllGroupsCollapsed } = useRows(mockSlots, mockProps, ref(initialRows))
      
      expect(areAllGroupsExpanded.value).toBe(false)
      expect(areAllGroupsCollapsed.value).toBe(false)
    })
  })

  describe("custom ordering", () => {
    it("should apply custom order when sorting is disabled", () => {
      const { customOrder, rows, toggleSort } = useRows(mockSlots, mockProps, ref(initialRows))
      
      customOrder.value.set("row2", 0)
      customOrder.value.set("row1", 1)
      
      toggleSort("Label")
      toggleSort("Label") 
      toggleSort("Label")
      
      expect(rows.value[0].id).toBe("row2")
      expect(rows.value[1].id).toBe("row1")
    })

    it("should reset custom order", () => {
      const { customOrder, resetCustomOrder } = useRows(mockSlots, mockProps, ref(initialRows))
      
      customOrder.value.set("row1", 0)
      expect(customOrder.value.size).toBe(1)
      
      resetCustomOrder()
      expect(customOrder.value.size).toBe(0)
    })
  })

  describe("history management", () => {
    it("should track history state changes", async () => {
      let composableResult: any

      const TestComponent = {
        setup() {
          composableResult = useRows(mockSlots, mockProps, ref(initialRows))
          return {}
        },
        template: "<div></div>"
      }

      mount(TestComponent)
      await nextTick()
      
      const { canUndo, canRedo, updateRows } = composableResult
      
      expect(canUndo.value).toBe(false)
      expect(canRedo.value).toBe(false)
      
      const newRows = [...initialRows, { id: "row3", label: "Task 3", bars: [] }]
      updateRows(newRows)
      
      expect(canUndo.value).toBe(true)
      expect(canRedo.value).toBe(false)
    })

    it("should undo changes", async () => {
      let composableResult: any

      const TestComponent = {
        setup() {
          composableResult = useRows(mockSlots, mockProps, ref(initialRows))
          return {}
        },
        template: "<div></div>"
      }

      mount(TestComponent)
      await nextTick()
      
      const { rows, updateRows, undo, canUndo } = composableResult
      
      const newRows = [{ id: "row3", label: "Task 3", bars: [] }]
      updateRows(newRows)
      expect(rows.value).toHaveLength(1)
      
      expect(canUndo.value).toBe(true)
      
      undo()
      expect(rows.value).toHaveLength(2)
    })

    it("should redo changes", async () => {
      let composableResult: any

      const TestComponent = {
        setup() {
          composableResult = useRows(mockSlots, mockProps, ref(initialRows))
          return {}
        },
        template: "<div></div>"
      }

      mount(TestComponent)
      await nextTick()
      
      const { rows, updateRows, undo, redo, canRedo } = composableResult
      
      const newRows = [{ id: "row3", label: "Task 3", bars: [] }]
      updateRows(newRows)
      
      undo()
      expect(rows.value).toHaveLength(2)
      expect(canRedo.value).toBe(true)
      
      redo()
      expect(rows.value).toHaveLength(1)
    })

    it("should clear history", async () => {
      let composableResult: any

      const TestComponent = {
        setup() {
          composableResult = useRows(mockSlots, mockProps, ref(initialRows))
          return {}
        },
        template: "<div></div>"
      }

      mount(TestComponent)
      await nextTick()
      
      const { updateRows, clearHistory, canUndo } = composableResult
      
      const newRows = [...initialRows, { id: "row3", label: "Task 3", bars: [] }]
      updateRows(newRows)
      
      expect(canUndo.value).toBe(true)
      
      clearHistory()
      expect(canUndo.value).toBe(false)
    })

    it("should handle bar move history", async () => {
      let composableResult: any

      const TestComponent = {
        setup() {
          composableResult = useRows(mockSlots, mockProps, ref(initialRows))
          return {}
        },
        template: "<div></div>"
      }

      mount(TestComponent)
      await nextTick()
      
      const { onBarMove, canUndo } = composableResult
      
      onBarMove()
      expect(canUndo.value).toBe(true)
    })
  })

  describe("date handling", () => {
    it("should handle Date objects in bars", () => {
      const dateRows = [
        {
          id: "row1",
          label: "Task 1",
          bars: [{
            start: new Date("2024-01-01"),
            end: new Date("2024-01-02"),
            ganttBarConfig: { id: "bar1", label: "Bar 1" }
          }]
        }
      ]
      const { rows } = useRows(mockSlots, mockProps, ref(dateRows))
      
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].bars).toHaveLength(1)
    })

    it("should use different date formats", () => {
      const dateFormatProps = {
        ...mockProps,
        dateFormat: ref("YYYY-MM-DD HH:mm:ss")
      }
      
      const { rows } = useRows(mockSlots, dateFormatProps, ref(initialRows))
      expect(rows.value).toHaveLength(2)
    })

    it("should handle false date format", () => {
      const dateFormatProps = {
        ...mockProps,
        dateFormat: ref(false)
      }
      
      const { rows } = useRows(mockSlots, dateFormatProps, ref(initialRows))
      expect(rows.value).toHaveLength(2)
    })
  })

  describe("edge cases", () => {
    it("should handle rows without IDs", () => {
      const noIdRows = [
        { label: "No ID Task", bars: [] }
      ]
      const { rows } = useRows(mockSlots, mockProps, ref(noIdRows))
      
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].label).toBe("No ID Task")
    })

    it("should handle rows with empty bars arrays", () => {
      const emptyBarsRows = [
        { id: "empty", label: "Empty Bars", bars: [] }
      ]
      const { rows } = useRows(mockSlots, mockProps, ref(emptyBarsRows))
      
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].bars).toHaveLength(0)
    })

    it("should handle deeply nested group structures", () => {
      const deepNested = [
        {
          id: "level1",
          label: "Level 1",
          bars: [],
          children: [
            {
              id: "level2", 
              label: "Level 2",
              bars: [],
              children: [
                {
                  id: "level3",
                  label: "Level 3", 
                  bars: [{
                    start: "2024-01-01",
                    end: "2024-01-02",
                    ganttBarConfig: { id: "deepbar", label: "Deep Bar" }
                  }]
                }
              ]
            }
          ]
        }
      ]
      
      const { rows } = useRows(mockSlots, mockProps, ref(deepNested))
      expect(rows.value).toHaveLength(1)
      expect(rows.value[0].children?.[0]?.children).toHaveLength(1)
    })
  })
})

describe("findBarInRows utility function", () => {
  const testRows: ChartRow[] = [
    {
      id: "row1",
      label: "Row 1",
      bars: [
        {
          start: "2024-01-01",
          end: "2024-01-02",
          ganttBarConfig: { id: "bar1", label: "Bar 1" }
        }
      ],
      children: [
        {
          id: "child1",
          label: "Child 1",
          bars: [
            {
              start: "2024-01-03",
              end: "2024-01-04",
              ganttBarConfig: { id: "childbar", label: "Child Bar" }
            }
          ]
        }
      ]
    }
  ]

  it("should find bar in root level", () => {
    const found = findBarInRows(testRows, "bar1")
    expect(found).toBeTruthy()
    expect(found?.ganttBarConfig.id).toBe("bar1")
  })

  it("should find bar in child rows", () => {
    const found = findBarInRows(testRows, "childbar")
    expect(found).toBeTruthy()
    expect(found?.ganttBarConfig.id).toBe("childbar")
  })

  it("should return null for non-existent bar", () => {
    const found = findBarInRows(testRows, "nonexistent")
    expect(found).toBeNull()
  })

  it("should handle empty rows array", () => {
    const found = findBarInRows([], "anybar")
    expect(found).toBeNull()
  })
})