<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import {
  type BalunConfig,
  type DesignResults,
  type ValidationResult,
  type HybridComponents,
} from './src/types'
import {
  CORE_MODELS,
  PRESET_CONFIGS,
  OPERATION_MODE_OPTIONS,
  DUTY_CYCLE_FACTORS,
  HAM_BANDS,
} from './src/constants'
import {
  findCoreModel,
  calculateCharacteristicImpedance,
  calculateRecommendedWireGauge,
  determineBandCoverage,
  formatInstructions,
} from './src/utils'
import { BalunDesignCalculator } from './src/balunDesignCalculator'
import { WindingStyleCalculator } from './src/windingStyleCalculator'
import { CoreCalculator } from './src/coreCalculator'

export default defineComponent({
  name: 'BalunCalculator',
  components: {},

  setup() {
    // State variables
    const showDesignSteps = ref(false)
    const showAdvancedOptions = ref(false)
    const showReport = ref(false)
    const showBandCoverage = ref(false)
    const showWireInfo = ref(false)
    const showPerformanceDetails = ref(false)
    const showWindingInstructions = ref(false)
    const showAlternativeDesigns = ref(false)
    const showHybridDesign = ref(false)
    const showCoreInfo = ref(false)
    const isCalculating = ref(false)
    const calculationError = ref('')

    // Form values
    const inputImpedance = ref(50)
    const outputImpedance = ref(50)
    const minFrequency = ref(1.8)
    const maxFrequency = ref(30)
    const power = ref(100)
    const operationMode = ref('SSB')
    const selectedCoreModel = ref('FT-140-43')
    const coreCount = ref(1)
    const primaryTurns = ref(0) // 0 means auto-calculate
    const useHybridDesign = ref(false)

    // Results
    const designResults = ref<DesignResults | null>(null)
    const validationResult = ref<ValidationResult | null>(null)
    const hybridComponents = ref<HybridComponents | null>(null)
    const bandPowerData = ref<Array<{
      band: string
      frequency: number
      inductance: number
      reactance: number
      resistance: number
      qFactor: number
      fluxDensity: number
      powerOut: number
      efficiency: number
      swr: number
    }> | null>(null)
    const swrData = ref<Array<{
      frequency: number
      swr: number
    }> | null>(null)
    const showPowerTransfer = ref(false)

    // Computed properties
    const impedanceRatio = computed(() => {
      return outputImpedance.value / inputImpedance.value
    })

    const characteristicImpedance = computed(() => {
      return calculateCharacteristicImpedance(inputImpedance.value, outputImpedance.value)
    })

    const shouldUseHybridDesign = computed(() => {
      return WindingStyleCalculator.shouldUseHybridDesign(
        inputImpedance.value,
        outputImpedance.value,
      )
    })

    const selectedCore = computed(() => {
      return findCoreModel(selectedCoreModel.value)
    })

    const coreModelOptions = computed(() => {
      return CORE_MODELS.map((core) => ({
        label: `${core.id} (Mix ${core.mix}, ${core.recommendedFreqRange.min}-${core.recommendedFreqRange.max} MHz)`,
        value: core.id,
      }))
    })

    const operationModeOptions = computed(() => {
      return OPERATION_MODE_OPTIONS
    })

    const presets = computed(() => {
      return PRESET_CONFIGS
    })

    const bandCoverage = computed(() => {
      if (!designResults.value) return HAM_BANDS

      const minFreq = designResults.value.config.minFrequency
      const maxFreq = Math.min(
        designResults.value.config.maxFrequency,
        designResults.value.maxFreqBasedOnLength,
      )

      return determineBandCoverage(minFreq, maxFreq, HAM_BANDS)
    })

    const recommendedWireInfo = computed(() => {
      if (!designResults.value) return null

      const primaryImpedance = designResults.value.impedanceAtMinFreq
      const primaryPower = designResults.value.config.power

      // Calculate wire gauge based on primary winding current
      return calculateRecommendedWireGauge(primaryPower, primaryImpedance)
    })

    // Methods
    const applyPreset = (preset: any) => {
      inputImpedance.value = preset.inputImpedance
      outputImpedance.value = preset.outputImpedance
      minFrequency.value = preset.minFrequency
      maxFrequency.value = preset.maxFrequency
      power.value = preset.power
      operationMode.value = preset.operationMode
      useHybridDesign.value = preset.useHybridDesign
    }

    const resetForm = () => {
      inputImpedance.value = 50
      outputImpedance.value = 50
      minFrequency.value = 1.8
      maxFrequency.value = 30
      power.value = 100
      operationMode.value = 'SSB'
      selectedCoreModel.value = 'FT-140-43'
      coreCount.value = 1
      primaryTurns.value = 0
      useHybridDesign.value = false
      designResults.value = null
      validationResult.value = null
      calculationError.value = ''
      showReport.value = false
    }

    const calculateBalun = () => {
      try {
        isCalculating.value = true
        calculationError.value = ''

        // Input validation
        if (minFrequency.value >= maxFrequency.value) {
          throw new Error('Minimum frequency must be less than maximum frequency')
        }

        if (power.value <= 0) {
          throw new Error('Power must be greater than 0')
        }

        // Find the selected core model
        const core = findCoreModel(selectedCoreModel.value)
        if (!core) {
          throw new Error('Invalid core model selected')
        }

        // Prepare configuration
        const config: BalunConfig = {
          inputImpedance: inputImpedance.value,
          outputImpedance: outputImpedance.value,
          minFrequency: minFrequency.value,
          maxFrequency: maxFrequency.value,
          power: power.value,
          operationMode: operationMode.value,
          coreModel: selectedCoreModel.value,
          coreCount: coreCount.value,
          primaryTurns: primaryTurns.value,
          useHybridDesign: useHybridDesign.value,
        }

        // Calculate balun design
        const results = BalunDesignCalculator.calculateBalunDesign(config, core)

        // Generate alternative designs
        const alternatives = BalunDesignCalculator.generateAlternatives(config, core)

        // Validate the design
        const validation = BalunDesignCalculator.validateDesign(results)

        // If using hybrid design, generate hybrid components
        let hybrid = null
        if (useHybridDesign.value) {
          hybrid = BalunDesignCalculator.generateHybridComponents(
            inputImpedance.value,
            outputImpedance.value,
            selectedCoreModel.value,
          )
        }

        // Calculate band power data
        const bandPowerResults = BalunDesignCalculator.calculateBandPowerData(
          core,
          results.config.primaryTurns,
          results.config.coreCount,
          results.config.power,
          results.config.inputImpedance,
        )

        // Calculate SWR data
        const swrResults = BalunDesignCalculator.calculateSWRData(
          core,
          results.config.primaryTurns,
          results.config.coreCount,
          results.config.power,
          results.config.inputImpedance,
        )

        // Update state with results
        designResults.value = {
          ...results,
          alternativeConfigurations: alternatives,
        }
        validationResult.value = validation
        hybridComponents.value = hybrid
        bandPowerData.value = bandPowerResults
        swrData.value = swrResults
        showReport.value = true
        showHybridDesign.value = useHybridDesign.value
      } catch (error) {
        calculationError.value = error instanceof Error ? error.message : String(error)
      } finally {
        isCalculating.value = false
      }
    }

    // Watchers
    watch(
      [
        minFrequency,
        maxFrequency,
        power,
        inputImpedance,
        outputImpedance,
        operationMode,
        selectedCoreModel,
        coreCount,
        primaryTurns,
        useHybridDesign,
      ],
      () => {
        // Reset results when inputs change
        if (designResults.value) {
          showReport.value = false
          designResults.value = null
          validationResult.value = null
        }
      },
    )

    // Return everything needed by the template
    return {
      // State
      showDesignSteps,
      showAdvancedOptions,
      showReport,
      showBandCoverage,
      showWireInfo,
      showPerformanceDetails,
      showWindingInstructions,
      showAlternativeDesigns,
      showHybridDesign,
      showCoreInfo,
      showPowerTransfer,
      isCalculating,
      calculationError,

      // Form values
      inputImpedance,
      outputImpedance,
      minFrequency,
      maxFrequency,
      power,
      operationMode,
      selectedCoreModel,
      coreCount,
      primaryTurns,
      useHybridDesign,

      // Results
      designResults,
      validationResult,
      hybridComponents,
      bandPowerData,
      swrData,

      // Computed properties
      impedanceRatio,
      characteristicImpedance,
      shouldUseHybridDesign,
      selectedCore,
      coreModelOptions,
      operationModeOptions,
      presets,
      bandCoverage,
      recommendedWireInfo,
      determineBandCoverage,

      // Methods
      applyPreset,
      resetForm,
      calculateBalun,
      calculateRecommendedWireGauge,
      formatInstructions,
      WindingStyleCalculator,
      CoreCalculator,

      // Constants
      dutyCycleFactor: DUTY_CYCLE_FACTORS,
    }
  },
})
</script>

<template>
  <div class="balun-calculator">
    <div class="calculator-intro">
      <h3>Balun Designer</h3>
      <p>
        Design balanced-to-unbalanced transformers (baluns) for RF applications. This calculator
        helps you determine the optimal core type, turns count, and wire gauge for your specific
        requirements.
      </p>

      <div class="design-steps" v-if="showDesignSteps">
        <h4>Design Process Overview</h4>
        <ol>
          <li>
            <strong>Specify Requirements:</strong> Input impedance, output impedance, power
            handling, and frequency range.
          </li>
          <li><strong>Core Selection:</strong> Based on power requirements and frequency range.</li>
          <li>
            <strong>Turns Calculation:</strong> Determined by the "Rule of 4" (XL ≥ 4×Z) at the
            lowest frequency.
          </li>
          <li>
            <strong>Design Validation:</strong> Check core loss, flux density, and winding length
            constraints.
          </li>
          <li>
            <strong>Optimization:</strong> Adjust parameters if needed to meet all requirements.
          </li>
          <li>
            <strong>Alternative Designs:</strong> Consider hybrid designs for non-standard impedance
            ratios.
          </li>
        </ol>
        <div class="info-box">
          <h5>Key Design Principles</h5>
          <ul>
            <li>
              <strong>Rule of 4:</strong> The inductive reactance should be at least 4 times the
              input impedance at the lowest frequency.
            </li>
            <li>
              <strong>Core Loss:</strong> Must be within the core's thermal limits for the selected
              operation mode.
            </li>
            <li>
              <strong>Flux Density:</strong> Should remain in the linear region (&lt;50mT) to
              prevent saturation.
            </li>
            <li>
              <strong>Winding Length:</strong> Should be less than λ/10 at the highest frequency to
              prevent transmission line effects.
            </li>
          </ul>
        </div>
      </div>

      <button class="toggle-button" @click="showDesignSteps = !showDesignSteps">
        {{ showDesignSteps ? 'Hide Design Process' : 'Show Design Process' }}
      </button>
    </div>

    <div class="calculator-form">
      <div class="presets-section">
        <h4>Common Configurations</h4>
        <div class="presets-container">
          <button
            v-for="(preset, index) in presets"
            :key="index"
            class="preset-button"
            @click="applyPreset(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <div class="form-section">
        <h4>Basic Parameters</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="inputImpedance">Input Impedance (Ω)</label>
            <input
              id="inputImpedance"
              v-model.number="inputImpedance"
              type="number"
              min="1"
              max="600"
            />
          </div>

          <div class="form-group">
            <label for="outputImpedance">Output Impedance (Ω)</label>
            <input
              id="outputImpedance"
              v-model.number="outputImpedance"
              type="number"
              min="1"
              max="600"
            />
          </div>

          <div class="form-group">
            <label>Impedance Ratio</label>
            <div class="calculated-value">1:{{ impedanceRatio.toFixed(1) }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="minFrequency">Min Frequency (MHz)</label>
            <input
              id="minFrequency"
              v-model.number="minFrequency"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          <div class="form-group">
            <label for="maxFrequency">Max Frequency (MHz)</label>
            <input
              id="maxFrequency"
              v-model.number="maxFrequency"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          <div class="form-group">
            <label for="power">Power (W)</label>
            <input id="power" v-model.number="power" type="number" min="1" max="2000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="operationMode">Operation Mode</label>
            <select id="operationMode" v-model="operationMode">
              <option
                v-for="option in operationModeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="useHybridDesign">Design Type</label>
            <select id="useHybridDesign" v-model="useHybridDesign">
              <option :value="false">Standard Balun</option>
              <option :value="true">Hybrid Design (Balun+Unun)</option>
            </select>
          </div>
        </div>

        <div
          class="characteristic-impedance-warning"
          v-if="shouldUseHybridDesign && !useHybridDesign"
        >
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            <strong
              >Characteristic impedance ({{ characteristicImpedance.toFixed(1) }}Ω) is not close to
              standard values (50Ω or 100Ω).</strong
            ><br />
            Consider using a hybrid design for better performance.
          </div>
        </div>
      </div>

      <div class="form-section" v-if="showAdvancedOptions">
        <h4>Advanced Options</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="selectedCoreModel">Core Model</label>
            <select id="selectedCoreModel" v-model="selectedCoreModel">
              <option v-for="option in coreModelOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="coreCount">Core Count</label>
            <select id="coreCount" v-model.number="coreCount">
              <option :value="1">Single Core</option>
              <option :value="2">Stacked Cores (2x)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="primaryTurns">Primary Turns (0 = Auto)</label>
            <input id="primaryTurns" v-model.number="primaryTurns" type="number" min="0" max="30" />
          </div>
        </div>

        <div class="core-info" v-if="selectedCore">
          <h5>Selected Core Properties</h5>
          <div class="core-properties">
            <div class="property">
              <span class="property-label">Model:</span>
              <span class="property-value">{{ selectedCore.id }}</span>
            </div>
            <div class="property">
              <span class="property-label">Mix:</span>
              <span class="property-value">{{ selectedCore.mix }}</span>
            </div>
            <div class="property">
              <span class="property-label">Initial μ:</span>
              <span class="property-value">{{ selectedCore.initialPermeability }}</span>
            </div>
            <div class="property">
              <span class="property-label">Bsat:</span>
              <span class="property-value">{{ selectedCore.saturationFluxDensity }} mT</span>
            </div>
            <div class="property">
              <span class="property-label">Dimensions:</span>
              <span class="property-value"
                >OD={{ selectedCore.dimensions.od }}mm, ID={{ selectedCore.dimensions.id }}mm, H={{
                  selectedCore.dimensions.height
                }}mm</span
              >
            </div>
            <div class="property">
              <span class="property-label">Recommended Freq:</span>
              <span class="property-value"
                >{{ selectedCore.recommendedFreqRange.min }}-{{
                  selectedCore.recommendedFreqRange.max
                }}
                MHz</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="toggle-advanced" @click="showAdvancedOptions = !showAdvancedOptions">
          {{ showAdvancedOptions ? 'Hide Advanced Options' : 'Advanced Options' }}
        </button>
        <button class="reset-button" @click="resetForm">Reset</button>
        <button class="calculate-button" @click="calculateBalun" :disabled="isCalculating">
          {{ isCalculating ? 'Calculating...' : 'Calculate Balun' }}
        </button>
      </div>
    </div>

    <div v-if="calculationError" class="error-message">
      {{ calculationError }}
    </div>

    <div v-if="designResults && showReport" class="results-section">
      <h3>Balun Design Results</h3>

      <div class="validation-messages" v-if="validationResult">
        <h4>Validation</h4>
        <div
          v-for="(message, index) in validationResult.messages"
          :key="index"
          :class="['validation-message', `message-${message.type}`]"
        >
          <span class="message-icon">
            {{ message.type === 'error' ? '❌' : message.type === 'warning' ? '⚠️' : 'ℹ️' }}
          </span>
          <span class="message-text">{{ message.message }}</span>
        </div>

        <div class="validation-summary" :class="validationResult.valid ? 'valid' : 'invalid'">
          <span class="summary-icon">{{ validationResult.valid ? '✅' : '❌' }}</span>
          <span class="summary-text">
            {{
              validationResult.valid
                ? 'This design is valid and should perform well.'
                : 'This design has issues that should be addressed.'
            }}
          </span>
        </div>
      </div>

      <div class="results-grid">
        <div class="result-card">
          <h4>Basic Design</h4>
          <div class="result-item">
            <span class="result-label">Impedance Ratio:</span>
            <span class="result-value"
              >{{ designResults.config.inputImpedance }}Ω:{{
                designResults.config.outputImpedance
              }}Ω (1:{{
                (
                  designResults.config.outputImpedance / designResults.config.inputImpedance
                ).toFixed(1)
              }})</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Frequency Range:</span>
            <span class="result-value"
              >{{ designResults.config.minFrequency }}-{{
                Math.min(
                  designResults.config.maxFrequency,
                  designResults.maxFreqBasedOnLength,
                ).toFixed(1)
              }}
              MHz</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Power Rating:</span>
            <span class="result-value"
              >{{ designResults.calculatedPowerRating.toFixed(1) }} W ({{
                designResults.config.operationMode
              }})</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Core:</span>
            <span class="result-value"
              >{{ designResults.coreModel.id }} ({{ designResults.config.coreCount }}x)</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Primary Turns:</span>
            <span class="result-value">{{ designResults.config.primaryTurns }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Secondary Turns:</span>
            <span class="result-value">{{
              Math.round(
                designResults.config.primaryTurns *
                  Math.sqrt(
                    designResults.config.outputImpedance / designResults.config.inputImpedance,
                  ),
              )
            }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Characteristic Z:</span>
            <span class="result-value"
              >{{ designResults.characteristicImpedance.toFixed(1) }} Ω</span
            >
          </div>
        </div>

        <div class="result-card">
          <h4>Performance Metrics</h4>
          <div class="result-item">
            <span class="result-label">Rule of 4:</span>
            <span class="result-value" :class="designResults.meetsRuleOfFour ? 'good' : 'bad'">
              {{ designResults.meetsRuleOfFour ? 'Met' : 'Not Met' }}
            </span>
          </div>
          <div class="result-item">
            <span class="result-label"
              >Reactance at {{ designResults.config.minFrequency }} MHz:</span
            >
            <span class="result-value">{{ designResults.reactanceAtMinFreq.toFixed(1) }} Ω</span>
          </div>
          <div class="result-item">
            <span class="result-label">Core Loss:</span>
            <span class="result-value" :class="designResults.withinCoreLossLimits ? 'good' : 'bad'">
              {{ designResults.coreLossAtMinFreq.toFixed(1) }} W /
              {{ designResults.maxPermissibleCoreLoss.toFixed(1) }} W max
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Flux Density:</span>
            <span
              class="result-value"
              :class="designResults.fluxDensityInLinearRegion ? 'good' : 'bad'"
            >
              {{ designResults.fluxDensityAtMinFreq.toFixed(1) }} mT (Linear: &lt;50 mT)
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Winding Length:</span>
            <span class="result-value">{{ designResults.windingLengthCm.toFixed(1) }} cm</span>
          </div>
          <div class="result-item">
            <span class="result-label">Max Frequency (Length):</span>
            <span
              class="result-value"
              :class="
                designResults.maxFreqBasedOnLength >= designResults.config.maxFrequency
                  ? 'good'
                  : 'bad'
              "
            >
              {{ designResults.maxFreqBasedOnLength.toFixed(1) }} MHz
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Q Factor:</span>
            <span class="result-value">{{ designResults.qFactorAtMinFreq.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <div class="additional-info">
        <div class="accordion">
          <div class="accordion-item">
            <div class="accordion-header" @click="showBandCoverage = !showBandCoverage">
              <span class="accordion-title">Band Coverage</span>
              <span class="accordion-icon">{{ showBandCoverage ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showBandCoverage }">
              <div class="band-coverage">
                <h4>Ham Band Coverage</h4>
                <div class="band-grid">
                  <div
                    v-for="band in bandCoverage"
                    :key="band.name"
                    class="band-item"
                    :class="{ covered: band.covered }"
                  >
                    <span class="band-name">{{ band.name }}</span>
                    <span class="band-status">{{ band.covered ? '✓' : '✗' }}</span>
                    <span class="band-range">{{ band.min }}-{{ band.max }} MHz</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item" v-if="bandPowerData && swrData">
            <div class="accordion-header" @click="showPowerTransfer = !showPowerTransfer">
              <span class="accordion-title">Power Transfer Analysis</span>
              <span class="accordion-icon">{{ showPowerTransfer ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showPowerTransfer }">
              <div class="power-transfer">
                <h4>Power Transfer to Antenna</h4>
                <p class="power-transfer-explanation">
                  This table shows how the balun's performance affects power transfer across
                  different amateur bands. Higher efficiency values indicate better power transfer
                  from the transmitter to the antenna.
                </p>

                <div class="power-transfer-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Band</th>
                        <th>Frequency (MHz)</th>
                        <th>Inductance (μH)</th>
                        <th>Reactance (Ω)</th>
                        <th>Series R (Ω)</th>
                        <th>Q Factor</th>
                        <th>Flux Density (mT)</th>
                        <th>Power Out (W)</th>
                        <th>Efficiency (%)</th>
                        <th>SWR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(data, index) in bandPowerData"
                        :key="index"
                        :class="{
                          'covered-band': determineBandCoverage(
                            designResults.config.minFrequency,
                            Math.min(
                              designResults.config.maxFrequency,
                              designResults.maxFreqBasedOnLength,
                            ),
                            [
                              {
                                name: data.band,
                                min: data.frequency * 0.9,
                                max: data.frequency * 1.1,
                                covered: false,
                              },
                            ],
                          )[0].covered,
                        }"
                      >
                        <td>{{ data.band }}</td>
                        <td>{{ data.frequency.toFixed(2) }}</td>
                        <td>{{ data.inductance.toFixed(1) }}</td>
                        <td>{{ data.reactance.toFixed(1) }}</td>
                        <td>{{ data.resistance.toFixed(1) }}</td>
                        <td>{{ data.qFactor.toFixed(1) }}</td>
                        <td :class="data.fluxDensity > 50 ? 'bad' : 'good'">
                          {{ data.fluxDensity.toFixed(1) }}
                        </td>
                        <td>{{ data.powerOut.toFixed(1) }}</td>
                        <td :class="data.efficiency < 90 ? 'bad' : 'good'">
                          {{ data.efficiency.toFixed(1) }}
                        </td>
                        <td :class="data.swr > 2 ? 'bad' : 'good'">
                          {{ data.swr.toFixed(2) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="swr-graph">
                  <h5>SWR Across HF Spectrum</h5>
                  <div class="graph-container">
                    <svg width="100%" height="300" viewBox="0 0 800 300" preserveAspectRatio="none">
                      <!-- Graph background -->
                      <rect
                        x="50"
                        y="20"
                        width="700"
                        height="230"
                        fill="#f8f9fa"
                        stroke="#dee2e6"
                      />

                      <!-- X-axis -->
                      <line x1="50" y1="250" x2="750" y2="250" stroke="#495057" stroke-width="2" />

                      <!-- Y-axis -->
                      <line x1="50" y1="20" x2="50" y2="250" stroke="#495057" stroke-width="2" />

                      <!-- X-axis labels -->
                      <text
                        v-for="i in 6"
                        :key="`x-${i}`"
                        :x="50 + (i - 1) * 140"
                        y="270"
                        text-anchor="middle"
                        font-size="12"
                      >
                        {{ (1 + (i - 1) * 6).toFixed(0) }}
                      </text>
                      <text x="400" y="290" text-anchor="middle" font-size="14">
                        Frequency (MHz)
                      </text>

                      <!-- Y-axis labels -->
                      <text
                        v-for="i in 5"
                        :key="`y-${i}`"
                        x="40"
                        :y="250 - i * 46"
                        text-anchor="end"
                        font-size="12"
                      >
                        {{ i * 2 }}
                      </text>
                      <text
                        x="20"
                        y="140"
                        text-anchor="middle"
                        font-size="14"
                        transform="rotate(-90, 20, 140)"
                      >
                        SWR
                      </text>

                      <!-- Grid lines -->
                      <line
                        v-for="i in 5"
                        :key="`grid-y-${i}`"
                        x1="50"
                        :y1="250 - i * 46"
                        x2="750"
                        :y2="250 - i * 46"
                        stroke="#dee2e6"
                        stroke-width="1"
                        stroke-dasharray="5,5"
                      />

                      <line
                        v-for="i in 5"
                        :key="`grid-x-${i}`"
                        :x1="50 + i * 140"
                        y1="20"
                        :x2="50 + i * 140"
                        y2="250"
                        stroke="#dee2e6"
                        stroke-width="1"
                        stroke-dasharray="5,5"
                      />

                      <!-- SWR curve -->
                      <polyline
                        :points="
                          swrData
                            .map((point) => {
                              const x = 50 + (point.frequency - 1) * (700 / 29) // Scale to 1-30 MHz
                              const y = 250 - Math.min(point.swr, 10) * 23 // Scale to SWR 1-10
                              return `${x},${y}`
                            })
                            .join(' ')
                        "
                        fill="none"
                        stroke="hsla(160, 100%, 37%, 1)"
                        stroke-width="2"
                      />

                      <!-- Highlight SWR=2 line -->
                      <line
                        x1="50"
                        y1="204"
                        x2="750"
                        y2="204"
                        stroke="#dc3545"
                        stroke-width="1"
                        stroke-dasharray="5,5"
                      />
                      <text x="755" y="204" text-anchor="start" font-size="12" fill="#dc3545">
                        SWR=2
                      </text>

                      <!-- Highlight operating range -->
                      <rect
                        :x="50 + (designResults.config.minFrequency - 1) * (700 / 29)"
                        y="20"
                        :width="
                          (Math.min(
                            designResults.config.maxFrequency,
                            designResults.maxFreqBasedOnLength,
                          ) -
                            designResults.config.minFrequency) *
                          (700 / 29)
                        "
                        height="230"
                        fill="rgba(0, 123, 255, 0.1)"
                        stroke="rgba(0, 123, 255, 0.5)"
                      />
                    </svg>
                  </div>
                  <div class="graph-legend">
                    <div class="legend-item">
                      <span
                        class="legend-color"
                        style="background-color: hsla(160, 100%, 37%, 1)"
                      ></span>
                      <span class="legend-label">SWR Curve</span>
                    </div>
                    <div class="legend-item">
                      <span
                        class="legend-color"
                        style="background-color: rgba(0, 123, 255, 0.5)"
                      ></span>
                      <span class="legend-label">Operating Range</span>
                    </div>
                    <div class="legend-item">
                      <span
                        class="legend-color"
                        style="background-color: #dc3545; height: 2px"
                      ></span>
                      <span class="legend-label">SWR=2 Threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item" v-if="recommendedWireInfo">
            <div class="accordion-header" @click="showWireInfo = !showWireInfo">
              <span class="accordion-title">Wire Information</span>
              <span class="accordion-icon">{{ showWireInfo ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showWireInfo }">
              <div class="wire-info">
                <h4>Wire Information</h4>
                <div class="wire-details">
                  <div class="wire-item">
                    <span class="wire-label">Recommended Wire:</span>
                    <span class="wire-value">AWG {{ recommendedWireInfo.gauge }}</span>
                  </div>
                  <div class="wire-item">
                    <span class="wire-label">Wire Diameter:</span>
                    <span class="wire-value">{{ recommendedWireInfo.diameter.toFixed(2) }} mm</span>
                  </div>
                  <div class="wire-item">
                    <span class="wire-label">Cross-sectional Area:</span>
                    <span class="wire-value">{{ recommendedWireInfo.area.toFixed(2) }} mm²</span>
                  </div>
                  <div class="wire-item">
                    <span class="wire-label">Current Capacity:</span>
                    <span class="wire-value"
                      >{{ recommendedWireInfo.currentCapacity.toFixed(2) }} A</span
                    >
                  </div>
                </div>
                <div class="wire-notes">
                  <p>
                    <strong>Note:</strong> For bifilar windings, use two identical wires placed
                    parallel to each other. For optimal performance, use insulated wire (enamel,
                    PTFE, etc.) to prevent shorts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item" v-if="designResults?.windingInfo">
            <div
              class="accordion-header"
              @click="showWindingInstructions = !showWindingInstructions"
            >
              <span class="accordion-title">Winding Instructions</span>
              <span class="accordion-icon">{{ showWindingInstructions ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showWindingInstructions }">
              <div class="winding-instructions">
                <h4>Winding Instructions</h4>
                <div class="winding-details">
                  <div class="winding-info-grid">
                    <div class="winding-info-item">
                      <span class="winding-info-label">Winding Style:</span>
                      <span class="winding-info-value">{{ designResults.windingInfo.style }}</span>
                    </div>
                    <div class="winding-info-item">
                      <span class="winding-info-label">Construction Method:</span>
                      <span class="winding-info-value">{{
                        designResults.windingInfo.construction === 'classical'
                          ? 'Classical Transformer'
                          : 'Autotransformer'
                      }}</span>
                    </div>
                    <div class="winding-info-item">
                      <span class="winding-info-label">Wire Count:</span>
                      <span class="winding-info-value">{{
                        designResults.windingInfo.wireCount
                      }}</span>
                    </div>
                    <div class="winding-info-item">
                      <span class="winding-info-label">Connection Type:</span>
                      <span class="winding-info-value">{{
                        designResults.windingInfo.connectionDetails
                      }}</span>
                    </div>
                  </div>

                  <div
                    class="winding-instructions-content"
                    v-html="
                      formatInstructions(
                        WindingStyleCalculator.generateWindingInstructions(
                          designResults.windingInfo,
                          designResults.config.primaryTurns,
                          designResults.coreModel.id,
                        ),
                      )
                    "
                  ></div>

                  <div
                    v-if="
                      designResults.windingInfo.construction === 'autotransformer' &&
                      !designResults.config.useHybridDesign &&
                      WindingStyleCalculator.shouldUseHybridDesign(
                        designResults.config.inputImpedance,
                        designResults.config.outputImpedance,
                      )
                    "
                    class="winding-suggestion"
                  >
                    <div class="suggestion-icon">💡</div>
                    <div class="suggestion-text">
                      <strong>Construction Suggestion:</strong> For this non-standard impedance
                      ratio (1:{{
                        (
                          designResults.config.outputImpedance / designResults.config.inputImpedance
                        ).toFixed(1)
                      }}), consider using a hybrid design (1:1 current balun + unun) instead of the
                      autotransformer approach for better performance and simpler construction.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <div class="accordion-header" @click="showPerformanceDetails = !showPerformanceDetails">
              <span class="accordion-title">Performance Details</span>
              <span class="accordion-icon">{{ showPerformanceDetails ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showPerformanceDetails }">
              <div class="performance-details">
                <h4>Detailed Performance Analysis</h4>
                <div class="performance-grid">
                  <div class="performance-item">
                    <h5>Core Properties</h5>
                    <div class="detail-item">
                      <span class="detail-label">Core Model:</span>
                      <span class="detail-value">{{ designResults.coreModel.id }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Mix:</span>
                      <span class="detail-value">{{ designResults.coreModel.mix }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Initial Permeability:</span>
                      <span class="detail-value">{{
                        designResults.coreModel.initialPermeability
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Saturation Flux Density:</span>
                      <span class="detail-value"
                        >{{ designResults.coreModel.saturationFluxDensity }} mT</span
                      >
                    </div>
                  </div>

                  <div class="performance-item">
                    <h5>Electrical Parameters</h5>
                    <div class="detail-item">
                      <span class="detail-label"
                        >Impedance at {{ designResults.config.minFrequency }} MHz:</span
                      >
                      <span class="detail-value"
                        >{{ designResults.impedanceAtMinFreq.toFixed(1) }} Ω</span
                      >
                    </div>
                    <div class="detail-item">
                      <span class="detail-label"
                        >Reactance at {{ designResults.config.minFrequency }} MHz:</span
                      >
                      <span class="detail-value"
                        >{{ designResults.reactanceAtMinFreq.toFixed(1) }} Ω</span
                      >
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Q Factor:</span>
                      <span class="detail-value">{{
                        designResults.qFactorAtMinFreq.toFixed(1)
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Flux Density:</span>
                      <span class="detail-value"
                        >{{ designResults.fluxDensityAtMinFreq.toFixed(1) }} mT</span
                      >
                    </div>
                  </div>

                  <div class="performance-item">
                    <h5>Thermal Considerations</h5>
                    <div class="detail-item">
                      <span class="detail-label">Core Loss:</span>
                      <span class="detail-value"
                        >{{ designResults.coreLossAtMinFreq.toFixed(1) }} W</span
                      >
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Max Permissible Loss:</span>
                      <span class="detail-value"
                        >{{ designResults.maxPermissibleCoreLoss.toFixed(1) }} W</span
                      >
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Loss Ratio:</span>
                      <span class="detail-value">{{
                        (
                          designResults.coreLossAtMinFreq / designResults.maxPermissibleCoreLoss
                        ).toFixed(2)
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Duty Cycle Factor:</span>
                      <span class="detail-value"
                        >{{ dutyCycleFactor[designResults.config.operationMode] }}x</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hybridComponents && showHybridDesign" class="hybrid-design">
            <div class="section-header">
              <h4>Hybrid Design (Balun + Unun)</h4>
            </div>

            <div class="hybrid-components">
              <div class="hybrid-component">
                <h5>Component 1: Current Balun (1:1)</h5>
                <div class="component-item">
                  <span class="component-label">Core:</span>
                  <span class="component-value">{{ hybridComponents.balun.coreType }}</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Turns:</span>
                  <span class="component-value">{{ hybridComponents.balun.turns }} (bifilar)</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Input Impedance:</span>
                  <span class="component-value">{{ hybridComponents.balun.inputImpedance }}Ω</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Output Impedance:</span>
                  <span class="component-value"
                    >{{ hybridComponents.balun.outputImpedance }}Ω balanced</span
                  >
                </div>
              </div>

              <div class="hybrid-component">
                <h5>Component 2: Unun Transformer</h5>
                <div class="component-item">
                  <span class="component-label">Core:</span>
                  <span class="component-value">{{ hybridComponents.unun.coreType }}</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Primary Turns:</span>
                  <span class="component-value">{{ hybridComponents.unun.turns.primary }}</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Secondary Turns:</span>
                  <span class="component-value">{{ hybridComponents.unun.turns.secondary }}</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Input Impedance:</span>
                  <span class="component-value">{{ hybridComponents.unun.inputImpedance }}Ω</span>
                </div>
                <div class="component-item">
                  <span class="component-label">Output Impedance:</span>
                  <span class="component-value">{{ hybridComponents.unun.outputImpedance }}Ω</span>
                </div>
              </div>
            </div>

            <div class="hybrid-notes">
              <h5>Construction Notes</h5>
              <ol>
                <li>
                  Construct the 1:1 current balun using {{ hybridComponents.balun.turns }} bifilar
                  turns (parallel wires, not twisted) of AWG
                  {{
                    calculateRecommendedWireGauge(power, hybridComponents.balun.inputImpedance)
                      .gauge
                  }}
                  wire.
                </li>
                <li>
                  Construct the unun transformer with
                  {{ hybridComponents.unun.turns.primary }} primary turns and
                  {{ hybridComponents.unun.turns.secondary }} secondary turns.
                </li>
                <li>
                  Connect the output of the current balun to the input of the unun transformer.
                </li>
                <li>Keep connections between components as short as possible.</li>
                <li>
                  Install both components in a weatherproof enclosure with adequate ventilation.
                </li>
              </ol>

              <div class="advantages">
                <h5>Advantages of This Hybrid Design</h5>
                <ul>
                  <li>
                    Improved common-mode rejection compared to direct 1:{{
                      (outputImpedance / inputImpedance).toFixed(1)
                    }}
                    balun
                  </li>
                  <li>Better balanced output for symmetrical antennas</li>
                  <li>Optimized characteristic impedance for each component</li>
                  <li>Superior performance with difficult loads</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <div class="accordion-header" @click="showCoreInfo = !showCoreInfo">
              <span class="accordion-title">Core Information</span>
              <span class="accordion-icon">{{ showCoreInfo ? '▼' : '▶' }}</span>
            </div>
            <div class="accordion-content" :class="{ 'accordion-open': showCoreInfo }">
              <div class="core-detailed-info">
                <h4>Core Specifications</h4>

                <div class="core-dimensions">
                  <h5>Core Type</h5>
                  <div class="core-type-info">
                    <div class="core-type-item">
                      <span class="core-type-label">Model:</span>
                      <span class="core-type-value">{{ designResults.coreModel.id }}</span>
                    </div>
                    <div class="core-type-item">
                      <span class="core-type-label">Mix:</span>
                      <span class="core-type-value">{{ designResults.coreModel.mix }}</span>
                    </div>
                    <div class="core-type-item">
                      <span class="core-type-label">Initial Permeability:</span>
                      <span class="core-type-value">{{
                        designResults.coreModel.initialPermeability
                      }}</span>
                    </div>
                  </div>

                  <h5>Physical Dimensions</h5>
                  <div class="dimensions-grid">
                    <div class="dimension-item">
                      <span class="dimension-label">Outside Diameter (OD):</span>
                      <span class="dimension-value"
                        >{{ designResults.coreModel.dimensions.od }} mm</span
                      >
                    </div>
                    <div class="dimension-item">
                      <span class="dimension-label">Inside Diameter (ID):</span>
                      <span class="dimension-value"
                        >{{ designResults.coreModel.dimensions.id }} mm</span
                      >
                    </div>
                    <div class="dimension-item">
                      <span class="dimension-label">Height:</span>
                      <span class="dimension-value"
                        >{{ designResults.coreModel.dimensions.height }} mm</span
                      >
                    </div>
                    <div class="dimension-item">
                      <span class="dimension-label">Effective Path Length (Le):</span>
                      <span class="dimension-value"
                        >{{
                          (
                            (Math.PI *
                              (designResults.coreModel.dimensions.od +
                                designResults.coreModel.dimensions.id)) /
                            20
                          ).toFixed(2)
                        }}
                        cm</span
                      >
                    </div>
                    <div class="dimension-item">
                      <span class="dimension-label">Effective Cross-Section (Ae):</span>
                      <span class="dimension-value"
                        >{{
                          (
                            ((designResults.coreModel.dimensions.od -
                              designResults.coreModel.dimensions.id) *
                              designResults.coreModel.dimensions.height) /
                            200
                          ).toFixed(2)
                        }}
                        cm²</span
                      >
                    </div>
                  </div>
                </div>

                <div class="permeability-data">
                  <h5>Permeability Data for Mix {{ designResults.coreModel.mix }}</h5>
                  <div class="permeability-table-container">
                    <table class="permeability-table">
                      <thead>
                        <tr>
                          <th>Frequency (MHz)</th>
                          <th>μ' (Real)</th>
                          <th>μ" (Imaginary)</th>
                          <th>|μ| (Complex)</th>
                          <th>Q Factor</th>
                          <th>tanδ/μ'</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(freq, index) in [1, 2, 5, 10, 20, 30]" :key="index">
                          <td>{{ freq }}</td>
                          <td>
                            {{
                              CoreCalculator.interpolatePermeability(
                                freq,
                                designResults.coreModel,
                              )[0].toFixed(1)
                            }}
                          </td>
                          <td>
                            {{
                              CoreCalculator.interpolatePermeability(
                                freq,
                                designResults.coreModel,
                              )[1].toFixed(1)
                            }}
                          </td>
                          <td>
                            {{
                              Math.sqrt(
                                Math.pow(
                                  CoreCalculator.interpolatePermeability(
                                    freq,
                                    designResults.coreModel,
                                  )[0],
                                  2,
                                ) +
                                  Math.pow(
                                    CoreCalculator.interpolatePermeability(
                                      freq,
                                      designResults.coreModel,
                                    )[1],
                                    2,
                                  ),
                              ).toFixed(1)
                            }}
                          </td>
                          <td>
                            {{
                              (
                                CoreCalculator.interpolatePermeability(
                                  freq,
                                  designResults.coreModel,
                                )[0] /
                                CoreCalculator.interpolatePermeability(
                                  freq,
                                  designResults.coreModel,
                                )[1]
                              ).toFixed(1)
                            }}
                          </td>
                          <td>
                            {{
                              (
                                CoreCalculator.interpolatePermeability(
                                  freq,
                                  designResults.coreModel,
                                )[1] /
                                CoreCalculator.interpolatePermeability(
                                  freq,
                                  designResults.coreModel,
                                )[0]
                              ).toFixed(4)
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="
              designResults.alternativeConfigurations &&
              designResults.alternativeConfigurations.length > 0
            "
            class="alternative-designs"
          >
            <div class="section-header">
              <h4>Alternative Designs</h4>
              <button @click="showAlternativeDesigns = !showAlternativeDesigns">
                {{ showAlternativeDesigns ? 'Hide' : 'Show' }}
              </button>
            </div>

            <div v-if="showAlternativeDesigns" class="alternatives-container">
              <div
                v-for="(alt, index) in designResults.alternativeConfigurations"
                :key="index"
                class="alternative-card"
              >
                <h5>Alternative {{ index + 1 }}</h5>
                <div class="alt-item">
                  <span class="alt-label">Impedance Ratio:</span>
                  <span class="alt-value"
                    >{{ alt.config.inputImpedance }}Ω:{{ alt.config.outputImpedance }}Ω</span
                  >
                </div>
                <div class="alt-item">
                  <span class="alt-label">Frequency Range:</span>
                  <span class="alt-value"
                    >{{ alt.config.minFrequency }}-{{
                      Math.min(alt.config.maxFrequency, alt.maxFreqBasedOnLength).toFixed(1)
                    }}
                    MHz</span
                  >
                </div>
                <div class="alt-item">
                  <span class="alt-label">Cores:</span>
                  <span class="alt-value">{{ alt.config.coreCount }}x {{ alt.coreModel.id }}</span>
                </div>
                <div class="alt-item">
                  <span class="alt-label">Primary Turns:</span>
                  <span class="alt-value">{{ alt.config.primaryTurns }}</span>
                </div>
                <div class="alt-item">
                  <span class="alt-label">Type:</span>
                  <span class="alt-value">{{
                    alt.config.useHybridDesign ? 'Hybrid' : 'Standard'
                  }}</span>
                </div>
                <div class="alt-item">
                  <span class="alt-label">Power Rating:</span>
                  <span class="alt-value">{{ alt.calculatedPowerRating.toFixed(1) }} W</span>
                </div>
              </div>
            </div>
          </div>

          <div class="design-report">
            <div class="report-toggle">
              <button @click="showReport = !showReport">
                {{ showReport ? 'Hide Full Report' : 'Show Full Report' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.balun-calculator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.calculator-intro {
  margin-bottom: 2rem;
}

.calculator-intro h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.calculator-intro p {
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.design-steps {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
}

.design-steps h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.design-steps ol {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.design-steps li {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.info-box {
  background-color: rgba(0, 128, 0, 0.05);
  border-left: 4px solid hsla(160, 100%, 37%, 1);
  padding: 1rem;
  margin-top: 1rem;
}

.info-box h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.info-box ul {
  padding-left: 1.5rem;
  margin: 0;
}

.info-box li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.toggle-button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: var(--color-background-mute);
  border-color: hsla(160, 100%, 37%, 0.5);
}

.calculator-form {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.presets-section {
  margin-bottom: 1.5rem;
}

.presets-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.presets-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.preset-button {
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.preset-button:hover {
  background-color: hsla(160, 100%, 37%, 0.1);
  border-color: hsla(160, 100%, 37%, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.form-group {
  flex: 1 1 calc(33.333% - 1rem);
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  border-color: hsla(160, 100%, 37%, 1);
  outline: none;
}

.calculated-value {
  padding: 0.75rem;
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--color-text);
}

.characteristic-impedance-warning {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background-color: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.5;
}

.core-info {
  margin-top: 1.5rem;
  background-color: var(--color-background-mute);
  border-radius: 4px;
  padding: 1rem;
}

.core-info h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.core-properties {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.property {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.property-label {
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: var(--color-text-light);
}

.property-value {
  color: var(--color-text);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.toggle-advanced,
.reset-button,
.calculate-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.toggle-advanced {
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-advanced::before {
  content: '⚙️';
  font-size: 1.1rem;
}

.toggle-advanced:hover {
  background-color: var(--color-background-soft);
  border-color: hsla(160, 100%, 37%, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.reset-button {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: rgb(220, 53, 69);
}

.reset-button:hover {
  background-color: rgba(220, 53, 69, 0.2);
}

.calculate-button {
  background-color: hsla(160, 100%, 37%, 0.8);
  border: 1px solid hsla(160, 100%, 37%, 1);
  color: white;
}

.calculate-button:hover {
  background-color: hsla(160, 100%, 37%, 1);
  transform: translateY(-2px);
}

.calculate-button:disabled {
  background-color: var(--color-background-mute);
  border-color: var(--color-border);
  color: var(--color-text-light);
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: rgb(220, 53, 69);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.results-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.results-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  text-align: center;
}

.validation-messages {
  margin-bottom: 1.5rem;
}

.validation-messages h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.validation-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.message-error {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.message-warning {
  background-color: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.5);
}

.message-info {
  background-color: rgba(13, 110, 253, 0.1);
  border: 1px solid rgba(13, 110, 253, 0.5);
}

.message-icon {
  font-size: 1.25rem;
}

.message-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.5;
}

.validation-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.validation-summary.valid {
  background-color: rgba(25, 135, 84, 0.1);
  border: 1px solid rgba(25, 135, 84, 0.5);
}

.validation-summary.invalid {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-text {
  flex: 1;
  font-size: 1rem;
  font-weight: bold;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.result-card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.result-card h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.result-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.result-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.result-value {
  font-size: 1rem;
  color: var(--color-text);
}

.result-value.good {
  color: hsla(160, 100%, 37%, 1);
}

.result-value.bad {
  color: rgb(220, 53, 69);
}

.additional-info {
  margin-top: 2rem;
}

.accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.accordion-item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-background);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--color-background-soft);
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.accordion-header:hover {
  background-color: var(--color-background-mute);
}

.accordion-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.accordion-icon {
  font-size: 0.9rem;
  color: var(--color-text-light);
  transition: transform 0.3s ease;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-content.accordion-open {
  max-height: 2000px; /* Large enough to contain content */
  transition: max-height 0.5s ease-in;
}

.band-coverage {
  padding: 1.25rem;
}

.band-coverage h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.band-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.band-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}

.band-item.covered {
  background-color: rgba(25, 135, 84, 0.1);
  border-color: rgba(25, 135, 84, 0.5);
}

.band-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.band-status {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.band-range {
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.wire-info {
  padding: 1.25rem;
}

.wire-info h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.wire-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.wire-item {
  display: flex;
  flex-direction: column;
}

.wire-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.wire-value {
  font-size: 1rem;
  color: var(--color-text);
}

.wire-notes {
  background-color: var(--color-background-mute);
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.winding-instructions {
  padding: 1.25rem;
}

.winding-instructions h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.winding-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
}

.winding-info-item {
  display: flex;
  flex-direction: column;
}

.winding-info-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.winding-info-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: bold;
}

.winding-instructions-content {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.winding-instructions-content h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.winding-instructions-content ul,
.winding-instructions-content ol {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.winding-instructions-content li {
  margin-bottom: 0.5rem;
}

.winding-suggestion {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background-color: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.5);
  border-radius: 8px;
  padding: 1rem;
}

.suggestion-icon {
  font-size: 1.5rem;
}

.suggestion-text {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;
}

.performance-details {
  padding: 1.25rem;
}

.performance-details h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.performance-item {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.performance-item h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.detail-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.detail-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1rem;
  color: var(--color-text);
}

.alternative-designs {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: var(--color-heading);
}

.section-header button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.section-header button:hover {
  background-color: var(--color-background-mute);
  border-color: hsla(160, 100%, 37%, 0.5);
}

.alternatives-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.alternative-card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.alternative-card h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.alt-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.alt-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.alt-value {
  font-size: 1rem;
  color: var(--color-text);
}

.hybrid-design {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.hybrid-components {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.hybrid-component {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.hybrid-component h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.component-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.component-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.component-value {
  font-size: 1rem;
  color: var(--color-text);
}

.hybrid-notes {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.hybrid-notes h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.hybrid-notes ol,
.hybrid-notes ul {
  padding-left: 1.5rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.hybrid-notes li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.advantages h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.design-report {
  margin-top: 2rem;
  text-align: center;
}

.report-toggle button {
  background-color: hsla(160, 100%, 37%, 0.8);
  border: 1px solid hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.report-toggle button:hover {
  background-color: hsla(160, 100%, 37%, 1);
  transform: translateY(-2px);
}

.core-detailed-info {
  padding: 1.25rem;
}

.core-detailed-info h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.core-dimensions {
  margin-bottom: 2rem;
}

.core-type-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.core-type-item {
  display: flex;
  flex-direction: column;
}

.core-type-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.core-type-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.core-dimensions h5,
.permeability-data h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.dimension-item {
  display: flex;
  flex-direction: column;
}

.dimension-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.dimension-value {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.permeability-table-container {
  overflow-x: auto;
}

.permeability-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.permeability-table th,
.permeability-table td {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  text-align: center;
}

.permeability-table th {
  background-color: var(--color-background-soft);
  font-weight: 600;
  color: var(--color-heading);
}

.permeability-table tr:nth-child(even) {
  background-color: var(--color-background-mute);
}

.power-transfer {
  padding: 1.25rem;
}

.power-transfer h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.power-transfer-explanation {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.power-transfer-table {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.power-transfer-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.power-transfer-table th,
.power-transfer-table td {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  text-align: center;
}

.power-transfer-table th {
  background-color: var(--color-background-soft);
  font-weight: 600;
  color: var(--color-heading);
}

.power-transfer-table tr.covered-band {
  background-color: rgba(25, 135, 84, 0.1);
}

.swr-graph {
  margin-top: 2rem;
}

.swr-graph h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.graph-container {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 20px;
  height: 10px;
  border-radius: 2px;
}

.legend-label {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .form-group {
    flex: 1 1 100%;
  }

  .preset-button {
    flex: 1 1 100%;
  }

  .results-grid,
  .performance-grid,
  .hybrid-components,
  .alternatives-container {
    grid-template-columns: 1fr;
  }

  .band-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
