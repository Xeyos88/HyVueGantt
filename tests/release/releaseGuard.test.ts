import { afterEach, describe, expect, it } from "vitest"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { success, verifyRelease } from "../../scripts/release-guard.mjs"

const directories: string[] = []
const nextRelease = { version: "5.3.2" }

async function fixture(packageVersion = "5.3.2", lockVersion = "5.3.2", rootVersion = "5.3.2") {
  const cwd = await mkdtemp(join(tmpdir(), "hyvuegantt-release-test-"))
  directories.push(cwd)
  await writeFile(join(cwd, "package.json"), JSON.stringify({ version: packageVersion }))
  await writeFile(join(cwd, "package-lock.json"), JSON.stringify({
    version: lockVersion,
    packages: { "": { version: rootVersion } }
  }))
  return cwd
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((cwd) => rm(cwd, { recursive: true, force: true })))
})

describe("release version guard", () => {
  it("accepts the manually prepared version when all manifests match the next release", async () => {
    const cwd = await fixture()
    await expect(verifyRelease({}, { cwd, nextRelease })).resolves.toBeUndefined()
  })

  it.each([
    ["5.3.1", "5.3.2", "5.3.2", "package.json"],
    ["5.3.2", "5.3.1", "5.3.2", "package-lock.json"],
    ["5.3.2", "5.3.2", "5.3.1", "package-lock.json root package"]
  ])("rejects mismatched package versions (%s, %s, %s)", async (pkg, lock, root, source) => {
    const cwd = await fixture(pkg, lock, root)
    await expect(verifyRelease({}, { cwd, nextRelease })).rejects.toThrow(
      `${source} has version 5.3.1; semantic-release expects 5.3.2`
    )
  })

  it("rejects a missing lockfile root version", async () => {
    const cwd = await fixture()
    await writeFile(join(cwd, "package-lock.json"), JSON.stringify({ version: "5.3.2" }))
    await expect(verifyRelease({}, { cwd, nextRelease })).rejects.toThrow("root package has version undefined")
  })

  it("exposes a successful release to the separate npm publishing step", async () => {
    const cwd = await fixture()
    const output = join(cwd, "output")
    await writeFile(output, "existing=value\n")
    await success({}, { env: { GITHUB_OUTPUT: output }, nextRelease })
    expect(await readFile(output, "utf8")).toBe("existing=value\nreleased=true\nversion=5.3.2\n")
  })

  it("supports releases outside GitHub Actions", async () => {
    await expect(success({}, { env: {}, nextRelease })).resolves.toBeUndefined()
  })
})
