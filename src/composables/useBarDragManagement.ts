import provideConfig from "../provider/provideConfig"
import type { GanttBarObject } from "../types/bar"
import provideEmitBarEvent from "../provider/provideEmitBarEvent"
import useDayjsHelper from "./useDayjsHelper"
import createBarDrag from "./createBarDrag"
import { useBarMovement } from "./useBarMovement"
import { inject } from "vue"
import type { UseRowsReturn } from "./useRows"
import { GANTT_ID_KEY } from "../provider/symbols"

/**
 * Interface representing the current state of drag operations
 */
type DragState = {
  movedBars: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
  isDragging: boolean
}

/**
 * A composable that manages bar drag operations in the Gantt chart
 * Handles initialization, movement, and state management for drag operations
 * @returns Object containing methods to manage bar dragging
 */
const useBarDragManagement = () => {
  const config = provideConfig()
  const emitBarEvent = provideEmitBarEvent()
  const dayjs = useDayjsHelper(config)
  const { barStart, barEnd } = config
  const rowManager = inject<UseRowsReturn>("useRows")!
  const ganttId = inject<string>(GANTT_ID_KEY)
  const movement = useBarMovement(config, rowManager, dayjs)

  /**
   * State object tracking currently dragged bars and their original positions
   */
  const dragState: DragState = {
    movedBars: new Map(),
    isDragging: false
  }

  const getBundleBars = (bundle?: string) => {
    const res: GanttBarObject[] = []
    if (bundle != null) {
      const allBars = movement.getAllBars()
      allBars.forEach((bar) => {
        if (bar.ganttBarConfig.bundle === bundle) {
          res.push(bar)
        }
      })
    }
    return res
  }

  /**
   * Initializes drag operation for a single bar
   * @param bar - Bar to initialize drag for
   * @param e - Mouse event that triggered the drag
   */
  const initDragOfBar = (bar: GanttBarObject, e: MouseEvent) => {
    if (bar.ganttBarConfig.bundle) {
      initDragOfBundle(bar, e)
      return
    }

    const dragHandler = createDragHandler(bar)
    dragHandler.initiateDrag(e)
    addBarToMovedBars(bar)
    emitBarEvent({ ...e, type: "dragstart" }, bar)
  }

  /**
   * Initializes drag operation for a bundle of bars
   * All bars in the bundle will move together
   * @param mainBar - Primary bar triggering the bundle drag
   * @param e - Mouse event that triggered the drag
   */
  const initDragOfBundle = (mainBar: GanttBarObject, e: MouseEvent) => {
    const bundle = mainBar.ganttBarConfig.bundle
    if (!bundle) return

    const bundleBars = getBundleBars(bundle)
    bundleBars.forEach((bar) => {
      const isMainBar = bar === mainBar
      const dragHandler = createDragHandler(bar, isMainBar)
      dragHandler.initiateDrag(e)
      addBarToMovedBars(bar)
    })

    emitBarEvent({ ...e, type: "dragstart" }, mainBar)
  }

  /**
   * Creates a drag handler for a specific bar
   * @param bar - Bar to create handler for
   * @param isMainBar - Whether this is the primary bar in a bundle
   * @returns Object containing drag initialization method
   */
  const createDragHandler = (bar: GanttBarObject, isMainBar = true) => ({
    initiateDrag: (e: MouseEvent) => {
      const { initDrag } = createBarDrag(
        bar,
        (e) => handleDrag(e, bar),
        isMainBar ? handleDragEnd : () => null,
        config,
        movement,
        ganttId!
      )
      initDrag(e)
    }
  })

  /**
   * Handles ongoing drag operations
   * Updates bar positions and emits drag events
   * @param e - Mouse event during drag
   * @param bar - Bar being dragged
   */
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

  /**
   * Handles the end of drag operations
   * Finalizes positions and emits dragend events
   * @param e - Mouse event at drag end
   * @param bar - Bar that was dragged
   */
  const handleDragEnd = (e: MouseEvent, bar: GanttBarObject) => {
    emitBarEvent({ ...e, type: "dragend" }, bar, undefined, new Map(dragState.movedBars))
    dragState.movedBars.clear()
    dragState.isDragging = false
  }

  /**
   * Adds a bar to the tracking map of moved bars
   * Stores original position for potential rollback
   * @param bar - Bar to track
   */
  const addBarToMovedBars = (bar: GanttBarObject) => {
    if (!dragState.movedBars.has(bar)) {
      dragState.movedBars.set(bar, {
        oldStart: bar[barStart.value],
        oldEnd: bar[barEnd.value]
      })
    }
  }

  /**
   * Reverts all moved bars to their original positions
   * Used when a drag operation fails
   */
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
