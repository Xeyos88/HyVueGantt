import { afterEach, expect, it, vi } from "vitest"
import { mount, type VueWrapper } from "@vue/test-utils"
import { nextTick } from "vue"
import { extendDayjs, GGanttChart } from "../../src/hy-vue-gantt"
import GGanttTimeaxis from "../../src/components/GGanttTimeaxis.vue"

extendDayjs()
const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
it("refreshes cached axis units when holidays load, change country or are disabled", async () => {
  const wrapper = mount(GGanttChart, {
    props: {
      chartStart: "2026-07-04 00:00",
      chartEnd: "2026-07-06 00:00",
      barStart: "start",
      barEnd: "end",
      holidayHighlight: "US",
      precision: "day",
      fixedPrecision: true
    }
  })
  wrappers.push(wrapper)
  const firstUnit = () =>
    wrapper.getComponent(GGanttTimeaxis).props("timeaxisUnits").result.lowerUnits[0]!
  expect(firstUnit().isHoliday).toBe(false)
  await vi.dynamicImportSettled()
  await nextTick()
  expect(firstUnit().isHoliday).toBe(true)
  await wrapper.setProps({ holidayHighlight: "DE" })
  await vi.dynamicImportSettled()
  await nextTick()
  expect(firstUnit().isHoliday).toBe(false)
  await wrapper.setProps({ chartStart: "2026-12-25 00:00", chartEnd: "2026-12-27 00:00" })
  await vi.dynamicImportSettled()
  await nextTick()
  expect(firstUnit().isHoliday).toBe(true)
  await wrapper.setProps({ holidayHighlight: "" })
  expect(firstUnit().isHoliday).toBe(false)
})
