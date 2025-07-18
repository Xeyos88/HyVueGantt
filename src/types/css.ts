export interface GanttCSSProperties {
  // Layout
  width?: string | number
  height?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  minHeight?: string | number
  maxHeight?: string | number

  // Positioning
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky"
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  zIndex?: number

  // Display
  display?: string
  opacity?: number
  visibility?: "visible" | "hidden" | "collapse"
  overflow?: "visible" | "hidden" | "scroll" | "auto"

  // Flexbox
  flex?: string | number
  flexGrow?: number
  flexShrink?: number
  flexBasis?: string | number
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse"
  justifyContent?: string
  alignItems?: string

  // Spacing
  margin?: string | number
  marginTop?: string | number
  marginRight?: string | number
  marginBottom?: string | number
  marginLeft?: string | number
  padding?: string | number
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number

  // Colors
  color?: string
  backgroundColor?: string
  background?: string

  // Borders
  border?: string
  borderRadius?: string | number
  borderWidth?: string | number
  borderColor?: string
  borderStyle?: string

  // Typography
  fontSize?: string | number
  fontWeight?: string | number
  fontFamily?: string
  lineHeight?: string | number
  textAlign?: "left" | "right" | "center" | "justify"
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"

  // Other common properties
  cursor?: string
  pointerEvents?: "auto" | "none"
  transition?: string
  transform?: string

  overflowX?: "visible" | "hidden" | "scroll" | "auto"
  overflowY?: "visible" | "hidden" | "scroll" | "auto"
}

export type GanttColor = string
