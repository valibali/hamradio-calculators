/**
 * Balun Calculator - Usage Example
 *
 * This file demonstrates how to use the balun calculator library
 * with various configurations and design scenarios.
 */

import { BalunConfig, OperationMode, defaultBalunConfig } from './balun-calculator-data'
import { BalunCalculator } from './balun-calculator-core'
import { HybridBalunCalculator } from './balun-calculator-hybrid'

/**
 * Example function demonstrating how to use the balun calculator
 */
function balunCalculatorExample() {
  console.log('===== Balun Calculator Example =====\n')

  // Example 1: Standard 1:4 balun with default parameters
  const config1: BalunConfig = {
    ...defaultBalunConfig,
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

  console.log('Example 1: Standard 1:4 Balun (50Ω to 200Ω)')
  const results1 = BalunCalculator.calculateBalunDesign(config1)
  const validation1 = BalunCalculator.validateBalunDesign(results1)
  console.log(`- Valid design: ${validation1.valid ? 'Yes' : 'No'}`)
  console.log(`- Core: ${results1.coreModel.id} (${config1.coreCount}x)`)
  console.log(`- Primary turns: ${config1.primaryTurns}`)
  console.log(`- Secondary turns: ${config1.primaryTurns * 2}`)
  console.log(
    `- Frequency range: ${config1.minFrequency}-${Math.min(config1.maxFrequency, results1.maxFreqBasedOnLength).toFixed(1)} MHz`,
  )
  console.log(`- Power rating: ${results1.calculatedPowerRating.toFixed(1)}W`)
  console.log(
    `- Core loss: ${results1.coreLossAtMinFreq.toFixed(1)}W / ${results1.maxPermissibleCoreLoss.toFixed(1)}W max`,
  )
  console.log()

  // Example 2: Optimized 1:4 balun for 80m-10m bands
  console.log('Example 2: Optimized 1:4 Balun (50Ω to 200Ω)')
  const config2: BalunConfig = {
    ...config1,
    primaryTurns: 0, // Let the optimizer determine turns
  }

  const optimized2 = BalunCalculator.optimizeBalunDesign(config2)
  console.log(`- Optimized turns: ${optimized2.config.primaryTurns}`)
  console.log(`- Optimized core count: ${optimized2.config.coreCount}`)
  console.log(`- Optimized min frequency: ${optimized2.config.minFrequency} MHz`)
  console.log(`- Power rating: ${optimized2.calculatedPowerRating.toFixed(1)}W`)
  console.log(`- Meets Rule of 4: ${optimized2.meetsRuleOfFour ? 'Yes' : 'No'}`)
  console.log(`- Within core loss limits: ${optimized2.withinCoreLossLimits ? 'Yes' : 'No'}`)
  console.log()

  // Example 3: High power 1:4 balun for 160m-10m
  console.log('Example 3: High Power 1:4 Balun (50Ω to 200Ω, 1.8-30 MHz, 500W)')
  const config3: BalunConfig = {
    ...config1,
    minFrequency: 1.8,
    power: 500,
    operationMode: OperationMode.CW,
    primaryTurns: 0, // Let the optimizer determine turns
  }

  const optimized3 = BalunCalculator.optimizeBalunDesign(config3)
  console.log(`- Optimized turns: ${optimized3.config.primaryTurns}`)
  console.log(`- Optimized core count: ${optimized3.config.coreCount}`)
  console.log(`- Core model: ${optimized3.coreModel.id}`)
  console.log(
    `- Frequency range: ${optimized3.config.minFrequency}-${Math.min(optimized3.config.maxFrequency, optimized3.maxFreqBasedOnLength).toFixed(1)} MHz`,
  )
  console.log(`- Power rating: ${optimized3.calculatedPowerRating.toFixed(1)}W`)
  console.log()

  // Example 4: Hybrid design for 1:9 impedance ratio
  console.log('Example 4: Hybrid Balun for 1:9 Ratio (50Ω to 450Ω)')
  const config4: BalunConfig = {
    ...config1,
    outputImpedance: 450,
    useHybridDesign: true,
  }

  const hybridComponents = HybridBalunCalculator.designHybridSystem(config4)
  console.log('Current Balun Component:')
  console.log(`- Core: ${hybridComponents.balun.coreType}`)
  console.log(`- Turns: ${hybridComponents.balun.turns} bifilar`)
  console.log(
    `- Input: ${hybridComponents.balun.inputImpedance}Ω, Output: ${hybridComponents.balun.outputImpedance}Ω balanced`,
  )

  console.log('Unun Component:')
  console.log(`- Core: ${hybridComponents.unun.coreType}`)
  console.log(
    `- Turns: ${hybridComponents.unun.turns.primary}:${hybridComponents.unun.turns.secondary}`,
  )
  console.log(
    `- Input: ${hybridComponents.unun.inputImpedance}Ω, Output: ${hybridComponents.unun.outputImpedance}Ω`,
  )

  // Calculate performance metrics
  const hybridCoreLoss = HybridBalunCalculator.calculateHybridCoreLoss(
    hybridComponents,
    config4.minFrequency,
    config4.power,
  )

  const hybridMaxLoss = HybridBalunCalculator.calculateHybridMaxPermissibleCoreLoss(
    hybridComponents,
    config4.operationMode,
  )

  console.log(`- Core loss: ${hybridCoreLoss.toFixed(1)}W / ${hybridMaxLoss.toFixed(1)}W max`)
  console.log()

  // Example 5: Digital modes (FT-8) balun
  console.log('Example 5: Digital Modes 1:4 Balun (50Ω to 200Ω, 100W FT-8)')
  const config5: BalunConfig = {
    ...config1,
    operationMode: OperationMode.DIGITAL,
    primaryTurns: 0, // Let the optimizer determine turns
  }

  const optimized5 = BalunCalculator.optimizeBalunDesign(config5)
  console.log(`- Optimized turns: ${optimized5.config.primaryTurns}`)
  console.log(`- Optimized core count: ${optimized5.config.coreCount}`)
  console.log(`- Optimized min frequency: ${optimized5.config.minFrequency} MHz`)
  console.log(`- Power rating: ${optimized5.calculatedPowerRating.toFixed(1)}W`)
  console.log()

  // Generate a full design report for one of our examples
  console.log('=== DESIGN REPORT ===\n')
  const report = BalunCalculator.generateDesignReport(optimized2)
  console.log(report)

  // Generate hybrid design report
  console.log('\n=== HYBRID DESIGN REPORT ===\n')
  const hybridReport = HybridBalunCalculator.generateHybridReport(hybridComponents, config4)
  console.log(hybridReport)
}

/**
 * Example showing how to design a specific balun from scratch
 */
function designSpecificBalun() {
  console.log('\n===== Designing a Specific Balun =====\n')

  // Design parameters
  const inputImpedance = 50
  const outputImpedance = 200
  const power = 100
  const minFreq = 3.5
  const maxFreq = 30
  const mode = OperationMode.SSB

  // Step 1: Calculate characteristic impedance
  const charZ = Math.sqrt(inputImpedance * outputImpedance)
  console.log(`Characteristic Impedance: ${charZ.toFixed(1)}Ω`)

  // Step 2: Determine if hybrid design is needed
  const needsHybrid = Math.abs(charZ - 50) > 10 && Math.abs(charZ - 100) > 10
  console.log(`Hybrid Design Recommended: ${needsHybrid ? 'Yes' : 'No'}`)

  // Step 3: Create configuration
  const config: BalunConfig = {
    inputImpedance,
    outputImpedance,
    power,
    minFrequency: minFreq,
    maxFrequency: maxFreq,
    operationMode: mode,
    coreCount: 1, // Start with a single core
    primaryTurns: 0, // Let the optimizer determine this
    useHybridDesign: needsHybrid,
  }

  // Step 4: Optimize the design
  console.log('Optimizing design...')
  const optimizedDesign = BalunCalculator.optimizeBalunDesign(config)

  // Step 5: Generate report
  console.log('\n=== OPTIMIZED DESIGN REPORT ===\n')
  const report = BalunCalculator.generateDesignReport(optimizedDesign)
  console.log(report)

  // Step 6: If hybrid design is needed, generate that report too
  if (needsHybrid) {
    console.log('\n=== HYBRID DESIGN ALTERNATIVE ===\n')
    const hybridComponents = HybridBalunCalculator.designHybridSystem(config)
    const hybridReport = HybridBalunCalculator.generateHybridReport(hybridComponents, config)
    console.log(hybridReport)
  }
}

// Execute the examples
balunCalculatorExample()
designSpecificBalun()
