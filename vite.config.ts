import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import postcssPresetEnv from "postcss-preset-env"
import styleInject from "@senojs/rollup-plugin-style-inject"

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [
      vue(),
      styleInject({
        insertAt: "top"
      })
    ],
    css: {
      postcss: {
        plugins: [postcssPresetEnv()]
      }
    },
    build: {
      lib:
        process.env.NODE_ENV === "production"
          ? {
              entry: fileURLToPath(new URL("src/hy-vue-gantt.ts", import.meta.url)),
              name: "HyVueGantt",
              fileName: "hy-vue-gantt"
            }
          : undefined,
      outDir: process.env.NODE_ENV === "production" ? "lib" : "dist",
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into the library
        external: ["vue", "dayjs"],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: "Vue",
            dayjs: "dayjs"
          },
          exports: "named"
        }
      }
    }
  })
}
