export interface CoaxCableData {
  outerDiameter: number // mm
  insulationThickness: number // mm
  name: string
}

export interface HamBandData {
  name: string
  center: number // MHz
  start: number // MHz
  end: number // MHz
}

export interface IAruRegionBands {
  [key: string]: HamBandData
}

export interface InductorParameters {
  coaxType: string
  formerDiameter: number // mm
  pitchRatio: number
  turnCount: number
  frequency: number // MHz
  iaruRegion: string
  hamBand: string
}

export interface InductorResults {
  // Frequency independent
  inductance: number // H
  capacitance: number // F
  dcResistance: number // Ω
  selfResonantFreq: number // Hz
  wireLength: number // m
  
  // Frequency dependent
  skinDepth: number // m
  acResistance: number // Ω
  inductiveReactance: number // Ω
  capacitiveReactance: number // Ω
  complexImpedance: { re: number; im: number } // Ω
  impedanceMagnitude: number // Ω
  qualityFactor: number
  
  // Physical dimensions
  conductorMeanDiameter: number // mm
  outerDiameter: number // mm
  turnSpacing: number // mm
  edgeToEdgeGap: number // mm
  coilLength: number // mm
  
  // Status
  overSRF: boolean
  
  // Performance verdict
  verdict: {
    isGoodChoke: boolean
    performanceLevel: 'poor' | 'usable' | 'excellent'
    message: string
  }
}

export interface FrequencyResponse {
  frequency: number // MHz
  impedanceMagnitude: number | null
  phase: number | null
  resistance: number | null
  reactance: number | null
}

// Physical constants
const MU0 = Math.PI * 4e-7 // H/m
const CU_SIGMA = 58e6 // S/m

// Coax cable data
export const COAX_CABLES: Record<string, CoaxCableData> = {
  "2.00": { outerDiameter: 2.00, insulationThickness: 0.30, name: "RG316" },
  "3.50": { outerDiameter: 3.50, insulationThickness: 0.60, name: "RG58/LL195" },
  "4.40": { outerDiameter: 4.40, insulationThickness: 0.75, name: "RG59" },
  "4.52": { outerDiameter: 4.52, insulationThickness: 0.76, name: "LMR-240" },
  "6.30": { outerDiameter: 6.30, insulationThickness: 1.00, name: "RG-6" },
  "7.98": { outerDiameter: 7.98, insulationThickness: 1.25, name: "RG213/RG11" },
  "8.14": { outerDiameter: 8.14, insulationThickness: 1.30, name: "RG-8/LL400" }
}

// Ham band definitions by IARU Region
export const HAM_BANDS_BY_REGION: Record<string, IAruRegionBands> = {
  "Region 1": {
    "1.900": { name: "160m", center: 1.900, start: 1.810, end: 2.000 },
    "3.650": { name: "80m", center: 3.650, start: 3.500, end: 3.800 },
    "7.150": { name: "40m", center: 7.150, start: 7.000, end: 7.200 },
    "10.125": { name: "30m", center: 10.125, start: 10.100, end: 10.150 },
    "14.175": { name: "20m", center: 14.175, start: 14.000, end: 14.350 },
    "18.118": { name: "17m", center: 18.118, start: 18.068, end: 18.168 },
    "21.225": { name: "15m", center: 21.225, start: 21.000, end: 21.450 },
    "24.940": { name: "12m", center: 24.940, start: 24.890, end: 24.990 },
    "28.400": { name: "10m", center: 28.400, start: 28.000, end: 29.700 },
    "50.150": { name: "6m", center: 50.150, start: 50.000, end: 52.000 },
    "70.150": { name: "4m", center: 70.150, start: 70.000, end: 70.500 },
    "144.200": { name: "2m", center: 144.200, start: 144.000, end: 146.000 },
    "432.150": { name: "70cm", center: 432.150, start: 430.000, end: 440.000 },
    "1296.150": { name: "23cm", center: 1296.150, start: 1240.000, end: 1300.000 }
  },
  "Region 2": {
    "1.900": { name: "160m", center: 1.900, start: 1.800, end: 2.000 },
    "3.650": { name: "80m", center: 3.650, start: 3.500, end: 4.000 },
    "7.150": { name: "40m", center: 7.150, start: 7.000, end: 7.300 },
    "10.125": { name: "30m", center: 10.125, start: 10.100, end: 10.150 },
    "14.175": { name: "20m", center: 14.175, start: 14.000, end: 14.350 },
    "18.118": { name: "17m", center: 18.118, start: 18.068, end: 18.168 },
    "21.225": { name: "15m", center: 21.225, start: 21.000, end: 21.450 },
    "24.940": { name: "12m", center: 24.940, start: 24.890, end: 24.990 },
    "28.400": { name: "10m", center: 28.400, start: 28.000, end: 29.700 },
    "50.150": { name: "6m", center: 50.150, start: 50.000, end: 54.000 },
    "70.150": { name: "4m", center: 70.150, start: 70.000, end: 70.300 },
    "144.200": { name: "2m", center: 144.200, start: 144.000, end: 148.000 },
    "432.150": { name: "70cm", center: 432.150, start: 420.000, end: 450.000 },
    "1296.150": { name: "23cm", center: 1296.150, start: 1240.000, end: 1300.000 }
  },
  "Region 3": {
    "1.900": { name: "160m", center: 1.900, start: 1.800, end: 2.000 },
    "3.650": { name: "80m", center: 3.650, start: 3.500, end: 3.900 },
    "7.150": { name: "40m", center: 7.150, start: 7.000, end: 7.300 },
    "10.125": { name: "30m", center: 10.125, start: 10.100, end: 10.150 },
    "14.175": { name: "20m", center: 14.175, start: 14.000, end: 14.350 },
    "18.118": { name: "17m", center: 18.118, start: 18.068, end: 18.168 },
    "21.225": { name: "15m", center: 21.225, start: 21.000, end: 21.450 },
    "24.940": { name: "12m", center: 24.940, start: 24.890, end: 24.990 },
    "28.400": { name: "10m", center: 28.400, start: 28.000, end: 29.700 },
    "50.150": { name: "6m", center: 50.150, start: 50.000, end: 54.000 },
    "70.150": { name: "4m", center: 70.150, start: 70.000, end: 70.300 },
    "144.200": { name: "2m", center: 144.200, start: 144.000, end: 148.000 },
    "432.150": { name: "70cm", center: 432.150, start: 430.000, end: 440.000 },
    "1296.150": { name: "23cm", center: 1296.150, start: 1240.000, end: 1300.000 }
  }
}

// Proximity resistance lookup table
const PROXIMITY_RESISTANCE = [
  [0.0, 1.0, 1.111, 1.25, 1.429, 1.667, 2.0, 2.5, 3.333, 5.00, 10.0],
  [0.0, 5.31, 3.73, 2.74, 2.12, 1.74, 1.44, 1.20, 1.16, 1.07, 1.02],
  [0.2, 5.45, 3.84, 2.83, 2.20, 1.77, 1.48, 1.29, 1.19, 1.08, 1.02],
  [0.4, 5.65, 3.99, 2.97, 2.28, 1.83, 1.54, 1.33, 1.21, 1.08, 1.03],
  [0.6, 5.80, 4.11, 3.10, 2.38, 1.89, 1.60, 1.38, 1.22, 1.10, 1.03],
  [0.8, 5.80, 4.17, 3.20, 2.44, 1.92, 1.64, 1.42, 1.23, 1.10, 1.03],
  [1.0, 5.55, 4.10, 3.17, 2.47, 1.94, 1.67, 1.45, 1.24, 1.10, 1.03],
  [2.0, 4.10, 3.36, 2.74, 2.32, 1.98, 1.74, 1.50, 1.28, 1.13, 1.04],
  [4.0, 3.54, 3.05, 2.60, 2.27, 2.01, 1.78, 1.54, 1.32, 1.15, 1.04],
  [6.0, 3.31, 2.92, 2.60, 2.29, 2.03, 1.80, 1.56, 1.34, 1.16, 1.04],
  [8.0, 3.20, 2.90, 2.62, 2.34, 2.08, 1.81, 1.57, 1.34, 1.165, 1.04],
  [10.0, 3.23, 2.93, 2.65, 2.37, 2.10, 1.83, 1.58, 1.35, 1.17, 1.04],
  [999.0, 3.41, 3.11, 2.815, 2.51, 2.22, 1.93, 1.65, 1.395, 1.19, 1.05]
]

export class RFInductorCalculator {
  /**
   * Calculate DC resistance of the coil
   */
  static dcResistance(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number
  ): number {
    const condRadiusMeters = 0.5 * condDiameterMeters
    const cSpacing = spacingRatio * condDiameterMeters
    const corrFactor = Math.sqrt(1.0 + (cSpacing ** 2 / loopDiameterMeters ** 2))
    const conductorLength = Math.PI * loopDiameterMeters * loopTurns * corrFactor
    const conductorArea = Math.PI * (condRadiusMeters ** 2.0)
    return 1.68e-8 * conductorLength / conductorArea
  }

  /**
   * Calculate skin depth at given frequency
   */
  static skinDepth(frequencyHz: number): number {
    return Math.sqrt(1.0 / (Math.PI * frequencyHz * MU0 * CU_SIGMA))
  }

  /**
   * Calculate DC to AC resistance factor
   */
  static dc2acFactor(condDiameterMeters: number, skinDepth: number): number {
    return condDiameterMeters ** 2 / (4.0 * (condDiameterMeters * skinDepth - skinDepth ** 2))
  }

  /**
   * Calculate Nagaoka coefficient
   */
  static nagaokaCoefficient(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number
  ): number {
    const cSpacing = spacingRatio * condDiameterMeters
    const x = loopDiameterMeters / (cSpacing * loopTurns)
    const zk = 2.0 / (Math.PI * x)
    const k0 = 1.0 / (Math.log(8.0 / Math.PI) - 0.5)
    const k2 = 24.0 / (3.0 * Math.PI ** 2 - 16.0)
    const w = -0.47 / (0.755 + x) ** 1.44
    const p = k0 + 3.437 / x + k2 / x ** 2 + w
    return zk * (Math.log(1 + 1 / zk) + 1 / p)
  }

  /**
   * Calculate inductance
   */
  static getInductance(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number
  ): number {
    const aCoilRadius = loopDiameterMeters * 0.5
    const coilLength = condDiameterMeters * spacingRatio * loopTurns
    return (
      (loopTurns ** 2.0) *
      MU0 *
      Math.PI *
      (aCoilRadius ** 2.0) *
      this.nagaokaCoefficient(loopDiameterMeters, condDiameterMeters, spacingRatio, loopTurns) /
      coilLength
    )
  }

  /**
   * Calculate turn-to-turn capacitance helper functions
   */
  static ctdw(ff: number, ei: number, ex: number, kL: number): number {
    const kct = 1.0 / kL - 1.0
    return 11.27350207 * ex * ff * (1.0 + kct * (1.0 + ei / ex) / 2.0)
  }

  static ciae(ff: number, ei: number, ex: number): number {
    return 17.70837564 * (ei + ex) / Math.log(1.0 + Math.PI ** 2 * ff)
  }

  /**
   * Calculate multi-loop capacitance
   */
  static multiloopCapacitance(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number
  ): number {
    const h = spacingRatio * condDiameterMeters
    const ei = 1.0
    const ex = 1.0
    const solenoidLength = 1.0 * loopTurns * h
    const ff = solenoidLength / loopDiameterMeters
    const kL = this.nagaokaCoefficient(loopDiameterMeters, condDiameterMeters, spacingRatio, loopTurns)
    return (
      1e-12 *
      (this.ctdw(ff, ei, ex, kL) / Math.sqrt(1 - h ** 2 / loopDiameterMeters ** 2) +
        this.ciae(ff, ei, ex)) *
      loopDiameterMeters
    )
  }

  /**
   * Get proximity resistance from spacing using lookup table
   */
  static getProximityResFromSpacing(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number
  ): number {
    const lengthDiameterRatio = loopTurns * spacingRatio * condDiameterMeters / loopDiameterMeters
    let i = 0
    let j = 0

    // Find spacing ratio index
    for (i = 1; i < PROXIMITY_RESISTANCE[0].length; i++) {
      if (spacingRatio < PROXIMITY_RESISTANCE[0][i]) {
        i--
        break
      }
    }

    // Find length/diameter ratio index
    for (j = 1; j < PROXIMITY_RESISTANCE.length; j++) {
      if (lengthDiameterRatio < PROXIMITY_RESISTANCE[j][0]) {
        j--
        break
      }
    }

    // Bilinear interpolation
    const t1 =
      ((spacingRatio - PROXIMITY_RESISTANCE[0][i]) /
        (PROXIMITY_RESISTANCE[0][i + 1] - PROXIMITY_RESISTANCE[0][i])) *
        (PROXIMITY_RESISTANCE[j][i + 1] - PROXIMITY_RESISTANCE[j][i]) +
      PROXIMITY_RESISTANCE[j][i]

    const t2 =
      ((spacingRatio - PROXIMITY_RESISTANCE[0][i]) /
        (PROXIMITY_RESISTANCE[0][i + 1] - PROXIMITY_RESISTANCE[0][i])) *
        (PROXIMITY_RESISTANCE[j + 1][i + 1] - PROXIMITY_RESISTANCE[j + 1][i]) +
      PROXIMITY_RESISTANCE[j + 1][i]

    return (
      ((lengthDiameterRatio - PROXIMITY_RESISTANCE[j][0]) /
        (PROXIMITY_RESISTANCE[j + 1][0] - PROXIMITY_RESISTANCE[j][0])) *
        (t2 - t1) +
      t1
    )
  }

  /**
   * Calculate AC resistance
   */
  static acResistance(
    loopDiameterMeters: number,
    condDiameterMeters: number,
    spacingRatio: number,
    loopTurns: number,
    frequencyHz: number
  ): number {
    const Rdc = this.dcResistance(loopDiameterMeters, condDiameterMeters, spacingRatio, loopTurns)
    const dc2ac = this.dc2acFactor(condDiameterMeters, this.skinDepth(frequencyHz))
    const prox = this.getProximityResFromSpacing(
      loopDiameterMeters,
      condDiameterMeters,
      spacingRatio,
      loopTurns
    )
    return Rdc * dc2ac * prox
  }

  /**
   * Calculate self-resonant frequency
   */
  static selfResonantFrequency(inductance: number, capacitance: number): number {
    return 1.0 / (2.0 * Math.PI * Math.sqrt(inductance * capacitance))
  }

  /**
   * Calculate inductive reactance
   */
  static inductiveReactance(frequency: number, inductance: number): number {
    return 2.0 * Math.PI * frequency * inductance
  }

  /**
   * Calculate capacitive reactance
   */
  static capacitiveReactance(frequency: number, capacitance: number): number {
    return -1.0 / (2.0 * Math.PI * frequency * capacitance)
  }

  /**
   * Calculate complex impedance (parallel LC circuit)
   */
  static calculateComplexImpedance(
    resistance: number,
    inductiveReactance: number,
    capacitiveReactance: number
  ): { re: number; im: number } {
    // Zl = R + jXl
    const Zl = { re: resistance, im: inductiveReactance }
    // Zc = jXc
    const Zc = { re: 0, im: capacitiveReactance }

    // Z = (Zl * Zc) / (Zl + Zc)
    // Multiply: (a + jb)(c + jd) = (ac - bd) + j(ad + bc)
    const numeratorRe = Zl.re * Zc.re - Zl.im * Zc.im
    const numeratorIm = Zl.re * Zc.im + Zl.im * Zc.re

    // Add: (a + jb) + (c + jd) = (a + c) + j(b + d)
    const denominatorRe = Zl.re + Zc.re
    const denominatorIm = Zl.im + Zc.im

    // Divide: (a + jb) / (c + jd) = [(a + jb)(c - jd)] / (c² + d²)
    const denomMagSq = denominatorRe * denominatorRe + denominatorIm * denominatorIm
    const resultRe = (numeratorRe * denominatorRe + numeratorIm * denominatorIm) / denomMagSq
    const resultIm = (numeratorIm * denominatorRe - numeratorRe * denominatorIm) / denomMagSq

    return { re: resultRe, im: resultIm }
  }

  /**
   * Evaluate choke performance based on impedance magnitude
   */
  static evaluateChokePerformance(impedanceMagnitude: number, overSRF: boolean): {
    isGoodChoke: boolean
    performanceLevel: 'poor' | 'usable' | 'excellent'
    message: string
  } {
    if (overSRF) {
      return {
        isGoodChoke: false,
        performanceLevel: 'poor',
        message: 'Az induktor az önrezonancia frekvencia felett működik - nem alkalmas fojtótekercsként!'
      }
    }

    if (impedanceMagnitude >= 3000) {
      return {
        isGoodChoke: true,
        performanceLevel: 'excellent',
        message: 'Kiváló fojtótekercs! Az impedancia nagyobb mint 3kΩ.'
      }
    } else if (impedanceMagnitude >= 1000) {
      return {
        isGoodChoke: true,
        performanceLevel: 'usable',
        message: 'Használható fojtótekercs. Az impedancia 1-3kΩ között van.'
      }
    } else {
      return {
        isGoodChoke: false,
        performanceLevel: 'poor',
        message: 'Gyenge fojtótekercs. Az impedancia kevesebb mint 1kΩ - nem ajánlott használni.'
      }
    }
  }

  /**
   * Main calculation function
   */
  static calculateInductor(params: InductorParameters): InductorResults {
    const coaxInfo = COAX_CABLES[params.coaxType]
    const condDiameterMeters = 0.001 * coaxInfo.outerDiameter
    const insulationThicknessMeters = 0.001 * coaxInfo.insulationThickness
    const formerDiameterMeters = 0.001 * params.formerDiameter

    // Calculate conductor mean diameter
    const conductorMeanDiameterMeters =
      formerDiameterMeters + insulationThicknessMeters + condDiameterMeters / 2

    const frequencyHz = params.frequency * 1e6

    // Frequency independent calculations
    const inductance = this.getInductance(
      conductorMeanDiameterMeters,
      condDiameterMeters,
      params.pitchRatio,
      params.turnCount
    )
    const capacitance = this.multiloopCapacitance(
      conductorMeanDiameterMeters,
      condDiameterMeters,
      params.pitchRatio,
      params.turnCount
    )
    const dcResistance = this.dcResistance(
      conductorMeanDiameterMeters,
      condDiameterMeters,
      params.pitchRatio,
      params.turnCount
    )
    const selfResonantFreq = this.selfResonantFrequency(inductance, capacitance)

    // Wire length calculation
    const wireLength = Math.sqrt(
      (params.turnCount * params.pitchRatio * condDiameterMeters) ** 2 +
        (Math.PI * conductorMeanDiameterMeters * params.turnCount) ** 2
    )

    // Frequency dependent calculations
    const skinDepth = this.skinDepth(frequencyHz)
    const acResistance = this.acResistance(
      conductorMeanDiameterMeters,
      condDiameterMeters,
      params.pitchRatio,
      params.turnCount,
      frequencyHz
    )
    const inductiveReactance = this.inductiveReactance(frequencyHz, inductance)
    const capacitiveReactance = this.capacitiveReactance(frequencyHz, capacitance)

    // Complex impedance
    const complexImpedance = this.calculateComplexImpedance(
      acResistance,
      inductiveReactance,
      capacitiveReactance
    )
    const impedanceMagnitude = Math.sqrt(
      complexImpedance.re ** 2 + complexImpedance.im ** 2
    )
    const qualityFactor = Math.abs(complexImpedance.im) / complexImpedance.re

    // Physical dimensions
    const condDiameterMm = condDiameterMeters * 1000
    const conductorMeanDiameterMm = conductorMeanDiameterMeters * 1000
    const turnSpacingMm = params.pitchRatio * condDiameterMm
    const edgeToEdgeGapMm = turnSpacingMm - condDiameterMm
    const coilLengthMm = params.turnCount * turnSpacingMm

    // Performance evaluation
    const overSRF = frequencyHz > selfResonantFreq
    const verdict = this.evaluateChokePerformance(impedanceMagnitude, overSRF)

    return {
      // Frequency independent
      inductance,
      capacitance,
      dcResistance,
      selfResonantFreq,
      wireLength,

      // Frequency dependent
      skinDepth,
      acResistance,
      inductiveReactance,
      capacitiveReactance,
      complexImpedance,
      impedanceMagnitude,
      qualityFactor,

      // Physical dimensions
      conductorMeanDiameter: conductorMeanDiameterMm,
      outerDiameter: conductorMeanDiameterMm + condDiameterMm,
      turnSpacing: turnSpacingMm,
      edgeToEdgeGap: edgeToEdgeGapMm,
      coilLength: coilLengthMm,

      // Status
      overSRF,
      
      // Performance verdict
      verdict
    }
  }

  /**
   * Generate frequency response data for plotting
   */
  static generateFrequencyResponse(
    params: InductorParameters,
    startFreqMHz: number,
    stopFreqMHz: number,
    numPoints: number = 100
  ): FrequencyResponse[] {
    const results: FrequencyResponse[] = []
    const freqStep = (stopFreqMHz - startFreqMHz) / (numPoints - 1)

    // Calculate SRF first to determine cutoff
    const baseResults = this.calculateInductor(params)
    const srfMHz = baseResults.selfResonantFreq / 1e6

    for (let i = 0; i < numPoints; i++) {
      const freqMHz = startFreqMHz + i * freqStep
      const tempParams = { ...params, frequency: freqMHz }
      
      if (freqMHz <= srfMHz) {
        const result = this.calculateInductor(tempParams)
        results.push({
          frequency: freqMHz,
          impedanceMagnitude: result.impedanceMagnitude,
          phase: Math.atan2(result.complexImpedance.im, result.complexImpedance.re) * 180 / Math.PI,
          resistance: result.complexImpedance.re,
          reactance: result.complexImpedance.im
        })
      } else {
        results.push({
          frequency: freqMHz,
          impedanceMagnitude: null,
          phase: null,
          resistance: null,
          reactance: null
        })
      }
    }

    return results
  }
}
