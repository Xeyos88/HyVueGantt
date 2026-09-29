import { ref, watch } from "vue"
import type Holidays from "date-holidays"
import type { Holiday } from "../types"
import type { GGanttChartConfig } from "../types/config"
import useDayjsHelper from "./useDayjsHelper"

// Share the in-flight download across charts, but keep each calendar instance local.
// Clear failures so a later enable/country change can retry the download.
let calendarModule: Promise<typeof import("date-holidays")> | undefined
const loadCalendar = () => {
  calendarModule ??= import("date-holidays").catch((error) => {
    calendarModule = undefined
    throw error
  })
  return calendarModule
}

/**
 * A composable that manages holiday information and highlighting in the Gantt chart
 * Uses the date-holidays library to provide holiday data for different countries
 * @param config - Gantt chart configuration object
 * @returns Object containing holiday state and methods
 */
export function useHolidays(config: GGanttChartConfig) {
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper(config)
  const holidays = ref<Holiday[]>([])
  const loadError = ref<string | null>(null)
  let calendar: Holidays | undefined

  /**
   * Retrieves holiday information for a specific date
   * @param date - Date to check for holiday
   * @returns Holiday information object or null if not a holiday
   */
  const getHolidayInfo = (date: Date) => {
    const holiday = holidays.value.find((h) => h.date.toDateString() === date.toDateString())
    if (!holiday) return null

    return {
      isHoliday: true,
      holidayName: holiday.name,
      holidayType: holiday.type
    }
  }

  /**
   * Watches for changes in holiday configuration and updates holiday data accordingly
   * Handles changes in country selection and clears data when disabled
   */
  watch(
    [() => config.holidayHighlight.value?.toUpperCase(), chartStartDayjs, chartEndDayjs],
    async ([country, start, end], _previous, onCleanup) => {
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      holidays.value = []
      loadError.value = null
      if (!country) return

      try {
        const { default: Holidays } = await loadCalendar()
        // Country/range changes and unmounts can happen while the chunk is loading.
        if (cancelled) return
        calendar ??= new Holidays()
        calendar.init(country)
        const result: Holiday[] = []
        for (let year = start.year(); year <= end.year(); year++) {
          for (const holiday of calendar.getHolidays(year)) {
            result.push({ date: new Date(holiday.date), name: holiday.name, type: holiday.type })
          }
        }
        holidays.value = result
      } catch (error) {
        if (!cancelled) {
          loadError.value = error instanceof Error ? error.message : "Failed to load holidays"
        }
      }
    },
    { immediate: true }
  )

  return {
    holidays,
    loadError,
    getHolidayInfo
  }
}
