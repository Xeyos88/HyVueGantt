import type { ColorScheme } from "./style"

export type ImportFormat = "jira" | "csv"

export interface ImportOptions {
  format: ImportFormat
  dateFormat?: string | boolean
  mapFields?: Record<string, string>
  skipValidation?: boolean
  onProgress?: (progress: number) => void
  colorScheme?: ColorScheme
}

export interface ImportResult {
  success: boolean
  data?: {
    rows: any[]
    chartStart?: string | Date
    chartEnd?: string | Date
  }
  error?: string
  warnings?: string[]
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: string
    issuetype: {
      name: string
      iconUrl: string
    }
    created: string
    updated: string
    duedate?: string
    parent?: {
      id: string
      key: string
    }
    status: {
      name: string
    }
    priority?: {
      name: string
    }
    assignee?: {
      displayName: string
    }
    subtasks?: JiraIssue[]
    issuelinks?: Array<{
      type: {
        name: string
        inward: string
        outward: string
      }
      inwardIssue?: {
        id: string
        key: string
      }
      outwardIssue?: {
        id: string
        key: string
      }
    }>
    [key: string]: any
  }
}

export interface JiraData {
  issues: JiraIssue[]
  [key: string]: any
}

export interface SpreadsheetRow {
  id?: string | number
  name?: string
  summary?: string
  startDate?: string
  endDate?: string
  duration?: string | number
  progress?: string | number
  parentId?: string | number
  dependencies?: string
  milestone?: boolean | string
  [key: string]: any
}
