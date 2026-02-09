import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import postcssPresetEnv from "postcss-preset-env"
import styleInject from "@senojs/rollup-plugin-style-inject"
import { visualizer } from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    plugins: [
      vue(),
      styleInject({
        insertAt: "top"
      }),
      visualizer({
        filename: "stats.html",
        gzipSize: true
      })
      //dts({
      //  include: ["src/**/*.ts", "src/**/*.vue"],
      //  beforeWriteFile: (filePath, content) => {
      //   if (filePath.endsWith(".vue.d.ts")) {
      //     return false
      //   }
      //   return { filePath, content }
      // }
      //})
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
              fileName: "hy-vue-gantt",
              formats: ["es"]
            }
          : undefined,
      outDir: process.env.NODE_ENV === "production" ? "lib" : "dist",
      copyPublicDir: process.env.NODE_ENV !== "production",
      rollupOptions: {
        external: [
          "vue",
          /^vue\//,
          "dayjs",
          /^dayjs/,
          "date-holidays",
          /^@fortawesome/,
          /^@vueuse/,
          "html2canvas",
          "jspdf",
          /^lodash/,
          "uuid",
          "xlsx",
          "papaparse"
        ],
        output: {
          compact: true,
          exports: "named"
        },
        treeshake: {
          preset: "smallest",
          moduleSideEffects: false
        }
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
          passes: 2,
          pure_getters: true,
          unsafe_math: true,
          unsafe_methods: true
        },
        mangle: {
          safari10: true,
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false
        }
      }
    }
  })
}
