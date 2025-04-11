// types.ts
export interface CoreDimensions {
  od: number // Outer diameter [mm]
  id: number // Inner diameter [mm]
  height: number // Height [mm]
}

export interface CoreModel {
  id: string
  mix: string
  initialPermeability: number
  saturationFluxDensity: number // [mT]
  dimensions: CoreDimensions
  recommendedFreqRange: {
    min: number // [MHz]
    max: number // [MHz]
  }
  lossFactor: number // Loss factor for the material
}

export interface PresetConfig {
  name: string
  inputImpedance: number
  outputImpedance: number
  minFrequency: number
  maxFrequency: number
  power: number
  operationMode: string
  useHybridDesign: boolean
  suggestedCoreModel: string
  suggestedCoreCount: number
}

export interface BalunConfig {
  inputImpedance: number
  outputImpedance: number
  minFrequency: number
  maxFrequency: number
  power: number
  operationMode: string
  coreModel: string
  coreCount: number
  primaryTurns: number // If 0, auto-calculate
  useHybridDesign: boolean
  type: 'current' | 'voltage'
}

export interface WindingInfo {
  style: string // "Bifilar", "Trifilar", etc.
  construction: string // "classical" or "autotransformer"
  wireCount: number // Number of wires used
  connectionDetails: string // How the wires are connected
}

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info'
  message: string
}

export interface ValidationResult {
  valid: boolean
  messages: ValidationMessage[]
}

export interface WireInfo {
  gauge: number
  diameter: number // [mm]
  area: number // [mm²]
  currentCapacity: number // [A]
}

export interface HybridComponents {
  balun: DesignResults
  unun: DesignResults
}

export interface DesignResults {
  config: BalunConfig
  coreModel: CoreModel
  characteristicImpedance: number
  calculatedPowerRating: number

  // Performance metrics
  reactanceAtMinFreq: number
  impedanceAtMinFreq: number
  coreLossAtMinFreq: number
  maxPermissibleCoreLoss: number
  fluxDensityAtMinFreq: number
  windingLengthCm: number
  maxFreqBasedOnLength: number
  qFactorAtMinFreq: number
  current: number // Primary winding current [A]

  // Validation results
  meetsRuleOfFour: boolean
  withinCoreLossLimits: boolean
  fluxDensityInLinearRegion: boolean

  // Additional information
  windingInfo?: WindingInfo
  alternativeConfigurations?: DesignResults[]
}

export interface FrequencyBand {
  name: string
  min: number // [MHz]
  max: number // [MHz]
  covered: boolean
}

export interface PermeabilityData {
  frequency: number // MHz
  uPrime: number // Real part of permeability
  uDoublePrime: number // Imaginary part of permeability
}
