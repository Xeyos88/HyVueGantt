import { afterEach, describe, expect, it } from "vitest"
import { mount, type VueWrapper } from "@vue/test-utils"
import { nextTick } from "vue"
import dayjs from "dayjs"
import { extendDayjs, GGanttChart } from "../../src/hy-vue-gantt"

extendDayjs()

const wrappers: VueWrapper[] = []
const originalLocale = dayjs.locale()

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  dayjs.locale(originalLocale)
})

const mountChart = (id: string, locale: string, zoom: number) => {
  const wrapper = mount(GGanttChart, {
    props: {
      chartStart: "2024-01-01 00:00",
      chartEnd: "2024-01-05 00:00",
      barStart: "start",
      barEnd: "end",
      locale,
      defaultZoom: zoom,
      commands: false,
      enableConnections: false,
      exportEnabled: false,
      showEventsAxis: true,
      initialRows: [{
        id,
        label: id,
        bars: [{
          start: "2024-01-02 00:00",
          end: "2024-01-03 00:00",
          ganttBarConfig: { id }
        }]
      }],
      timeaxisEvents: [{
        id: `${id}-event`, label: "Event",
        startDate: "2024-01-02 00:00", endDate: "2024-01-03 00:00"
      }]
    }
  })
  wrappers.push(wrapper)
  return wrapper
}

const expectPosition = (wrapper: VueWrapper, width: number) => {
  for (const selector of [".g-gantt-bar", ".g-timeaxis-event"]) {
    const element = wrapper.get(selector).element as HTMLElement
    expect(element.style.left).toBe(`${width}px`)
    expect(element.style.width).toBe(`${width}px`)
  }
}

describe("GGanttChart instance isolation", () => {
  it("keeps bar and event positions independent when another chart mounts or zooms", async () => {
    const first = mountChart("first", "en", 3)
    await nextTick()
    const second = mountChart("second", "it", 6)
    await nextTick()
    expectPosition(first, 72)
    expectPosition(second, 144)

    await second.setProps({ defaultZoom: 5 })
    // Restore uses the same exposed API that consumers use to change zoom.
    second.vm.restoreZoom(5, "day")
    await nextTick()
    expectPosition(first, 72)
    expectPosition(second, 120)

    second.unmount()
    wrappers.pop()
    first.vm.restoreZoom(4, "day")
    await nextTick()
    expectPosition(first, 96)
  })

  it("keeps axis labels local during locale and date-range updates", async () => {
    const first = mountChart("first", "en", 3)
    const second = mountChart("second", "it", 6)
    await nextTick()
    expect(first.get(".g-upper-timeunit").text()).toBe("January 2024")
    expect(second.get(".g-upper-timeunit").text()).toBe("Gennaio 2024")

    await second.setProps({ locale: "fr" })
    expect(second.get(".g-upper-timeunit").text()).toBe("Janvier 2024")
    await first.setProps({ chartEnd: "2024-01-06 00:00" })
    expect(first.get(".g-upper-timeunit").text()).toBe("January 2024")
    expect(second.get(".g-upper-timeunit").text()).toBe("Janvier 2024")
    expectPosition(first, 72)
    expectPosition(second, 144)
  })

  it("does not change the host application's Day.js locale", async () => {
    dayjs.locale("de")
    const chart = mountChart("first", "it", 3)
    await nextTick()
    expect(dayjs.locale()).toBe("de")
    await chart.setProps({ locale: "fr" })
    expect(dayjs.locale()).toBe("de")
  })
})
