// coreCalculator.ts
import { PERMEABILITY_DATA } from './constants'
import { type CoreModel } from './types'

export class CoreCalculator {
  // Physical constants
  private static MU0 = 4e-7 * Math.PI // Vacuum permeability [H/m]

  /**
   * Calculate air-core inductance
   * @param N Number of turns
   * @param core Core model
   * @returns Inductance in μH
   */
  static calculateL0(N: number, core: CoreModel): number {
    // Convert dimensions to meters
    const od = core.dimensions.od * 1e-3
    const id = core.dimensions.id * 1e-3
    const height = core.dimensions.height * 1e-3

    // Calculate effective dimensions
    const Ae = ((od - id) * height) / 2 // Effective cross-sectional area [m²]
    const le = (Math.PI * (od + id)) / 2 // Effective magnetic path length [m]

    // Calculate air-core inductance
    const L0 = (this.MU0 * N ** 2 * Ae) / le // [H]

    return L0 * 1e6 // Convert to μH
  }

  /**
   * Interpolate complex permeability at a given frequency
   * @param fMHz Frequency in MHz
   * @param core Core model
   * @returns [μ', μ"] - Real and imaginary parts of permeability
   */
  static interpolatePermeability(fMHz: number, core: CoreModel): [number, number] {
    // Get the mix type from the core
    const mixType = core.mix

    // Get permeability data for this mix from constants
    const permeabilityData = PERMEABILITY_DATA[mixType]

    if (!permeabilityData) {
      console.warn(`No permeability data found for mix ${mixType}, using default values`)
      // Return sensible defaults if no data is available
      return [core.initialPermeability, core.initialPermeability * 0.1]
    }

    // Extract frequency and permeability values into separate arrays for interpolation
    const freqPoints = permeabilityData.map((data) => data.frequency)
    const uPrimeValues = permeabilityData.map((data) => data.uPrime)
    const uDoublePrimeValues = permeabilityData.map((data) => data.uDoublePrime)

    // Linear interpolation
    let uP, uPP

    if (fMHz <= freqPoints[0]) {
      // Below the first point, use the first point value
      uP = uPrimeValues[0]
      uPP = uDoublePrimeValues[0]
    } else if (fMHz >= freqPoints[freqPoints.length - 1]) {
      // Above the last point, use the last point value
      uP = uPrimeValues[uPrimeValues.length - 1]
      uPP = uDoublePrimeValues[uDoublePrimeValues.length - 1]
    } else {
      // Linear interpolation between points
      let i = 0
      while (i < freqPoints.length - 1 && fMHz > freqPoints[i + 1]) {
        i++
      }

      const fLow = freqPoints[i]
      const fHigh = freqPoints[i + 1]
      const ratio = (fMHz - fLow) / (fHigh - fLow)

      uP = uPrimeValues[i] + ratio * (uPrimeValues[i + 1] - uPrimeValues[i])
      uPP = uDoublePrimeValues[i] + ratio * (uDoublePrimeValues[i + 1] - uDoublePrimeValues[i])
    }

    return [uP, uPP]
  }

  /**
   * Calculate coil impedance components
   * @param fMHz Frequency in MHz
   * @param N Number of turns
   * @param core Core model
   * @param coreCount Number of cores stacked
   * @returns Object with inductance, resistance, reactance, impedance, and Q factor
   */
  static calculateImpedance(
    fMHz: number,
    N: number,
    core: CoreModel,
    coreCount: number = 1,
  ): {
    Ls: number // Series inductance [μH]
    Rs: number // Series resistance [Ω]
    Xs: number // Reactance [Ω]
    Z: number // Impedance magnitude [Ω]
    Q: number // Quality factor
  } {
    const fHz = fMHz * 1e6
    const omega = 2 * Math.PI * fHz

    // Air-core inductance
    const L0 = this.calculateL0(N, core) * coreCount // Scale by core count

    // Complex permeability
    const [uP, uPP] = this.interpolatePermeability(fMHz, core)

    // Series equivalent circuit
    const Ls = L0 * uP * 1e-6 // Series inductance [H]
    const Rs = omega * L0 * uPP * 1e-6 // Series resistance [Ω]
    const Xs = omega * Ls // Reactance [Ω]
    const Z = Math.sqrt(Rs ** 2 + Xs ** 2) // Impedance magnitude [Ω]
    const Q = Xs / Rs // Quality factor

    return {
      Ls: Ls * 1e6, // Convert back to μH
      Rs,
      Xs,
      Z,
      Q,
    }
  }

  /**
   * Calculate core losses under excitation
   * @param fMHz Frequency in MHz
   * @param N Number of turns
   * @param core Core model
   * @param coreCount Number of cores stacked
   * @param power Input power in watts
   * @param sourceZ Source impedance in ohms
   * @returns Object with detailed loss calculations
   */
  static calculateLosses(
    fMHz: number,
    N: number,
    core: CoreModel,
    coreCount: number = 1,
    power: number = 100,
    sourceZ: number = 50,
  ): {
    powerLoss: number // Power dissipated in the core [W]
    current: number // Current through the coil [A]
    efficiency: number // Efficiency [%]
    inputVoltage: number // Input voltage [V]
    inductance: number // Inductance [μH]
    resistance: number // Resistance [Ω]
    impedance: number // Impedance [Ω]
    fluxDensity: number // Flux density [mT]
    P_out: number // Power transferred to the output [W]
  } {
    // Get impedance components
    const { Ls, Rs, Xs, Z } = this.calculateImpedance(fMHz, N, core, coreCount)

    // Calculate input voltage (P_in = V_in^2 / Z_source)
    const V_in = Math.sqrt(power * sourceZ)

    // Current through the coil (simplified for Z >> Z_source)
    const I_coil = V_in / Z

    // Power dissipation in the core
    const P_loss = V_in ** 2 / Z

    // Calculate power transferred to the output
    const P_out = power - P_loss
    
    // Efficiency calculation
    const efficiency = (P_out / power) * 100

    // Calculate flux density
    // B = L * I / (N * Ae)
    const od = core.dimensions.od * 1e-3 // [m]
    const id = core.dimensions.id * 1e-3 // [m]
    const height = core.dimensions.height * 1e-3 // [m]
    const Ae = (((od - id) * height) / 2) * coreCount // [m²], scaled by core count

    // Convert inductance from μH to H
    const L_H = Ls * 1e-6

    // Calculate flux density in T, then convert to mT
    const B = ((L_H * I_coil) / (N * Ae)) * 1000 // [mT]

    return {
      powerLoss: P_loss,
      current: I_coil,
      efficiency,
      inputVoltage: V_in,
      inductance: Ls,
      resistance: Rs,
      impedance: Z,
      fluxDensity: B,
      P_out: P_out,
    }
  }

  /**
   * Calculate the maximum permissible core loss
   * @param core Core model
   * @param coreCount Number of cores stacked
   * @param dutyCycleFactor Duty cycle factor (0-1)
   * @returns Maximum permissible loss in watts
   */
  /**
   * Calculate the maximum permissible core loss
   * @param core Core model
   * @param coreCount Number of cores stacked
   * @param dutyCycleFactor Duty cycle factor (0-1)
   * @returns Maximum permissible loss in watts
   */
  static calculateMaxPermissibleCoreLoss(
    core: CoreModel,
    coreCount: number = 1,
    dutyCycleFactor: number = 0.5,
  ): number {
    // Calculate core volume in cm³
    const od = core.dimensions.od // [mm]
    const id = core.dimensions.id // [mm]
    const h = core.dimensions.height // [mm]

    // Calculate volume in cm³ (convert from mm³)
    const crossSectionArea = (Math.PI / 4) * (od * od - id * id)
    const volumeCm3 = (crossSectionArea * h) / 1000 // Convert mm³ to cm³

    // Total volume accounting for multiple cores
    const totalVolumeCm3 = volumeCm3 * coreCount

    // Thermal coefficients
    const thermalCoefficient = 0.044
    const deltaT = 30 // Permissible temperature rise in °C

    // Calculate max permissible loss using the provided formula
    const maxLoss = deltaT * thermalCoefficient * Math.sqrt(totalVolumeCm3)

    // Scale by duty cycle factor
    return maxLoss / dutyCycleFactor
  }
}
