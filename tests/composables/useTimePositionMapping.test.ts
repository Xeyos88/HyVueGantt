import { afterEach, describe, expect, it } from "vitest"
import { effectScope, ref, type EffectScope } from "vue"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "dayjs/locale/en"
import "dayjs/locale/it"
import useTimePositionMapping from "../../src/composables/useTimePositionMapping"

dayjs.extend(customParseFormat)
const scopes: EffectScope[] = []
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))

const createMapping = (width: number) => {
  const config = {
    chartStart: ref<string | Date>("2024-01-01 00:00"), chartEnd: ref<string | Date>("2024-01-05 00:00"),
    barStart: ref("start"), barEnd: ref("end"),
    dateFormat: ref<string | false>("YYYY-MM-DD HH:mm"), locale: ref("en"),
    ganttWidth: ref(width)
  }
  const scope = effectScope()
  scopes.push(scope)
  return { config, ...scope.run(() => useTimePositionMapping(config))! }
}

describe("useTimePositionMapping", () => {
  it("isolates both mapping directions and cached results across chart widths", () => {
    const first = createMapping(400)
    const second = createMapping(800)
    const date = "2024-01-02 00:00"
    expect(first.mapTimeToPosition(date)).toBe(100)
    expect(second.mapTimeToPosition(date)).toBe(200)
    expect(first.mapPositionToTime(100)).toBe(date)
    expect(second.mapPositionToTime(200)).toBe(date)

    second.config.ganttWidth.value = 1200
    expect(second.mapTimeToPosition(date)).toBe(300)
    expect(second.mapPositionToTime(300)).toBe(date)
    expect(second.mapPositionToTime(200)).toBe("2024-01-01 16:00")
    expect(first.mapTimeToPosition(date)).toBe(100)
    expect(first.mapPositionToTime(100)).toBe(date)
  })

  it("invalidates cached positions immediately when the chart range changes", () => {
    const mapping = createMapping(400)
    expect(mapping.mapTimeToPosition("2024-01-02 00:00")).toBe(100)
    mapping.config.chartEnd.value = "2024-01-09 00:00"
    expect(mapping.mapTimeToPosition("2024-01-02 00:00")).toBe(50)
  })

  it("invalidates cached date strings when the format or locale changes", () => {
    const mapping = createMapping(400)
    expect(mapping.mapPositionToTime(100)).toBe("2024-01-02 00:00")
    mapping.config.chartStart.value = new Date(2024, 0, 1)
    mapping.config.chartEnd.value = new Date(2024, 0, 5)
    expect(mapping.mapPositionToTime(100)).toBe("2024-01-02 00:00")
    mapping.config.dateFormat.value = "YYYY-MM-DD HH:mm [month:] MMMM"
    expect(mapping.mapPositionToTime(100)).toBe("2024-01-02 00:00 month: January")
    mapping.config.locale.value = "it"
    expect(mapping.mapPositionToTime(100)).toBe("2024-01-02 00:00 month: gennaio")
  })
})
