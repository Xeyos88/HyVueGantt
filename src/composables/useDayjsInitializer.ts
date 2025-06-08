import dayjs from "dayjs"

// Import all required dayjs plugins
import isoWeek from "dayjs/plugin/isoWeek"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isBetween from "dayjs/plugin/isBetween.js"
import weekOfYear from "dayjs/plugin/weekOfYear"
import advancedFormat from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import dayOfYear from "dayjs/plugin/dayOfYear.js"
import localizedFormat from "dayjs/plugin/localizedFormat"
import utc from "dayjs/plugin/utc"

/**
 * Global flag to ensure dayjs plugins are extended only once across the entire application
 * This prevents multiple initializations and potential conflicts
 */
let isInitialized = false

/**
 * List of all required plugins for the Gantt library
 * This ensures we don't miss any plugin and helps with maintenance
 */
const REQUIRED_PLUGINS = [
  { plugin: isSameOrBefore, name: "isSameOrBefore" },
  { plugin: isSameOrAfter, name: "isSameOrAfter" },
  { plugin: isBetween, name: "isBetween" },
  { plugin: customParseFormat, name: "customParseFormat" },
  { plugin: weekOfYear, name: "weekOfYear" },
  { plugin: isoWeek, name: "isoWeek" },
  { plugin: advancedFormat, name: "advancedFormat" },
  { plugin: dayOfYear, name: "dayOfYear" },
  { plugin: localizedFormat, name: "localizedFormat" },
  { plugin: utc, name: "utc" }
] as const

/**
 * Initializes all required dayjs plugins for the Gantt library
 * This function is safe to call multiple times - it will only initialize once
 *
 * @returns boolean - true if plugins were initialized, false if already initialized
 */
export function initializeDayjsPlugins(): boolean {
  if (isInitialized) {
    return false
  }

  try {
    // Extend dayjs with all required plugins
    REQUIRED_PLUGINS.forEach(({ plugin }) => {
      dayjs.extend(plugin)
    })

    isInitialized = true

    // Optional: Log successful initialization in development
    if (process.env.NODE_ENV === "development") {
      console.log("[hy-vue-gantt] Dayjs plugins initialized successfully")
    }

    return true
  } catch (error) {
    console.error("[hy-vue-gantt] Failed to initialize dayjs plugins:", error)
    throw error
  }
}

/**
 * Returns the current initialization status
 * Useful for debugging or conditional logic
 */
export function isDayjsInitialized(): boolean {
  return isInitialized
}

/**
 * Forces re-initialization of dayjs plugins
 * Should only be used in testing scenarios or when explicitly needed
 *
 * @param force - If true, forces re-initialization even if already initialized
 */
export function reinitializeDayjsPlugins(force: boolean = false): boolean {
  if (force) {
    isInitialized = false
  }
  return initializeDayjsPlugins()
}

/**
 * Validates that all required dayjs methods are available
 * Useful for debugging plugin initialization issues
 *
 * @returns Object with validation results
 */
export function validateDayjsPlugins() {
  const testDate = dayjs()
  const validationResults = {
    weekOfYear: typeof testDate.week === "function",
    isSameOrBefore: typeof testDate.isBefore === "function",
    isSameOrAfter: typeof testDate.isAfter === "function",
    isBetween: typeof testDate.isBetween === "function",
    customParseFormat: typeof dayjs("2023-01-01", "YYYY-MM-DD", true).isValid === "function",
    advancedFormat: typeof testDate.format === "function",
    dayOfYear: typeof testDate.dayOfYear === "function",
    utc: typeof dayjs.utc === "function",
    isoWeek: typeof testDate.isoWeek === "function"
  }

  const allValid = Object.values(validationResults).every(Boolean)

  return {
    allValid,
    results: validationResults,
    missing: Object.entries(validationResults)
      .filter(([, isValid]) => !isValid)
      .map(([name]) => name)
  }
}

// Auto-initialize when this module is imported
// This ensures plugins are loaded as early as possible
initializeDayjsPlugins()
