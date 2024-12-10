import provideConfig from "../provider/provideConfig"
import type { GanttBarObject } from "../types/bar"
import provideGetChartRows from "../provider/provideGetChartRows"
import provideEmitBarEvent from "../provider/provideEmitBarEvent"
import useDayjsHelper from "./useDayjsHelper"
import createBarDrag from "./createBarDrag"
// Types for better typing and code organization
type DragState = {
  movedBars: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
  isDragging: boolean
}

type BarMovement = {
  bar: GanttBarObject
  minutes: number
  direction: "left" | "right"
}

type OverlapResult = {
  overlapBar?: GanttBarObject
  overlapType: "left" | "right" | "between" | null
}

// Main hook for drag and drop management
const useBarDragManagement = () => {
  const config = provideConfig()
  const getChartRows = provideGetChartRows()
  const emitBarEvent = provideEmitBarEvent()
  const { pushOnOverlap, pushOnConnect, barStart, barEnd, noOverlap, dateFormat } = config

  // Central state management for drag operations
  const dragState: DragState = {
    movedBars: new Map(),
    isDragging: false
  }

  const { toDayjs, format } = useDayjsHelper()

  // Initialize drag for a single bar
  const initDragOfBar = (bar: GanttBarObject, e: MouseEvent) => {
    const dragHandler = createDragHandler(bar)
    dragHandler.initiateDrag(e)
    addBarToMovedBars(bar)
    emitBarEvent({ ...e, type: "dragstart" }, bar)
  }

  // Initialize drag for a bundle of bars
  const initDragOfBundle = (mainBar: GanttBarObject, e: MouseEvent) => {
    const bundle = mainBar.ganttBarConfig.bundle
    if (!bundle) return

    const getBundleBars = () =>
      getChartRows()
        .flatMap((row) => row.bars)
        .filter((bar) => bar.ganttBarConfig.bundle === bundle)

    getBundleBars().forEach((bar) => {
      const isMainBar = bar === mainBar
      const dragHandler = createDragHandler(bar, isMainBar)
      dragHandler.initiateDrag(e)
      addBarToMovedBars(bar)
    })

    emitBarEvent({ ...e, type: "dragstart" }, mainBar)
  }

  // Create handler for drag events
  const createDragHandler = (bar: GanttBarObject, isMainBar = true) => ({
    initiateDrag: (e: MouseEvent) => {
      const { initDrag } = createBarDrag(
        bar,
        (e) => handleDrag(e, bar),
        isMainBar ? handleDragEnd : () => null,
        config
      )
      initDrag(e)
    }
  })

  // Handle ongoing drag operations
  const handleDrag = (e: MouseEvent, bar: GanttBarObject) => {
    emitBarEvent({ ...e, type: "drag" }, bar)
    if (pushOnOverlap?.value && pushOnConnect?.value) {
      const barsToProcess = [bar]
      const processedBars = new Set<string>([bar.ganttBarConfig.id])

      while (barsToProcess.length > 0) {
        const currentBar = barsToProcess.shift()!

        handleOverlaps(currentBar)
        handleOverlapsConnect(currentBar)

        const connectedBars = getConnectedBars(currentBar)
        connectedBars.forEach((connectedBar) => {
          if (!processedBars.has(connectedBar.ganttBarConfig.id)) {
            processedBars.add(connectedBar.ganttBarConfig.id)
            barsToProcess.push(connectedBar)
          }
        })
      }
    } else if (pushOnOverlap?.value) {
      handleOverlaps(bar)
    } else if (pushOnConnect?.value) {
      handleOverlapsConnect(bar)
    }
  }

  // Manage overlapping bars during drag
  const handleOverlaps = (bar: GanttBarObject) => {
    let currentBar = bar
    let overlap = detectOverlap(currentBar)

    while (overlap.overlapBar) {
      const adjustedBar = adjustOverlappingBar(currentBar, overlap)
      if (!adjustedBar) break

      currentBar = adjustedBar
      overlap = detectOverlap(currentBar)
    }
  }

  const handleOverlapsConnect = (bar: GanttBarObject) => {
    let currentBar = bar
    let overlap = detectOverlapConnect(currentBar)

    while (overlap.overlapBar) {
      const adjustedBar = adjustOverlappingBar(currentBar, overlap)
      if (!adjustedBar) break

      currentBar = adjustedBar
      overlap = detectOverlapConnect(currentBar)
    }
  }

  const getConnectedBars = (bar: GanttBarObject): GanttBarObject[] => {
    const connectedBars: GanttBarObject[] = []
    const allBars = getChartRows().flatMap((row) => row.bars)

    bar.ganttBarConfig.connections?.forEach((conn) => {
      const targetBar = allBars.find((b) => b.ganttBarConfig.id === conn.targetId)
      if (targetBar) connectedBars.push(targetBar)
    })

    allBars.forEach((otherBar) => {
      otherBar.ganttBarConfig.connections?.forEach((conn) => {
        if (conn.targetId === bar.ganttBarConfig.id && !connectedBars.includes(otherBar)) {
          connectedBars.push(otherBar)
        }
      })
    })

    return connectedBars
  }

  

  const detectOverlapConnect = (bar: GanttBarObject): OverlapResult => {
    const barsInRow = getConnectedBars(bar)

    for (const otherBar of barsInRow) {
      if (otherBar === bar) continue

      const overlapType = determineOverlapType(bar, otherBar)
      if (overlapType) {
        return { overlapBar: otherBar, overlapType }
      }
    }

    return { overlapType: null }
  }

  // Detect if and how bars overlap
  const detectOverlap = (bar: GanttBarObject): OverlapResult => {
    let barsInRow = getChartRows().find((row) => row.bars.includes(bar))?.bars || []
    if (pushOnConnect.value) {
      barsInRow = [...barsInRow, ...getConnectedBars(bar)]
    }    


    for (const otherBar of barsInRow) {
      if (otherBar === bar) continue

      const overlapType = determineOverlapType(bar, otherBar)
      if (overlapType) {
        return { overlapBar: otherBar, overlapType }
      }
    }

    return { overlapType: null }
  }

  // Determine the type of overlap between two bars
  const determineOverlapType = (bar1: GanttBarObject, bar2: GanttBarObject) => {
    const start1 = toDayjs(bar1[barStart.value])
    const end1 = toDayjs(bar1[barEnd.value])
    const start2 = toDayjs(bar2[barStart.value])
    const end2 = toDayjs(bar2[barEnd.value])

    if (start1.isBetween(start2, end2)) return "left"
    if (end1.isBetween(start2, end2)) return "right"
    if (start2.isBetween(start1, end1) || end2.isBetween(start1, end1)) return "between"

    return null
  }

  // Adjust bar positions when overlap is detected
  const adjustOverlappingBar = (currentBar: GanttBarObject, overlap: OverlapResult) => {
    if (!overlap.overlapBar || !overlap.overlapType) return null

    const adjustment = calculateBarMovement(currentBar, overlap.overlapBar, overlap.overlapType)
    applyBarAdjustment(overlap.overlapBar, adjustment)

    if (overlap.overlapBar.ganttBarConfig.bundle) {
      adjustBundleBars(overlap.overlapBar, adjustment)
    }

    return overlap.overlapBar
  }

  // Calculate the required movement to resolve overlap
  const calculateBarMovement = (
    currentBar: GanttBarObject,
    overlapBar: GanttBarObject,
    type: string
  ): BarMovement => {
    const currentStart = toDayjs(currentBar[barStart.value])
    const currentEnd = toDayjs(currentBar[barEnd.value])
    const overlapStart = toDayjs(overlapBar[barStart.value])
    const overlapEnd = toDayjs(overlapBar[barEnd.value])

    if (type === "left") {
      const minutes = overlapEnd.diff(currentStart, "minutes", true)
      return { bar: overlapBar, minutes, direction: "left" }
    }

    const minutes = currentEnd.diff(overlapStart, "minutes", true)
    return { bar: overlapBar, minutes, direction: "right" }
  }

  // Apply movement adjustment to a bar
  const applyBarAdjustment = (bar: GanttBarObject, adjustment: BarMovement) => {
    addBarToMovedBars(bar)

    const timeAdjustment =
      adjustment.direction === "left"
        ? (time: string) => toDayjs(time).subtract(adjustment.minutes, "minutes")
        : (time: string) => toDayjs(time).add(adjustment.minutes, "minutes")

    bar[barStart.value] = format(timeAdjustment(bar[barStart.value]), dateFormat.value)
    bar[barEnd.value] = format(timeAdjustment(bar[barEnd.value]), dateFormat.value)
  }

  // Adjust all bars in a bundle
  const adjustBundleBars = (sourceBar: GanttBarObject, adjustment: BarMovement) => {
    const bundle = sourceBar.ganttBarConfig.bundle
    if (!bundle) return

    getChartRows().forEach((row) => {
      row.bars.forEach((bar) => {
        if (bar.ganttBarConfig.bundle === bundle && bar !== sourceBar) {
          addBarToMovedBars(bar)
          applyBarAdjustment(bar, adjustment)
        }
      })
    })
  }

  // Handle the end of a drag operation
  const handleDragEnd = (e: MouseEvent, bar: GanttBarObject) => {
    if (shouldSnapBack()) {
      snapBackMovedBars()
    }

    emitBarEvent({ ...e, type: "dragend" }, bar, undefined, new Map(dragState.movedBars))

    dragState.movedBars.clear()
    dragState.isDragging = false
  }

  // Add a bar to the moved bars tracking
  const addBarToMovedBars = (bar: GanttBarObject) => {
    if (!dragState.movedBars.has(bar)) {
      dragState.movedBars.set(bar, {
        oldStart: bar[barStart.value],
        oldEnd: bar[barEnd.value]
      })
    }
  }

  // Check if bars should snap back to original positions
  const shouldSnapBack = () => {
    if (pushOnOverlap.value || !noOverlap.value) return false

    return Array.from(dragState.movedBars.keys()).some((bar) => {
      const { overlapBar } = detectOverlap(bar)
      return overlapBar != null
    })
  }

  // Reset all moved bars to their original positions
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
    shouldSnapBack,
    handleOverlaps
  }
}

export default useBarDragManagement
