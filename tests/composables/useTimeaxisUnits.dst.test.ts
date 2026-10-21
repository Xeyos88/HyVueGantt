import { describe, expect, it } from "vitest"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { resolve } from "node:path"

const execute = promisify(execFile)
const root = process.cwd()
const fixture = resolve(root, "tests/fixtures/timeaxis-dst.mjs")
type Unit = { label: string; time: number; offset: number; width: number }
type Scenario = { start: string; end: string; precision?: string; dates?: boolean }

async function generate(scenario: Scenario, timezone = "Europe/Rome") {
  const { stdout } = await execute(process.execPath, [fixture, JSON.stringify(scenario)], {
    cwd: root,
    env: { ...process.env, TZ: timezone },
    timeout: 5000,
    killSignal: "SIGKILL"
  })
  return JSON.parse(stdout) as { lower: Unit[]; upper: Unit[] }
}

const width = (units: Unit[]) => units.reduce((sum, unit) => sum + unit.width, 0)
function expectContinuousAxis(units: Unit[], end: number, pxPerHour = 40) {
  expect(units.length).toBeGreaterThan(0)
  for (const [index, unit] of units.entries()) {
    const next = units[index + 1]?.time ?? end
    expect(next).toBeGreaterThan(unit.time)
    expect(unit.width).toBeGreaterThan(0)
    expect(unit.width).toBeCloseTo((next - unit.time) / 3_600_000 * pxPerHour, 8)
  }
}

describe("time axis across daylight saving changes", () => {
  it("finishes the reported five-day hourly range and preserves both repeated hours", async () => {
    const { lower, upper } = await generate({
      start: "2026-10-21 00:00", end: "2026-10-26 00:00"
    })
    expect(lower).toHaveLength(121)
    const repeated = lower.filter(unit =>
      unit.time >= Date.parse("2026-10-25T00:00:00Z") &&
      unit.time < Date.parse("2026-10-25T02:00:00Z")
    )
    expect(repeated.map(unit => unit.label)).toEqual(["02", "02"])
    expect(repeated.map(unit => unit.offset)).toEqual([-120, -60])
    expectContinuousAxis(lower, Date.parse("2026-10-26T00:00:00+01:00"))
    expect(upper.map(unit => unit.width)).toEqual([960, 960, 960, 960, 1000])
    expect(width(lower)).toBe(width(upper))
  }, 10000)

  it("keeps partial cells in both occurrences of the repeated hour", async () => {
    const { lower, upper } = await generate({
      start: "2026-10-25T02:30:00+02:00",
      end: "2026-10-25T02:30:00+01:00",
      dates: true
    })
    expect(lower.map(unit => unit.label)).toEqual(["02", "02"])
    expect(lower.map(unit => unit.width)).toEqual([20, 20])
    expectContinuousAxis(lower, Date.parse("2026-10-25T02:30:00+01:00"))
    expect(width(upper)).toBe(40)
  }, 10000)

  it("handles a start inside the second occurrence down to milliseconds", async () => {
    const start = "2026-10-25T02:15:30.250+01:00"
    const end = "2026-10-25T03:10:45.750+01:00"
    const { lower, upper } = await generate({ start, end, dates: true })
    expect(lower.map(unit => unit.time)).toEqual([
      Date.parse(start), Date.parse("2026-10-25T03:00:00+01:00")
    ])
    expectContinuousAxis(lower, Date.parse(end))
    expect(width(lower)).toBeCloseTo(width(upper), 8)
  }, 10000)

  it("skips the missing spring hour and renders a 23-hour day", async () => {
    const { lower, upper } = await generate({
      start: "2026-03-29 00:00", end: "2026-03-30 00:00"
    })
    expect(lower).toHaveLength(23)
    expect(lower.slice(0, 4).map(unit => unit.label)).toEqual(["00", "01", "03", "04"])
    expectContinuousAxis(lower, Date.parse("2026-03-30T00:00:00+02:00"))
    expect(width(lower)).toBe(920)
    expect(width(upper)).toBe(920)
  }, 10000)

  it("keeps ordinary seven-day hourly ranges unchanged", async () => {
    const { lower, upper } = await generate({
      start: "2026-10-26 00:00", end: "2026-11-02 00:00"
    })
    expect(lower).toHaveLength(168)
    expectContinuousAxis(lower, Date.parse("2026-11-02T00:00:00+01:00"))
    expect(width(upper)).toBe(168 * 40)
  }, 10000)

  it("does not duplicate hours when the host timezone is UTC", async () => {
    const { lower, upper } = await generate({
      start: "2026-10-25 00:00", end: "2026-10-26 00:00"
    }, "UTC")
    expect(lower).toHaveLength(24)
    expect(lower.every(unit => unit.offset === 0)).toBe(true)
    expectContinuousAxis(lower, Date.parse("2026-10-26T00:00:00Z"))
    expect(width(upper)).toBe(960)
  }, 10000)

  it("preserves calendar-day boundaries and their real durations", async () => {
    const { lower, upper } = await generate({
      start: "2026-10-24 00:00", end: "2026-10-27 00:00", precision: "day"
    })
    expect(lower).toHaveLength(3)
    expectContinuousAxis(lower, Date.parse("2026-10-27T00:00:00+01:00"), 40 / 24)
    expect(lower[1]!.width).toBeCloseTo(40 * 25 / 24, 8)
    expect(width(lower)).toBeCloseTo(width(upper), 8)
  }, 10000)
})
