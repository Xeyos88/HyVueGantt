import { appendFile, readFile } from "node:fs/promises"
import { join } from "node:path"

// Validate the manually maintained version before semantic-release creates a tag.
export async function verifyRelease(_config, { cwd, nextRelease }) {
  const manifest = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"))
  const lock = JSON.parse(await readFile(join(cwd, "package-lock.json"), "utf8"))
  const versions = {
    "package.json": manifest.version,
    "package-lock.json": lock.version,
    "package-lock.json root package": lock.packages?.[""]?.version
  }

  for (const [source, version] of Object.entries(versions)) {
    if (version !== nextRelease.version) {
      throw new Error(
        `${source} has version ${version}; semantic-release expects ${nextRelease.version}. ` +
        "Update package.json and package-lock.json before merging into main."
      )
    }
  }
}

// No release means no output: the separate npm publish step stays skipped.
export async function success(_config, { env, nextRelease }) {
  if (env.GITHUB_OUTPUT) {
    await appendFile(
      env.GITHUB_OUTPUT,
      `released=true\nversion=${nextRelease.version}\n`
    )
  }
}
