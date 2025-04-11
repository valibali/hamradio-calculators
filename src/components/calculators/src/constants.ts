// constants.ts
import {
  type CoreModel,
  type PresetConfig,
  type FrequencyBand,
  type PermeabilityData,
} from './types'

export const SPEED_OF_LIGHT = 299792458 // [m/s]

export const OPERATION_MODE_OPTIONS = [
  { value: 'SSB', label: 'SSB (Low Duty Cycle)' },
  { value: 'CW', label: 'CW (Medium Duty Cycle)' },
  { value: 'DIGITAL', label: 'Digital Modes (High Duty Cycle)' },
  { value: 'CONTINUOUS', label: 'Continuous (100% Duty Cycle)' },
]

export const DUTY_CYCLE_FACTORS: Record<string, number> = {
  SSB: 0.3, // ~30% duty cycle
  CW: 0.5, // ~50% duty cycle
  DIGITAL: 0.8, // ~80% duty cycle
  CONTINUOUS: 1.0, // 100% duty cycle
}

export const CORE_MODELS: CoreModel[] = [
  {
    id: 'FT-140-61',
    mix: '61',
    initialPermeability: 125,
    saturationFluxDensity: 350,
    dimensions: {
      od: 35.6,
      id: 23.0,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 5.0,
      max: 150,
    },
    lossFactor: 0.002,
  },
  {
    id: 'FT-114-61',
    mix: '61',
    initialPermeability: 125,
    saturationFluxDensity: 350,
    dimensions: {
      od: 29.0,
      id: 19.1,
      height: 7.1,
    },
    recommendedFreqRange: {
      min: 10.0,
      max: 200,
    },
    lossFactor: 0.002,
  },
  {
    id: 'FT-140-52',
    mix: '52',
    initialPermeability: 250,
    saturationFluxDensity: 350,
    dimensions: {
      od: 35.6,
      id: 23.0,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 2.0,
      max: 50,
    },
    lossFactor: 0.005,
  },
  {
    id: 'FT-240-52',
    mix: '52',
    initialPermeability: 250,
    saturationFluxDensity: 350,
    dimensions: {
      od: 61.0,
      id: 35.6,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 1.0,
      max: 30,
    },
    lossFactor: 0.005,
  },
  {
    id: 'FT-50-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 12.7,
      id: 7.6,
      height: 5.1,
    },
    recommendedFreqRange: {
      min: 10.0,
      max: 300,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-82-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 21.0,
      id: 12.7,
      height: 6.4,
    },
    recommendedFreqRange: {
      min: 5.0,
      max: 100,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-114-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 29.0,
      id: 19.1,
      height: 7.1,
    },
    recommendedFreqRange: {
      min: 1.0,
      max: 50,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-140-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 35.6,
      id: 23.0,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.5,
      max: 30,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-240-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 61.0,
      id: 35.6,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.1,
      max: 10,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-140-77',
    mix: '77',
    initialPermeability: 2000,
    saturationFluxDensity: 510,
    dimensions: {
      od: 35.6,
      id: 23.0,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.5,
      max: 8,
    },
    lossFactor: 0.015,
  },
  {
    id: 'FT-240-61',
    mix: '61',
    initialPermeability: 125,
    saturationFluxDensity: 350,
    dimensions: {
      od: 61.0,
      id: 35.6,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 15.0,
      max: 200,
    },
    lossFactor: 0.002,
  },
  {
    id: 'FT-240-77',
    mix: '77',
    initialPermeability: 2000,
    saturationFluxDensity: 510,
    dimensions: {
      od: 61.0,
      id: 35.6,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.1,
      max: 5,
    },
    lossFactor: 0.015,
  },
  {
    id: 'FT-290-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 73.65,
      id: 38.85,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 1.0,
      max: 30,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-290-52',
    mix: '52',
    initialPermeability: 250,
    saturationFluxDensity: 350,
    dimensions: {
      od: 73.65,
      id: 38.85,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.5,
      max: 30,
    },
    lossFactor: 0.005,
  },
  {
    id: 'FT-290-61',
    mix: '61',
    initialPermeability: 125,
    saturationFluxDensity: 350,
    dimensions: {
      od: 73.65,
      id: 38.85,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 10.0,
      max: 200,
    },
    lossFactor: 0.002,
  },
  {
    id: 'FT-290-77',
    mix: '77',
    initialPermeability: 2000,
    saturationFluxDensity: 510,
    dimensions: {
      od: 73.65,
      id: 38.85,
      height: 12.7,
    },
    recommendedFreqRange: {
      min: 0.1,
      max: 5,
    },
    lossFactor: 0.015,
  },

  // FT-340 Variants
  {
    id: 'FT-340-43',
    mix: '43',
    initialPermeability: 850,
    saturationFluxDensity: 300,
    dimensions: {
      od: 85.7,
      id: 55.5,
      height: 13.5,
    },
    recommendedFreqRange: {
      min: 0.1,
      max: 10,
    },
    lossFactor: 0.008,
  },
  {
    id: 'FT-340-52',
    mix: '52',
    initialPermeability: 250,
    saturationFluxDensity: 350,
    dimensions: {
      od: 85.7,
      id: 55.5,
      height: 13.5,
    },
    recommendedFreqRange: {
      min: 0.5,
      max: 30,
    },
    lossFactor: 0.005,
  },
  {
    id: 'FT-340-61',
    mix: '61',
    initialPermeability: 125,
    saturationFluxDensity: 350,
    dimensions: {
      od: 85.7,
      id: 55.5,
      height: 13.5,
    },
    recommendedFreqRange: {
      min: 10.0,
      max: 200,
    },
    lossFactor: 0.002,
  },
  {
    id: 'FT-340-77',
    mix: '77',
    initialPermeability: 2000,
    saturationFluxDensity: 510,
    dimensions: {
      od: 85.7,
      id: 55.5,
      height: 13.5,
    },
    recommendedFreqRange: {
      min: 0.1,
      max: 5,
    },
    lossFactor: 0.015,
  },
]

// Preset configurations
export const PRESET_CONFIGS: PresetConfig[] = [
  {
    name: '1:1 Current Balun (50Ω:50Ω)',
    inputImpedance: 50,
    outputImpedance: 50,
    minFrequency: 1.8,
    maxFrequency: 30,
    power: 100,
    operationMode: 'SSB',
    useHybridDesign: false,
  },
  {
    name: '1:2 Current Balun (50Ω:10Ω)',
    inputImpedance: 50,
    outputImpedance: 100,
    minFrequency: 3.5,
    maxFrequency: 30,
    power: 100,
    operationMode: 'SSB',
    useHybridDesign: true,
  },
  {
    name: '1:4 Current Balun (50:200Ω)',
    inputImpedance: 50,
    outputImpedance: 200,
    minFrequency: 3.5,
    maxFrequency: 30,
    power: 100,
    operationMode: 'SSB',
    useHybridDesign: true,
  },
  {
    name: '1:9 High Power Hybrid Balun (50:450Ω)',
    inputImpedance: 50,
    outputImpedance: 450,
    minFrequency: 3.5,
    maxFrequency: 30,
    power: 280,
    operationMode: 'SSB',
    useHybridDesign: false,
  },
  {
    name: 'QRP 1:1 Current Balun',
    inputImpedance: 50,
    outputImpedance: 50,
    minFrequency: 3.5,
    maxFrequency: 30,
    power: 10,
    operationMode: 'CW',
    useHybridDesign: false,
  },
]

// Ham radio bands
export const HAM_BANDS: FrequencyBand[] = [
  { name: '160m', min: 1.8, max: 2.0, covered: false },
  { name: '80m', min: 3.5, max: 4.0, covered: false },
  { name: '60m', min: 5.3, max: 5.4, covered: false },
  { name: '40m', min: 7.0, max: 7.3, covered: false },
  { name: '30m', min: 10.1, max: 10.15, covered: false },
  { name: '20m', min: 14.0, max: 14.35, covered: false },
  { name: '17m', min: 18.068, max: 18.168, covered: false },
  { name: '15m', min: 21.0, max: 21.45, covered: false },
  { name: '12m', min: 24.89, max: 24.99, covered: false },
  { name: '10m', min: 28.0, max: 29.7, covered: false },
  { name: '6m', min: 50.0, max: 54.0, covered: false },
  { name: '2m', min: 144.0, max: 148.0, covered: false },
  { name: '70cm', min: 430.0, max: 450.0, covered: false },
]

// AWG Wire data
export const WIRE_DATA: { [gauge: number]: { diameter: number; area: number; current: number } } = {
  10: { diameter: 2.588, area: 5.26, current: 15 },
  12: { diameter: 2.053, area: 3.31, current: 9.3 },
  14: { diameter: 1.628, area: 2.08, current: 5.9 },
  16: { diameter: 1.291, area: 1.31, current: 3.7 },
  18: { diameter: 1.024, area: 0.823, current: 2.3 },
  20: { diameter: 0.812, area: 0.518, current: 1.5 },
  22: { diameter: 0.644, area: 0.326, current: 0.92 },
  24: { diameter: 0.511, area: 0.205, current: 0.58 },
  26: { diameter: 0.405, area: 0.129, current: 0.37 },
  28: { diameter: 0.321, area: 0.081, current: 0.23 },
  30: { diameter: 0.255, area: 0.051, current: 0.14 },
}

// Permeability data for different ferrite mixes
export const PERMEABILITY_DATA: { [mixType: string]: PermeabilityData[] } = {
  '43': [
    { frequency: 1.0, uPrime: 750, uDoublePrime: 65 },
    { frequency: 2.0, uPrime: 600, uDoublePrime: 170 },
    { frequency: 4.0, uPrime: 450, uDoublePrime: 205 },
    { frequency: 7.0, uPrime: 310, uDoublePrime: 230 },
    { frequency: 10.0, uPrime: 250, uDoublePrime: 210 },
    { frequency: 15.0, uPrime: 190, uDoublePrime: 200 },
    { frequency: 20.0, uPrime: 150, uDoublePrime: 180 },
    { frequency: 30.0, uPrime: 90, uDoublePrime: 150 },
    { frequency: 40.0, uPrime: 63, uDoublePrime: 140 },
    { frequency: 50.0, uPrime: 45, uDoublePrime: 105 },
  ],
  '52': [
    { frequency: 1.0, uPrime: 250, uDoublePrime: 10 },
    { frequency: 2.0, uPrime: 240, uDoublePrime: 25 },
    { frequency: 4.0, uPrime: 225, uDoublePrime: 40 },
    { frequency: 7.0, uPrime: 200, uDoublePrime: 45 },
    { frequency: 10.0, uPrime: 190, uDoublePrime: 50 },
    { frequency: 15.0, uPrime: 170, uDoublePrime: 55 },
    { frequency: 20.0, uPrime: 150, uDoublePrime: 50 },
    { frequency: 30.0, uPrime: 100, uDoublePrime: 45 },
    { frequency: 40.0, uPrime: 85, uDoublePrime: 40 },
    { frequency: 50.0, uPrime: 70, uDoublePrime: 35 },
  ],
  '61': [
    { frequency: 1.0, uPrime: 125, uDoublePrime: 1 },
    { frequency: 2.0, uPrime: 125, uDoublePrime: 2 },
    { frequency: 4.0, uPrime: 125, uDoublePrime: 4 },
    { frequency: 7.0, uPrime: 125, uDoublePrime: 6 },
    { frequency: 10.0, uPrime: 125, uDoublePrime: 8 },
    { frequency: 15.0, uPrime: 125, uDoublePrime: 10 },
    { frequency: 20.0, uPrime: 120, uDoublePrime: 12 },
    { frequency: 30.0, uPrime: 115, uDoublePrime: 15 },
    { frequency: 40.0, uPrime: 110, uDoublePrime: 18 },
    { frequency: 50.0, uPrime: 105, uDoublePrime: 20 },
  ],
  '77': [
    { frequency: 1.0, uPrime: 2097, uDoublePrime: 791 },
    { frequency: 2.0, uPrime: 1174, uDoublePrime: 1286 },
    { frequency: 4.0, uPrime: 278, uDoublePrime: 920 },
    { frequency: 7.0, uPrime: 27, uDoublePrime: 603 },
    { frequency: 10.0, uPrime: -40, uDoublePrime: 346 },
    { frequency: 15.0, uPrime: -41, uDoublePrime: 237 },
    { frequency: 20.0, uPrime: -36, uDoublePrime: 163 },
    { frequency: 30.0, uPrime: -26, uDoublePrime: 92 },
    { frequency: 40.0, uPrime: -19, uDoublePrime: 62 },
    { frequency: 50.0, uPrime: -16, uDoublePrime: 51 },
  ],
}
