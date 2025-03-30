export interface ExportOptions {
  format: "pdf" | "png" | "svg" | "excel"
  quality?: number
  timeRange?: { start: Date; end: Date }
  filename?: string
  paperSize?: "a4" | "a3" | "letter" | "legal"
  orientation?: "portrait" | "landscape"
  scale?: number
  margin?: number
}

export interface ExportResult {
  success: boolean
  data: Blob | null
  error?: string
  filename: string
}
