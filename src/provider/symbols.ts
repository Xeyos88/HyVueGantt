import type { InjectionKey, Ref } from "vue"

import type { GGanttBooleanConfig, GGanttChartConfig, GanttBarObject } from "../types"

export type EmitBarEvent = (
  e: MouseEvent,
  bar: GanttBarObject,
  datetime?: string | Date,
  movedBars?: Map<GanttBarObject, { oldStart: string; oldEnd: string }>
) => void

export const CONFIG_KEY = Symbol("CONFIG_KEY") as InjectionKey<GGanttChartConfig>
export const BOOLEAN_KEY = Symbol("BOOLEAN_KEY") as InjectionKey<GGanttBooleanConfig>
export const EMIT_BAR_EVENT_KEY = Symbol("EMIT_BAR_EVENT_KEY") as InjectionKey<EmitBarEvent>
export const BAR_CONTAINER_KEY = Symbol("BAR_CONTAINER_KEY") as InjectionKey<
  Ref<HTMLElement | null>
>
export const GANTT_ID_KEY = Symbol("GANTT_ID_KEY") as InjectionKey<string>
