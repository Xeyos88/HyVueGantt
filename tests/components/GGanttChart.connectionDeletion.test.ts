import { afterEach, describe, expect, it, vi } from "vitest"
import { mount, type VueWrapper } from "@vue/test-utils"
import { nextTick } from "vue"
import { extendDayjs, GGanttChart } from "../../src/hy-vue-gantt"

extendDayjs()
const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

const setup = async (enabled: boolean, virtualRows: boolean) => {
  const wrapper = mount(GGanttChart, {
    attachTo: document.body,
    props: {
      chartStart: "2024-01-01 00:00",
      chartEnd: "2024-01-05 00:00",
      barStart: "start",
      barEnd: "end",
      enableConnectionDeletion: enabled,
      virtualRows,
      maxRows: 5,
      initialRows: [
        {
          id: "source-row",
          label: "Source",
          bars: [
            {
              start: "2024-01-01 00:00",
              end: "2024-01-02 00:00",
              ganttBarConfig: { id: "source", connections: [{ targetId: "target" }] }
            }
          ]
        },
        {
          id: "target-row",
          label: "Target",
          bars: [
            {
              start: "2024-01-03 00:00",
              end: "2024-01-04 00:00",
              ganttBarConfig: { id: "target" }
            }
          ]
        }
      ]
    }
  })
  wrappers.push(wrapper)
  await nextTick()
  await vi.waitFor(() => expect(wrapper.findAll(".connector-path")).toHaveLength(1))
  return wrapper
}

for (const virtualRows of [false, true]) {
  describe(`connection deletion (virtualRows: ${virtualRows})`, () => {
    it("enables deletion after mount and emits the deleted endpoints", async () => {
      const wrapper = await setup(false, virtualRows)
      const chartElement = wrapper.element
      await wrapper.setProps({ enableConnectionDeletion: true })
      await wrapper.get(".connector-path").trigger("click")
      await wrapper.get(".g-gantt-container").trigger("keydown", { key: "Delete" })
      expect(wrapper.findAll(".connector-path")).toHaveLength(0)
      expect(wrapper.element).toBe(chartElement)
      expect(wrapper.emitted("connection-delete")).toHaveLength(1)
      expect(wrapper.emitted("connection-delete")![0]![0]).toMatchObject({
        sourceBar: { ganttBarConfig: { id: "source" } },
        targetBar: { ganttBarConfig: { id: "target" } }
      })
    })

    it("blocks deletion of a selected connection when disabled and permits it on re-enable", async () => {
      const wrapper = await setup(true, virtualRows)
      await wrapper.get(".connector-path").trigger("click")
      await wrapper.setProps({ enableConnectionDeletion: false })
      await wrapper.get(".g-gantt-container").trigger("keydown", { key: "Delete" })
      expect(wrapper.findAll(".connector-path")).toHaveLength(1)
      expect(wrapper.emitted("connection-delete")).toBeUndefined()
      await wrapper.setProps({ enableConnectionDeletion: true })
      await wrapper.get(".g-gantt-container").trigger("keydown", { key: "Delete" })
      expect(wrapper.findAll(".connector-path")).toHaveLength(0)
      expect(wrapper.emitted("connection-delete")).toHaveLength(1)
    })
  })
}
