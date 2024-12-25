import type { ColorScheme } from "./types"

export const colorSchemes: Record<string, ColorScheme> = {
  default: {
    primary: "#eeeeee",
    secondary: "#E0E0E0",
    ternary: "#F5F5F5",
    quartenary: "#ededed",
    hoverHighlight: "rgba(204, 216, 219, 0.5)",
    markerCurrentTime: "#000",
    text: "#404040",
    background: "white",
    commands: "#eeeeee",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  creamy: {
    primary: "#ffe8d9",
    secondary: "#fcdcc5",
    ternary: "#fff6f0",
    quartenary: "#f7ece6",
    hoverHighlight: "rgba(230, 221, 202, 0.5)",
    markerCurrentTime: "#000",
    text: "#542d05",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  crimson: {
    primary: "#a82039",
    secondary: "#c41238",
    ternary: "#db4f56",
    quartenary: "#ce5f64",
    hoverHighlight: "rgba(196, 141, 141, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },
  dark: {
    primary: "#404040",
    secondary: "#303030",
    ternary: "#353535",
    quartenary: "#383838",
    hoverHighlight: "rgba(159, 160, 161, 0.5)",
    markerCurrentTime: "#fff",
    text: "white",
    background: "#525252",
    toast: "#1f1f1f",
    commands: "#525252",
    rangeHighlight: "#000",
    holidayHighlight: "#ff9d3b"
  },

  flare: {
    primary: "#e08a38",
    secondary: "#e67912",
    ternary: "#5e5145",
    quartenary: "#665648",
    hoverHighlight: "rgba(196, 141, 141, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  fuchsia: {
    primary: "#de1d5a",
    secondary: "#b50b41",
    ternary: "#ff7da6",
    quartenary: "#f2799f",
    hoverHighlight: "rgba(196, 141, 141, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  grove: {
    primary: "#3d9960",
    secondary: "#288542",
    ternary: "#72b585",
    quartenary: "#65a577",
    hoverHighlight: "rgba(160, 219, 171, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  "material-blue": {
    primary: "#0D47A1",
    secondary: "#1565C0",
    ternary: "#42a5f5",
    quartenary: "#409fed",
    hoverHighlight: "rgba(110, 165, 196, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  sky: {
    primary: "#b5e3ff",
    secondary: "#a1d6f7",
    ternary: "#d6f7ff",
    quartenary: "#d0edf4",
    hoverHighlight: "rgba(193, 202, 214, 0.5)",
    markerCurrentTime: "#000",
    text: "#022c47",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  slumber: {
    primary: "#2a2f42",
    secondary: "#2f3447",
    ternary: "#35394d",
    quartenary: "#2c3044",
    hoverHighlight: "rgba(179, 162, 127, 0.5)",
    markerCurrentTime: "#fff",
    text: "#ffe0b3",
    background: "#38383b",
    toast: "#1f1f1f",
    commands: "#38383b",
    rangeHighlight: "#000",
    holidayHighlight: "rgba(240, 120, 96, 0.8)"
  },

  vue: {
    primary: "#258a5d",
    secondary: "#41B883",
    ternary: "#35495E",
    quartenary: "#2a3d51",
    hoverHighlight: "rgba(160, 219, 171, 0.5)",
    markerCurrentTime: "#000",
    text: "white",
    background: "white",
    commands: "white",
    rangeHighlight: "#000",
    holidayHighlight: "#f7842d"
  }
}

export type ColorSchemeKey = keyof typeof colorSchemes

export default colorSchemes
