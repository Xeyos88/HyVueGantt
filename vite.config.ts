import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import postcssPresetEnv from "postcss-preset-env"
import styleInject from "@senojs/rollup-plugin-style-inject"
import { visualizer } from "rollup-plugin-visualizer"
import dts from "vite-plugin-dts"

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
              fileName: "hy-vue-gantt"
            }
          : undefined,
      outDir: process.env.NODE_ENV === "production" ? "lib" : "dist",
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into the library
        external: [
          "vue",
          "dayjs",
          "date-holidays",
          /^dayjs\/plugin/,
          /^dayjs\/locale/,
          "@fortawesome/vue-fontawesome",
          "@fortawesome/free-solid-svg-icons",
          "@vueuse/core",
          "lodash-es",
          "uuid"
        ],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: "Vue",
            dayjs: "dayjs",
            "date-holidays": "date-holidays",
            "lodash-es": "lodash-es",
            uuid: "uuid"
          },
          exports: "named"
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
