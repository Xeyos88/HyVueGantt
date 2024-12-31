import { describe, it, expect, vi, beforeEach } from "vitest"
import { ref } from "vue"
import { useHolidays } from "../../src/composables/useHolidays"
import Holidays from "date-holidays"
import type { Holiday } from "../../src/types"

vi.mock("date-holiholidaysdays", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      init: vi.fn(),
      getHolidays: vi.fn().mockImplementation((date) => [
        {
          date: new Date("2024-01-01"),
          name: "New Year's Day",
          type: "public"
        },
        {
          date: new Date("2024-12-25"),
          name: "Christmas Day",
          type: "public"
        }
      ])
    }))
  }
})

vi.mock("../../src/composables/useDayjsHelper", () => ({
  default: () => ({
    chartStartDayjs: {
      value: {
        toDate: () => new Date("2024-01-01")
      }
    },
    chartEndDayjs: {
      value: {
        toDate: () => new Date("2024-12-31")
      }
    },
    toDayjs: vi.fn().mockReturnValue({
      toDate: () => new Date("2024-01-01")
    }),
    format: vi.fn().mockReturnValue("2024-01-01")
  })
}))

describe("useHolidays", () => {
  const mockConfig = {
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    holidayHighlight: ref("US")
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with empty holidays array", () => {
      const config = {
        ...mockConfig,
        holidayHighlight: ref("")
      }
      const { holidays } = useHolidays(config)
      expect(holidays.value).toHaveLength(0)
    })

    it("should load holidays when country code is provided", () => {
      const { holidays } = useHolidays(mockConfig)
      expect(holidays.value).toHaveLength(46)
      expect(holidays.value[0]).toMatchObject({
        date: expect.any(Date),
        name: "New Year's Day",
        type: "public"
      })
    })

    it("should clear holidays when country code is removed", async () => {
      const config = {
        ...mockConfig,
        holidayHighlight: ref("US")
      }
      const { holidays } = useHolidays(config)
      expect(holidays.value.length).toBeGreaterThan(0)

      config.holidayHighlight.value = ""
      await vi.dynamicImportSettled()
      expect(holidays.value).toHaveLength(0)
    })
  })

  describe("getHolidayInfo", () => {
    it("should return holiday info for a matching date", () => {
      const { getHolidayInfo } = useHolidays(mockConfig)
      const date = new Date("2024-01-01")
      const info = getHolidayInfo(date)

      expect(info).toMatchObject({
        isHoliday: true,
        holidayName: "New Year's Day",
        holidayType: "public"
      })
    })

    it("should return null for non-holiday date", () => {
      const { getHolidayInfo } = useHolidays(mockConfig)
      const date = new Date("2024-01-02")
      const info = getHolidayInfo(date)

      expect(info).toBeNull()
    })
  })

  describe("holiday updates", () => {
    
    it("should handle invalid country codes gracefully", () => {
      const config = {
        ...mockConfig,
        holidayHighlight: ref("INVALID")
      }
      const { holidays } = useHolidays(config)
      expect(holidays.value).toBeDefined()
      expect(Array.isArray(holidays.value)).toBe(true)
    })
  })

  describe("date handling", () => {
    it("should correctly compare dates ignoring time", () => {
      const { getHolidayInfo } = useHolidays(mockConfig)
      
      const morningDate = new Date("2024-01-01T08:00:00")
      const eveningDate = new Date("2024-01-01T20:00:00")
      
      const morningInfo = getHolidayInfo(morningDate)
      const eveningInfo = getHolidayInfo(eveningDate)
      
      expect(morningInfo?.isHoliday).toBe(true)
      expect(eveningInfo?.isHoliday).toBe(true)
      expect(morningInfo?.holidayName).toBe(eveningInfo?.holidayName)
    })

    it("should handle timezone differences", () => {
      const { getHolidayInfo } = useHolidays(mockConfig)
      
      const date = new Date(Date.UTC(2024, 0, 1))
      const info = getHolidayInfo(date)
      
      expect(info?.isHoliday).toBe(true)
      expect(info?.holidayName).toBe("New Year's Day")
    })
  })
})