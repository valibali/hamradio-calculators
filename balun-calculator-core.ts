/**
 * Balun Calculator - Core Logic
 *
 * This file contains the main calculation and optimization logic for
 * designing baluns based on the specified requirements.
 */

import {
  BalunConfig,
  BalunResults,
  CoreModel,
  OperationMode,
  PermeabilityData,
  ValidationResult,
  WireSpec,
  constants,
  coreModels,
  defaultBalunConfig,
  dutyCycleFactor,
  hamBands,
  wireSpecs,
} from './balun-calculator-data'

/**
 * Core calculator class for balun design
 */
export class BalunCalculator {
  /**
   * Find the nearest permeability data point for a given frequency
   */
  private static getPermeabilityAtFrequency(core: CoreModel, freqMHz: number): PermeabilityData {
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

  /**
   * Calculate the form factor for a core
   */
  private static calculateFormFactor(core: CoreModel, coreCount: number): number {
    return (
      constants.mu0 * ((coreCount * core.dimensions.ae) / (coreCount * core.dimensions.le)) * 1e-2
    )
  }

  /**
   * Calculate inductance at a specific frequency
   */
  private static calculateInductance(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
  ): number {
    const permeabilityData = BalunCalculator.getPermeabilityAtFrequency(core, freqMHz)
    const formFactor = BalunCalculator.calculateFormFactor(core, coreCount)

    // L(f) = n² × μ'(f) × C × 10⁶ [μH]
    return Math.pow(turns, 2) * permeabilityData.muPrime * formFactor * 1e6
  }

  /**
   * Calculate inductive reactance at a specific frequency
   */
  private static calculateInductiveReactance(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
  ): number {
    const inductance = BalunCalculator.calculateInductance(core, turns, freqMHz, coreCount)

    // XL(f) = 2π × f × L(f) [Ω]
    return 2 * Math.PI * freqMHz * 1e6 * inductance * 1e-6
  }

  /**
   * Calculate series resistance at a specific frequency
   */
  private static calculateSeriesResistance(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
  ): number {
    const permeabilityData = BalunCalculator.getPermeabilityAtFrequency(core, freqMHz)
    const formFactor = BalunCalculator.calculateFormFactor(core, coreCount)

    // R(f) = 2π × f × n² × μ"(f) × C [Ω]
    return (
      2 * Math.PI * freqMHz * 1e6 * Math.pow(turns, 2) * permeabilityData.muDoublePrime * formFactor
    )
  }

  /**
   * Calculate complex impedance at a specific frequency
   */
  private static calculateComplexImpedance(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
  ): number {
    const reactance = BalunCalculator.calculateInductiveReactance(core, turns, freqMHz, coreCount)
    const resistance = BalunCalculator.calculateSeriesResistance(core, turns, freqMHz, coreCount)

    // Z(f) = √(XL(f)² + R(f)²) [Ω]
    return Math.sqrt(Math.pow(reactance, 2) + Math.pow(resistance, 2))
  }

  /**
   * Calculate core loss at a specific frequency
   */
  private static calculateCoreLoss(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
    rmsVoltage: number,
  ): number {
    const impedance = BalunCalculator.calculateComplexImpedance(core, turns, freqMHz, coreCount)

    // P(f) = U[RMS]² / Z(f) [W]
    return Math.pow(rmsVoltage, 2) / impedance
  }

  /**
   * Calculate maximum permissible core loss
   */
  private static calculateMaxPermissibleCoreLoss(
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

  /**
   * Calculate flux density at a specific frequency
   */
  private static calculateFluxDensity(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    rmsVoltage: number,
  ): number {
    // B(f) = U[RMS] × 10³ / (4.44 × n × f × 10⁶ × Ae × 10⁻⁴) [mT]
    return (rmsVoltage * 1e3) / (4.44 * turns * freqMHz * 1e6 * core.dimensions.ae * 1e-4)
  }

  /**
   * Calculate winding length
   */
  private static calculateWindingLength(core: CoreModel, turns: number, coreCount: number): number {
    // l_tek = 1.2 × n × ((OD-ID) + (K×2×W)) [mm]
    const lengthMm =
      constants.windingLengthFactor *
      turns *
      (core.dimensions.od - core.dimensions.id + coreCount * 2 * core.dimensions.height)

    // Convert to centimeters
    return lengthMm / 10
  }

  /**
   * Calculate maximum frequency based on winding length
   */
  private static calculateMaxFreqFromWindingLength(windingLengthCm: number): number {
    // Convert winding length to meters
    const windingLengthM = windingLengthCm / 100

    // Double for bifilar winding
    const totalLengthM = windingLengthM * 2

    // f_max = 300 / (10 × totalLength) [MHz]
    return (constants.speedOfLight * 1e-6) / (totalLengthM / constants.maxWindingLengthFraction)
  }

  /**
   * Calculate RMS voltage from power and impedance
   */
  private static calculateRmsVoltage(power: number, impedance: number): number {
    // U[RMS] = √(P × Z) [V]
    return Math.sqrt(power * impedance)
  }

  /**
   * Calculate quality factor
   */
  private static calculateQFactor(
    core: CoreModel,
    turns: number,
    freqMHz: number,
    coreCount: number,
  ): number {
    const reactance = BalunCalculator.calculateInductiveReactance(core, turns, freqMHz, coreCount)
    const resistance = BalunCalculator.calculateSeriesResistance(core, turns, freqMHz, coreCount)

    // Q = XL / R
    return reactance / resistance
  }

  /**
   * Calculate minimum turns required for Rule of 4
   */
  private static calculateMinimumTurnsForRuleOfFour(
    core: CoreModel,
    freqMHz: number,
    impedance: number,
    coreCount: number,
  ): number {
    // We need XL(f) ≥ 4 × Z
    const targetReactance = constants.ruleOfFourFactor * impedance

    // Try increasing turns until we meet the requirement
    for (let turns = 4; turns <= 20; turns++) {
      const reactance = BalunCalculator.calculateInductiveReactance(core, turns, freqMHz, coreCount)
      if (reactance >= targetReactance) {
        return turns
      }
    }

    // If we couldn't find a solution with 20 turns, return a high value
    return 21
  }

  /**
   * Calculate the recommended wire gauge based on primary winding current
   * @param designResults The calculated design results containing current information
   * @returns Wire information including gauge, diameter, area, and current capacity
   */
  private static calculateRecommendedWireGauge(designResults: DesignResults): WireInfo {
    // Get the current in the primary winding from the design results
    // This would be calculated during the core loss calculation
    const primaryCurrent = designResults.current // Amps

    // Add safety margin (typically 50% for RF applications)
    const currentWithMargin = primaryCurrent * 1.5

    // Find the appropriate wire gauge that can handle this current
    let selectedGauge = 30 // Start with thinnest wire

    for (const [gauge, data] of Object.entries(WIRE_DATA)) {
      if (data.current >= currentWithMargin) {
        selectedGauge = parseInt(gauge)
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
   * Calculate characteristic impedance
   */
  private static calculateCharacteristicImpedance(inputZ: number, outputZ: number): number {
    // Zchar = √(Zin × Zout) [Ω]
    return Math.sqrt(inputZ * outputZ)
  }

  /**
   * Find best core for the given requirements
   */
  private static findBestCore(config: BalunConfig): CoreModel {
    // For now, we'll just use FT140-43 for standard needs and FT240-43 for higher power
    return config.power > 150 ? coreModels[1] : coreModels[0]
  }

  /**
   * Calculate necessary parameters for a balun design
   */
  public static calculateBalunDesign(config: BalunConfig): BalunResults {
    // Find the best core for the requirements
    const core = BalunCalculator.findBestCore(config)

    // Calculate RMS voltage
    const rmsVoltage = BalunCalculator.calculateRmsVoltage(config.power, config.inputImpedance)

    // Calculate key parameters
    const reactance = BalunCalculator.calculateInductiveReactance(
      core,
      config.primaryTurns,
      config.minFrequency,
      config.coreCount,
    )

    const impedance = BalunCalculator.calculateComplexImpedance(
      core,
      config.primaryTurns,
      config.minFrequency,
      config.coreCount,
    )

    const coreLoss = BalunCalculator.calculateCoreLoss(
      core,
      config.primaryTurns,
      config.minFrequency,
      config.coreCount,
      rmsVoltage,
    )

    const maxCoreLoss = BalunCalculator.calculateMaxPermissibleCoreLoss(
      core,
      config.coreCount,
      config.operationMode,
    )

    const fluxDensity = BalunCalculator.calculateFluxDensity(
      core,
      config.primaryTurns,
      config.minFrequency,
      rmsVoltage,
    )

    const windingLengthCm = BalunCalculator.calculateWindingLength(
      core,
      config.primaryTurns,
      config.coreCount,
    )

    const maxFreqFromLength = BalunCalculator.calculateMaxFreqFromWindingLength(windingLengthCm)

    const qFactor = BalunCalculator.calculateQFactor(
      core,
      config.primaryTurns,
      config.minFrequency,
      config.coreCount,
    )

    const characteristicImpedance = BalunCalculator.calculateCharacteristicImpedance(
      config.inputImpedance,
      config.outputImpedance,
    )

    const recommendedWireGauge = BalunCalculator.calculateRecommendedWireGauge(
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
    }
  }

  /**
   * Validate if a balun design meets all requirements
   */
  public static validateBalunDesign(results: BalunResults): ValidationResult {
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

  /**
   * Optimize a balun design based on given configuration
   */
  public static optimizeBalunDesign(config: BalunConfig): BalunResults {
    const core = BalunCalculator.findBestCore(config)

    // Step 1: Optimize turn count
    // Start with the minimum number of turns that satisfies the Rule of 4
    const minTurns = BalunCalculator.calculateMinimumTurnsForRuleOfFour(
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
    let results = BalunCalculator.calculateBalunDesign(optimizedConfig)
    let validation = BalunCalculator.validateBalunDesign(results)

    // Step 2: If core loss is too high, try increasing the minimum frequency
    if (!validation.valid && !results.withinCoreLossLimits) {
      // Try increasing the minimum frequency stepwise
      const frequencySteps = [1.8, 3.5, 5.0, 7.0, 10.0, 14.0]

      for (const freq of frequencySteps) {
        if (freq <= config.minFrequency) continue

        // Recalculate minimum turns for the new frequency
        const newMinTurns = BalunCalculator.calculateMinimumTurnsForRuleOfFour(
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
        results = BalunCalculator.calculateBalunDesign(optimizedConfig)
        validation = BalunCalculator.validateBalunDesign(results)

        // If we've found a valid configuration, break
        if (results.withinCoreLossLimits) {
          break
        }
      }
    }

    // Step 3: If still not valid, try using stacked cores
    if (!validation.valid && !results.withinCoreLossLimits && config.coreCount === 1) {
      // Revert to original minimum frequency but use stacked cores
      const newMinTurns = BalunCalculator.calculateMinimumTurnsForRuleOfFour(
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

      results = BalunCalculator.calculateBalunDesign(optimizedConfig)
    }

    // Generate alternative configurations
    const alternatives: BalunResults[] = []

    // Alternative 1: Single core design with higher min frequency
    if (config.coreCount === 2 || optimizedConfig.coreCount === 2) {
      for (const freq of [1.8, 3.5, 5.0]) {
        if (freq <= config.minFrequency) continue

        const altTurns = BalunCalculator.calculateMinimumTurnsForRuleOfFour(
          core,
          freq,
          config.inputImpedance,
          1,
        )

        const altConfig = {
          ...config,
          minFrequency: freq,
          coreCount: 1,
          primaryTurns: altTurns,
        }

        const altResults = BalunCalculator.calculateBalunDesign(altConfig)
        const altValidation = BalunCalculator.validateBalunDesign(altResults)

        if (altValidation.valid) {
          alternatives.push(altResults)
          break
        }
      }
    }

    // Alternative 2: Hybrid design if not already using it
    if (!config.useHybridDesign) {
      const hybridConfig = BalunCalculator.designHybridBalun(config)
      const hybridResults = BalunCalculator.calculateBalunDesign(hybridConfig)
      alternatives.push(hybridResults)
    }

    // Return the results with alternatives
    return {
      ...results,
      alternativeConfigurations: alternatives,
    }
  }

  /**
   * Design a hybrid balun (balun + unun)
   */
  public static designHybridBalun(config: BalunConfig): BalunConfig {
    const characteristicImpedance = BalunCalculator.calculateCharacteristicImpedance(
      config.inputImpedance,
      config.outputImpedance,
    )

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
        BalunCalculator.calculateMinimumTurnsForRuleOfFour(
          BalunCalculator.findBestCore(config),
          config.minFrequency,
          config.inputImpedance,
          config.coreCount,
        ) - 1, // Slight reduction in turns for the hybrid approach
    }
  }

  /**
   * Generate a full balun design report
   */
  public static generateDesignReport(results: BalunResults): string {
    const validation = BalunCalculator.validateBalunDesign(results)
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
    report += `- Secondary Turns: ${results.config.primaryTurns * Math.sqrt(results.config.outputImpedance / results.config.inputImpedance)}\n`
    report += `- Wire Gauge: AWG ${results.recommendedWireGauge}\n`
    report += `- Winding Length: ${results.windingLengthCm.toFixed(1)} cm\n`
    report += `- Characteristic Impedance: ${results.characteristicImpedance.toFixed(1)} Ω\n\n`

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
}
