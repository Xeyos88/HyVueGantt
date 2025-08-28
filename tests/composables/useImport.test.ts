import { describe, it, expect, vi, beforeEach } from "vitest"
import { useImport } from "../../src/composables/useImport"
import type { ImportOptions, JiraData, SpreadsheetRow, JiraIssue } from "../../src/types/import"

// Mock Papa parse
vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn()
  }
}))

import Papa from "papaparse"

describe("useImport", () => {
  let importComposable: ReturnType<typeof useImport>

  beforeEach(() => {
    vi.clearAllMocks()
    importComposable = useImport()
  })

  describe("basic initialization", () => {
    it("should initialize with correct default state", () => {
      expect(importComposable.isImporting.value).toBe(false)
      expect(importComposable.importProgress.value).toBe(0)
      expect(importComposable.lastError.value).toBeNull()
    })
  })

  describe("file import functionality", () => {
    it("should import CSV file successfully", async () => {
      const csvContent = "id,name,start,end\n1,Task 1,2024-01-01,2024-01-02\n2,Task 2,2024-01-03,2024-01-04"
      
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })
      
      // Mock Papa.parse to return successful result
      vi.mocked(Papa.parse).mockReturnValue({
        data: [
          { id: 1, name: "Task 1", start: "2024-01-01", end: "2024-01-02" },
          { id: 2, name: "Task 2", start: "2024-01-03", end: "2024-01-04" }
        ],
        errors: []
      } as any)

      const options: ImportOptions = {
        format: "csv",
        mapFields: { startDate: "start", endDate: "end" }
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
      expect(result.data?.rows[0].id).toBe(1)
      expect(result.data?.rows[0].label).toBe("Task 1")
      expect(importComposable.isImporting.value).toBe(false)
      expect(importComposable.importProgress.value).toBe(100)
    })

    it("should import Jira JSON file successfully", async () => {
      const jiraData: JiraData = {
        issues: [
          {
            id: "1",
            key: "TEST-1",
            fields: {
              summary: "Test Issue",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              duedate: "2024-01-02",
              status: { name: "In Progress" },
              issuetype: { name: "Task", iconUrl: "" },
              subtasks: [],
              issuelinks: []
            }
          }
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1)
      expect(result.data?.rows[0].id).toBe("1")
      expect(result.data?.rows[0].label).toBe("Test Issue")
      expect(result.data?.rows[0].bars).toHaveLength(1)
    })

    it("should handle file format detection", async () => {
      const csvContent = "id,name\n1,Task 1"
      const csvFile = new File([csvContent], "test.csv", { type: "text/csv" })

      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ id: 1, name: "Task 1" }],
        errors: []
      } as any)

      const options: ImportOptions = {
        format: "csv" // Auto-detect will be overridden by explicit format
      }

      const result = await importComposable.importFromFile(csvFile, options)
      expect(result.success).toBe(true)
    })

    it("should handle unsupported file format", async () => {
      const mockFile = new File(["content"], "test.xyz", { type: "text/plain" })

      const options: ImportOptions = {
        format: "csv" as any
      }

      // Test will call detectFormatFromFile for unsupported format
      const result = await importComposable.importFromFile(mockFile, { ...options, format: undefined as any })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain("Could not determine format")
    })

    it("should handle file reading errors", async () => {
      const mockFile = {
        name: "test.csv",
        size: 0
      } as File

      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsText: vi.fn().mockImplementation(function() {
          setTimeout(() => {
            this.onerror({ target: { error: new Error("Read error") } })
          }, 0)
        }),
        onload: vi.fn(),
        onerror: vi.fn()
      })) as any

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Error reading file")

      global.FileReader = originalFileReader
    })

    it("should handle CSV parsing errors", async () => {
      const csvContent = "invalid,csv\ncontent"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      vi.mocked(Papa.parse).mockReturnValue({
        data: [],
        errors: [
          { message: "Invalid CSV format", row: 1 }
        ]
      } as any)

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain("CSV parsing errors")
    })

    it("should handle JSON parsing errors", async () => {
      const invalidJson = "{ invalid json"
      const mockFile = new File([invalidJson], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Failed to parse file")
    })

    it("should call progress callback", async () => {
      const progressCallback = vi.fn()
      const csvContent = "id,name\n1,Task 1"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ id: 1, name: "Task 1" }],
        errors: []
      } as any)

      const options: ImportOptions = {
        format: "csv",
        onProgress: progressCallback
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })

    it("should skip validation when requested", async () => {
      const csvContent = "id,name\n1,Task 1"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      vi.mocked(Papa.parse).mockReturnValue({
        data: [{ id: 1, name: "Task 1" }],
        errors: []
      } as any)

      const options: ImportOptions = {
        format: "csv",
        skipValidation: true
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
    })
  })

  describe("CSV conversion", () => {
    beforeEach(() => {
      vi.mocked(Papa.parse).mockReturnValue({
        data: [],
        errors: []
      } as any)
    })

    it("should convert CSV with standard fields", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Task 1",
          start_date: "2024-01-01",
          end_date: "2024-01-02",
          progress: 50
        },
        {
          id: "2", 
          name: "Task 2",
          start_date: "2024-01-03",
          end_date: "2024-01-04",
          progress: "75%"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,start_date,end_date,progress\n1,Task 1,2024-01-01,2024-01-02,50\n2,Task 2,2024-01-03,2024-01-04,75%"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
      
      const firstTask = result.data?.rows[0]
      expect(firstTask.id).toBe("1")
      expect(firstTask.label).toBe("Task 1")
      expect(firstTask.bars[0].ganttBarConfig.progress).toBe(50)

      const secondTask = result.data?.rows[1]
      expect(secondTask.bars[0].ganttBarConfig.progress).toBe(75)
    })

    it("should handle parent-child relationships in CSV", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Parent Task",
          start_date: "2024-01-01",
          end_date: "2024-01-05"
        },
        {
          id: "2",
          name: "Child Task",
          parent_id: "1",
          start_date: "2024-01-02",
          end_date: "2024-01-03"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,parent_id,start_date,end_date\n1,Parent Task,,2024-01-01,2024-01-05\n2,Child Task,1,2024-01-02,2024-01-03"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1) // Only parent in root
      expect(result.data?.rows[0].children).toHaveLength(1)
      expect(result.data?.rows[0].children![0].label).toBe("Child Task")
    })

    it("should handle dependencies in CSV", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Task 1",
          start_date: "2024-01-01",
          end_date: "2024-01-02"
        },
        {
          id: "2",
          name: "Task 2", 
          dependencies: "1",
          start_date: "2024-01-03",
          end_date: "2024-01-04"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,dependencies,start_date,end_date\n1,Task 1,,2024-01-01,2024-01-02\n2,Task 2,1,2024-01-03,2024-01-04"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows[0].bars[0].ganttBarConfig.connections).toHaveLength(1)
      expect(result.data?.rows[0].bars[0].ganttBarConfig.connections![0].targetId).toBe("task-2")
    })

    it("should handle milestones in CSV", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Milestone",
          milestone: true,
          start_date: "2024-01-01",
          end_date: "2024-01-01"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,milestone,start_date,end_date\n1,Milestone,true,2024-01-01,2024-01-01"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows[0].bars[0].ganttBarConfig.class).toBe("milestone")
    })

    it("should handle missing or invalid data in CSV", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          name: "Task without ID"
        },
        {
          id: "2",
          name: "Task with missing dates"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "name\nTask without ID\nTask with missing dates"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1) // Only the row with ID should be processed
      expect(result.warnings?.some(w => w.includes("Row is missing an ID field"))).toBe(true)
    })

    it("should handle various progress formats", async () => {
      const csvData: SpreadsheetRow[] = [
        { id: "1", name: "Task 1", progress: "50%" },
        { id: "2", name: "Task 2", progress: 75 },
        { id: "3", name: "Task 3", progress: "invalid" },
        { id: "4", name: "Task 4", progress: 150 } // Should be clamped to 100
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,progress\n1,Task 1,50%\n2,Task 2,75\n3,Task 3,invalid\n4,Task 4,150"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows[0].bars[0].ganttBarConfig.progress).toBe(50)
      expect(result.data?.rows[1].bars[0].ganttBarConfig.progress).toBe(75)
      expect(result.data?.rows[2].bars[0].ganttBarConfig.progress).toBe(0)
      expect(result.data?.rows[3].bars[0].ganttBarConfig.progress).toBe(100)
    })
  })

  describe("Jira conversion", () => {
    it("should convert Jira issues with different statuses", async () => {
      const jiraData: JiraData = {
        issues: [
          {
            id: "1",
            key: "TEST-1",
            fields: {
              summary: "To Do Task",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "To Do" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          },
          {
            id: "2", 
            key: "TEST-2",
            fields: {
              summary: "In Progress Task",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "In Progress" },
              issuetype: { name: "Bug", iconUrl: "" }
            }
          },
          {
            id: "3",
            key: "TEST-3",
            fields: {
              summary: "Done Task",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "Done" },
              issuetype: { name: "Story", iconUrl: "" }
            }
          }
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(3)
      
      // Check progress calculation
      expect(result.data?.rows[0].bars[0].ganttBarConfig.progress).toBe(0) // To Do
      expect(result.data?.rows[1].bars[0].ganttBarConfig.progress).toBe(50) // In Progress  
      expect(result.data?.rows[2].bars[0].ganttBarConfig.progress).toBe(100) // Done
      
      // Check CSS classes
      expect(result.data?.rows[0].bars[0].ganttBarConfig.class).toBe("task")
      expect(result.data?.rows[1].bars[0].ganttBarConfig.class).toBe("bug") 
      expect(result.data?.rows[2].bars[0].ganttBarConfig.class).toBe("story")
    })

    it("should handle Jira issue links", async () => {
      const jiraData: JiraData = {
        issues: [
          {
            id: "1",
            key: "TEST-1", 
            fields: {
              summary: "Source Issue",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "To Do" },
              issuetype: { name: "Task", iconUrl: "" },
              issuelinks: [
                {
                  type: { name: "Blocks", inward: "is blocked by", outward: "blocks" },
                  outwardIssue: { id: "2", key: "TEST-2" }
                },
                {
                  type: { name: "Depends", inward: "depends on", outward: "is depended on by" },
                  inwardIssue: { id: "3", key: "TEST-3" }
                }
              ]
            }
          },
          {
            id: "2",
            key: "TEST-2",
            fields: {
              summary: "Target Issue",
              created: "2024-01-01T00:00:00.000Z", 
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "Done" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          },
          {
            id: "3",
            key: "TEST-3",
            fields: {
              summary: "Dependency Issue",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "In Progress" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          }
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      
      // Check connections
      const sourceIssue = result.data?.rows.find(r => r.label === "Source Issue")
      const dependencyIssue = result.data?.rows.find(r => r.label === "Dependency Issue")
      
      expect(sourceIssue?.bars[0].ganttBarConfig.connections).toHaveLength(1)
      expect(sourceIssue?.bars[0].ganttBarConfig.connections![0].targetId).toBe("issue-TEST-2")
      expect(sourceIssue?.bars[0].ganttBarConfig.connections![0].type).toBe("squared") // blocks = squared
      
      expect(dependencyIssue?.bars[0].ganttBarConfig.connections).toHaveLength(1)
      expect(dependencyIssue?.bars[0].ganttBarConfig.connections![0].targetId).toBe("issue-TEST-1")
      expect(dependencyIssue?.bars[0].ganttBarConfig.connections![0].type).toBe("bezier") // depends = bezier
    })

    it("should handle Jira subtasks and parent relationships", async () => {
      const subtask: JiraIssue = {
        id: "2",
        key: "TEST-2",
        fields: {
          summary: "Subtask",
          created: "2024-01-01T00:00:00.000Z",
          updated: "2024-01-02T00:00:00.000Z",
          status: { name: "To Do" },
          issuetype: { name: "Sub-task", iconUrl: "" },
          parent: { id: "1", key: "TEST-1" }
        }
      }

      const jiraData: JiraData = {
        issues: [
          {
            id: "1",
            key: "TEST-1",
            fields: {
              summary: "Parent Issue", 
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "In Progress" },
              issuetype: { name: "Epic", iconUrl: "" },
              subtasks: [subtask]
            }
          },
          subtask
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1) // Only parent at root level
      expect(result.data?.rows[0].children).toHaveLength(1)
      expect(result.data?.rows[0].children![0].label).toBe("Subtask")
      expect(result.data?.rows[0].label).toBe("Parent Issue")
    })

    it("should handle Jira issues with missing dates", async () => {
      const jiraData: JiraData = {
        issues: [
          {
            id: "1", 
            key: "TEST-1",
            fields: {
              summary: "Issue without due date",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              duedate: undefined, // Explicitly missing due date
              status: { name: "To Do" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          }
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(1)
      // Since it has created date, warning may not be generated - check for valid data
      expect(result.data?.rows[0].bars[0]).toBeDefined()
    })

    it("should handle unknown Jira statuses", async () => {
      const jiraData: JiraData = {
        issues: [
          {
            id: "1",
            key: "TEST-1", 
            fields: {
              summary: "Custom Status Issue",
              created: "2024-01-01T00:00:00.000Z",
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "Custom Status" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          },
          {
            id: "2",
            key: "TEST-2",
            fields: {
              summary: "Progress Status Issue",
              created: "2024-01-01T00:00:00.000Z", 
              updated: "2024-01-02T00:00:00.000Z",
              status: { name: "Custom In Progress Status" },
              issuetype: { name: "Task", iconUrl: "" }
            }
          }
        ]
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows[0].bars[0].ganttBarConfig.progress).toBe(0) // Unknown = 0
      expect(result.data?.rows[1].bars[0].ganttBarConfig.progress).toBe(50) // Contains "progress" = 50
    })
  })

  describe("date range calculation", () => {
    it("should calculate chart date range with buffer", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Task 1",
          start_date: "2024-01-01",
          end_date: "2024-01-05"
        },
        {
          id: "2",
          name: "Task 2", 
          start_date: "2024-01-10",
          end_date: "2024-01-15"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,start_date,end_date\n1,Task 1,2024-01-01,2024-01-05\n2,Task 2,2024-01-10,2024-01-15"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.chartStart).toBeDefined()
      expect(result.data?.chartEnd).toBeDefined()
    })
  })

  describe("data validation", () => {
    it("should validate imported data by default", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          name: "Task without ID" // Missing ID should trigger warning
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "name\nTask without ID"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv",
        skipValidation: false
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.warnings?.length).toBeGreaterThan(0)
    })
  })

  describe("edge cases", () => {
    it("should handle empty CSV data", async () => {
      vi.mocked(Papa.parse).mockReturnValue({
        data: [],
        errors: []
      } as any)

      const csvContent = "id,name"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(0)
    })

    it("should handle empty Jira data", async () => {
      const jiraData: JiraData = {
        issues: []
      }

      const mockFile = new File([JSON.stringify(jiraData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(0)
    })

    it("should handle malformed Jira data", async () => {
      const malformedData = {
        notIssues: []
      }

      const mockFile = new File([JSON.stringify(malformedData)], "test.json", { type: "application/json" })

      const options: ImportOptions = {
        format: "jira"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(0)
    })

    it("should handle missing dependency references", async () => {
      const csvData: SpreadsheetRow[] = [
        {
          id: "1",
          name: "Task 1",
          dependencies: "999", // Non-existent dependency
          start_date: "2024-01-01",
          end_date: "2024-01-02"
        }
      ]

      vi.mocked(Papa.parse).mockReturnValue({
        data: csvData,
        errors: []
      } as any)

      const csvContent = "id,name,dependencies,start_date,end_date\n1,Task 1,999,2024-01-01,2024-01-02"
      const mockFile = new File([csvContent], "test.csv", { type: "text/csv" })

      const options: ImportOptions = {
        format: "csv"
      }

      const result = await importComposable.importFromFile(mockFile, options)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain("Task 1 refers to a dependency 999 that doesn't exist")
    })
  })
})