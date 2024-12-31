import { mergeConfig, defineConfig } from "vitest/config"
import viteConfig from "./vite.config"
import path from "path"

export default defineConfig(() =>
  mergeConfig(
    viteConfig(),
    defineConfig({
      test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./tests/vitestSetup.ts"],
        reporters: ["default", "junit"],
        outputFile: {
          junit: "./coverage/junit.xml"
        },
        coverage: {
          provider: "v8",
          reporter: ["html", "cobertura", "text", "text-summary", "lcov"],
          exclude: [
            "env.d.ts",
            "src/**/*.d.ts",
            "tests/**",
            "node_modules/**",
            "dist/**",
            "docs/**",
            "lib/**",
            "lib_types/**",
            ".vitepress/**",
            "**/{vite,vitest,eslint}.config.{js,cjs,mjs,ts}",
            "src/hy-vue-gantt.ts",
            "src/types/**",
          ],
          reportsDirectory: "./coverage",
          clean: true,
        },
        include: ["tests/**/*.test.ts"],
        pool: "vmThreads",
        poolOptions: {
          threads: {
            singleThread: true
          }
        }
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src")
        }
      }
    })
  )
)
