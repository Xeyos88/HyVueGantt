<script setup lang="ts">
// -----------------------------
// 1. EXTERNAL IMPORTS
// -----------------------------
import { ref, computed, watch, inject } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import {
  faFileImport,
  faSpinner,
  faCheck,
  faXmark,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons"

// -----------------------------
// 2. INTERNAL IMPORTS
// -----------------------------
import { useImport } from "../composables/useImport"
import type { ImportFormat, ImportOptions, ImportResult } from "../types/import"
import type { ColorScheme } from "../types"
import { colorSchemes } from "../color-schemes"
import { CONFIG_KEY } from "../provider/symbols"

// -----------------------------
// 3. PROPS AND CONFIGURATION
// -----------------------------
const props = defineProps<{
  modelValue?: boolean
  title?: string
  defaultFormat?: ImportFormat
  allowedFormats?: ImportFormat[]
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "import", value: ImportResult): void
  (e: "close"): void
}>()

// -----------------------------
// 4. INJECT SHARED CONFIGURATION
// -----------------------------
// Inject configuration from parent GGanttChart component
const config = inject(CONFIG_KEY)
if (!config) {
  throw Error("GGanttImporter must be used as a child of GGanttChart!")
}

// Extract relevant properties from configuration
const dateFormat = computed(() => config.dateFormat.value)
const font = computed(() => config.font.value)
const colorScheme = computed(() => config.colorScheme.value)
const barStart = computed(() => config.barStart.value)
const barEnd = computed(() => config.barEnd.value)

// -----------------------------
// 5. INTERNAL STATE
// -----------------------------
const { importFromFile, isImporting, importProgress, lastError } = useImport()

const visible = ref(props.modelValue || false)
const selectedFormat = ref<ImportFormat>(props.defaultFormat || "csv")
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const mapStartField = ref<string>(barStart.value)
const mapEndField = ref<string>(barEnd.value)
const importWarnings = ref<string[]>([])
const importSuccess = ref<boolean | null>(null)
const showOptions = ref(false)
const activeStep = ref(1)

// -----------------------------
// 5. COMPUTED PROPERTIES
// -----------------------------
const fontStyle = computed(() => font.value || "inherit")

const colors = computed<ColorScheme>(() => {
  if (typeof colorScheme.value === "string") {
    return colorSchemes[colorScheme.value as keyof typeof colorSchemes]! || colorSchemes.default
  }
  return colorScheme.value! || colorSchemes.default
})

const textStyle = computed(() => colors.value.text)
const backgroundStyle = computed(() => colors.value.background)
const primaryStyle = computed(() => colors.value.primary)
const secondaryStyle = computed(() => colors.value.secondary)
const tertiaryStyle = computed(() => colors.value.ternary)

// Colors for specific elements
const accentColor = computed(() => colors.value.rangeHighlight || "#4a9eff")
const successColor = computed(() => "#4caf50")
const errorColor = computed(() => "#f44336")
const warningColor = computed(() => "#ffc107")

const availableFormats = computed(() => {
  const formats: { value: ImportFormat; label: string }[] = [
    { value: "jira", label: "Jira (JSON)" },
    { value: "csv", label: "CSV" },
  ]

  if (props.allowedFormats && props.allowedFormats.length > 0) {
    return formats.filter((f) => props.allowedFormats!.includes(f.value))
  }

  return formats
})

// -----------------------------
// 6. WATCHERS
// -----------------------------
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal || false
  }
)

watch(visible, (newVal) => {
  emit("update:modelValue", newVal)
})

watch(barStart, (newVal) => {
  if (newVal) {
    mapStartField.value = newVal
  }
})

watch(barEnd, (newVal) => {
  if (newVal) {
    mapEndField.value = newVal
  }
})

// -----------------------------
// 7. METHODS
// -----------------------------
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]!

    const fileName = selectedFile.value.name.toLowerCase()
    if (fileName.endsWith(".json")) {
      selectedFormat.value = "jira"
    } else if (fileName.endsWith(".csv")) {
      selectedFormat.value = "csv"
    } 
    
    activeStep.value = 2
  }
}

const startImport = async () => {
  if (!selectedFile.value) return

  importWarnings.value = []
  importSuccess.value = null

  const options: ImportOptions = {
    format: selectedFormat.value,
    dateFormat: dateFormat.value,
    mapFields: {
      startDate: mapStartField.value,
      endDate: mapEndField.value
    },
    colorScheme: colors.value,
    onProgress: (progress) => {
      importProgress.value = progress
    }
  }

  const result = await importFromFile(selectedFile.value, options)

  if (result.success) {
    importSuccess.value = true
    if (result.warnings) {
      importWarnings.value = result.warnings
    }
    activeStep.value = 3
    emit("import", result)
  } else {
    importSuccess.value = false
  }
}

const reset = () => {
  selectedFile.value = null
  importSuccess.value = null
  importWarnings.value = []
  activeStep.value = 1

  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

const close = () => {
  visible.value = false
  reset()
  emit("close")
}

// -----------------------------
// 8. INTERFACE CONTENT
// -----------------------------
</script>

<template>
  <teleport to="body">
    <transition name="g-fade">
      <div v-if="visible" class="g-gantt-importer-overlay">
        <div
          class="g-gantt-importer-modal"
          :style="{
            fontFamily: fontStyle,
            color: textStyle,
            background: backgroundStyle
          }"
        >
          <!-- Modal Header -->
          <div class="g-gantt-importer-header" :style="{ background: primaryStyle }">
            <h3>{{ title || "Import Data" }}</h3>
            <button class="g-gantt-importer-close-btn" @click="close" :style="{ color: textStyle }">
              <FontAwesomeIcon :icon="faXmark" />
            </button>
          </div>

          <!-- Modal Content -->
          <div class="g-gantt-importer-content">
            <!-- Stepper -->
            <div class="g-gantt-importer-stepper">
              <div
                class="g-gantt-stepper-step"
                :class="{ active: activeStep === 1, completed: activeStep > 1 }"
              >
                <div
                  class="g-gantt-step-number"
                  :style="{
                    backgroundColor:
                      activeStep === 1 ? accentColor : activeStep > 1 ? successColor : '#e0e0e0',
                    color: activeStep >= 1 ? 'white' : textStyle
                  }"
                >
                  <span v-if="activeStep <= 1">1</span>
                  <FontAwesomeIcon v-else :icon="faCheck" />
                </div>
                <div
                  class="g-gantt-step-label"
                  :style="{ color: activeStep === 1 ? textStyle : secondaryStyle }"
                >
                  Select File
                </div>
              </div>

              <div
                class="g-gantt-step-connector"
                :style="{ backgroundColor: colors.gridAndBorder }"
              ></div>

              <div
                class="g-gantt-stepper-step"
                :class="{ active: activeStep === 2, completed: activeStep > 2 }"
              >
                <div
                  class="g-gantt-step-number"
                  :style="{
                    backgroundColor:
                      activeStep === 2 ? accentColor : activeStep > 2 ? successColor : '#e0e0e0',
                    color: activeStep >= 2 ? 'white' : textStyle
                  }"
                >
                  <span v-if="activeStep <= 2">2</span>
                  <FontAwesomeIcon v-else :icon="faCheck" />
                </div>
                <div
                  class="g-gantt-step-label"
                  :style="{ color: activeStep === 2 ? textStyle : secondaryStyle }"
                >
                  Configure
                </div>
              </div>

              <div
                class="g-gantt-step-connector"
                :style="{ backgroundColor: colors.gridAndBorder }"
              ></div>

              <div
                class="g-gantt-stepper-step"
                :class="{ active: activeStep === 3, completed: activeStep > 3 }"
              >
                <div
                  class="g-gantt-step-number"
                  :style="{
                    backgroundColor:
                      activeStep === 3 ? accentColor : activeStep > 3 ? successColor : '#e0e0e0',
                    color: activeStep >= 3 ? 'white' : textStyle
                  }"
                >
                  <span v-if="activeStep <= 3">3</span>
                  <FontAwesomeIcon v-else :icon="faCheck" />
                </div>
                <div
                  class="g-gantt-step-label"
                  :style="{ color: activeStep === 3 ? textStyle : secondaryStyle }"
                >
                  Result
                </div>
              </div>
            </div>

            <!-- Step 1: File Selection -->
            <div v-if="activeStep === 1" class="g-gantt-importer-step">
              <div class="g-gantt-file-upload">
                <div
                  class="g-gantt-file-dropzone"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="
                    (e) => {
                      const files = e.dataTransfer?.files
                      if (files && files.length > 0) {
                        selectedFile = files[0]!
                        activeStep = 2
                      }
                    }
                  "
                  :style="{
                    borderColor: colors.gridAndBorder
                  }"
                >
                  <FontAwesomeIcon
                    :icon="faFileImport"
                    class="file-icon"
                    :style="{ color: accentColor }"
                  />
                  <p>Click or drag a file here to import</p>
                  <small
                    >Supported formats: {{ availableFormats.map((f) => f.label).join(", ") }}</small
                  >
                </div>

                <input
                  type="file"
                  ref="fileInput"
                  @change="handleFileSelect"
                  class="g-gantt-file-input"
                  :accept="
                    availableFormats
                      .map((f) => {
                        switch (f.value) {
                          case 'jira':
                            return '.json'
                          case 'csv':
                            return '.csv'
                          default:
                            return ''
                        }
                      })
                      .filter(Boolean)
                      .join(',')
                  "
                />
              </div>
            </div>

            <!-- Step 2: Configuration -->
            <div v-else-if="activeStep === 2" class="g-gantt-importer-step">
              <div v-if="selectedFile" class="g-gantt-selected-file">
                <div class="g-gantt-file-info" :style="{ backgroundColor: tertiaryStyle }">
                  <div><strong>Selected file:</strong> {{ selectedFile.name }}</div>
                  <div><strong>Size:</strong> {{ (selectedFile.size / 1024).toFixed(2) }} KB</div>
                </div>

                <div class="g-gantt-import-options">
                  <div class="g-gantt-option-group">
                    <label>Format</label>
                    <select v-model="selectedFormat" :style="{ borderColor: colors.gridAndBorder }">
                      <option
                        v-for="format in availableFormats"
                        :key="format.value"
                        :value="format.value"
                      >
                        {{ format.label }}
                      </option>
                    </select>
                  </div>

                  <div class="g-gantt-option-toggle">
                    <button
                      class="g-gantt-toggle-btn"
                      @click="showOptions = !showOptions"
                      :style="{ color: accentColor }"
                    >
                      {{ showOptions ? "Hide advanced options" : "Show advanced options" }}
                    </button>
                  </div>

                  <div
                    v-if="showOptions"
                    class="g-gantt-advanced-options"
                    :style="{ borderTopColor: colors.gridAndBorder }"
                  >
                    <div class="g-gantt-option-group">
                      <label>Start date field</label>
                      <input
                        type="text"
                        v-model="mapStartField"
                        :style="{ borderColor: colors.gridAndBorder }"
                      />
                    </div>

                    <div class="g-gantt-option-group">
                      <label>End date field</label>
                      <input
                        type="text"
                        v-model="mapEndField"
                        :style="{ borderColor: colors.gridAndBorder }"
                      />
                    </div>
                  </div>
                </div>

                <div class="g-gantt-import-actions">
                  <button
                    class="g-gantt-button secondary"
                    @click="activeStep = 1"
                    :style="{
                      backgroundColor: secondaryStyle,
                      color: textStyle
                    }"
                  >
                    Back
                  </button>
                  <button
                    class="g-gantt-button primary"
                    @click="startImport"
                    :disabled="isImporting"
                    :style="{
                      backgroundColor: accentColor,
                      color: 'white'
                    }"
                  >
                    <FontAwesomeIcon v-if="isImporting" :icon="faSpinner" class="fa-spin" />
                    <span v-else>Import</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Step 3: Result -->
            <div v-else-if="activeStep === 3" class="g-gantt-importer-step">
              <div class="g-gantt-import-result">
                <div v-if="importSuccess" class="g-gantt-result-success">
                  <FontAwesomeIcon
                    :icon="faCheck"
                    class="result-icon success"
                    :style="{
                      color: successColor,
                      backgroundColor: `rgba(${parseInt(successColor.slice(1, 3), 16)}, 
                                                    ${parseInt(successColor.slice(3, 5), 16)}, 
                                                    ${parseInt(successColor.slice(5, 7), 16)}, 0.1)`
                    }"
                  />
                  <h4>Import completed successfully</h4>

                  <div
                    v-if="importWarnings.length > 0"
                    class="g-gantt-warnings"
                    :style="{
                      backgroundColor: `rgba(${parseInt(warningColor.slice(1, 3), 16)}, 
                                         ${parseInt(warningColor.slice(3, 5), 16)}, 
                                         ${parseInt(warningColor.slice(5, 7), 16)}, 0.1)`,
                      borderLeftColor: warningColor
                    }"
                  >
                    <h5 :style="{ color: '#aa8700' }">
                      <FontAwesomeIcon :icon="faExclamationTriangle" />
                      Warnings ({{ importWarnings.length }})
                    </h5>
                    <ul>
                      <li
                        v-for="(warning, index) in importWarnings"
                        :key="index"
                        :style="{ color: '#aa8700' }"
                      >
                        {{ warning }}
                      </li>
                      <!--<li v-if="importWarnings.length > 5" :style="{ color: '#aa8700' }">
                        ...and {{ importWarnings.length - 5 }} more warnings
                      </li>-->
                    </ul>
                  </div>
                </div>

                <div v-else-if="importSuccess === false" class="g-gantt-result-error">
                  <FontAwesomeIcon
                    :icon="faXmark"
                    class="result-icon error"
                    :style="{
                      color: errorColor,
                      backgroundColor: `rgba(${parseInt(errorColor.slice(1, 3), 16)}, 
                                                    ${parseInt(errorColor.slice(3, 5), 16)}, 
                                                    ${parseInt(errorColor.slice(5, 7), 16)}, 0.1)`
                    }"
                  />
                  <h4>Error during import</h4>
                  <p>{{ lastError }}</p>
                </div>

                <div class="g-gantt-result-actions">
                  <button
                    class="g-gantt-button secondary"
                    @click="reset"
                    :style="{
                      backgroundColor: secondaryStyle,
                      color: textStyle
                    }"
                  >
                    Import another file
                  </button>
                  <button
                    class="g-gantt-button primary"
                    @click="close"
                    :style="{
                      backgroundColor: accentColor,
                      color: 'white'
                    }"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
.g-gantt-importer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.g-gantt-importer-modal {
  width: 650px;
  max-width: 95%;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.g-gantt-importer-header {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.g-gantt-importer-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.g-gantt-importer-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.g-gantt-importer-close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.g-gantt-importer-content {
  padding: 20px;
  overflow-y: auto;
}

/* Stepper styles */
.g-gantt-importer-stepper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.g-gantt-stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.g-gantt-step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.g-gantt-step-label {
  font-size: 14px;
  transition: color 0.3s;
}

.g-gantt-step-connector {
  flex-grow: 1;
  height: 2px;
  margin: 0 10px;
  margin-bottom: 30px;
}

/* File upload styles */
.g-gantt-file-upload {
  width: 100%;
}

.g-gantt-file-dropzone {
  border: 2px dashed;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.g-gantt-file-dropzone:hover {
  border-color: currentColor;
  background-color: rgba(0, 0, 0, 0.03);
}

.g-gantt-file-dropzone .file-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.g-gantt-file-dropzone p {
  margin: 0 0 8px;
  font-size: 16px;
}

.g-gantt-file-dropzone small {
  color: #666;
}

.g-gantt-file-input {
  display: none;
}

/* Configuration styles */
.g-gantt-selected-file {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-gantt-file-info {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-gantt-import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.g-gantt-option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-gantt-option-group label {
  font-weight: 500;
  font-size: 14px;
}

.g-gantt-option-group select,
.g-gantt-option-group input {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 14px;
}

.g-gantt-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  text-decoration: underline;
}

.g-gantt-advanced-options {
  border-top: 1px solid;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.g-gantt-import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

/* Result styles */
.g-gantt-import-result {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  text-align: center;
}

.g-gantt-result-success,
.g-gantt-result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.result-icon {
  font-size: 48px;
  border-radius: 50%;
  padding: 16px;
  margin-bottom: 8px;
}

.g-gantt-warnings {
  margin-top: 16px;
  text-align: left;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  width: 100%;
}

.g-gantt-warnings h5 {
  margin-top: 0;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.g-gantt-warnings ul {
  margin: 0;
  padding-left: 14px;
  max-height: 150px;
  overflow-y: overlay;
}

/* Button styles */
.g-gantt-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-weight: 500;
}

.g-gantt-result-actions {
  display: flex;
  gap: 4px;
}

.g-gantt-button:hover {
  filter: brightness(0.95);
}

.g-gantt-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animations */
.g-fade-enter-active,
.g-fade-leave-active {
  transition: opacity 0.3s ease;
}

.g-fade-enter-from,
.g-fade-leave-to {
  opacity: 0;
}
</style>
