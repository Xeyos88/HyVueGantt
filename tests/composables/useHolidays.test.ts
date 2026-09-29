import { afterEach, describe, expect, it, vi } from "vitest"
import { effectScope, nextTick, ref, type EffectScope } from "vue"
import { useHolidays } from "../../src/composables/useHolidays"
import type { GGanttChartConfig } from "../../src/types"

const loader = vi.hoisted(() => ({ loaded: vi.fn(), calculated: vi.fn() }))
vi.mock("date-holidays", () => {
  loader.loaded()
  return {
    default: class {
      country = ""
      init(country: string) {
        if (country === "FAIL") throw new Error("Calendar unavailable")
        this.country = country
      }
      getHolidays(year: number) {
        loader.calculated(this.country, year)
        return [
          { date: `${year}-01-01 00:00:00`, name: `${this.country} New Year`, type: "public" }
        ]
      }
    }
  }
})
const scopes: EffectScope[] = []
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
const setup = (country = "") => {
  const scope = effectScope()
  scopes.push(scope)
  const config = {
    chartStart: ref("2024-01-01"),
    chartEnd: ref("2024-12-31"),
    barStart: ref("start"),
    barEnd: ref("end"),
    locale: ref("en"),
    dateFormat: ref("YYYY-MM-DD"),
    holidayHighlight: ref(country)
  }
  return { scope, config, ...scope.run(() => useHolidays(config as unknown as GGanttChartConfig))! }
}

describe("lazy holiday data", () => {
  it("defers loading and ignores stale country requests and disposed charts", async () => {
    const disabled = setup()
    expect(disabled.holidays.value).toEqual([])
    expect(loader.loaded).not.toHaveBeenCalled()
    const first = setup("US")
    const second = setup("FR")
    const disposed = setup("US")
    disposed.scope.stop()
    first.config.holidayHighlight.value = "IT"
    await nextTick()
    await vi.dynamicImportSettled()
    expect(loader.loaded).toHaveBeenCalledTimes(1)
    expect([first.loadError.value, second.loadError.value]).toEqual([null, null])
    await vi.waitFor(() => expect(loader.calculated).toHaveBeenCalledTimes(2))
    expect(loader.calculated.mock.calls).toEqual(
      expect.arrayContaining([
        ["FR", 2024],
        ["IT", 2024]
      ])
    )
    expect(first.getHolidayInfo(new Date(2024, 0, 1))?.holidayName).toBe("IT New Year")
    expect(second.getHolidayInfo(new Date(2024, 0, 1))?.holidayName).toBe("FR New Year")
    expect(disposed.holidays.value).toEqual([])
  })

  it("clears disabled holidays and can enable them again", async () => {
    const calendar = setup("US")
    await vi.dynamicImportSettled()
    expect(calendar.holidays.value).toHaveLength(1)
    calendar.config.holidayHighlight.value = ""
    await nextTick()
    expect(calendar.holidays.value).toEqual([])
    calendar.config.holidayHighlight.value = "it"
    await nextTick()
    await vi.dynamicImportSettled()
    expect(calendar.getHolidayInfo(new Date(2024, 0, 1))?.holidayName).toBe("IT New Year")
  })

  it("reloads every year in the new range without duplicating a single year", async () => {
    const calendar = setup("US")
    await vi.dynamicImportSettled()
    expect(calendar.holidays.value).toHaveLength(1)
    calendar.config.chartStart.value = "2025-01-01"
    calendar.config.chartEnd.value = "2027-12-31"
    await nextTick()
    await vi.dynamicImportSettled()
    expect(calendar.holidays.value.map((holiday) => holiday.date.getFullYear())).toEqual([
      2025, 2026, 2027
    ])
  })

  it("matches days regardless of time and returns null for other days", async () => {
    const calendar = setup("US")
    await vi.dynamicImportSettled()
    expect(calendar.getHolidayInfo(new Date(2024, 0, 1, 8))?.isHoliday).toBe(true)
    expect(calendar.getHolidayInfo(new Date(2024, 0, 1, 20))?.isHoliday).toBe(true)
    expect(calendar.getHolidayInfo(new Date(2024, 0, 2))).toBeNull()
  })

  it("exposes loading errors without rejecting the chart watcher and recovers on change", async () => {
    const calendar = setup("FAIL")
    await vi.dynamicImportSettled()
    expect(calendar.holidays.value).toEqual([])
    expect(calendar.loadError.value).toBe("Calendar unavailable")
    calendar.config.holidayHighlight.value = "US"
    await nextTick()
    await vi.dynamicImportSettled()
    expect(calendar.loadError.value).toBeNull()
    expect(calendar.holidays.value).toHaveLength(1)
  })
})
