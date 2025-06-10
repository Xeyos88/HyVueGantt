import { describe, it, expect, vi } from "vitest"
import { ref } from "vue"
import useDayjsHelper from "../../src/composables/useDayjsHelper"
import dayjs from "dayjs"

// Mock dayjs
vi.mock("dayjs", () => {
  const mockDayjs = vi.fn((input) => ({
    format: vi.fn().mockReturnValue(input || "2024-01-01"),
    diff: vi.fn().mockReturnValue(60),
    add: vi.fn().mockImplementation((value, unit) => mockDayjs("2024-01-02")),
    subtract: vi.fn().mockImplementation((value, unit) => mockDayjs("2023-12-31")),
    locale: vi.fn().mockReturnValue(mockDayjs)
  }))

  // Add static methods and properties that dayjs uses
  mockDayjs.extend = vi.fn()
  mockDayjs.locale = vi.fn()

  return {
    default: mockDayjs,
    __esModule: true
  }
})

// Mock provideConfig
vi.mock("../../src/provider/provideConfig", () => ({
  default: () => ({
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    locale: ref("en")
  })
}))

describe("useDayjsHelper", () => {
  const mockConfig = {
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    barStart: ref("start"),
    barEnd: ref("end"),
    dateFormat: ref("YYYY-MM-DD HH:mm"),
    locale: ref("en")
  }

  describe("toDayjs", () => {
    it("should convert string date to dayjs object", () => {
      const { toDayjs } = useDayjsHelper(mockConfig)
      const result = toDayjs("2024-01-01")
      expect(dayjs).toHaveBeenCalledWith("2024-01-01", "YYYY-MM-DD HH:mm", false)
    })

    it("should convert Date object to dayjs object", () => {
      const { toDayjs } = useDayjsHelper(mockConfig)
      const date = new Date("2024-01-01")
      const result = toDayjs(date)
      expect(dayjs).toHaveBeenCalledWith(date)
    })

    it("should handle bar object with start property", () => {
      const { toDayjs } = useDayjsHelper(mockConfig)
      const bar = {
        start: "2024-01-01",
        end: "2024-01-02",
        ganttBarConfig: { id: "1" }
      }
      const result = toDayjs(bar, "start")
      expect(dayjs).toHaveBeenCalledWith("2024-01-01", "YYYY-MM-DD HH:mm", false)
    })

    it("should handle bar object with end property", () => {
      const { toDayjs } = useDayjsHelper(mockConfig)
      const bar = {
        start: "2024-01-01",
        end: "2024-01-02",
        ganttBarConfig: { id: "1" }
      }
      const result = toDayjs(bar, "end")
      expect(dayjs).toHaveBeenCalledWith("2024-01-02", "YYYY-MM-DD HH:mm", false)
    })
  })

  describe("format", () => {
    it("should format date string with default pattern", () => {
      const { format } = useDayjsHelper(mockConfig)
      const result = format("2024-01-01")
      expect(result).toBe("2024-01-01")
    })

    it("should return Date object when pattern is false", () => {
      const { format } = useDayjsHelper(mockConfig)
      const date = new Date("2024-01-01")
      const result = format(date, false)
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe("diffDates", () => {
    it("should calculate difference between chart start and end", () => {
      const { diffDates } = useDayjsHelper(mockConfig)
      const result = diffDates()
      expect(result).toBe(60)
    })
  })
})
