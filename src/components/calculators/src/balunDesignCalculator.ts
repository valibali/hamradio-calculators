// balunDesignCalculator.ts
import {
  type BalunConfig,
  type CoreModel,
  type DesignResults,
  type ValidationMessage,
  type ValidationResult,
  type HybridComponents,
} from './types'
import { CoreCalculator } from './coreCalculator'
import { WindingStyleCalculator } from './windingStyleCalculator'
import {
  calculateWindingLength,
  calculateMaxFreqBasedOnLength,
  calculateCharacteristicImpedance,
} from './utils'
import { DUTY_CYCLE_FACTORS, HAM_BANDS } from './constants'

export class BalunDesignCalculator {
  /**
   * Calculate and validate a balun design
   */
  static calculateBalunDesign(config: BalunConfig, coreModel: CoreModel): DesignResults {
    // Auto-calculate primary turns if not specified
    let primaryTurns = config.primaryTurns
    if (primaryTurns === 0) {
      primaryTurns = this.calculateOptimalTurns(config, coreModel)
    }

    // Calculate impedance and reactance at the minimum frequency
    const {
      Z: impedanceAtMinFreq,
      Xs: reactanceAtMinFreq,
      Q: qFactorAtMinFreq,
    } = CoreCalculator.calculateImpedance(
      config.minFrequency,
      primaryTurns,
      coreModel,
      config.coreCount,
    )

    // Calculate losses and other performance metrics
    const {
      powerLoss: coreLossAtMinFreq,
      fluxDensity: fluxDensityAtMinFreq,
      current: primaryCurrent, // Get the current value
    } = CoreCalculator.calculateLosses(
      config.minFrequency,
      primaryTurns,
      coreModel,
      config.coreCount,
      config.power,
      config.inputImpedance,
    )

    // Calculate the maximum permissible core loss based on operation mode
    const dutyCycleFactor = DUTY_CYCLE_FACTORS[config.operationMode]
    const maxPermissibleCoreLoss = CoreCalculator.calculateMaxPermissibleCoreLoss(
      coreModel,
      config.coreCount,
      dutyCycleFactor,
    )

    // Calculate characteristic impedance
    const characteristicImpedance = calculateCharacteristicImpedance(
      config.inputImpedance,
      config.outputImpedance,
    )

    // Validate the rule of 4 (XL ≥ 4×Z)
    const meetsRuleOfFour = reactanceAtMinFreq >= 4 * config.inputImpedance

    // Validate core loss limits
    const withinCoreLossLimits = coreLossAtMinFreq <= maxPermissibleCoreLoss

    // Validate flux density (should be in linear region, typically <50mT)
    const fluxDensityInLinearRegion = fluxDensityAtMinFreq < 50

    // Calculate winding length and maximum frequency based on length
    const windingLengthCm = calculateWindingLength(primaryTurns, coreModel, config.coreCount)
    const maxFreqBasedOnLength = calculateMaxFreqBasedOnLength(windingLengthCm, config)

    // Calculate power rating based on core loss
    const calculatedPowerRating = (config.power * maxPermissibleCoreLoss) / coreLossAtMinFreq

    // Determine winding style
    const windingInfo = WindingStyleCalculator.determineWindingStyle(
      config.inputImpedance,
      config.outputImpedance,
      config.useHybridDesign,
    )

    // Combine results
    const updatedConfig = {
      ...config,
      primaryTurns,
    }

    return {
      config: updatedConfig,
      coreModel,
      characteristicImpedance,
      calculatedPowerRating,
      current: primaryCurrent,

      reactanceAtMinFreq,
      impedanceAtMinFreq,
      coreLossAtMinFreq,
      maxPermissibleCoreLoss,
      fluxDensityAtMinFreq,
      windingLengthCm,
      maxFreqBasedOnLength,
      qFactorAtMinFreq,

      meetsRuleOfFour,
      withinCoreLossLimits,
      fluxDensityInLinearRegion,

      windingInfo,
    }
  }

  /**
   * Calculate optimal turn count
   */
  static calculateOptimalTurns(config: BalunConfig, coreModel: CoreModel): number {
    // Start with minimum turns (based on rule of 4)
    let minTurns = 1

    // Find the minimum turns that satisfy the rule of 4
    while (true) {
      const { Xs } = CoreCalculator.calculateImpedance(
        config.minFrequency,
        minTurns,
        coreModel,
        config.coreCount,
      )

      if (Xs >= 4 * config.inputImpedance) {
        break
      }

      minTurns++

      // Safety check to prevent infinite loops
      if (minTurns > 50) {
        return 12 // Return a default value
      }
    }

    // Now, increase turns until power handling requirements are met
    let optimalTurns = minTurns

    while (true) {
      const { powerLoss } = CoreCalculator.calculateLosses(
        config.minFrequency,
        optimalTurns,
        coreModel,
        config.coreCount,
        config.power,
        config.inputImpedance,
      )

      // Check if core loss is within limits
      const dutyCycleFactor = DUTY_CYCLE_FACTORS[config.operationMode]
      const maxLoss = CoreCalculator.calculateMaxPermissibleCoreLoss(
        coreModel,
        config.coreCount,
        dutyCycleFactor,
      )

      if (powerLoss <= maxLoss) {
        break
      }

      optimalTurns++

      // Safety check
      if (optimalTurns > minTurns + 20) {
        // If we can't meet power requirements, return the minimum turns
        return minTurns
      }
    }

    return optimalTurns
  }

  /**
   * Generate alternative configurations
   */
  static generateAlternatives(
    config: BalunConfig,
    coreModel: CoreModel,
    designResults: DesignResults,
  ): DesignResults[] {
    const alternatives: DesignResults[] = []

    // Alternative 1: Use stacked cores
    if (config.coreCount === 1) {
      const stackedConfig = {
        ...config,
        coreCount: 2,
      }

      alternatives.push(this.calculateBalunDesign(stackedConfig, coreModel))
    }

    // Alternative 2: Use hybrid design if not already using one
    if (
      !config.useHybridDesign &&
      WindingStyleCalculator.shouldUseHybridDesign(config.inputImpedance, config.outputImpedance)
    ) {
      const hybridConfig = {
        ...config,
        useHybridDesign: true,
      }

      alternatives.push(this.calculateBalunDesign(hybridConfig, coreModel))
    }

    // Alternative 3: Try a different core material if frequency range warrants it
    // This would require more implementation in a real system

    return alternatives
  }

  /**
   * Validate the design and generate validation messages
   */
  static validateDesign(designResults: DesignResults): ValidationResult {
    const messages: ValidationMessage[] = []

    // Check the rule of 4 (XL ≥ 4×Z)
    if (!designResults.meetsRuleOfFour) {
      messages.push({
        type: 'error',
        message: `Reactance (${designResults.reactanceAtMinFreq.toFixed(1)}Ω) is less than 4× input impedance (${4 * designResults.config.inputImpedance}Ω) at the minimum frequency. Increase turns or use a higher-permeability core.`,
      })
    }

    // Check core loss limits
    if (!designResults.withinCoreLossLimits) {
      messages.push({
        type: 'error',
        message: `Core loss (${designResults.coreLossAtMinFreq.toFixed(1)}W) exceeds maximum permissible loss (${designResults.maxPermissibleCoreLoss.toFixed(1)}W). Reduce power, increase turns, or use stacked cores.`,
      })
    }

    // Check flux density
    if (!designResults.fluxDensityInLinearRegion) {
      messages.push({
        type: 'warning',
        message: `Flux density (${designResults.fluxDensityAtMinFreq.toFixed(1)}mT) exceeds the linear region (<50mT). Core may saturate at full power, causing distortion.`,
      })
    }

    // Check frequency range based on winding length
    if (
      designResults.config.useHybridDesign &&
      designResults.maxFreqBasedOnLength < designResults.config.maxFrequency
    ) {
      messages.push({
        type: 'info',
        message: `Winding length limits the theoretical maximum frequency to ${designResults.maxFreqBasedOnLength.toFixed(1)}MHz (below the specified ${designResults.config.maxFrequency}MHz).\n
        This is not necessarily a problem, but you may encounter higher theoretical insertion SWR, since the wire will start having stronger feedline-behavior at this length.`,
      })
    }

    // Check if core is appropriate for frequency range
    if (designResults.config.minFrequency < designResults.coreModel.recommendedFreqRange.min) {
      messages.push({
        type: 'warning',
        message: `The selected core is recommended for frequencies above ${designResults.coreModel.recommendedFreqRange.min}MHz. Performance may be reduced at ${designResults.config.minFrequency}MHz.`,
      })
    }

    if (designResults.config.maxFrequency > designResults.coreModel.recommendedFreqRange.max) {
      messages.push({
        type: 'warning',
        message: `The selected core is recommended for frequencies below ${designResults.coreModel.recommendedFreqRange.max}MHz. Performance may be reduced at ${designResults.config.maxFrequency}MHz.`,
      })
    }

    // Check quality factor
    if (designResults.qFactorAtMinFreq > 5) {
      messages.push({
        type: 'warning',
        message: `High Q factor (${designResults.qFactorAtMinFreq.toFixed(1)}) may result in increased losses. Consider using a different core material.`,
      })
    }

    // Add information about hybrid design if appropriate
    if (
      !designResults.config.useHybridDesign &&
      WindingStyleCalculator.shouldUseHybridDesign(
        designResults.config.inputImpedance,
        designResults.config.outputImpedance,
      )
    ) {
      messages.push({
        type: 'info',
        message: `For this impedance ratio (1:${(designResults.config.outputImpedance / designResults.config.inputImpedance).toFixed(1)}), a hybrid design may offer better performance.`,
      })
    }

    return {
      valid: !messages.some((m) => m.type === 'error'),
      messages,
    }
  }

  /**
   * Calculate power transfer data for HAM bands
   */
  static calculateBandPowerData(
    core: CoreModel,
    turns: number,
    coreCount: number,
    inputPower: number,
    inputImpedance: number,
  ) {
    // Calculate power transfer for each HAM band
    return HAM_BANDS.map((band) => {
      const centerFreq = (band.min + band.max) / 2

      // Calculate core losses and power output
      const lossResult = CoreCalculator.calculateLosses(
        centerFreq,
        turns,
        core,
        coreCount,
        inputPower,
        inputImpedance,
      )

      // Calculate reactance
      const reactance = 2 * Math.PI * centerFreq * 1e6 * lossResult.inductance * 1e-6

      // Calculate Q factor
      const qFactor = reactance / lossResult.resistance

      // Calculate SWR (input power / output power)
      const swr = inputPower / lossResult.P_out

      return {
        band: band.name,
        frequency: centerFreq,
        inductance: lossResult.inductance,
        reactance: reactance,
        resistance: lossResult.resistance,
        qFactor: qFactor,
        fluxDensity: lossResult.fluxDensity,
        powerOut: lossResult.P_out,
        efficiency: (lossResult.P_out / inputPower) * 100,
        swr: swr,
      }
    })
  }

  /**
   * Calculate SWR data across the HF spectrum
   */
  static calculateSWRData(
    core: CoreModel,
    turns: number,
    coreCount: number,
    inputPower: number,
    inputImpedance: number,
  ) {
    // Generate SWR data across the HF spectrum (1-30 MHz)
    const points = 29
    const minFreq = 1
    const maxFreq = 30

    return Array.from({ length: points }, (_, i) => {
      const freq = minFreq + i

      // Calculate core losses and power output
      const lossResult = CoreCalculator.calculateLosses(
        freq,
        turns,
        core,
        coreCount,
        inputPower,
        inputImpedance,
      )

      // Calculate SWR (input power / output power)
      // Ensure we don't divide by zero
      const powerOut = Math.max(lossResult.P_out, 0.001)
      const swr = inputPower / powerOut

      return {
        frequency: freq,
        swr: Math.min(swr, 10), // Cap SWR at 10 for display purposes
      }
    })
  }

  /**
   * Generate hybrid design components for non-standard impedance ratios
   */
  static generateHybridComponents(config: BalunConfig, coreModel: CoreModel): HybridComponents {
    // For a hybrid design, we use a 1:1 current balun followed by an impedance transformer

    const balunConfig: BalunConfig = {
      ...config,
      type: 'current',
      outputImpedance: config.inputImpedance, //make sure the balun is a 1:1 current (choke) balun
    }

    const ununConfig: BalunConfig = {
      ...config,
      type: 'voltage',
    }

    const balun = BalunDesignCalculator.calculateBalunDesign(balunConfig, coreModel)
    const unun = BalunDesignCalculator.calculateBalunDesign(ununConfig, coreModel)

    return { balun, unun }
  }
}
