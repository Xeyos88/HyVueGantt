import provideConfig from "../provider/provideConfig"
import type { GanttBarObject } from "../types/bar"
import provideEmitBarEvent from "../provider/provideEmitBarEvent"
import useDayjsHelper from "./useDayjsHelper"
import createBarDrag from "./createBarDrag"
import { useBarMovement } from "./useBarMovement"
import { inject } from "vue"
import type { UseRowsReturn } from "./useRows"

type DragState = {
  movedBars: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
  isDragging: boolean
}

const useBarDragManagement = () => {
  const config = provideConfig()
  const emitBarEvent = provideEmitBarEvent()
  const dayjs = useDayjsHelper(config)
  const { barStart, barEnd } = config
  const rowManager = inject<UseRowsReturn>("useRows")!

  const movement = useBarMovement(config, rowManager, dayjs)

  const dragState: DragState = {
    movedBars: new Map(),
    isDragging: false
  }

  const initDragOfBar = (bar: GanttBarObject, e: MouseEvent) => {
    const dragHandler = createDragHandler(bar)
    dragHandler.initiateDrag(e)
    addBarToMovedBars(bar)
    emitBarEvent({ ...e, type: "dragstart" }, bar)
  }

  const initDragOfBundle = (mainBar: GanttBarObject, e: MouseEvent) => {
    const bundle = mainBar.ganttBarConfig.bundle
    if (!bundle) return

    const bundleBars = rowManager.rows.value
      .flatMap((row) => row.bars)
      .filter((bar) => bar.ganttBarConfig.bundle === bundle)

    bundleBars.forEach((bar) => {
      const isMainBar = bar === mainBar
      const dragHandler = createDragHandler(bar, isMainBar)
      dragHandler.initiateDrag(e)
      addBarToMovedBars(bar)
    })

    emitBarEvent({ ...e, type: "dragstart" }, mainBar)
  }

  const createDragHandler = (bar: GanttBarObject, isMainBar = true) => ({
    initiateDrag: (e: MouseEvent) => {
      const { initDrag } = createBarDrag(
        bar,
        (e) => handleDrag(e, bar),
        isMainBar ? handleDragEnd : () => null,
        config,
        movement
      )
      initDrag(e)
    }
  })

  const handleDrag = (e: MouseEvent, bar: GanttBarObject) => {
    emitBarEvent({ ...e, type: "drag" }, bar)
    const result = movement.moveBar(bar, bar[barStart.value], bar[barEnd.value])
    if (!result.success) {
      snapBackMovedBars()
    } else {
      result.affectedBars.forEach((affectedBar) => {
        if (!dragState.movedBars.has(affectedBar)) {
          addBarToMovedBars(affectedBar)
        }
      })
    }
  }

  const handleDragEnd = (e: MouseEvent, bar: GanttBarObject) => {
    emitBarEvent({ ...e, type: "dragend" }, bar, undefined, new Map(dragState.movedBars))
    dragState.movedBars.clear()
    dragState.isDragging = false
  }

  const addBarToMovedBars = (bar: GanttBarObject) => {
    if (!dragState.movedBars.has(bar)) {
      dragState.movedBars.set(bar, {
        oldStart: bar[barStart.value],
        oldEnd: bar[barEnd.value]
      })
    }
  }

  const snapBackMovedBars = () => {
    dragState.movedBars.forEach(({ oldStart, oldEnd }, bar) => {
      bar[barStart.value] = oldStart
      bar[barEnd.value] = oldEnd
    })
  }

  return {
    initDragOfBar,
    initDragOfBundle,
    snapBackMovedBars,
    handleDrag,
    getConnectedBars: movement.findConnectedBars
  }
}

export default useBarDragManagement
