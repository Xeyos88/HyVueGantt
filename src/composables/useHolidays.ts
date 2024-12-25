import { ref, watch } from "vue"
import Holidays from "date-holidays"
import type { Holiday } from "../types"
import type { GGanttChartConfig } from "../types/config"
import useDayjsHelper from "./useDayjsHelper"

export function useHolidays(config: GGanttChartConfig) {
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper(config)
  const holidays = ref<Holiday[]>([])
  const hd = new Holidays()

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

  const getHolidayInfo = (date: Date) => {
    const holiday = holidays.value.find((h) => h.date.toDateString() === date.toDateString())
    if (!holiday) return null

    return {
      isHoliday: true,
      holidayName: holiday.name,
      holidayType: holiday.type
    }
  }

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
