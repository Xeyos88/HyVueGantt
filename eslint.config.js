import pluginVue from "eslint-plugin-vue"
import vueTsEslintConfig from "@vue/eslint-config-typescript"
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { includeIgnoreFile } from "@eslint/compat"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const gitignorePath = path.resolve(__dirname, ".gitignore")

export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"]
  },

  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]
  },

  ...pluginVue.configs["flat/essential"],
  ...vueTsEslintConfig(),

  skipFormatting,
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["**/tests/*", "**/docs/*"]
  }
]
