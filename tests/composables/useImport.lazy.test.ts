import { describe, expect, it, vi } from "vitest"
import { useImport } from "../../src/composables/useImport"
const { loaded } = vi.hoisted(() => ({ loaded: vi.fn() }))
vi.mock("papaparse", async () => {
  loaded()
  return await vi.importActual("papaparse")
})

describe("CSV parser loading", () => {
  it("does not load the parser on initialization or Jira import", async () => {
    const importer = useImport()
    expect(loaded).not.toHaveBeenCalled()
    const result = await importer.importFromFile(new File(['{"issues":[]}'], "jira.json"), {
      format: "jira"
    })
    expect(result.success).toBe(true)
    expect(loaded).not.toHaveBeenCalled()
  })

  it("loads the real parser on CSV import and preserves quoted fields", async () => {
    const importer = useImport()
    const file = new File(
      ['id,name,start,end\n1,"Plan, review",2026-01-01,2026-01-03'],
      "tasks.csv"
    )
    const result = await importer.importFromFile(file, { format: "csv" })
    expect(loaded).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(result.data?.rows[0].label).toBe("Plan, review")
    expect(importer.isImporting.value).toBe(false)
    const second = await importer.importFromFile(file, { format: "csv" })
    expect(second.success).toBe(true)
    expect(loaded).toHaveBeenCalledTimes(1)
  })

  it("reports asynchronous parse errors through the existing import result", async () => {
    const importer = useImport()
    const result = await importer.importFromFile(new File(['id,name\n1,"Unclosed'], "bad.csv"), {
      format: "csv"
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain("Failed to parse file: CSV parsing errors:")
    expect(importer.isImporting.value).toBe(false)
    expect(importer.lastError.value).toBe(result.error)
  })
})
