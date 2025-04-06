/**
 * Core Material Data and Types for Balun Calculator
 *
 * This file contains the type definitions and constant data for ferrite cores
 * used in balun transformers.
 */

/**
 * Complex permeability data for a specific frequency
 */
export interface PermeabilityData {
  /** Frequency in MHz */
  freq: number
  /** Real part of complex permeability (inductive component) */
  muPrime: number
  /** Imaginary part of complex permeability (loss component) */
  muDoublePrime: number
  /** Quality factor */
  q: number
  /** Complex permeability magnitude */
  muComplex: number
}

/**
 * Physical dimensions and properties of a ferrite core
 */
export interface CoreDimensions {
  /** Outside diameter in mm */
  od: number
  /** Inside diameter in mm */
  id: number
  /** Height/width in mm */
  height: number
  /** Effective magnetic path length in cm */
  le: number
  /** Effective cross-sectional area in cm² */
  ae: number
  /** Core volume in cm³ */
  volume: number
  /** Heat conduction coefficient */
  heatConductionCoeff: number
}

/**
 * Represents a full ferrite core model with all relevant properties
 */
export interface CoreModel {
  /** Core model identifier */
  id: string
  /** Mix/material number */
  mix: string
  /** Initial permeability */
  initialPermeability: number
  /** Saturation flux density in mT */
  saturationFluxDensity: number
  /** Curie temperature in °C */
  curieTemperature: number
  /** Frequency range recommendation for wideband applications */
  recommendedFreqRange: {
    min: number
    max: number
  }
  /** Physical dimensions */
  dimensions: CoreDimensions
  /** Permeability data across frequency range */
  permeabilityData: PermeabilityData[]
}

/**
 * Duty cycle factor by operation mode
 */
export enum OperationMode {
  SSB = 'SSB',
  CW = 'CW',
  DIGITAL = 'DIGITAL',
  FIFTY_PERCENT = '50_PERCENT',
  CONTINUOUS = 'CONTINUOUS',
}

/**
 * Factors for different operation modes
 */
export const dutyCycleFactor: Record<OperationMode, number> = {
  [OperationMode.SSB]: 3.0,
  [OperationMode.CW]: 3.0,
  [OperationMode.DIGITAL]: 2.5,
  [OperationMode.FIFTY_PERCENT]: 1.5,
  [OperationMode.CONTINUOUS]: 1.0,
}

/**
 * Wire specifications
 */
export interface WireSpec {
  /** AWG size */
  awg: number
  /** Diameter in mm */
  diameterMm: number
  /** Cross-sectional area in mm² */
  areaMm2: number
  /** Current capacity at 1.5A/mm² in amperes */
  currentCapacity: number
}

/**
 * Balun configuration parameters
 */
export interface BalunConfig {
  /** Input impedance in ohms */
  inputImpedance: number
  /** Output impedance in ohms */
  outputImpedance: number
  /** Power rating in watts */
  power: number
  /** Minimum frequency in MHz */
  minFrequency: number
  /** Maximum frequency in MHz */
  maxFrequency: number
  /** Operation mode for duty cycle calculation */
  operationMode: OperationMode
  /** Number of stacked cores */
  coreCount: number
  /** Primary turns count */
  primaryTurns: number
  /** Whether to use hybrid design (balun+unun) */
  useHybridDesign: boolean
}

/**
 * Results from balun calculations
 */
export interface BalunResults {
  /** Optimized balun configuration */
  config: BalunConfig
  /** Core model used */
  coreModel: CoreModel
  /** Whether design meets Rule of 4 at minimum frequency */
  meetsRuleOfFour: boolean
  /** Whether design is within acceptable core loss limits */
  withinCoreLossLimits: boolean
  /** Whether flux density is within linear region */
  fluxDensityInLinearRegion: boolean
  /** Winding length in centimeters */
  windingLengthCm: number
  /** Maximum frequency based on winding length */
  maxFreqBasedOnLength: number
  /** Core loss at minimum frequency in watts */
  coreLossAtMinFreq: number
  /** Maximum permissible core loss in watts */
  maxPermissibleCoreLoss: number
  /** Flux density at minimum frequency in mT */
  fluxDensityAtMinFreq: number
  /** Inductive reactance at minimum frequency in ohms */
  reactanceAtMinFreq: number
  /** Complex impedance at minimum frequency in ohms */
  impedanceAtMinFreq: number
  /** Quality factor at minimum frequency */
  qFactorAtMinFreq: number
  /** Characteristic impedance */
  characteristicImpedance: number
  /** Wire gauge recommendation */
  recommendedWireGauge: number
  /** Calculated power rating */
  calculatedPowerRating: number
  /** Alternative configurations */
  alternativeConfigurations?: BalunResults[]
}

/**
 * Validation result for balun design
 */
export interface ValidationResult {
  /** Is the design valid? */
  valid: boolean
  /** Validation messages */
  messages: Array<{
    type: 'info' | 'warning' | 'error'
    message: string
  }>
}

// ----- Constant Data -----

/**
 * #43 Mix permeability data
 */
export const mix43PermeabilityData: PermeabilityData[] = [
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

/**
 * Core models data
 */
export const coreModels: CoreModel[] = [
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

/**
 * AWG wire specifications
 */
export const wireSpecs: WireSpec[] = [
  { awg: 12, diameterMm: 2.05, areaMm2: 3.31, currentCapacity: 4.97 },
  { awg: 14, diameterMm: 1.63, areaMm2: 2.08, currentCapacity: 3.12 },
  { awg: 16, diameterMm: 1.29, areaMm2: 1.31, currentCapacity: 1.97 },
  { awg: 18, diameterMm: 1.02, areaMm2: 0.82, currentCapacity: 1.23 },
  { awg: 20, diameterMm: 0.81, areaMm2: 0.52, currentCapacity: 0.78 },
  { awg: 22, diameterMm: 0.64, areaMm2: 0.33, currentCapacity: 0.49 },
]

/**
 * Default balun configuration
 */
export const defaultBalunConfig: BalunConfig = {
  inputImpedance: 50,
  outputImpedance: 200,
  power: 100,
  minFrequency: 3.5,
  maxFrequency: 30,
  operationMode: OperationMode.SSB,
  coreCount: 1,
  primaryTurns: 6,
  useHybridDesign: false,
}

/**
 * Constants for calculations
 */
export const constants = {
  /** Rule of 4 factor */
  ruleOfFourFactor: 4,
  /** Maximum linear flux density in mT */
  maxLinearFluxDensity: 50,
  /** Maximum allowed temperature rise in °C */
  maxTempRise: 30,
  /** Current density in A/mm² */
  currentDensity: 1.5,
  /** Speed of light in m/s */
  speedOfLight: 3e8,
  /** Winding teflon insulation factor */
  windingLengthFactor: 1.2,
  /** Maximum winding length as fraction of wavelength */
  maxWindingLengthFraction: 0.1,
  /** Mu zero (permeability of free space) in H/m */
  mu0: 4 * Math.PI * 1e-7,
}

/**
 * Ham radio bands with their frequency ranges
 */
export const hamBands = [
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
