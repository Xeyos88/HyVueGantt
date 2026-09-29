import { afterEach, describe, expect, it } from "vitest"
import { ref } from "vue"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "dayjs/locale/en"
import "dayjs/locale/it"
import "dayjs/locale/fr"
import "dayjs/locale/de"
import useDayjsHelper from "../../src/composables/useDayjsHelper"

dayjs.extend(customParseFormat)
const originalLocale = dayjs.locale()
afterEach(() => dayjs.locale(originalLocale))

const createConfig = (locale = "en", dateFormat: string | false = "YYYY-MM-DD HH:mm") => ({
  chartStart: ref("2024-01-01 00:00"),
  chartEnd: ref("2024-01-05 00:00"),
  barStart: ref("start"),
  barEnd: ref("end"),
  dateFormat: ref(dateFormat),
  locale: ref(locale)
})

describe("useDayjsHelper", () => {
  it("parses strings and Date objects", () => {
    const helper = useDayjsHelper(createConfig())
    expect(helper.toDayjs("2024-01-02 12:30").format("YYYY-MM-DD HH:mm"))
      .toBe("2024-01-02 12:30")
    const date = new Date(2024, 0, 2, 12, 30)
    expect(helper.toDayjs(date).valueOf()).toBe(date.getTime())
  })

  it("reads the configured start and end fields from bars", () => {
    const config = createConfig()
    config.barStart.value = "begin"
    config.barEnd.value = "finish"
    const helper = useDayjsHelper(config)
    const bar = { begin: "2024-01-02 00:00", finish: "2024-01-03 00:00", ganttBarConfig: { id: "a" } }
    expect(helper.toDayjs(bar, "start").date()).toBe(2)
    expect(helper.toDayjs(bar, "end").date()).toBe(3)
  })

  it("returns native dates when formatting is disabled", () => {
    const helper = useDayjsHelper(createConfig())
    const date = new Date(2024, 0, 2)
    expect(helper.format(date, false)).toBe(date)
    expect(helper.format("2024-01-02 00:00", false)).toEqual(date)
  })

  it("calculates the range duration", () => {
    expect(useDayjsHelper(createConfig()).diffDates()).toBe(4)
  })

  it("parses localized month names using each chart's locale", () => {
    const italian = useDayjsHelper(createConfig("it", "D MMMM YYYY"))
    const english = useDayjsHelper(createConfig("en", "D MMMM YYYY"))
    expect(italian.toDayjs("2 gennaio 2024").format("YYYY-MM-DD")).toBe("2024-01-02")
    expect(english.toDayjs("2 January 2024").format("YYYY-MM-DD")).toBe("2024-01-02")
  })

  it("formats strings, dates and existing Day.js objects in the chart's locale", () => {
    const helper = useDayjsHelper(createConfig("it"))
    for (const input of ["2024-01-02 00:00", new Date(2024, 0, 2), dayjs("2024-01-02").locale("en")]) {
      expect(helper.format(input, "MMMM")).toBe("gennaio")
    }
  })

  it("reacts to locale changes without affecting other charts or the application", () => {
    dayjs.locale("de")
    const config = createConfig("it")
    const italian = useDayjsHelper(config)
    const english = useDayjsHelper(createConfig("en"))
    expect(italian.chartStartDayjs.value.format("MMMM")).toBe("gennaio")
    config.locale.value = "fr"
    expect(italian.chartStartDayjs.value.format("MMMM")).toBe("janvier")
    expect(english.chartStartDayjs.value.format("MMMM")).toBe("January")
    expect(dayjs.locale()).toBe("de")
  })
})
