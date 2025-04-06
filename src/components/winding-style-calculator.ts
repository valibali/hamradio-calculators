/**
 * Balun Calculator - Winding Style Module
 *
 * This module provides specialized logic for determining the appropriate
 * winding style and construction method for baluns based on impedance ratios.
 */

/**
 * Output from the winding style determination
 */
export interface WindingStyleInfo {
  /** Winding style (bifilar, trifilar, etc.) */
  style: string
  /** Construction method */
  construction: 'classical' | 'autotransformer'
  /** Number of wires needed */
  wireCount: number
  /** Detailed connection instructions */
  connectionDetails: string
  /** Diagram type for visual representation */
  diagramType: string
}

/**
 * Utility class for determining winding styles and construction methods
 */
export class WindingStyleCalculator {
  /**
   * Determine appropriate winding style and construction method based on impedance ratio
   */
  public static determineWindingAndBuildStyle(
    inputImpedance: number,
    outputImpedance: number,
  ): WindingStyleInfo {
    // Calculate impedance ratio and turns ratio
    const impedanceRatio = outputImpedance / inputImpedance
    const turnsRatio = Math.sqrt(impedanceRatio)

    // Convert to simple fraction if possible
    let numerator = Math.round(turnsRatio)
    let denominator = 1

    // If not close to integer ratio, try to find a simple fraction representation
    if (Math.abs(turnsRatio - numerator) > 0.1) {
      // Find simple fraction approximation
      for (let d = 2; d <= 5; d++) {
        const n = Math.round(turnsRatio * d)
        if (Math.abs(turnsRatio - n / d) < 0.05) {
          numerator = n
          denominator = d
          break
        }
      }
    }

    // Sum of the turn ratio parts to determine wire count
    const wireCount = numerator + denominator

    // Determine if classical transformer or autotransformer is better
    let construction: 'classical' | 'autotransformer'
    let connectionDetails: string
    let diagramType: string

    // Standard ratios that work well with classical transformers
    if (
      impedanceRatio === 1 ||
      impedanceRatio === 4 ||
      impedanceRatio === 9 ||
      impedanceRatio === 16
    ) {
      construction = 'classical'

      if (impedanceRatio === 1) {
        connectionDetails = '1:1 current balun with separate primary and secondary windings'
        diagramType = '1to1_current_balun'
      } else {
        connectionDetails = `${numerator}:${denominator} current balun with series input and parallel output`
        diagramType = `${numerator}to${denominator}_current_balun`
      }
    }
    // Ratios that work well with autotransformers (especially non-integer ratios)
    else {
      construction = 'autotransformer'
      connectionDetails = `${numerator}:${denominator} autotransformer with tap at ${denominator}/${wireCount} of total turns`
      diagramType = `${numerator}to${denominator}_autotransformer`
    }

    // Determine winding style based on wire count
    let style: string
    if (wireCount === 2) {
      style = 'bifilar'
    } else if (wireCount === 3) {
      style = 'trifilar'
    } else if (wireCount === 4) {
      style = 'quadrifilar'
    } else {
      // For more complex ratios, we might need a multifilar approach
      style = `${wireCount}-filar`
    }

    return {
      style,
      construction,
      wireCount,
      connectionDetails,
      diagramType,
    }
  }

  /**
   * Generate winding instructions based on winding style and number of turns
   */
  public static generateWindingInstructions(
    windingInfo: WindingStyleInfo,
    primaryTurns: number,
    coreType: string,
  ): string {
    let instructions = ''

    // Basic winding instructions
    instructions += `### Winding Instructions for ${windingInfo.style.charAt(0).toUpperCase() + windingInfo.style.slice(1)} ${windingInfo.construction.charAt(0).toUpperCase() + windingInfo.construction.slice(1)}\n\n`

    instructions += `1. Prepare ${windingInfo.wireCount} lengths of wire, each approximately ${this.estimateWireLength(coreType, primaryTurns, windingInfo.wireCount)} cm long.\n`
    instructions += `2. If using different colored wire, label them as Wire 1${windingInfo.wireCount >= 3 ? ', Wire 2, Wire 3' : ' and Wire 2'}${windingInfo.wireCount >= 4 ? ', etc.' : ''}.\n`
    instructions += `3. Hold all wires parallel and twist them together with approximately 4-5 twists per inch.\n`
    instructions += `4. Wind ${primaryTurns} complete turns through the ${coreType} core, keeping the wires flat against the core surface.\n`

    // Connection instructions based on construction type
    instructions += `\n### Connection Instructions\n\n`

    if (windingInfo.construction === 'classical') {
      if (windingInfo.style === 'bifilar' && windingInfo.diagramType === '1to1_current_balun') {
        instructions += 'For a 1:1 current balun:\n'
        instructions += '- Connect Wire 1 start to input terminal\n'
        instructions += '- Connect Wire 1 end to input ground\n'
        instructions += '- Connect Wire 2 start to output terminal 1\n'
        instructions += '- Connect Wire 2 end to output terminal 2\n'
      } else if (
        windingInfo.style === 'trifilar' &&
        windingInfo.diagramType === '2to1_current_balun'
      ) {
        instructions += 'For a 2:1 (4:1 impedance) current balun:\n'
        instructions += '- Connect Wire 1 start to input terminal\n'
        instructions += '- Connect Wire 1 end to Wire 2 start\n'
        instructions += '- Connect Wire 2 end to input ground\n'
        instructions += '- Connect Wire 3 start to output terminal 1\n'
        instructions += '- Connect Wire 3 end to output terminal 2\n'
      } else if (
        windingInfo.style === 'quadrifilar' &&
        windingInfo.diagramType === '3to1_current_balun'
      ) {
        instructions += 'For a 3:1 (9:1 impedance) current balun:\n'
        instructions += '- Connect Wire 1 start to input terminal\n'
        instructions += '- Connect Wire 1 end to Wire 2 start\n'
        instructions += '- Connect Wire 2 end to Wire 3 start\n'
        instructions += '- Connect Wire 3 end to input ground\n'
        instructions += '- Connect Wire 4 start to output terminal 1\n'
        instructions += '- Connect Wire 4 end to output terminal 2\n'
      } else {
        instructions += `Follow standard ${windingInfo.style} winding connection patterns for a ${windingInfo.diagramType.replace('_', ' ')}.\n`
      }
    } else {
      // autotransformer
      instructions += `For a ${windingInfo.diagramType.replace('_', ' ').replace('to', ':').replace('autotransformer', 'impedance autotransformer')}:\n`
      instructions += '- Wind all wires in parallel around the core\n'
      instructions += '- Connect the wires in series for the primary\n'
      instructions += `- Tap the connection at the appropriate point (${Math.round(primaryTurns * (windingInfo.denominator / windingInfo.wireCount))} turns from start) for the secondary\n`
      instructions +=
        '- Refer to a detailed autotransformer connection diagram for your specific ratio\n'
    }

    return instructions
  }

  /**
   * Estimate wire length needed for winding
   */
  private static estimateWireLength(coreType: string, turns: number, wireCount: number): number {
    // Basic estimates based on core type
    let lengthPerTurn: number

    switch (coreType) {
      case 'FT140-43':
        lengthPerTurn = 7.5 // cm per turn
        break
      case 'FT240-43':
        lengthPerTurn = 12 // cm per turn
        break
      default:
        lengthPerTurn = 10 // default estimate
    }

    // Calculate total length with 20% safety margin
    return Math.ceil(turns * lengthPerTurn * 1.2)
  }

  /**
   * Determine if this impedance ratio is better suited for a hybrid design
   */
  public static shouldUseHybridDesign(inputImpedance: number, outputImpedance: number): boolean {
    const impedanceRatio = outputImpedance / inputImpedance
    const standardRatios = [1, 2, 4, 9, 16]

    // Check if close to a standard ratio
    for (const ratio of standardRatios) {
      if (Math.abs(impedanceRatio - ratio) / ratio < 0.1) {
        return false // Close to standard ratio, no need for hybrid
      }
    }

    // If impedance ratio is high (>9) or unusual, recommend hybrid
    return impedanceRatio > 9 || !standardRatios.includes(Math.round(impedanceRatio))
  }
}
