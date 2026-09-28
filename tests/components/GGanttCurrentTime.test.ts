import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mount, type VueWrapper } from "@vue/test-utils"
import { nextTick, ref } from "vue"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import utcPlugin from "dayjs/plugin/utc"
import GGanttCurrentTime from "../../src/components/GGanttCurrentTime.vue"
import { CONFIG_KEY } from "../../src/provider/symbols"

dayjs.extend(customParseFormat)
dayjs.extend(utcPlugin)

const wrappers: VueWrapper[] = []
const createWrapper = (slots = {}) => {
  const config = {
    chartStart: ref<string | Date>("2024-01-01 00:00:00"),
    chartEnd: ref<string | Date>("2024-01-02 00:00:00"),
    dateFormat: ref<string | false>("YYYY-MM-DD HH:mm:ss"),
    locale: ref("en"),
    barStart: ref("start"),
    barEnd: ref("end"),
    ganttWidth: ref(2400),
    colors: ref({ markerCurrentTime: "#123456" }),
    currentTimeLabel: ref("Now"),
    utc: ref(false)
  }
  const wrapper = mount(GGanttCurrentTime, {
    global: { provide: { [CONFIG_KEY]: config } },
    slots
  })
  wrappers.push(wrapper)
  const left = () => wrapper.get<HTMLElement>(".g-grid-current-time").element.style.left
  return { wrapper, config, left }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2024, 0, 1, 12))
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
})

describe("GGanttCurrentTime", () => {
  it("positions the marker on first render without waiting for a timer tick", () => {
    const { left } = createWrapper()
    expect(left()).toBe("1200px")
  })

  it("updates immediately on zoom and resize, even with cached positions", async () => {
    const { config, left } = createWrapper()
    await vi.advanceTimersByTimeAsync(1000)
    expect(left()).toBe("1200px")
    config.ganttWidth.value = 4800
    await nextTick()
    expect(left()).toBe("2400px")
    config.ganttWidth.value = 1200
    await nextTick()
    expect(left()).toBe("600px")
  })

  it("updates immediately when either end of the chart range changes", async () => {
    const { config, left } = createWrapper()
    await vi.advanceTimersByTimeAsync(1000)
    config.chartEnd.value = "2024-01-03 00:00:00"
    await nextTick()
    expect(left()).toBe("600px")
    config.chartStart.value = "2023-12-31 00:00:00"
    await nextTick()
    expect(left()).toBe("1200px")
  })

  it("keeps tracking time and releases its timer on unmount", async () => {
    const { wrapper, config, left } = createWrapper()
    config.ganttWidth.value = 86400 // One pixel per second.
    await nextTick()
    expect(left()).toBe("43200px")
    await vi.advanceTimersByTimeAsync(1000)
    expect(left()).toBe("43201px")
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("supports Date ranges and a disabled date format", async () => {
    const { config, left } = createWrapper()
    config.chartStart.value = new Date(2024, 0, 1)
    config.chartEnd.value = new Date(2024, 0, 2)
    config.dateFormat.value = false
    await nextTick()
    expect(left()).toBe("1200px")
  })

  it("uses the configured color and label without a slot", async () => {
    const { wrapper, config } = createWrapper()
    expect(wrapper.get<HTMLElement>(".g-grid-current-time-marker").element.style.border).toBe(
      "1px dashed rgb(18, 52, 86)"
    )
    expect(wrapper.get(".g-grid-current-time-text").text()).toBe("Now")
    config.currentTimeLabel.value = "Ora"
    await nextTick()
    expect(wrapper.get(".g-grid-current-time-text").text()).toBe("Ora")
  })

  it("updates the position and label immediately when UTC mode is enabled", async () => {
    const { wrapper, config, left } = createWrapper()
    await vi.advanceTimersByTimeAsync(1000)
    config.utc.value = true
    await nextTick()
    const utcNow = dayjs().utc()
    const seconds = utcNow.hour() * 3600 + utcNow.minute() * 60 + utcNow.second()
    expect(left()).toBe(`${Math.round((seconds / 86400) * 2400)}px`)
    expect(wrapper.get(".g-grid-current-time-text").text()).toBe("Now (UTC)")
  })

  it("renders a custom current-time-label slot", () => {
    const { wrapper } = createWrapper({ "current-time-label": "<span>Custom Time</span>" })
    expect(wrapper.get(".g-grid-current-time-text").text()).toBe("Custom Time")
  })
})
