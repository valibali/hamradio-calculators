// utils.ts
import { CORE_MODELS, SPEED_OF_LIGHT, WIRE_DATA } from './constants'
import {
  type CoreModel,
  type WireInfo,
  type FrequencyBand,
  type ValidationMessage,
  type BalunConfig,
} from './types'

/**
 * Find a core model by its ID
 */
export function findCoreModel(modelId: string): CoreModel | undefined {
  return CORE_MODELS.find((model) => model.id === modelId)
}

/**
 * Calculate the impedance ratio from input to output impedance
 */
export function calculateImpedanceRatio(inputZ: number, outputZ: number): number {
  return outputZ / inputZ
}

/**
 * Calculate the characteristic impedance of a balun
 */
export function calculateCharacteristicImpedance(inputZ: number, outputZ: number): number {
  return Math.sqrt(inputZ * outputZ)
}

/**
 * Calculate the wavelength in cm for a given frequency in MHz
 */
export function calculateWavelength(frequencyMHz: number): number {
  return (SPEED_OF_LIGHT / (frequencyMHz * 1e6)) * 100 // Convert to cm
}

/**
 * Calculate winding length for a given turn count on a core
 */
export function calculateWindingLength(
  turns: number,
  coreModel: CoreModel,
  coreCount: number,
  wireGauge: number = 14,
): number {
  const wireDiameter = WIRE_DATA[wireGauge].diameter / 10 // Convert to cm
  const coreCircumference =
    (coreModel.dimensions.od -
      coreModel.dimensions.id +
      coreCount * 2 * coreModel.dimensions.height) /
      10 +
    wireDiameter * 2 // Convert to cm

  // Winding length = circumference × turns + some margin for leads
  return 1.2 * coreCircumference * turns + 5 // Add 5cm for lead length
}

/**
 * Calculate maximum frequency based on winding length
 */
export function calculateMaxFreqBasedOnLength(
  windingLengthCm: number,
  config: BalunConfig,
): number {
  if (config.inputImpedance == config.outputImpedance) return config.maxFrequency

  // Max frequency based on λ/10 rule
  const maxWavelengthCm = windingLengthCm * 10
  return (SPEED_OF_LIGHT * 100) / maxWavelengthCm / 1e6 // Convert to MHz
}

/**
 * Determine if bands are covered by a frequency range
 */
export function determineBandCoverage(
  minFreq: number,
  maxFreq: number,
  bands: FrequencyBand[],
): FrequencyBand[] {
  return bands.map((band) => ({
    ...band,
    covered: band.min >= minFreq && band.max <= maxFreq,
  }))
}

/**
 * Calculate the recommended wire gauge based on power and impedance
 */
export function calculateRecommendedWireGauge(power: number, impedance: number): WireInfo {
  // Calculate maximum current: I = sqrt(P/Z)
  const current = Math.sqrt(power / impedance) * 1.5 // Add 50% safety margin

  // Get all gauge numbers and sort them in descending order (largest wire first)
  const gauges = Object.keys(WIRE_DATA)
    .map((g) => parseInt(g))
    .sort((a, b) => a - b)

  // Start with largest wire (smallest gauge number)
  let selectedGauge = gauges[0]

  // Iterate through the gauges from largest to smallest
  for (const gauge of gauges) {
    if (WIRE_DATA[gauge].current >= current) {
      selectedGauge = gauge
    } else {
      // Once we find a wire that's too small, stop and use the previous one
      break
    }
  }

  // Get wire data
  const wireData = WIRE_DATA[selectedGauge]

  return {
    gauge: selectedGauge,
    diameter: wireData.diameter,
    area: wireData.area,
    currentCapacity: wireData.current,
  }
}

/**
 * Format validation messages
 */
export function formatValidationMessages(validations: ValidationMessage[]): ValidationMessage[] {
  // Sort messages by type (error, warning, info)
  const sortOrder = { error: 0, warning: 1, info: 2 }

  return validations.sort((a, b) => {
    return sortOrder[a.type] - sortOrder[b.type]
  })
}

/**
 * Format winding instructions with HTML
 */
export function formatInstructions(instructions: string): string {
  // Add basic HTML formatting
  const formatted = instructions
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  return `<p>${formatted}</p>`
}
