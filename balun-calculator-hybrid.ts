/**
 * Balun Calculator - Hybrid Design Implementation
 *
 * This file contains the specialized logic for hybrid balun designs,
 * which combine a current balun with an unun transformer.
 */

import {
  BalunConfig,
  BalunResults,
  CoreModel,
  OperationMode,
  constants,
  wireSpecs,
  coreModels,
} from './balun-calculator-data'
import { BalunCalculator } from './balun-calculator-core'

/**
 * Specialized class for handling hybrid balun designs (balun + unun)
 */
export interface HybridComponents {
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

export class HybridBalunCalculator {
  /**
   * Represent the component configuration of a hybrid design
   */

  /**
   * Design a hybrid balun system with optimized components
   */
  public static designHybridSystem(config: BalunConfig): HybridComponents {
    // Calculate the geometric mean of the impedances
    const geometricMean = Math.sqrt(config.inputImpedance * config.outputImpedance)

    // Determine which standard impedance to use (50Ω or 100Ω)
    const targetImpedance = Math.abs(geometricMean - 50) < Math.abs(geometricMean - 100) ? 50 : 100

    // Get best core model
    const coreModel = coreModels.find((core) => core.id === 'FT140-43') || coreModels[0]

    // Calculate minimum turns for the 1:1 current balun
    const balunTurns = this.calculateMinimumTurnsForBalun(
      coreModel,
      config.minFrequency,
      config.inputImpedance,
      1, // Current balun uses a single core
    )

    // Calculate turns for the unun transformer
    const ununPrimaryTurns = this.calculateMinimumTurnsForUnun(
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

  /**
   * Calculate minimum turns required for a 1:1 current balun
   */
  private static calculateMinimumTurnsForBalun(
    core: CoreModel,
    freqMHz: number,
    impedance: number,
    coreCount: number,
  ): number {
    // For current balun, we need XL >= 4 × Z
    // Try increasing turns until we meet the requirement
    for (let turns = 5; turns <= 15; turns++) {
      // Estimate reactance based on permeability at this frequency
      const permeabilityData = this.getPermeabilityAtFrequency(core, freqMHz)
      const formFactor = this.calculateFormFactor(core, coreCount)

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

  /**
   * Calculate minimum turns required for an unun transformer
   */
  private static calculateMinimumTurnsForUnun(
    core: CoreModel,
    freqMHz: number,
    impedance: number,
    coreCount: number,
  ): number {
    // Unun transformers need the same reactance requirements as baluns
    return this.calculateMinimumTurnsForBalun(core, freqMHz, impedance, coreCount)
  }

  /**
   * Calculate form factor for a core (helper function)
   */
  private static calculateFormFactor(core: CoreModel, coreCount: number): number {
    return (
      constants.mu0 * ((coreCount * core.dimensions.ae) / (coreCount * core.dimensions.le)) * 1e-2
    )
  }

  /**
   * Get permeability at a specific frequency (helper function)
   */
  private static getPermeabilityAtFrequency(core: CoreModel, freqMHz: number): any {
    // Find the closest data points
    const sortedData = [...core.permeabilityData].sort((a, b) => a.freq - b.freq)

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

  /**
   * Calculate the winding length for a hybrid system
   */
  public static calculateHybridWindingLength(components: HybridComponents): number {
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

  /**
   * Calculate maximum frequency for a hybrid system
   */
  public static calculateHybridMaxFrequency(windingLengthCm: number): number {
    // Convert winding length to meters
    const windingLengthM = windingLengthCm / 100

    // Double for bifilar winding
    const totalLengthM = windingLengthM * 2

    // f_max = 300 / (10 × totalLength) [MHz]
    return (constants.speedOfLight * 1e-6) / (totalLengthM / constants.maxWindingLengthFraction)
  }

  /**
   * Calculate core loss for a hybrid system
   */
  public static calculateHybridCoreLoss(
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
    const balunPermeability = this.getPermeabilityAtFrequency(balunCore, freqMHz)
    const balunFormFactor = this.calculateFormFactor(balunCore, 1)
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
    const ununPermeability = this.getPermeabilityAtFrequency(ununCore, freqMHz)
    const ununFormFactor = this.calculateFormFactor(ununCore, 1)
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

  /**
   * Calculate maximum permissible core loss for a hybrid system
   */
  public static calculateHybridMaxPermissibleCoreLoss(
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

  /**
   * Generate a detailed report for a hybrid balun design
   */
  public static generateHybridReport(components: HybridComponents, config: BalunConfig): string {
    // Calculate additional performance metrics
    const windingLength = this.calculateHybridWindingLength(components)
    const maxFrequency = this.calculateHybridMaxFrequency(windingLength)
    const coreLoss = this.calculateHybridCoreLoss(components, config.minFrequency, config.power)
    const maxCoreLoss = this.calculateHybridMaxPermissibleCoreLoss(components, config.operationMode)

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
    report += `1. Construct the 1:1 current balun using ${components.balun.turns} bifilar turns of AWG ${this.getRecommendedWireGauge(config.power, components.balun.inputImpedance)} wire.\n`
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

  /**
   * Helper method to get recommended wire gauge
   */
  private static getRecommendedWireGauge(power: number, impedance: number): number {
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
}
