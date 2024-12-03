import type * as CSS from "csstype"

type Color = CSS.DataType.Color

export interface ColorScheme {
  primary: Color
  secondary: Color
  ternary: Color
  quartenary: Color
  hoverHighlight: Color
  markerCurrentTime: Color
  text: Color
  background: Color
  toast?: Color
  commands?: Color
  rangeHighlight?: Color
}
