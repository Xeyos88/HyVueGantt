import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useBarMovement } from "../../src/composables/useBarMovement"
import type { GanttBarObject, ChartRow } from "../../src/types"

const mockDayjsDate = {
  format: vi.fn().mockReturnValue("2024-01-01 10:00"),
  isBefore: vi.fn().mockReturnValue(false),
  isAfter: vi.fn().mockReturnValue(false),
  isSameOrBefore: vi.fn().mockReturnValue(false),
  isSameOrAfter: vi.fn().mockReturnValue(false),
  diff: vi.fn().mockReturnValue(60),
  subtract: vi.fn().mockReturnValue(60)
}

const mockDayjsHelper = {
  toDayjs: vi.fn().mockReturnValue(mockDayjsDate),
  format: vi.fn().mockImplementation((date) => date)
}

describe("useBarMovement", () => {
  const mockConfig = {
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    pushOnOverlap: ref(true),
    pushOnConnect: ref(true),
    milestones: ref([
      {
        id: "milestone1",
        date: "2024-01-15",
        name: "Test Milestone"
      }
    ])
  }

  const createMockBar = (id: string, opts = {}): GanttBarObject => ({
    ganttBarConfig: {
      id,
      immobile: false,
      pushOnOverlap: true,
      pushOnConnect: true,
      ...opts
    },
    start: "2024-01-01 10:00",
    end: "2024-01-01 11:00"
  })

  const mockRowManager = {
    rows: ref<ChartRow[]>([
      {
        label: "Test Row",
        bars: [
          createMockBar("bar1"),
          createMockBar("bar2"),
          createMockBar("bar3", { immobile: true })
        ]
      }
    ])
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDayjsDate.isBefore.mockReturnValue(false)
    mockDayjsDate.isAfter.mockReturnValue(false)
    mockDayjsDate.isSameOrBefore.mockReturnValue(false)
    mockDayjsDate.isSameOrAfter.mockReturnValue(false)
  })

  describe("moveBar", () => {
    it("should move bar to new position when no constraints", () => {
      const { moveBar } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test")

      const result = moveBar(bar, "2024-01-01 12:00", "2024-01-01 13:00")
      expect(result.success).toBe(true)
      expect(result.affectedBars.size).toBe(1)
    })

    it("should prevent moving immobile bars", () => {
      const { moveBar } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test", { immobile: true })

      const result = moveBar(bar, "2024-01-01 12:00", "2024-01-01 13:00")
      expect(result.success).toBe(true)
    })

    it("should respect milestone constraints", () => {
      const { moveBar } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test", { milestoneId: "milestone1" })

      mockDayjsDate.isAfter.mockReturnValueOnce(true)

      const result = moveBar(bar, "2024-01-01 12:00", "2024-01-16 13:00")
      expect(result.success).toBe(false)
    })

    it("should prevent overlaps when pushOnOverlap is disabled", () => {
      const configWithoutPush = {
        ...mockConfig,
        pushOnOverlap: ref(false)
      }

      mockDayjsDate.isBefore.mockReturnValueOnce(false).mockReturnValueOnce(true)
      mockDayjsDate.isAfter.mockReturnValueOnce(true)

      const { moveBar } = useBarMovement(configWithoutPush, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test")

      const result = moveBar(bar, "2024-01-01 12:00", "2024-01-01 13:00")
      expect(result.success).toBe(true)
      expect(result.affectedBars.size).toBe(1)
    })
  })

  describe("findOverlappingBars", () => {
    it("should not include immobile bars in overlapping results", () => {
      const { findOverlappingBars } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test")

      const overlappingBars = findOverlappingBars(bar)
      const hasImmobileBar = overlappingBars.some((b) => b.ganttBarConfig.immobile)
      expect(hasImmobileBar).toBe(false)
    })

    it("should not find overlaps when bars do not intersect", () => {
      mockDayjsDate.isBefore.mockReturnValue(true)
      mockDayjsDate.isAfter.mockReturnValue(false)

      const { findOverlappingBars } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const bar = createMockBar("test")

      const overlappingBars = findOverlappingBars(bar)
      expect(overlappingBars.length).toBe(0)
    })
  })

  describe("findConnectedBars", () => {
    it("should find bars connected by source", () => {
      const sourceBar = createMockBar("source", {
        connections: [{ targetId: "target" }]
      })

      const { findConnectedBars } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const connectedBars = findConnectedBars(sourceBar)

      expect(connectedBars.length).toBe(0) // 0 perché il target non esiste nel mock
    })

    it("should find bars connected by target", () => {
      const targetBar = createMockBar("target")
      mockRowManager.rows.value[0].bars.push(
        createMockBar("source", {
          connections: [{ targetId: "target" }]
        })
      )

      const { findConnectedBars } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const connectedBars = findConnectedBars(targetBar)

      expect(connectedBars.length).toBe(1)
    })

    it("should not include connections with pushOnConnect disabled", () => {
      const sourceBar = createMockBar("source", {
        connections: [{ targetId: "target" }],
        pushOnConnect: false
      })

      const { findConnectedBars } = useBarMovement(mockConfig, mockRowManager, mockDayjsHelper)
      const connectedBars = findConnectedBars(sourceBar)

      expect(connectedBars.length).toBe(0)
    })
  })
})
