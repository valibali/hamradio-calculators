<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { WindingStyleCalculator, type WindingStyleInfo } from './winding-style-calculator'

// Enums and interfaces
enum OperationMode {
  SSB = 'SSB',
  CW = 'CW',
  DIGITAL = 'DIGITAL',
  FIFTY_PERCENT = '50_PERCENT',
  CONTINUOUS = 'CONTINUOUS',
}

interface PermeabilityData {
  freq: number
  muPrime: number
  muDoublePrime: number
  q: number
  muComplex: number
}

interface CoreDimensions {
  od: number
  id: number
  height: number
  le: number
  ae: number
  volume: number
  heatConductionCoeff: number
}

interface CoreModel {
  id: string
  mix: string
  initialPermeability: number
  saturationFluxDensity: number
  curieTemperature: number
  recommendedFreqRange: {
    min: number
    max: number
  }
  dimensions: CoreDimensions
  permeabilityData: PermeabilityData[]
}

interface WireSpec {
  awg: number
  diameterMm: number
  areaMm2: number
  currentCapacity: number
}

interface BalunConfig {
  inputImpedance: number
  outputImpedance: number
  power: number
  minFrequency: number
  maxFrequency: number
  operationMode: OperationMode
  coreCount: number
  primaryTurns: number
  useHybridDesign: boolean
}

interface BalunResults {
  config: BalunConfig
  coreModel: CoreModel
  meetsRuleOfFour: boolean
  withinCoreLossLimits: boolean
  fluxDensityInLinearRegion: boolean
  windingLengthCm: number
  maxFreqBasedOnLength: number
  coreLossAtMinFreq: number
  maxPermissibleCoreLoss: number
  fluxDensityAtMinFreq: number
  reactanceAtMinFreq: number
  impedanceAtMinFreq: number
  qFactorAtMinFreq: number
  characteristicImpedance: number
  recommendedWireGauge: number
  calculatedPowerRating: number
  windingInfo?: WindingStyleInfo
  alternativeConfigurations?: BalunResults[]
}

interface ValidationResult {
  valid: boolean
  messages: Array<{
    type: 'info' | 'warning' | 'error'
    message: string
  }>
}

interface HybridComponents {
  balun: {
    coreType: string
    inputImpedance: number
    outputImpedance: number
    turns: number
    characteristicImpedance: number
  }
  unun: {
    coreType: string
    inputImpedance: number
    outputImpedance: number
    turns: {
      primary: number
      secondary: number
    }
    characteristicImpedance: number
  }
}

// Constants
const constants = {
  ruleOfFourFactor: 4,
  maxLinearFluxDensity: 50,
  maxTempRise: 30,
  currentDensity: 1.5,
  speedOfLight: 3e8,
  windingLengthFactor: 1.2,
  maxWindingLengthFraction: 0.1,
  mu0: 4 * Math.PI * 1e-7,
}

const dutyCycleFactor: Record<OperationMode, number> = {
  [OperationMode.SSB]: 3.0,
  [OperationMode.CW]: 3.0,
  [OperationMode.DIGITAL]: 2.5,
  [OperationMode.FIFTY_PERCENT]: 1.5,
  [OperationMode.CONTINUOUS]: 1.0,
}

// Core models data
const mix43PermeabilityData: PermeabilityData[] = [
  { freq: 0.01, muPrime: 791.5, muDoublePrime: 3.5, q: 226.1, muComplex: 791.5 },
  { freq: 0.05, muPrime: 789.1, muDoublePrime: 3.9, q: 202.3, muComplex: 789.1 },
  { freq: 0.1, muPrime: 788.0, muDoublePrime: 6.0, q: 131.3, muComplex: 788.0 },
  { freq: 0.3, muPrime: 790.6, muDoublePrime: 10.9, q: 72.5, muComplex: 790.7 },
  { freq: 0.5, muPrime: 795.1, muDoublePrime: 17.9, q: 44.4, muComplex: 795.3 },
  { freq: 0.7, muPrime: 787.8, muDoublePrime: 24.9, q: 31.6, muComplex: 788.2 },
  { freq: 1.0, muPrime: 747.1, muDoublePrime: 62.8, q: 11.9, muComplex: 749.7 },
  { freq: 1.17, muPrime: 713.5, muDoublePrime: 83.0, q: 8.6, muComplex: 718.3 },
  { freq: 1.36, muPrime: 673.6, muDoublePrime: 107.3, q: 6.3, muComplex: 682.1 },
  { freq: 1.6, muPrime: 637.4, muDoublePrime: 131.6, q: 4.8, muComplex: 650.8 },
  { freq: 1.84, muPrime: 608.7, muDoublePrime: 155.2, q: 3.9, muComplex: 628.2 },
  { freq: 2.15, muPrime: 572.3, muDoublePrime: 176.3, q: 3.2, muComplex: 598.8 },
  { freq: 2.5, muPrime: 544.2, muDoublePrime: 194.4, q: 2.8, muComplex: 577.9 },
  { freq: 2.92, muPrime: 513.4, muDoublePrime: 208.9, q: 2.5, muComplex: 554.3 },
  { freq: 3.4, muPrime: 480.6, muDoublePrime: 219.6, q: 2.2, muComplex: 528.4 },
  { freq: 3.96, muPrime: 446.9, muDoublePrime: 226.8, q: 2.0, muComplex: 501.2 },
  { freq: 4.62, muPrime: 413.5, muDoublePrime: 230.6, q: 1.8, muComplex: 473.5 },
  { freq: 5.38, muPrime: 380.8, muDoublePrime: 231.5, q: 1.6, muComplex: 445.6 },
  { freq: 6.27, muPrime: 349.2, muDoublePrime: 230.3, q: 1.5, muComplex: 418.3 },
  { freq: 7.31, muPrime: 318.9, muDoublePrime: 227.4, q: 1.4, muComplex: 391.7 },
  { freq: 8.51, muPrime: 289.8, muDoublePrime: 223.5, q: 1.3, muComplex: 366.0 },
  { freq: 9.92, muPrime: 261.7, muDoublePrime: 218.7, q: 1.2, muComplex: 341.1 },
  { freq: 11.6, muPrime: 234.3, muDoublePrime: 212.7, q: 1.1, muComplex: 316.4 },
  { freq: 13.5, muPrime: 207.7, muDoublePrime: 205.8, q: 1.0, muComplex: 292.4 },
  { freq: 15.7, muPrime: 182.0, muDoublePrime: 197.6, q: 0.9, muComplex: 268.6 },
  { freq: 18.3, muPrime: 157.5, muDoublePrime: 188.2, q: 0.8, muComplex: 245.4 },
  { freq: 21.3, muPrime: 134.6, muDoublePrime: 177.5, q: 0.8, muComplex: 222.8 },
  { freq: 24.8, muPrime: 113.8, muDoublePrime: 165.8, q: 0.7, muComplex: 201.1 },
  { freq: 28.9, muPrime: 94.9, muDoublePrime: 153.5, q: 0.6, muComplex: 180.5 },
  { freq: 33.7, muPrime: 78.7, muDoublePrime: 140.9, q: 0.6, muComplex: 161.4 },
  { freq: 39.3, muPrime: 64.2, muDoublePrime: 128.3, q: 0.5, muComplex: 143.5 },
  { freq: 45.8, muPrime: 51.9, muDoublePrime: 116.0, q: 0.4, muComplex: 127.1 },
  { freq: 53.4, muPrime: 41.5, muDoublePrime: 104.2, q: 0.4, muComplex: 112.2 },
]

const coreModels: CoreModel[] = [
  {
    id: 'FT140-43',
    mix: '43',
    initialPermeability: 800,
    saturationFluxDensity: 290,
    curieTemperature: 130,
    recommendedFreqRange: {
      min: 1,
      max: 50,
    },
    dimensions: {
      od: 36,
      id: 23,
      height: 12.7,
      le: 8.9,
      ae: 0.79,
      volume: 7.65,
      heatConductionCoeff: 0.044,
    },
    permeabilityData: mix43PermeabilityData,
  },
  {
    id: 'FT240-43',
    mix: '43',
    initialPermeability: 800,
    saturationFluxDensity: 290,
    curieTemperature: 130,
    recommendedFreqRange: {
      min: 1,
      max: 50,
    },
    dimensions: {
      od: 61,
      id: 35.6,
      height: 12.7,
      le: 14.7,
      ae: 1.33,
      volume: 19.6,
      heatConductionCoeff: 0.044,
    },
    permeabilityData: mix43PermeabilityData,
  },
]

const wireSpecs: WireSpec[] = [
  { awg: 12, diameterMm: 2.05, areaMm2: 3.31, currentCapacity: 4.97 },
  { awg: 14, diameterMm: 1.63, areaMm2: 2.08, currentCapacity: 3.12 },
  { awg: 16, diameterMm: 1.29, areaMm2: 1.31, currentCapacity: 1.97 },
  { awg: 18, diameterMm: 1.02, areaMm2: 0.82, currentCapacity: 1.23 },
  { awg: 20, diameterMm: 0.81, areaMm2: 0.52, currentCapacity: 0.78 },
  { awg: 22, diameterMm: 0.64, areaMm2: 0.33, currentCapacity: 0.49 },
]

const hamBands = [
  { name: '160m', min: 1.8, max: 2.0 },
  { name: '80m', min: 3.5, max: 4.0 },
  { name: '60m', min: 5.3, max: 5.4 },
  { name: '40m', min: 7.0, max: 7.3 },
  { name: '30m', min: 10.1, max: 10.15 },
  { name: '20m', min: 14.0, max: 14.35 },
  { name: '17m', min: 18.068, max: 18.168 },
  { name: '15m', min: 21.0, max: 21.45 },
  { name: '12m', min: 24.89, max: 24.99 },
  { name: '10m', min: 28.0, max: 29.7 },
  { name: '6m', min: 50.0, max: 54.0 },
]

export default defineComponent({
  name: 'BalunCalculator',
  setup() {
    // Form inputs
    const inputImpedance = ref(50)
    const outputImpedance = ref(200)
    const power = ref(100)
    const minFrequency = ref(3.5)
    const maxFrequency = ref(30)
    const operationMode = ref(OperationMode.SSB)
    const coreCount = ref(1)
    const primaryTurns = ref(0) // 0 means auto-calculate
    const useHybridDesign = ref(false)
    const selectedCoreModel = ref(coreModels[0].id)
    const showAdvancedOptions = ref(false)
    const showDesignSteps = ref(false)
    const showAlternativeDesigns = ref(false)
    const showHybridDesign = ref(false)
    const showBandCoverage = ref(false)
    const showWireInfo = ref(false)
    const showPerformanceDetails = ref(false)
    const showWindingInstructions = ref(false)
    const showReport = ref(false)
    const designResults = ref<BalunResults | null>(null)
    const hybridComponents = ref<HybridComponents | null>(null)
    const validationResult = ref<ValidationResult | null>(null)
    const hybridReport = ref<string>('')
    const designReport = ref<string>('')
    const isCalculating = ref(false)
    const calculationError = ref<string | null>(null)

    // Computed properties
    const impedanceRatio = computed(() => {
      return outputImpedance.value / inputImpedance.value
    })

    const characteristicImpedance = computed(() => {
      return Math.sqrt(inputImpedance.value * outputImpedance.value)
    })

    const shouldUseHybridDesign = computed(() => {
      const charZ = characteristicImpedance.value
      return Math.abs(charZ - 50) > 10 && Math.abs(charZ - 100) > 10
    })

    const selectedCore = computed(() => {
      return coreModels.find((core) => core.id === selectedCoreModel.value) || coreModels[0]
    })

    const operationModeOptions = computed(() => {
      return [
        { value: OperationMode.SSB, label: 'SSB (Voice)' },
        { value: OperationMode.CW, label: 'CW (Morse)' },
        { value: OperationMode.DIGITAL, label: 'Digital Modes (FT8, etc.)' },
        { value: OperationMode.FIFTY_PERCENT, label: '50% Duty Cycle' },
        { value: OperationMode.CONTINUOUS, label: 'Continuous (100% Duty Cycle)' },
      ]
    })

    const coreModelOptions = computed(() => {
      return coreModels.map((core) => ({
        value: core.id,
        label: `${core.id} (${core.mix} Mix)`,
      }))
    })

    const bandCoverage = computed(() => {
      if (!designResults.value) return []

      const maxFreq = Math.min(
        designResults.value.config.maxFrequency,
        designResults.value.maxFreqBasedOnLength,
      )

      return hamBands.map((band) => ({
        ...band,
        covered: band.min >= designResults.value!.config.minFrequency && band.max <= maxFreq,
      }))
    })

    const recommendedWireInfo = computed(() => {
      if (!designResults.value) return null

      const wireGauge = designResults.value.recommendedWireGauge
      const wireSpec = wireSpecs.find((w) => w.awg === wireGauge)

      if (!wireSpec) return null

      return {
        gauge: wireSpec.awg,
        diameter: wireSpec.diameterMm,
        area: wireSpec.areaMm2,
        currentCapacity: wireSpec.currentCapacity,
      }
    })

    // Methods
    function getPermeabilityAtFrequency(core: CoreModel, freqMHz: number): PermeabilityData {
      // Sort permeability data by frequency
      const sortedData = [...core.permeabilityData].sort((a, b) => a.freq - b.freq)

      // Find the closest data points
      let lowerIndex = 0
      let upperIndex = sortedData.length - 1

      for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i].freq <= freqMHz) {
          lowerIndex = i
        } else {
          upperIndex = i
          break
        }
      }

      // If exact match or at the edges of our data
      if (sortedData[lowerIndex].freq === freqMHz || lowerIndex === upperIndex) {
        return sortedData[lowerIndex]
      }

      // Linear interpolation
      const lowerPoint = sortedData[lowerIndex]
      const upperPoint = sortedData[upperIndex]
      const ratio = (freqMHz - lowerPoint.freq) / (upperPoint.freq - lowerPoint.freq)

      return {
        freq: freqMHz,
        muPrime: lowerPoint.muPrime + ratio * (upperPoint.muPrime - lowerPoint.muPrime),
        muDoublePrime:
          lowerPoint.muDoublePrime + ratio * (upperPoint.muDoublePrime - lowerPoint.muDoublePrime),
        q: lowerPoint.q + ratio * (upperPoint.q - lowerPoint.q),
        muComplex: lowerPoint.muComplex + ratio * (upperPoint.muComplex - lowerPoint.muComplex),
      }
    }

    function calculateFormFactor(core: CoreModel, coreCount: number): number {
      return (
        constants.mu0 * ((coreCount * core.dimensions.ae) / (coreCount * core.dimensions.le)) * 1e-2
      )
    }

    function calculateInductance(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
    ): number {
      const permeabilityData = getPermeabilityAtFrequency(core, freqMHz)
      const formFactor = calculateFormFactor(core, coreCount)

      // L(f) = n² × μ'(f) × C × 10⁶ [μH]
      return Math.pow(turns, 2) * permeabilityData.muPrime * formFactor * 1e6
    }

    function calculateInductiveReactance(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
    ): number {
      const inductance = calculateInductance(core, turns, freqMHz, coreCount)

      // XL(f) = 2π × f × L(f) [Ω]
      return 2 * Math.PI * freqMHz * 1e6 * inductance * 1e-6
    }

    function calculateSeriesResistance(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
    ): number {
      const permeabilityData = getPermeabilityAtFrequency(core, freqMHz)
      const formFactor = calculateFormFactor(core, coreCount)

      // R(f) = 2π × f × n² × μ"(f) × C [Ω]
      return (
        2 *
        Math.PI *
        freqMHz *
        1e6 *
        Math.pow(turns, 2) *
        permeabilityData.muDoublePrime *
        formFactor
      )
    }

    function calculateComplexImpedance(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
    ): number {
      const reactance = calculateInductiveReactance(core, turns, freqMHz, coreCount)
      const resistance = calculateSeriesResistance(core, turns, freqMHz, coreCount)

      // Z(f) = √(XL(f)² + R(f)²) [Ω]
      return Math.sqrt(Math.pow(reactance, 2) + Math.pow(resistance, 2))
    }

    function calculateCoreLoss(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
      rmsVoltage: number,
    ): number {
      const impedance = calculateComplexImpedance(core, turns, freqMHz, coreCount)

      // P(f) = U[RMS]² / Z(f) [W]
      return Math.pow(rmsVoltage, 2) / impedance
    }

    function calculateMaxPermissibleCoreLoss(
      core: CoreModel,
      coreCount: number,
      operationMode: OperationMode,
    ): number {
      // Calculate total core volume
      const totalVolume = core.dimensions.volume * coreCount

      // Pmax = ΔT × a × √Vmag [W]
      const continuousLoss =
        constants.maxTempRise * core.dimensions.heatConductionCoeff * Math.sqrt(totalVolume)

      // Apply duty cycle factor
      return continuousLoss * dutyCycleFactor[operationMode]
    }

    function calculateFluxDensity(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      rmsVoltage: number,
    ): number {
      // B(f) = U[RMS] × 10³ / (4.44 × n × f × 10⁶ × Ae × 10⁻⁴) [mT]
      return (rmsVoltage * 1e3) / (4.44 * turns * freqMHz * 1e6 * core.dimensions.ae * 1e-4)
    }

    function calculateWindingLength(core: CoreModel, turns: number, coreCount: number): number {
      // l_tek = 1.2 × n × ((OD-ID) + (K×2×W)) [mm]
      const lengthMm =
        constants.windingLengthFactor *
        turns *
        (core.dimensions.od - core.dimensions.id + coreCount * 2 * core.dimensions.height)

      // Convert to centimeters
      return lengthMm / 10
    }

    function calculateMaxFreqFromWindingLength(windingLengthCm: number): number {
      // Convert winding length to meters
      const windingLengthM = windingLengthCm / 100

      // Double for bifilar winding
      const totalLengthM = windingLengthM * 2

      // f_max = 300 / (10 × totalLength) [MHz]
      return (constants.speedOfLight * 1e-6) / (totalLengthM / constants.maxWindingLengthFraction)
    }

    function calculateRmsVoltage(power: number, impedance: number): number {
      // U[RMS] = √(P × Z) [V]
      return Math.sqrt(power * impedance)
    }

    function calculateQFactor(
      core: CoreModel,
      turns: number,
      freqMHz: number,
      coreCount: number,
    ): number {
      const reactance = calculateInductiveReactance(core, turns, freqMHz, coreCount)
      const resistance = calculateSeriesResistance(core, turns, freqMHz, coreCount)

      // Q = XL / R
      return reactance / resistance
    }

    function calculateMinimumTurnsForRuleOfFour(
      core: CoreModel,
      freqMHz: number,
      impedance: number,
      coreCount: number,
    ): number {
      // We need XL(f) ≥ 4 × Z
      const targetReactance = constants.ruleOfFourFactor * impedance

      // Try increasing turns until we meet the requirement
      for (let turns = 4; turns <= 20; turns++) {
        const reactance = calculateInductiveReactance(core, turns, freqMHz, coreCount)
        if (reactance >= targetReactance) {
          return turns
        }
      }

      // If we couldn't find a solution with 20 turns, return a high value
      return 21
    }

    function calculateRecommendedWireGauge(power: number, impedance: number): number {
      // Calculate current
      const current = Math.sqrt(power / impedance)

      // Required cross-sectional area based on current density
      const requiredArea = current / constants.currentDensity

      // Find the suitable wire gauge
      for (const wire of wireSpecs) {
        if (wire.areaMm2 >= requiredArea) {
          return wire.awg
        }
      }

      // If no suitable wire found, return the largest gauge
      return wireSpecs[0].awg
    }

    function findBestCore(config: BalunConfig): CoreModel {
      // For now, we'll just use FT140-43 for standard needs and FT240-43 for higher power
      return config.power > 150 ? coreModels[1] : coreModels[0]
    }

    function calculateBalunDesign(config: BalunConfig): BalunResults {
      // Find the best core for the requirements
      const core = coreModels.find((c) => c.id === selectedCoreModel.value) || findBestCore(config)

      // Calculate RMS voltage
      const rmsVoltage = calculateRmsVoltage(config.power, config.inputImpedance)

      // Calculate key parameters
      const reactance = calculateInductiveReactance(
        core,
        config.primaryTurns,
        config.minFrequency,
        config.coreCount,
      )

      const impedance = calculateComplexImpedance(
        core,
        config.primaryTurns,
        config.minFrequency,
        config.coreCount,
      )

      const coreLoss = calculateCoreLoss(
        core,
        config.primaryTurns,
        config.minFrequency,
        config.coreCount,
        rmsVoltage,
      )

      const maxCoreLoss = calculateMaxPermissibleCoreLoss(
        core,
        config.coreCount,
        config.operationMode,
      )

      const fluxDensity = calculateFluxDensity(
        core,
        config.primaryTurns,
        config.minFrequency,
        rmsVoltage,
      )

      const windingLengthCm = calculateWindingLength(core, config.primaryTurns, config.coreCount)

      const maxFreqFromLength = calculateMaxFreqFromWindingLength(windingLengthCm)

      const qFactor = calculateQFactor(
        core,
        config.primaryTurns,
        config.minFrequency,
        config.coreCount,
      )

      const characteristicImpedance = Math.sqrt(config.inputImpedance * config.outputImpedance)

      const recommendedWireGauge = calculateRecommendedWireGauge(
        config.power,
        config.inputImpedance,
      )

      // Calculate scaled power rating based on core loss
      const calculatedPowerRating =
        config.power * (maxCoreLoss / coreLoss < 1 ? maxCoreLoss / coreLoss : 1)

      // Evaluate results
      const meetsRuleOfFour = reactance >= constants.ruleOfFourFactor * config.inputImpedance
      const withinCoreLossLimits = coreLoss <= maxCoreLoss
      const fluxDensityInLinearRegion = fluxDensity <= constants.maxLinearFluxDensity

      // Determine winding style information
      const windingInfo = WindingStyleCalculator.determineWindingAndBuildStyle(
        config.inputImpedance,
        config.outputImpedance,
      )

      // Return the results
      return {
        config,
        coreModel: core,
        meetsRuleOfFour,
        withinCoreLossLimits,
        fluxDensityInLinearRegion,
        windingLengthCm,
        maxFreqBasedOnLength: maxFreqFromLength,
        coreLossAtMinFreq: coreLoss,
        maxPermissibleCoreLoss: maxCoreLoss,
        fluxDensityAtMinFreq: fluxDensity,
        reactanceAtMinFreq: reactance,
        impedanceAtMinFreq: impedance,
        qFactorAtMinFreq: qFactor,
        characteristicImpedance,
        recommendedWireGauge,
        calculatedPowerRating,
        windingInfo,
      }
    }

    function validateBalunDesign(results: BalunResults): ValidationResult {
      const messages: Array<{ type: 'info' | 'warning' | 'error'; message: string }> = []
      let valid = true

      // Check Rule of 4
      if (!results.meetsRuleOfFour) {
        valid = false
        messages.push({
          type: 'error',
          message:
            `Rule of 4 not met: reactance at ${results.config.minFrequency} MHz is ${results.reactanceAtMinFreq.toFixed(1)} Ω, ` +
            `should be at least ${constants.ruleOfFourFactor * results.config.inputImpedance} Ω.`,
        })
      }

      // Check core loss
      if (!results.withinCoreLossLimits) {
        valid = false
        messages.push({
          type: 'error',
          message:
            `Core loss too high: ${results.coreLossAtMinFreq.toFixed(1)} W at ${results.config.minFrequency} MHz, ` +
            `maximum permissible is ${results.maxPermissibleCoreLoss.toFixed(1)} W.`,
        })
      }

      // Check flux density
      if (!results.fluxDensityInLinearRegion) {
        valid = false
        messages.push({
          type: 'error',
          message:
            `Flux density exceeds linear region: ${results.fluxDensityAtMinFreq.toFixed(1)} mT at ${results.config.minFrequency} MHz, ` +
            `should be below ${constants.maxLinearFluxDensity} mT.`,
        })
      }

      // Check operating frequency range
      if (results.config.maxFrequency > results.maxFreqBasedOnLength) {
        valid = false
        messages.push({
          type: 'error',
          message:
            `Winding length limits maximum frequency to ${results.maxFreqBasedOnLength.toFixed(1)} MHz, ` +
            `below the specified ${results.config.maxFrequency} MHz.`,
        })
      }

      // Check characteristic impedance match
      const idealCharZ = results.characteristicImpedance
      if (
        Math.abs(idealCharZ - 50) > 10 &&
        Math.abs(idealCharZ - 100) > 10 &&
        !results.config.useHybridDesign
      ) {
        messages.push({
          type: 'warning',
          message:
            `Characteristic impedance (${idealCharZ.toFixed(1)} Ω) is not close to standard values (50Ω or 100Ω). ` +
            `Consider a hybrid design for better performance.`,
        })
      }

      // Check if winding style suggests a hybrid design
      if (
        results.windingInfo &&
        results.windingInfo.construction === 'autotransformer' &&
        !results.config.useHybridDesign &&
        WindingStyleCalculator.shouldUseHybridDesign(
          results.config.inputImpedance,
          results.config.outputImpedance,
        )
      ) {
        messages.push({
          type: 'warning',
          message:
            `This impedance ratio (1:${(results.config.outputImpedance / results.config.inputImpedance).toFixed(1)}) ` +
            `requires a complex ${results.windingInfo.style} winding. Consider using a hybrid design for simpler construction.`,
        })
      }

      // Check calculated power rating
      if (results.calculatedPowerRating < results.config.power) {
        messages.push({
          type: 'warning',
          message:
            `Design is limited to ${results.calculatedPowerRating.toFixed(1)} W at ${results.config.minFrequency} MHz, ` +
            `below the specified ${results.config.power} W.`,
        })
      }

      return { valid, messages }
    }

    function optimizeBalunDesign(config: BalunConfig): BalunResults {
      const core = coreModels.find((c) => c.id === selectedCoreModel.value) || findBestCore(config)

      // Step 1: Optimize turn count
      // Start with the minimum number of turns that satisfies the Rule of 4
      const minTurns = calculateMinimumTurnsForRuleOfFour(
        core,
        config.minFrequency,
        config.inputImpedance,
        config.coreCount,
      )

      // Create a new config with the optimized turns
      let optimizedConfig = {
        ...config,
        primaryTurns: minTurns,
      }

      // Calculate the design with optimized turns
      let results = calculateBalunDesign(optimizedConfig)
      let validation = validateBalunDesign(results)

      // Step 2: If core loss is too high, try increasing the minimum frequency
      if (!validation.valid && !results.withinCoreLossLimits) {
        // Try increasing the minimum frequency stepwise
        const frequencySteps = [1.8, 3.5, 5.0, 7.0, 10.0, 14.0]

        for (const freq of frequencySteps) {
          if (freq <= config.minFrequency) continue

          // Recalculate minimum turns for the new frequency
          const newMinTurns = calculateMinimumTurnsForRuleOfFour(
            core,
            freq,
            config.inputImpedance,
            config.coreCount,
          )

          // Update config
          optimizedConfig = {
            ...optimizedConfig,
            minFrequency: freq,
            primaryTurns: newMinTurns,
          }

          // Calculate results
          results = calculateBalunDesign(optimizedConfig)
          validation = validateBalunDesign(results)

          // If we've found a valid configuration, break
          if (results.withinCoreLossLimits) {
            break
          }
        }
      }

      // Step 3: If still not valid, try using stacked cores
      if (!validation.valid && !results.withinCoreLossLimits && config.coreCount === 1) {
        // Revert to original minimum frequency but use stacked cores
        const newMinTurns = calculateMinimumTurnsForRuleOfFour(
          core,
          config.minFrequency,
          config.inputImpedance,
          2,
        )

        optimizedConfig = {
          ...config,
          coreCount: 2,
          primaryTurns: newMinTurns,
        }

        results = calculateBalunDesign(optimizedConfig)
      }

      // Generate alternative configurations
      const alternatives: BalunResults[] = []

      // Alternative 1: Single core design with higher min frequency
      if (config.coreCount === 2 || optimizedConfig.coreCount === 2) {
        for (const freq of [1.8, 3.5, 5.0]) {
          if (freq <= config.minFrequency) continue

          const altTurns = calculateMinimumTurnsForRuleOfFour(core, freq, config.inputImpedance, 1)

          const altConfig = {
            ...config,
            minFrequency: freq,
            coreCount: 1,
            primaryTurns: altTurns,
          }

          const altResults = calculateBalunDesign(altConfig)
          const altValidation = validateBalunDesign(altResults)

          if (altValidation.valid) {
            alternatives.push(altResults)
            break
          }
        }
      }

      // Alternative 2: Hybrid design if not already using it
      if (!config.useHybridDesign) {
        // Check if winding style suggests a hybrid design
        const windingInfo = WindingStyleCalculator.determineWindingAndBuildStyle(
          config.inputImpedance,
          config.outputImpedance,
        )

        const shouldUseHybrid = WindingStyleCalculator.shouldUseHybridDesign(
          config.inputImpedance,
          config.outputImpedance,
        )

        if (windingInfo.construction === 'autotransformer' || shouldUseHybrid) {
          const hybridConfig = designHybridBalun(config)
          const hybridResults = calculateBalunDesign(hybridConfig)
          alternatives.push(hybridResults)
        } else {
          // Still add a hybrid design as an alternative, but with lower priority
          const hybridConfig = designHybridBalun(config)
          const hybridResults = calculateBalunDesign(hybridConfig)
          alternatives.push(hybridResults)
        }
      }

      // Return the results with alternatives
      return {
        ...results,
        alternativeConfigurations: alternatives,
      }
    }

    function designHybridBalun(config: BalunConfig): BalunConfig {
      const characteristicImpedance = Math.sqrt(config.inputImpedance * config.outputImpedance)

      // Determine which characteristic impedance to target (50Ω or 100Ω)
      const targetCharZ =
        Math.abs(characteristicImpedance - 50) < Math.abs(characteristicImpedance - 100) ? 50 : 100

      // For a hybrid design, we'll use a 1:1 current balun with the target characteristic impedance
      // followed by a unun transformer
      return {
        ...config,
        useHybridDesign: true,
        // Use fewer turns for the hybrid design since each transformer handles part of the job
        primaryTurns:
          calculateMinimumTurnsForRuleOfFour(
            coreModels.find((c) => c.id === selectedCoreModel.value) || findBestCore(config),
            config.minFrequency,
            config.inputImpedance,
            config.coreCount,
          ) - 1, // Slight reduction in turns for the hybrid approach
      }
    }

    function generateDesignReport(results: BalunResults): string {
      const validation = validateBalunDesign(results)
      let report = ''

      // Basic details
      report += `# Balun Design Report\n\n`
      report += `## Configuration\n\n`
      report += `- Impedance Ratio: ${results.config.inputImpedance}Ω:${results.config.outputImpedance}Ω (1:${results.config.outputImpedance / results.config.inputImpedance})\n`
      report += `- Frequency Range: ${results.config.minFrequency}-${Math.min(results.config.maxFrequency, results.maxFreqBasedOnLength).toFixed(1)} MHz\n`
      report += `- Power Rating: ${results.calculatedPowerRating.toFixed(1)} W (${results.config.operationMode} mode)\n`
      report += `- Core: ${results.coreModel.id} (${results.config.coreCount}x)\n`
      report += `- Design Type: ${results.config.useHybridDesign ? 'Hybrid (Balun+Unun)' : 'Standard Balun'}\n\n`

      // Construction details
      report += `## Construction Details\n\n`
      report += `- Primary Turns: ${results.config.primaryTurns}\n`
      report += `- Secondary Turns: ${Math.round(results.config.primaryTurns * Math.sqrt(results.config.outputImpedance / results.config.inputImpedance))}\n`
      report += `- Wire Gauge: AWG ${results.recommendedWireGauge}\n`
      report += `- Winding Length: ${results.windingLengthCm.toFixed(1)} cm\n`
      report += `- Characteristic Impedance: ${results.characteristicImpedance.toFixed(1)} Ω\n\n`

      // Add winding instructions if available
      if (results.windingInfo) {
        report += `## Winding and Construction Details\n\n`
        report += `- Winding Style: ${results.windingInfo.style}\n`
        report += `- Construction Method: ${results.windingInfo.construction}\n`
        report += `- Connection Method: ${results.windingInfo.connectionDetails}\n\n`

        // Generate detailed winding instructions
        const instructions = WindingStyleCalculator.generateWindingInstructions(
          results.windingInfo,
          results.config.primaryTurns,
          results.coreModel.id,
        )

        report += instructions + '\n'
      }

      // Performance details
      report += `## Performance Details\n\n`
      report += `- Rule of 4: ${results.meetsRuleOfFour ? 'Met' : 'Not Met'} (${results.reactanceAtMinFreq.toFixed(1)} Ω at ${results.config.minFrequency} MHz)\n`
      report += `- Core Loss: ${results.coreLossAtMinFreq.toFixed(1)} W of ${results.maxPermissibleCoreLoss.toFixed(1)} W maximum\n`
      report += `- Flux Density: ${results.fluxDensityAtMinFreq.toFixed(1)} mT (Linear region: <${constants.maxLinearFluxDensity} mT)\n`
      report += `- Q Factor: ${results.qFactorAtMinFreq.toFixed(1)}\n\n`

      // Validation
      report += `## Validation\n\n`
      for (const msg of validation.messages) {
        report += `- [${msg.type.toUpperCase()}] ${msg.message}\n`
      }

      // Summary
      report += `\n## Summary\n\n`
      report += validation.valid
        ? `This design is valid and should perform well across the specified frequency range.\n`
        : `This design has issues that should be addressed before construction.\n`

      // Add suggestion for hybrid design if appropriate
      if (
        results.windingInfo &&
        results.windingInfo.construction === 'autotransformer' &&
        !results.config.useHybridDesign &&
        WindingStyleCalculator.shouldUseHybridDesign(
          results.config.inputImpedance,
          results.config.outputImpedance,
        )
      ) {
        report += '\n## Construction Suggestion\n\n'
        report +=
          'For this non-standard impedance ratio, consider using a hybrid design (1:1 current balun + unun) '
        report +=
          'instead of the autotransformer approach for better performance and simpler construction.\n'
      }

      // Add band coverage
      report += `\n## Ham Band Coverage\n\n`
      for (const band of hamBands) {
        const covered =
          band.min >= results.config.minFrequency &&
          band.max <= Math.min(results.config.maxFrequency, results.maxFreqBasedOnLength)
        report += `- ${band.name}: ${covered ? '✓' : '✗'}\n`
      }

      // Alternative configurations
      if (results.alternativeConfigurations && results.alternativeConfigurations.length > 0) {
        report += `\n## Alternative Configurations\n\n`

        results.alternativeConfigurations.forEach((alt, index) => {
          report += `### Alternative ${index + 1}\n\n`
          report += `- Impedance Ratio: ${alt.config.inputImpedance}Ω:${alt.config.outputImpedance}Ω\n`
          report += `- Frequency Range: ${alt.config.minFrequency}-${Math.min(alt.config.maxFrequency, alt.maxFreqBasedOnLength).toFixed(1)} MHz\n`
          report += `- Cores: ${alt.config.coreCount}x ${alt.coreModel.id}\n`
          report += `- Primary Turns: ${alt.config.primaryTurns}\n`
          report += `- Type: ${alt.config.useHybridDesign ? 'Hybrid' : 'Standard'}\n`
          report += `- Power Rating: ${alt.calculatedPowerRating.toFixed(1)} W\n\n`
        })
      }

      return report
    }

    // Hybrid Balun Calculator Methods
    function calculateMinimumTurnsForBalun(
      core: CoreModel,
      freqMHz: number,
      impedance: number,
      coreCount: number,
    ): number {
      // For current balun, we need XL >= 4 × Z
      // Try increasing turns until we meet the requirement
      for (let turns = 5; turns <= 15; turns++) {
        // Estimate reactance based on permeability at this frequency
        const permeabilityData = getPermeabilityAtFrequency(core, freqMHz)
        const formFactor = calculateFormFactor(core, coreCount)

        // Calculate inductance: L(f) = n² × μ'(f) × C × 10⁶ [μH]
        const inductance = Math.pow(turns, 2) * permeabilityData.muPrime * formFactor * 1e6

        // Calculate reactance: XL(f) = 2π × f × L(f) [Ω]
        const reactance = 2 * Math.PI * freqMHz * 1e6 * inductance * 1e-6

        if (reactance >= constants.ruleOfFourFactor * impedance) {
          return turns
        }
      }

      // If we couldn't find a solution, return a reasonable default
      return 10
    }

    function calculateMinimumTurnsForUnun(
      core: CoreModel,
      freqMHz: number,
      impedance: number,
      coreCount: number,
    ): number {
      // Unun transformers need the same reactance requirements as baluns
      return calculateMinimumTurnsForBalun(core, freqMHz, impedance, coreCount)
    }

    function designHybridSystem(config: BalunConfig): HybridComponents {
      // Calculate the geometric mean of the impedances
      const geometricMean = Math.sqrt(config.inputImpedance * config.outputImpedance)

      // Determine which standard impedance to use (50Ω or 100Ω)
      const targetImpedance =
        Math.abs(geometricMean - 50) < Math.abs(geometricMean - 100) ? 50 : 100

      // Get best core model
      const coreModel =
        coreModels.find((core) => core.id === selectedCoreModel.value) || coreModels[0]

      // Calculate minimum turns for the 1:1 current balun
      const balunTurns = calculateMinimumTurnsForBalun(
        coreModel,
        config.minFrequency,
        config.inputImpedance,
        1, // Current balun uses a single core
      )

      // Calculate turns for the unun transformer
      const ununPrimaryTurns = calculateMinimumTurnsForUnun(
        coreModel,
        config.minFrequency,
        targetImpedance,
        1, // Unun typically uses a single core
      )

      // Calculate unun output turns based on impedance ratio
      const impedanceRatio = config.outputImpedance / targetImpedance
      const turnsRatio = Math.sqrt(impedanceRatio)
      const ununSecondaryTurns = Math.round(ununPrimaryTurns * turnsRatio)

      return {
        balun: {
          coreType: coreModel.id,
          inputImpedance: config.inputImpedance,
          outputImpedance: targetImpedance,
          turns: balunTurns,
          characteristicImpedance: targetImpedance,
        },
        unun: {
          coreType: coreModel.id,
          inputImpedance: targetImpedance,
          outputImpedance: config.outputImpedance,
          turns: {
            primary: ununPrimaryTurns,
            secondary: ununSecondaryTurns,
          },
          characteristicImpedance: Math.sqrt(targetImpedance * config.outputImpedance),
        },
      }
    }

    function calculateHybridWindingLength(components: HybridComponents): number {
      // Get core model info
      const balunCore =
        coreModels.find((core) => core.id === components.balun.coreType) || coreModels[0]
      const ununCore =
        coreModels.find((core) => core.id === components.unun.coreType) || coreModels[0]

      // Calculate balun winding length
      const balunLengthMm =
        constants.windingLengthFactor *
        components.balun.turns *
        (balunCore.dimensions.od - balunCore.dimensions.id + 2 * balunCore.dimensions.height)

      // Calculate unun winding length (primary + secondary)
      const ununLengthMm =
        constants.windingLengthFactor *
        (components.unun.turns.primary + components.unun.turns.secondary) *
        (ununCore.dimensions.od - ununCore.dimensions.id + 2 * ununCore.dimensions.height)

      // Return total length in cm
      return (balunLengthMm + ununLengthMm) / 10
    }

    function calculateHybridMaxFrequency(windingLengthCm: number): number {
      // Convert winding length to meters
      const windingLengthM = windingLengthCm / 100

      // Double for bifilar winding
      const totalLengthM = windingLengthM * 2

      // f_max = 300 / (10 × totalLength) [MHz]
      return (constants.speedOfLight * 1e-6) / (totalLengthM / constants.maxWindingLengthFraction)
    }

    function calculateHybridCoreLoss(
      components: HybridComponents,
      freqMHz: number,
      power: number,
    ): number {
      // Get core models
      const balunCore =
        coreModels.find((core) => core.id === components.balun.coreType) || coreModels[0]
      const ununCore =
        coreModels.find((core) => core.id === components.unun.coreType) || coreModels[0]

      // Calculate RMS voltage at input
      const inputVoltage = Math.sqrt(power * components.balun.inputImpedance)

      // Calculate balun complex impedance
      const balunPermeability = getPermeabilityAtFrequency(balunCore, freqMHz)
      const balunFormFactor = calculateFormFactor(balunCore, 1)
      const balunInductance =
        Math.pow(components.balun.turns, 2) * balunPermeability.muPrime * balunFormFactor * 1e6
      const balunReactance = 2 * Math.PI * freqMHz * 1e6 * balunInductance * 1e-6
      const balunResistance =
        2 *
        Math.PI *
        freqMHz *
        1e6 *
        Math.pow(components.balun.turns, 2) *
        balunPermeability.muDoublePrime *
        balunFormFactor
      const balunImpedance = Math.sqrt(Math.pow(balunReactance, 2) + Math.pow(balunResistance, 2))

      // Calculate unun complex impedance
      const ununPermeability = getPermeabilityAtFrequency(ununCore, freqMHz)
      const ununFormFactor = calculateFormFactor(ununCore, 1)
      const ununInductance =
        Math.pow(components.unun.turns.primary, 2) * ununPermeability.muPrime * ununFormFactor * 1e6
      const ununReactance = 2 * Math.PI * freqMHz * 1e6 * ununInductance * 1e-6
      const ununResistance =
        2 *
        Math.PI *
        freqMHz *
        1e6 *
        Math.pow(components.unun.turns.primary, 2) *
        ununPermeability.muDoublePrime *
        ununFormFactor
      const ununImpedance = Math.sqrt(Math.pow(ununReactance, 2) + Math.pow(ununResistance, 2))

      // Calculate core losses
      const balunLoss = Math.pow(inputVoltage, 2) / balunImpedance
      const ununLoss =
        Math.pow(inputVoltage * (components.unun.turns.primary / components.balun.turns), 2) /
        ununImpedance

      // Total core loss is the sum of both components
      return balunLoss + ununLoss
    }

    function calculateHybridMaxPermissibleCoreLoss(
      components: HybridComponents,
      operationMode: OperationMode,
    ): number {
      // Get core models
      const balunCore =
        coreModels.find((core) => core.id === components.balun.coreType) || coreModels[0]
      const ununCore =
        coreModels.find((core) => core.id === components.unun.coreType) || coreModels[0]

      // Calculate continuous loss for each core
      const balunContinuousLoss =
        constants.maxTempRise *
        balunCore.dimensions.heatConductionCoeff *
        Math.sqrt(balunCore.dimensions.volume)

      const ununContinuousLoss =
        constants.maxTempRise *
        ununCore.dimensions.heatConductionCoeff *
        Math.sqrt(ununCore.dimensions.volume)

      // Apply duty cycle factor
      const dutyCycle = {
        [OperationMode.SSB]: 3.0,
        [OperationMode.CW]: 3.0,
        [OperationMode.DIGITAL]: 2.5,
        [OperationMode.FIFTY_PERCENT]: 1.5,
        [OperationMode.CONTINUOUS]: 1.0,
      }

      // Return the sum of permissible losses for both cores
      return (balunContinuousLoss + ununContinuousLoss) * dutyCycle[operationMode]
    }

    function generateHybridReport(components: HybridComponents, config: BalunConfig): string {
      // Calculate additional performance metrics
      const windingLength = calculateHybridWindingLength(components)
      const maxFrequency = calculateHybridMaxFrequency(windingLength)
      const coreLoss = calculateHybridCoreLoss(components, config.minFrequency, config.power)
      const maxCoreLoss = calculateHybridMaxPermissibleCoreLoss(components, config.operationMode)

      let report = ''

      report += `# Hybrid Balun System Design Report\n\n`
      report += `## System Overview\n\n`
      report += `- Impedance Transformation: ${config.inputImpedance}Ω to ${config.outputImpedance}Ω (1:${config.outputImpedance / config.inputImpedance})\n`
      report += `- Frequency Range: ${config.minFrequency}-${Math.min(config.maxFrequency, maxFrequency).toFixed(1)} MHz\n`
      report += `- Power Rating: ${config.power}W (${config.operationMode} mode)\n`
      report += `- Total Winding Length: ${windingLength.toFixed(1)} cm\n`
      report += `- Total Core Loss at ${config.minFrequency} MHz: ${coreLoss.toFixed(1)}W of ${maxCoreLoss.toFixed(1)}W maximum\n\n`

      report += `## Component 1: Current Balun (1:1)\n\n`
      report += `- Core: ${components.balun.coreType}\n`
      report += `- Turns: ${components.balun.turns} (bifilar)\n`
      report += `- Input Impedance: ${components.balun.inputImpedance}Ω\n`
      report += `- Output Impedance: ${components.balun.outputImpedance}Ω balanced\n`
      report += `- Characteristic Impedance: ${components.balun.characteristicImpedance}Ω\n\n`

      report += `## Component 2: Unun Transformer\n\n`
      report += `- Core: ${components.unun.coreType}\n`
      report += `- Primary Turns: ${components.unun.turns.primary}\n`
      report += `- Secondary Turns: ${components.unun.turns.secondary}\n`
      report += `- Input Impedance: ${components.unun.inputImpedance}Ω\n`
      report += `- Output Impedance: ${components.unun.outputImpedance}Ω\n`
      report += `- Characteristic Impedance: ${components.unun.characteristicImpedance.toFixed(1)}Ω\n\n`

      report += `## Construction Notes\n\n`
      report += `1. Construct the 1:1 current balun using ${components.balun.turns} bifilar turns of AWG ${calculateRecommendedWireGauge(config.power, components.balun.inputImpedance)} wire.\n`
      report += `2. Construct the unun transformer with ${components.unun.turns.primary} primary turns and ${components.unun.turns.secondary} secondary turns.\n`
      report += `3. Connect the output of the current balun to the input of the unun transformer.\n`
      report += `4. Keep connections between components as short as possible.\n`
      report += `5. Install both components in a weatherproof enclosure with adequate ventilation.\n\n`

      report += `## Advantages of This Hybrid Design\n\n`
      report += `- Improved common-mode rejection compared to direct 1:${config.outputImpedance / config.inputImpedance} balun\n`
      report += `- Better balanced output for symmetrical antennas\n`
      report += `- Optimized characteristic impedance for each component\n`
      report += `- Superior performance with difficult loads\n\n`

      report += `## Recommended Usage\n\n`
      report += `This hybrid design is particularly well-suited for applications requiring excellent common-mode rejection and true balanced output, such as with symmetrical antennas like dipoles and loops. The design trades some simplicity for improved performance.`

      return report
    }

    function getRecommendedWireGauge(power: number, impedance: number): number {
      // Calculate current
      const current = Math.sqrt(power / impedance)

      // Required cross-sectional area based on current density
      const requiredArea = current / constants.currentDensity

      // Find the suitable wire gauge
      for (const wire of wireSpecs) {
        if (wire.areaMm2 >= requiredArea) {
          return wire.awg
        }
      }

      // If no suitable wire found, return the largest gauge
      return wireSpecs[0].awg
    }

    // Main calculation function
    function calculateBalun() {
      isCalculating.value = true
      calculationError.value = null

      try {
        // Create config from form inputs
        const config: BalunConfig = {
          inputImpedance: inputImpedance.value,
          outputImpedance: outputImpedance.value,
          power: power.value,
          minFrequency: minFrequency.value,
          maxFrequency: maxFrequency.value,
          operationMode: operationMode.value,
          coreCount: coreCount.value,
          primaryTurns: primaryTurns.value,
          useHybridDesign: useHybridDesign.value,
        }

        // If primary turns is 0, optimize the design
        if (config.primaryTurns === 0) {
          designResults.value = optimizeBalunDesign(config)
        } else {
          designResults.value = calculateBalunDesign(config)
        }

        // Validate the design
        validationResult.value = validateBalunDesign(designResults.value)

        // Generate design report
        designReport.value = generateDesignReport(designResults.value)

        // If hybrid design is requested or recommended, calculate hybrid components
        if (config.useHybridDesign || shouldUseHybridDesign.value) {
          hybridComponents.value = designHybridSystem(config)
          hybridReport.value = generateHybridReport(hybridComponents.value, config)
          showHybridDesign.value = true
        } else {
          hybridComponents.value = null
          hybridReport.value = ''
          showHybridDesign.value = false
        }

        // Show the report
        showReport.value = true
      } catch (error) {
        console.error('Calculation error:', error)
        calculationError.value = `Error during calculation: ${error instanceof Error ? error.message : String(error)}`
      } finally {
        isCalculating.value = false
      }
    }

    // Reset form to defaults
    function resetForm() {
      inputImpedance.value = 50
      outputImpedance.value = 200
      power.value = 100
      minFrequency.value = 3.5
      maxFrequency.value = 30
      operationMode.value = OperationMode.SSB
      coreCount.value = 1
      primaryTurns.value = 0
      useHybridDesign.value = false
      selectedCoreModel.value = coreModels[0].id
      showAdvancedOptions.value = false
      showDesignSteps.value = false
      showAlternativeDesigns.value = false
      showHybridDesign.value = false
      showBandCoverage.value = false
      showWireInfo.value = false
      showPerformanceDetails.value = false
      showReport.value = false
      designResults.value = null
      hybridComponents.value = null
      validationResult.value = null
      hybridReport.value = ''
      designReport.value = ''
      calculationError.value = null
    }

    // Presets for common balun configurations
    const presets = [
      {
        name: '1:1 Current Balun (50Ω)',
        config: {
          inputImpedance: 50,
          outputImpedance: 50,
          power: 100,
          minFrequency: 3.5,
          maxFrequency: 30,
          operationMode: OperationMode.SSB,
          coreCount: 1,
          primaryTurns: 0,
          useHybridDesign: false,
        },
      },
      {
        name: '1:4 Voltage Balun (50Ω to 200Ω)',
        config: {
          inputImpedance: 50,
          outputImpedance: 200,
          power: 100,
          minFrequency: 3.5,
          maxFrequency: 30,
          operationMode: OperationMode.SSB,
          coreCount: 1,
          primaryTurns: 0,
          useHybridDesign: false,
        },
      },
      {
        name: '1:9 Balun (50Ω to 450Ω)',
        config: {
          inputImpedance: 50,
          outputImpedance: 450,
          power: 100,
          minFrequency: 3.5,
          maxFrequency: 30,
          operationMode: OperationMode.SSB,
          coreCount: 1,
          primaryTurns: 0,
          useHybridDesign: true,
        },
      },
      {
        name: 'High Power 1:4 Balun (200W)',
        config: {
          inputImpedance: 50,
          outputImpedance: 200,
          power: 200,
          minFrequency: 3.5,
          maxFrequency: 30,
          operationMode: OperationMode.CW,
          coreCount: 1,
          primaryTurns: 0,
          useHybridDesign: false,
        },
      },
      {
        name: '160m-10m 1:4 Balun',
        config: {
          inputImpedance: 50,
          outputImpedance: 200,
          power: 100,
          minFrequency: 1.8,
          maxFrequency: 30,
          operationMode: OperationMode.SSB,
          coreCount: 1,
          primaryTurns: 0,
          useHybridDesign: false,
        },
      },
    ]

    function applyPreset(preset: any) {
      inputImpedance.value = preset.config.inputImpedance
      outputImpedance.value = preset.config.outputImpedance
      power.value = preset.config.power
      minFrequency.value = preset.config.minFrequency
      maxFrequency.value = preset.config.maxFrequency
      operationMode.value = preset.config.operationMode
      coreCount.value = preset.config.coreCount
      primaryTurns.value = preset.config.primaryTurns
      useHybridDesign.value = preset.config.useHybridDesign

      // Calculate after applying preset
      calculateBalun()
    }

    function formatInstructions(instructions: string): string {
      // Convert markdown headers to HTML
      let formatted = instructions.replace(/### (.*?)\n/g, '<h5>$1</h5>')

      // Convert markdown lists to HTML
      formatted = formatted.replace(/- (.*?)(?:\n|$)/g, '<li>$1</li>')
      formatted = formatted.replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!<li>)/g, '</li></ul>')
      formatted = formatted.replace(/<\/ul><ul>/g, '')

      // Convert numbered lists
      formatted = formatted.replace(/(\d+)\. (.*?)(?:\n|$)/g, '<li>$2</li>')
      formatted = formatted.replace(/<li>/g, '<ol><li>').replace(/<\/li>(?!<li>)/g, '</li></ol>')
      formatted = formatted.replace(/<\/ol><ol>/g, '')

      // Convert line breaks
      formatted = formatted.replace(/\n\n/g, '<br><br>')

      return formatted
    }

    return {
      // Form inputs
      inputImpedance,
      outputImpedance,
      power,
      minFrequency,
      maxFrequency,
      operationMode,
      coreCount,
      primaryTurns,
      useHybridDesign,
      selectedCoreModel,
      showAdvancedOptions,
      showDesignSteps,
      showAlternativeDesigns,
      showHybridDesign,
      showBandCoverage,
      showWireInfo,
      showPerformanceDetails,
      showWindingInstructions,
      showReport,

      // Computed properties
      impedanceRatio,
      characteristicImpedance,
      shouldUseHybridDesign,
      selectedCore,
      operationModeOptions,
      coreModelOptions,
      bandCoverage,
      recommendedWireInfo,

      // Results
      designResults,
      hybridComponents,
      validationResult,
      hybridReport,
      designReport,
      isCalculating,
      calculationError,

      // Constants
      dutyCycleFactor,

      // Methods
      calculateBalun,
      resetForm,
      presets,
      applyPreset,
      formatInstructions,
      WindingStyleCalculator,
      getRecommendedWireGauge,
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
          {{ showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options' }}
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
              {{ designResults.fluxDensityAtMinFreq.toFixed(1) }} mT (Linear: <50 mT)
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
        <div class="info-toggle">
          <button @click="showBandCoverage = !showBandCoverage">
            {{ showBandCoverage ? 'Hide Band Coverage' : 'Show Band Coverage' }}
          </button>
          <button @click="showWireInfo = !showWireInfo">
            {{ showWireInfo ? 'Hide Wire Information' : 'Show Wire Information' }}
          </button>
          <button @click="showPerformanceDetails = !showPerformanceDetails">
            {{ showPerformanceDetails ? 'Hide Performance Details' : 'Show Performance Details' }}
          </button>
          <button
            v-if="designResults?.windingInfo"
            @click="showWindingInstructions = !showWindingInstructions"
          >
            {{
              showWindingInstructions ? 'Hide Winding Instructions' : 'Show Winding Instructions'
            }}
          </button>
        </div>

        <div v-if="showBandCoverage" class="band-coverage">
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

        <div v-if="showWireInfo && recommendedWireInfo" class="wire-info">
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
              <span class="wire-value">{{ recommendedWireInfo.currentCapacity.toFixed(2) }} A</span>
            </div>
          </div>
          <div class="wire-notes">
            <p>
              <strong>Note:</strong> For bifilar windings, use two identical wires twisted together.
              For optimal performance, use insulated wire (enamel, PTFE, etc.) to prevent shorts.
            </p>
          </div>
        </div>

        <div
          v-if="showWindingInstructions && designResults?.windingInfo"
          class="winding-instructions"
        >
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
                <span class="winding-info-value">{{ designResults.windingInfo.wireCount }}</span>
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
                <strong>Construction Suggestion:</strong> For this non-standard impedance ratio
                (1:{{
                  (
                    designResults.config.outputImpedance / designResults.config.inputImpedance
                  ).toFixed(1)
                }}), consider using a hybrid design (1:1 current balun + unun) instead of the
                autotransformer approach for better performance and simpler construction.
              </div>
            </div>
          </div>
        </div>

        <div v-if="showPerformanceDetails" class="performance-details">
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
                <span class="detail-value">{{ designResults.coreModel.initialPermeability }}</span>
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
                <span class="detail-value">{{ designResults.qFactorAtMinFreq.toFixed(1) }}</span>
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
                <span class="detail-value">{{ designResults.coreLossAtMinFreq.toFixed(1) }} W</span>
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
                  (designResults.coreLossAtMinFreq / designResults.maxPermissibleCoreLoss).toFixed(
                    2,
                  )
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
              Construct the 1:1 current balun using {{ hybridComponents.balun.turns }} bifilar turns
              of AWG
              {{ getRecommendedWireGauge(power, hybridComponents.balun.inputImpedance) }} wire.
            </li>
            <li>
              Construct the unun transformer with {{ hybridComponents.unun.turns.primary }} primary
              turns and {{ hybridComponents.unun.turns.secondary }} secondary turns.
            </li>
            <li>Connect the output of the current balun to the input of the unun transformer.</li>
            <li>Keep connections between components as short as possible.</li>
            <li>Install both components in a weatherproof enclosure with adequate ventilation.</li>
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

      <div class="design-report">
        <div class="report-toggle">
          <button @click="showReport = !showReport">
            {{ showReport ? 'Hide Full Report' : 'Show Full Report' }}
          </button>
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.preset-button {
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex: 1 1 calc(33.333% - 0.75rem);
  min-width: 200px;
  text-align: center;
}

.preset-button:hover {
  background-color: hsla(160, 100%, 37%, 0.1);
  border-color: hsla(160, 100%, 37%, 0.5);
  transform: translateY(-2px);
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
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-advanced {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.toggle-advanced:hover {
  background-color: var(--color-background-mute);
  border-color: hsla(160, 100%, 37%, 0.5);
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

.info-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-toggle button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.info-toggle button:hover {
  background-color: var(--color-background-mute);
  border-color: hsla(160, 100%, 37%, 0.5);
}

.band-coverage {
  margin-bottom: 1.5rem;
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
  margin-bottom: 1.5rem;
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
  margin-bottom: 1.5rem;
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
  margin-bottom: 1.5rem;
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
