// windingStyleCalculator.ts (continued)
import { type WindingInfo } from './types'

export class WindingStyleCalculator {
  /**
   * Determine if a hybrid design should be used based on impedance ratio
   */
  static shouldUseHybridDesign(inputZ: number, outputZ: number): boolean {
    const impedanceRatio = outputZ / inputZ

    // Check if the impedance ratio is close to a standard value
    const standardRatios = [1, 4, 9, 16, 25, 36, 49]
    let closestRatio = standardRatios[0]
    let minDifference = Math.abs(impedanceRatio - closestRatio)

    for (const ratio of standardRatios) {
      const difference = Math.abs(impedanceRatio - ratio)
      if (difference < minDifference) {
        minDifference = difference
        closestRatio = ratio
      }
    }

    // If the impedance ratio is not close to a standard value, suggest a hybrid design
    return minDifference > 0.5
  }

  /**
   * Determine the winding style based on impedance ratio
   */
  static determineWindingStyle(
    inputZ: number,
    outputZ: number,
    useHybridDesign: boolean,
  ): WindingInfo {
    const impedanceRatio = outputZ / inputZ

    if (Math.abs(impedanceRatio - 1) < 0.2) {
      // 1:1 current balun (bifilar winding)
      return {
        style: 'Bifilar',
        construction: 'autotransformer',
        wireCount: 2,
        connectionDetails: 'Series-Connected Windings',
      }
    } else if (Math.abs(impedanceRatio - 4) < 0.4) {
      // 1:4 or 4:1 voltage balun
      if (impedanceRatio > 1) {
        // 1:4 (step-up)
        return {
          style: 'Bifilar',
          construction: 'autotransformer',
          wireCount: 2,
          connectionDetails: 'Parallel Input, Series Output',
        }
      } else {
        // 4:1 (step-down)
        return {
          style: 'Bifilar',
          construction: 'autotransformer',
          wireCount: 2,
          connectionDetails: 'Series Input, Parallel Output',
        }
      }
    } else if (Math.abs(impedanceRatio - 9) < 0.5) {
      // 1:9 or 9:1 transformer
      if (impedanceRatio > 1) {
        // 1:9 (step-up)
        return {
          style: 'Trifilar',
          construction: 'autotransformer',
          wireCount: 3,
          connectionDetails: 'Parallel Input, Series Output',
        }
      } else {
        // 9:1 (step-down)
        return {
          style: 'Trifilar',
          construction: 'autotransformer',
          wireCount: 3,
          connectionDetails: 'Series Input, Parallel Output',
        }
      }
    } else if (useHybridDesign) {
      // Hybrid design for non-standard ratios
      return {
        style: 'Hybrid Design',
        construction: 'hybrid',
        wireCount: 2,
        connectionDetails: 'Combination of 1:1 Balun and Unun',
      }
    } else {
      // Custom ratio with autotransformer
      return {
        style: 'Custom Ratio',
        construction: 'autotransformer',
        wireCount: 2,
        connectionDetails: `Custom ${inputZ}Ω:${outputZ}Ω Transformation`,
      }
    }
  }

  /**
   * Generate detailed winding instructions
   */
  static generateWindingInstructions(
    windingInfo: WindingInfo,
    primaryTurns: number,
    coreModel: string,
  ): string {
    // Base instructions based on winding style
    let instructions = ''

    if (windingInfo.construction === 'hybrid') {
      instructions = `**Hybrid Design (1:1 Balun + Unun)**\n\n`
      instructions += `This design requires constructing two separate components:\n`
      instructions += `1. A 1:1 current balun\n`
      instructions += `2. An impedance-matching unun\n\n`
      instructions += `For detailed construction steps, please refer to the Hybrid Design section below.`

      return instructions
    }

    // Standard instructions for various winding types
    if (windingInfo.style === 'Bifilar') {
      instructions = `**Bifilar Winding Instructions for ${coreModel}**\n\n`
      instructions += `1. Prepare two identical wires (preferably different colors for easier identification).\n`
      instructions += `2. Never twist the wires together - they need to run parallel, since they are feedline. Calculate airgap <a href='calculators?category=transmission-lines&calculator=twinlead'>here</a>.\n`
      instructions += `3. Wind ${primaryTurns} turns of the twinline through the core.\n`

      if (windingInfo.construction === 'classical') {
        instructions += `4. Label the wire ends as follows:\n`
        instructions += `   - Wire 1: A (start) and B (end)\n`
        instructions += `   - Wire 2: C (start) and D (end)\n`
        instructions += `5. For a 1:1 current balun, connect B to C.\n`
        instructions += `6. Input goes across A and C, output is taken from A and D.\n`
        instructions += `7. Connect the input shield to the A terminal.\n`
      } else if (windingInfo.connectionDetails.includes('Parallel Input')) {
        instructions += `4. Label the wire ends as follows:\n`
        instructions += `   - Wire 1: A (start) and B (end)\n`
        instructions += `   - Wire 2: C (start) and D (end)\n`
        instructions += `5. For a step-up configuration, connect A to C and B to D.\n`
        instructions += `6. Input goes across the parallel combination (A/C).\n`
        instructions += `7. Output is taken from the series combination (A to D).\n`
      } else if (windingInfo.connectionDetails.includes('Series Input')) {
        instructions += `4. Label the wire ends as follows:\n`
        instructions += `   - Wire 1: A (start) and B (end)\n`
        instructions += `   - Wire 2: C (start) and D (end)\n`
        instructions += `5. For a step-down configuration, connect B to C.\n`
        instructions += `6. Input goes across the series combination (A to D).\n`
        instructions += `7. Output is taken from one of the windings (e.g., A to B).\n`
      }
    } else if (windingInfo.style === 'Trifilar') {
      instructions = `**Trifilar Winding Instructions for ${coreModel}**\n\n`
      instructions += `1. Prepare three identical wires (preferably different colors for easier identification).\n`
      instructions += `2. Never twist the wires together - they need to run parallel, since they are feedline. Calculate airgap <a href='calculators?category=transmission-lines&calculator=twinlead'>here</a>.\n`
      instructions += `3. Wind ${primaryTurns} turns of the paralell trio through the core.\n`
      instructions += `4. Label the wire ends as follows:\n`
      instructions += `   - Wire 1: A (start) and B (end)\n`
      instructions += `   - Wire 2: C (start) and D (end)\n`
      instructions += `   - Wire 3: E (start) and F (end)\n`

      if (windingInfo.connectionDetails.includes('Parallel Input')) {
        instructions += `5. For a step-up configuration, connect all starts together (A, C, E) and all ends together (B, D, F).\n`
        instructions += `6. Input goes across one winding (e.g., A to B).\n`
        instructions += `7. Output is taken across all three windings in series (A to F).\n`
      } else if (windingInfo.connectionDetails.includes('Series Input')) {
        instructions += `5. For a step-down configuration, connect B to C, D to E.\n`
        instructions += `6. Input goes across all three windings in series (A to F).\n`
        instructions += `7. Output is taken across one winding (e.g., A to B).\n`
      }
    } else {
      // Custom winding for non-standard ratios
      instructions = `**Custom Winding Instructions for ${coreModel}**\n\n`
      instructions += `This is a custom impedance transformation that uses an autotransformer configuration.\n\n`
      instructions += `1. Prepare two identical wires (preferably different colors for easier identification).\n`
      instructions += `2. Never twist the wires together - they need to run parallel, since they are feedline. Calculate airgap <a href='calculators?category=transmission-lines&calculator=twinlead'>here</a>.\n`
      instructions += `3. Wind ${primaryTurns} turns of the twisted pair through the core.\n`
      instructions += `4. For this specific impedance ratio, you will need custom connection points.\n`
      instructions += `5. Consult a reference guide or use a vector network analyzer to find the optimal tap points.\n`
    }

    // Add common notes
    instructions += `\n**Installation Notes:**\n`
    instructions += `- Use insulated wire (enamel-coated or PTFE-insulated) to prevent shorts.\n`
    instructions += `- Secure the windings to the core with electrical tape or hot glue to prevent movement.\n`
    instructions += `- Install in a weatherproof enclosure with adequate ventilation if used outdoors.\n`
    instructions += `- Keep lead lengths as short as possible, especially at higher frequencies.\n`

    return instructions
  }
}
