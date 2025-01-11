import { ref, watch } from "vue"
import Holidays from "date-holidays"
import type { Holiday } from "../types"
import type { GGanttChartConfig } from "../types/config"
import useDayjsHelper from "./useDayjsHelper"

/**
 * A composable that manages holiday information and highlighting in the Gantt chart
 * Uses the date-holidays library to provide holiday data for different countries
 * @param config - Gantt chart configuration object
 * @returns Object containing holiday state and methods
 */
export function useHolidays(config: GGanttChartConfig) {
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper(config)
  const holidays = ref<Holiday[]>([])
  const hd = new Holidays()

  /**
   * Loads holidays for a specified country
   * Fetches holidays that fall within the chart's date range
   * @param country - Country code for holiday data
   */
  const loadHolidays = (country: string) => {
    hd.init(country)
    const start = chartStartDayjs.value.toDate()
    const end = chartEndDayjs.value.toDate()

    const holidaysListStart = hd.getHolidays(start) as unknown as Holiday[]
    const holidaysListEnd = hd.getHolidays(end) as unknown as Holiday[]

    const startHolidays = holidaysListStart.map((h: Holiday) => ({
      date: new Date(h.date),
      name: h.name,
      type: h.type
    }))

    const endHolidays = holidaysListEnd.map((h: Holiday) => ({
      date: new Date(h.date),
      name: h.name,
      type: h.type
    }))

    holidays.value = [...startHolidays, ...endHolidays]
  }

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
    () => config.holidayHighlight.value?.toUpperCase(),
    (newCountry) => {
      if (newCountry) {
        loadHolidays(newCountry)
      } else {
        holidays.value = []
      }
    },
    { immediate: true }
  )

  return {
    holidays,
    getHolidayInfo
  }
}
