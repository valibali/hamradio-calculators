<script lang="ts">
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

type CoreMaterial = '#31' | '#43' | '#61'
type TransformerType = 'voltage-balun' | 'current-balun' | 'unun'
// Wire type will be determined by the algorithm

interface CoreSpec {
  partNumber: string
  Ae: number // Cross-section (mm²)
  le: number // Magnetic path length (mm)
  Wa: number // Window area (mm²)
  Bsat: number // Saturation flux density (T)
  material: CoreMaterial
  thermalResistance: number // °C/W (updated values)
}

interface FrequencyDependentMu {
  frequency: number
  muPrime: number
  muDoublePrime: number
}

interface CoreMaterialData {
  muCurve: FrequencyDependentMu[]
}

interface DesignParameters {
  zin: number
  zout: number
  type: TransformerType
  core: CoreSpec
  freqMinHz: number
  freqMaxHz: number
  powerW: number
}

interface DesignResult {
  parameters: DesignParameters
  turnsRatio: number
  primaryTurns: number
  secondaryTurns: number
  wireGauge: string
  core: CoreSpec
  isValid: boolean
  warnings: string[]
  thermalRiseC: number
  fluxDensityT: number
  coreLossW: number
}

export default defineComponent({
  name: 'UnunCalculator',
  components: {
    RouterLink,
  },
  data() {
    return {
      // Input parameters
      zin: 50,
      zout: 450,
      transformerType: 'unun' as TransformerType,
      selectedCore: 'FT-240-#43',
      freqMinMHz: 3.5,
      freqMaxMHz: 30,
      powerW: 100,
      
      // Core database
      CORE_DB: {
        'FT-240-#43': {
          partNumber: 'FT-240',
          Ae: 132,
          le: 94,
          Wa: 480,
          Bsat: 0.4,
          material: '#43' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-240-#61': {
          partNumber: 'FT-240',
          Ae: 132,
          le: 94,
          Wa: 480,
          Bsat: 0.35,
          material: '#61' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-240-#31': {
          partNumber: 'FT-240',
          Ae: 132,
          le: 94,
          Wa: 480,
          Bsat: 0.47,
          material: '#31' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-140-#43': {
          partNumber: 'FT-140',
          Ae: 46,
          le: 55,
          Wa: 130,
          Bsat: 0.4,
          material: '#43' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-140-#61': {
          partNumber: 'FT-140',
          Ae: 46,
          le: 55,
          Wa: 130,
          Bsat: 0.35,
          material: '#61' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-140-#31': {
          partNumber: 'FT-140',
          Ae: 46,
          le: 55,
          Wa: 130,
          Bsat: 0.47,
          material: '#31' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-114-#43': {
          partNumber: 'FT-114',
          Ae: 32,
          le: 45,
          Wa: 90,
          Bsat: 0.4,
          material: '#43' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-114-#61': {
          partNumber: 'FT-114',
          Ae: 32,
          le: 45,
          Wa: 90,
          Bsat: 0.35,
          material: '#61' as CoreMaterial,
          thermalResistance: 22,
        },
        'FT-114-#31': {
          partNumber: 'FT-114',
          Ae: 32,
          le: 45,
          Wa: 90,
          Bsat: 0.47,
          material: '#31' as CoreMaterial,
          thermalResistance: 22,
        },
      },
      
      // Material data
      MATERIAL_DATA: {
        '#31': {
          muCurve: [
            { frequency: 10000, muPrime: 1423.52, muDoublePrime: 10.45 },
            { frequency: 50000, muPrime: 1406.98, muDoublePrime: 27.02 },
            { frequency: 100000, muPrime: 1401.93, muDoublePrime: 41.61 },
            { frequency: 150000, muPrime: 1379.45, muDoublePrime: 57.82 },
            { frequency: 200000, muPrime: 1386.57, muDoublePrime: 72.67 },
            { frequency: 250000, muPrime: 1385.58, muDoublePrime: 89.6 },
            { frequency: 300000, muPrime: 1387.5, muDoublePrime: 106.76 },
            { frequency: 333000, muPrime: 1388.08, muDoublePrime: 119.0 },
            { frequency: 400000, muPrime: 1388.37, muDoublePrime: 141.03 },
            { frequency: 480000, muPrime: 1391.6, muDoublePrime: 173.33 },
            { frequency: 500000, muPrime: 1390.55, muDoublePrime: 183.07 },
            { frequency: 600000, muPrime: 1396.46, muDoublePrime: 228.68 },
            { frequency: 640000, muPrime: 1392.65, muDoublePrime: 248.07 },
            { frequency: 667000, muPrime: 1390.14, muDoublePrime: 260.16 },
            { frequency: 800000, muPrime: 1463.65, muDoublePrime: 345.99 },
            { frequency: 960000, muPrime: 1409.68, muDoublePrime: 444.47 },
            { frequency: 1000000, muPrime: 1400.65, muDoublePrime: 463.22 },
            { frequency: 2000000, muPrime: 980.76, muDoublePrime: 734.77 },
            { frequency: 2330000, muPrime: 854.67, muDoublePrime: 752.33 },
            { frequency: 2680000, muPrime: 757.67, muDoublePrime: 728.33 },
            { frequency: 3090000, muPrime: 668.67, muDoublePrime: 696.33 },
            { frequency: 3560000, muPrime: 590.0, muDoublePrime: 657.67 },
            { frequency: 4090000, muPrime: 520.67, muDoublePrime: 616.0 },
            { frequency: 4710000, muPrime: 460.33, muDoublePrime: 571.33 },
            { frequency: 5430000, muPrime: 409.0, muDoublePrime: 527.0 },
            { frequency: 6250000, muPrime: 365.67, muDoublePrime: 484.33 },
            { frequency: 7200000, muPrime: 329.0, muDoublePrime: 444.33 },
            { frequency: 8290000, muPrime: 299.0, muDoublePrime: 408.33 },
            { frequency: 9540000, muPrime: 272.0, muDoublePrime: 375.33 },
            { frequency: 11000000, muPrime: 248.0, muDoublePrime: 346.67 },
            { frequency: 12600000, muPrime: 227.0, muDoublePrime: 321.67 },
            { frequency: 14600000, muPrime: 206.0, muDoublePrime: 299.0 },
            { frequency: 16800000, muPrime: 187.0, muDoublePrime: 278.67 },
            { frequency: 19300000, muPrime: 168.0, muDoublePrime: 260.0 },
            { frequency: 22200000, muPrime: 149.67, muDoublePrime: 242.33 },
            { frequency: 25600000, muPrime: 132.33, muDoublePrime: 226.33 },
            { frequency: 29500000, muPrime: 115.67, muDoublePrime: 210.33 },
            { frequency: 33900000, muPrime: 100.7, muDoublePrime: 195.0 },
            { frequency: 39100000, muPrime: 86.2, muDoublePrime: 180.0 },
            { frequency: 45000000, muPrime: 73.33, muDoublePrime: 165.33 },
            { frequency: 51800000, muPrime: 61.8, muDoublePrime: 151.67 },
            { frequency: 59600000, muPrime: 51.27, muDoublePrime: 138.67 },
            { frequency: 68700000, muPrime: 43.0, muDoublePrime: 130.0 },
            { frequency: 75600000, muPrime: 39.06, muDoublePrime: 125.0 },
            { frequency: 124000000, muPrime: 14.7, muDoublePrime: 86.5 },
            { frequency: 216000000, muPrime: 1.61, muDoublePrime: 52.1 },
            { frequency: 353000000, muPrime: 0.0, muDoublePrime: 32.1 },
            { frequency: 617000000, muPrime: 0.0, muDoublePrime: 18.7 },
            { frequency: 1000000000, muPrime: 0.0, muDoublePrime: 12.5 },
          ],
        },
        '#43': {
          muCurve: [
            { frequency: 10000, muPrime: 816.04, muDoublePrime: 10.11 },
            { frequency: 100000, muPrime: 809.44, muDoublePrime: 7.77 },
            { frequency: 300000, muPrime: 808.55, muDoublePrime: 13.13 },
            { frequency: 500000, muPrime: 812.48, muDoublePrime: 18.86 },
            { frequency: 700000, muPrime: 830.0, muDoublePrime: 26.0 },
            { frequency: 900000, muPrime: 840.0, muDoublePrime: 39.76 },
            { frequency: 1000000, muPrime: 851.36, muDoublePrime: 48.0 },
            { frequency: 1040844, muPrime: 855.39, muDoublePrime: 52.24 },
            { frequency: 1083356, muPrime: 859.43, muDoublePrime: 56.08 },
            { frequency: 1127605, muPrime: 863.33, muDoublePrime: 60.66 },
            { frequency: 1173660, muPrime: 868.84, muDoublePrime: 63.77 },
            { frequency: 1221597, muPrime: 873.4, muDoublePrime: 68.79 },
            { frequency: 1271492, muPrime: 878.64, muDoublePrime: 74.55 },
            { frequency: 1323425, muPrime: 884.08, muDoublePrime: 82.1 },
            { frequency: 1377479, muPrime: 889.05, muDoublePrime: 89.92 },
            { frequency: 1433740, muPrime: 895.38, muDoublePrime: 99.86 },
            { frequency: 1492300, muPrime: 899.45, muDoublePrime: 109.89 },
            { frequency: 1553251, muPrime: 904.01, muDoublePrime: 122.09 },
            { frequency: 1616692, muPrime: 907.53, muDoublePrime: 134.92 },
            { frequency: 1682724, muPrime: 910.02, muDoublePrime: 150.2 },
            { frequency: 1751453, muPrime: 910.95, muDoublePrime: 165.56 },
            { frequency: 1822989, muPrime: 911.44, muDoublePrime: 182.67 },
            { frequency: 1897447, muPrime: 910.02, muDoublePrime: 199.66 },
            { frequency: 1974946, muPrime: 906.44, muDoublePrime: 217.98 },
            { frequency: 2055611, muPrime: 901.76, muDoublePrime: 236.27 },
            { frequency: 2139570, muPrime: 894.75, muDoublePrime: 254.52 },
            { frequency: 2226959, muPrime: 886.53, muDoublePrime: 272.96 },
            { frequency: 2317916, muPrime: 876.49, muDoublePrime: 290.63 },
            { frequency: 2412589, muPrime: 864.83, muDoublePrime: 308.01 },
            { frequency: 2511129, muPrime: 851.88, muDoublePrime: 324.83 },
            { frequency: 2613693, muPrime: 836.97, muDoublePrime: 340.88 },
            { frequency: 2720446, muPrime: 820.96, muDoublePrime: 355.44 },
            { frequency: 2831560, muPrime: 803.92, muDoublePrime: 368.92 },
            { frequency: 2947212, muPrime: 786.4, muDoublePrime: 381.4 },
            { frequency: 3067588, muPrime: 767.54, muDoublePrime: 392.89 },
            { frequency: 3192880, muPrime: 748.08, muDoublePrime: 402.68 },
            { frequency: 3323290, muPrime: 728.19, muDoublePrime: 410.59 },
            { frequency: 3459026, muPrime: 708.02, muDoublePrime: 417.68 },
            { frequency: 3600306, muPrime: 687.52, muDoublePrime: 423.35 },
            { frequency: 3747356, muPrime: 667.28, muDoublePrime: 427.98 },
            { frequency: 3900413, muPrime: 647.3, muDoublePrime: 431.55 },
            { frequency: 4059721, muPrime: 627.29, muDoublePrime: 433.84 },
            { frequency: 4225536, muPrime: 607.71, muDoublePrime: 434.8 },
            { frequency: 4398124, muPrime: 588.3, muDoublePrime: 435.31 },
            { frequency: 4577760, muPrime: 569.47, muDoublePrime: 434.98 },
            { frequency: 4764734, muPrime: 551.1, muDoublePrime: 433.49 },
            { frequency: 4959344, muPrime: 533.25, muDoublePrime: 431.93 },
            { frequency: 5161903, muPrime: 515.83, muDoublePrime: 429.31 },
            { frequency: 5372736, muPrime: 498.63, muDoublePrime: 426.29 },
            { frequency: 5592179, muPrime: 482.19, muDoublePrime: 423.1 },
            { frequency: 5820586, muPrime: 466.35, muDoublePrime: 419.15 },
            { frequency: 6058321, muPrime: 450.84, muDoublePrime: 414.78 },
            { frequency: 6305767, muPrime: 435.86, muDoublePrime: 409.98 },
            { frequency: 6563319, muPrime: 421.33, muDoublePrime: 405.03 },
            { frequency: 6831390, muPrime: 407.52, muDoublePrime: 399.76 },
            { frequency: 7110411, muPrime: 394.0, muDoublePrime: 394.37 },
            { frequency: 7400828, muPrime: 380.94, muDoublePrime: 388.52 },
            { frequency: 7703107, muPrime: 368.46, muDoublePrime: 382.74 },
            { frequency: 8017732, muPrime: 356.39, muDoublePrime: 376.77 },
            { frequency: 8345207, muPrime: 344.79, muDoublePrime: 370.73 },
            { frequency: 8686058, muPrime: 333.59, muDoublePrime: 364.54 },
            { frequency: 9040831, muPrime: 322.74, muDoublePrime: 358.56 },
            { frequency: 9410094, muPrime: 312.36, muDoublePrime: 352.29 },
            { frequency: 9794439, muPrime: 302.22, muDoublePrime: 346.17 },
            { frequency: 10194482, muPrime: 292.6, muDoublePrime: 340.03 },
            { frequency: 10610865, muPrime: 283.29, muDoublePrime: 333.74 },
            { frequency: 11044254, muPrime: 274.22, muDoublePrime: 327.78 },
            { frequency: 11495344, muPrime: 265.62, muDoublePrime: 321.79 },
            { frequency: 11964859, muPrime: 257.28, muDoublePrime: 315.8 },
            { frequency: 12453551, muPrime: 249.16, muDoublePrime: 309.88 },
            { frequency: 12962202, muPrime: 241.28, muDoublePrime: 304.14 },
            { frequency: 13491630, muPrime: 233.78, muDoublePrime: 298.32 },
            { frequency: 14042680, muPrime: 226.28, muDoublePrime: 292.63 },
            { frequency: 14616238, muPrime: 219.29, muDoublePrime: 287.06 },
            { frequency: 15213223, muPrime: 212.38, muDoublePrime: 281.64 },
            { frequency: 15834590, muPrime: 205.65, muDoublePrime: 276.32 },
            { frequency: 16481337, muPrime: 199.13, muDoublePrime: 271.0 },
            { frequency: 17154499, muPrime: 192.86, muDoublePrime: 265.89 },
            { frequency: 17855156, muPrime: 186.7, muDoublePrime: 260.8 },
            { frequency: 18584431, muPrime: 180.69, muDoublePrime: 255.83 },
            { frequency: 19343491, muPrime: 174.81, muDoublePrime: 250.93 },
            { frequency: 20133555, muPrime: 169.06, muDoublePrime: 246.23 },
            { frequency: 20955888, muPrime: 163.42, muDoublePrime: 241.53 },
            { frequency: 21811809, muPrime: 157.81, muDoublePrime: 236.95 },
            { frequency: 22702688, muPrime: 152.5, muDoublePrime: 232.49 },
            { frequency: 23629955, muPrime: 147.18, muDoublePrime: 228.02 },
            { frequency: 24595095, muPrime: 141.9, muDoublePrime: 223.68 },
            { frequency: 25599655, muPrime: 136.76, muDoublePrime: 219.36 },
            { frequency: 26645245, muPrime: 131.7, muDoublePrime: 215.03 },
            { frequency: 27733541, muPrime: 126.7, muDoublePrime: 210.83 },
            { frequency: 28866287, muPrime: 121.91, muDoublePrime: 206.65 },
            { frequency: 30045299, muPrime: 117.12, muDoublePrime: 202.49 },
            { frequency: 31272467, muPrime: 112.43, muDoublePrime: 198.3 },
            { frequency: 32549757, muPrime: 107.91, muDoublePrime: 194.17 },
            { frequency: 33879216, muPrime: 103.39, muDoublePrime: 190.08 },
            { frequency: 35262976, muPrime: 99.05, muDoublePrime: 186.06 },
            { frequency: 36703254, muPrime: 94.8, muDoublePrime: 181.99 },
            { frequency: 38202358, muPrime: 90.66, muDoublePrime: 178.03 },
            { frequency: 39762692, muPrime: 86.62, muDoublePrime: 174.05 },
            { frequency: 41386756, muPrime: 82.74, muDoublePrime: 170.11 },
            { frequency: 43077153, muPrime: 78.93, muDoublePrime: 166.22 },
            { frequency: 44836592, muPrime: 75.24, muDoublePrime: 162.41 },
            { frequency: 46667894, muPrime: 71.62, muDoublePrime: 158.61 },
            { frequency: 48573993, muPrime: 68.11, muDoublePrime: 154.81 },
            { frequency: 50557945, muPrime: 64.71, muDoublePrime: 151.04 },
            { frequency: 52622929, muPrime: 61.36, muDoublePrime: 147.37 },
            { frequency: 54772256, muPrime: 58.16, muDoublePrime: 143.68 },
            { frequency: 57009369, muPrime: 55.0, muDoublePrime: 140.01 },
            { frequency: 59337855, muPrime: 51.98, muDoublePrime: 136.41 },
            { frequency: 61761445, muPrime: 49.05, muDoublePrime: 132.83 },
            { frequency: 64284024, muPrime: 46.22, muDoublePrime: 129.27 },
            { frequency: 66909635, muPrime: 43.49, muDoublePrime: 125.78 },
            { frequency: 69642486, muPrime: 40.86, muDoublePrime: 122.31 },
            { frequency: 72486957, muPrime: 38.33, muDoublePrime: 118.84 },
            { frequency: 75447608, muPrime: 35.91, muDoublePrime: 115.42 },
            { frequency: 78529184, muPrime: 33.6, muDoublePrime: 112.05 },
            { frequency: 81736623, muPrime: 31.37, muDoublePrime: 108.71 },
            { frequency: 85075066, muPrime: 29.26, muDoublePrime: 105.45 },
            { frequency: 88549865, muPrime: 27.26, muDoublePrime: 102.2 },
            { frequency: 92166588, muPrime: 25.33, muDoublePrime: 99.0 },
            { frequency: 95931032, muPrime: 23.53, muDoublePrime: 95.86 },
            { frequency: 99849230, muPrime: 21.83, muDoublePrime: 92.81 },
            { frequency: 103927464, muPrime: 20.21, muDoublePrime: 89.77 },
            { frequency: 108172268, muPrime: 18.68, muDoublePrime: 86.83 },
            { frequency: 112590446, muPrime: 17.25, muDoublePrime: 83.93 },
            { frequency: 117189081, muPrime: 15.9, muDoublePrime: 81.1 },
            { frequency: 121975541, muPrime: 14.66, muDoublePrime: 78.33 },
            { frequency: 126957499, muPrime: 13.47, muDoublePrime: 75.65 },
            { frequency: 132142940, muPrime: 12.36, muDoublePrime: 73.05 },
            { frequency: 137540175, muPrime: 11.34, muDoublePrime: 70.47 },
            { frequency: 143157854, muPrime: 10.36, muDoublePrime: 68.02 },
            { frequency: 149004980, muPrime: 9.44, muDoublePrime: 65.61 },
            { frequency: 155090927, muPrime: 8.61, muDoublePrime: 63.29 },
            { frequency: 161425447, muPrime: 7.83, muDoublePrime: 61.03 },
            { frequency: 168018693, muPrime: 7.08, muDoublePrime: 58.85 },
            { frequency: 174881234, muPrime: 6.39, muDoublePrime: 56.73 },
            { frequency: 182024068, muPrime: 5.75, muDoublePrime: 54.68 },
            { frequency: 189458643, muPrime: 5.16, muDoublePrime: 52.7 },
            { frequency: 197196875, muPrime: 4.59, muDoublePrime: 50.79 },
            { frequency: 205251167, muPrime: 4.08, muDoublePrime: 48.94 },
            { frequency: 213634427, muPrime: 3.59, muDoublePrime: 47.14 },
            { frequency: 222360093, muPrime: 3.12, muDoublePrime: 45.43 },
            { frequency: 231442149, muPrime: 2.7, muDoublePrime: 43.75 },
            { frequency: 240895152, muPrime: 2.3, muDoublePrime: 42.15 },
            { frequency: 250734252, muPrime: 1.93, muDoublePrime: 40.59 },
            { frequency: 260975220, muPrime: 1.59, muDoublePrime: 39.09 },
            { frequency: 271634469, muPrime: 1.26, muDoublePrime: 37.65 },
            { frequency: 282729083, muPrime: 0.96, muDoublePrime: 36.24 },
            { frequency: 294276845, muPrime: 0.67, muDoublePrime: 34.9 },
            { frequency: 306296262, muPrime: 0.42, muDoublePrime: 33.6 },
            { frequency: 318806600, muPrime: 0.17, muDoublePrime: 32.35 },
            { frequency: 331827909, muPrime: -0.06, muDoublePrime: 31.15 },
            { frequency: 345381058, muPrime: -0.27, muDoublePrime: 29.98 },
            { frequency: 359487772, muPrime: -0.46, muDoublePrime: 28.85 },
            { frequency: 374170659, muPrime: -0.64, muDoublePrime: 27.77 },
            { frequency: 389453252, muPrime: -0.8, muDoublePrime: 26.73 },
            { frequency: 405360046, muPrime: -0.95, muDoublePrime: 25.73 },
            { frequency: 421916537, muPrime: -1.09, muDoublePrime: 24.76 },
            { frequency: 439149258, muPrime: -1.22, muDoublePrime: 23.84 },
            { frequency: 457085832, muPrime: -1.33, muDoublePrime: 22.95 },
            { frequency: 475755005, muPrime: -1.43, muDoublePrime: 22.09 },
            { frequency: 495186701, muPrime: -1.52, muDoublePrime: 21.28 },
            { frequency: 515412063, muPrime: -1.61, muDoublePrime: 20.49 },
            { frequency: 536463508, muPrime: -1.69, muDoublePrime: 19.74 },
            { frequency: 558374776, muPrime: -1.75, muDoublePrime: 19.03 },
            { frequency: 581180986, muPrime: -1.82, muDoublePrime: 18.34 },
            { frequency: 604918691, muPrime: -1.87, muDoublePrime: 17.69 },
            { frequency: 629625937, muPrime: -1.92, muDoublePrime: 17.07 },
            { frequency: 655342323, muPrime: -1.96, muDoublePrime: 16.47 },
            { frequency: 682109067, muPrime: -2.01, muDoublePrime: 15.9 },
            { frequency: 709969070, muPrime: -2.06, muDoublePrime: 15.36 },
            { frequency: 738966984, muPrime: -2.11, muDoublePrime: 14.85 },
            { frequency: 769149286, muPrime: -2.14, muDoublePrime: 14.35 },
            { frequency: 800564352, muPrime: -2.17, muDoublePrime: 13.88 },
            { frequency: 833262532, muPrime: -2.21, muDoublePrime: 13.44 },
            { frequency: 867296233, muPrime: -2.25, muDoublePrime: 13.01 },
            { frequency: 902720004, muPrime: -2.27, muDoublePrime: 12.61 },
            { frequency: 939590621, muPrime: -2.3, muDoublePrime: 12.22 },
            { frequency: 977967177, muPrime: -2.32, muDoublePrime: 11.86 },
            { frequency: 1017911182, muPrime: -2.34, muDoublePrime: 11.51 },
            { frequency: 1059486657, muPrime: -2.37, muDoublePrime: 11.19 },
            { frequency: 1102760237, muPrime: -2.38, muDoublePrime: 10.88 },
            { frequency: 1147801278, muPrime: -2.4, muDoublePrime: 10.59 },
            { frequency: 1194681973, muPrime: -2.41, muDoublePrime: 10.33 },
            { frequency: 1243477458, muPrime: -2.42, muDoublePrime: 10.08 },
            { frequency: 1294265942, muPrime: -2.43, muDoublePrime: 9.86 },
            { frequency: 1347128826, muPrime: -2.43, muDoublePrime: 9.66 },
            { frequency: 1402150837, muPrime: -2.44, muDoublePrime: 9.48 },
            { frequency: 1459420162, muPrime: -2.45, muDoublePrime: 9.32 },
            { frequency: 1519028591, muPrime: -2.46, muDoublePrime: 9.19 },
            { frequency: 1581071660, muPrime: -2.47, muDoublePrime: 9.07 },
            { frequency: 1645648812, muPrime: -2.48, muDoublePrime: 8.99 },
            { frequency: 1712863547, muPrime: -2.5, muDoublePrime: 8.94 },
            { frequency: 1782823595, muPrime: -2.53, muDoublePrime: 8.92 },
            { frequency: 1855641085, muPrime: -2.57, muDoublePrime: 8.92 },
            { frequency: 1931432726, muPrime: -2.62, muDoublePrime: 8.96 },
            { frequency: 2010319994, muPrime: -2.7, muDoublePrime: 9.05 },
            { frequency: 2092429326, muPrime: -2.8, muDoublePrime: 9.17 },
            { frequency: 2177892326, muPrime: -2.94, muDoublePrime: 9.34 },
            { frequency: 2266845968, muPrime: -3.14, muDoublePrime: 9.56 },
            { frequency: 2359432825, muPrime: -3.41, muDoublePrime: 9.83 },
            { frequency: 2455801291, muPrime: -3.77, muDoublePrime: 10.14 },
            { frequency: 2556105823, muPrime: -4.27, muDoublePrime: 10.48 },
            { frequency: 2660507184, muPrime: -4.96, muDoublePrime: 10.8 },
            { frequency: 2769172705, muPrime: -5.84, muDoublePrime: 11.05 },
            { frequency: 2882276551, muPrime: -6.95, muDoublePrime: 11.13 },
            { frequency: 3000000000, muPrime: -8.23, muDoublePrime: 10.91 },
          ],
        },
        '#61': {
          muCurve: [
            { frequency: 1000000, muPrime: 123.63, muDoublePrime: 0.5 },
            { frequency: 1040000, muPrime: 123.58, muDoublePrime: 0.52 },
            { frequency: 1080000, muPrime: 123.57, muDoublePrime: 0.53 },
            { frequency: 1130000, muPrime: 123.6, muDoublePrime: 0.54 },
            { frequency: 1170000, muPrime: 123.63, muDoublePrime: 0.47 },
            { frequency: 1220000, muPrime: 123.58, muDoublePrime: 0.49 },
            { frequency: 1270000, muPrime: 123.62, muDoublePrime: 0.49 },
            { frequency: 1320000, muPrime: 123.6, muDoublePrime: 0.47 },
            { frequency: 1380000, muPrime: 123.6, muDoublePrime: 0.48 },
            { frequency: 1430000, muPrime: 123.61, muDoublePrime: 0.45 },
            { frequency: 1490000, muPrime: 123.6, muDoublePrime: 0.52 },
            { frequency: 1550000, muPrime: 123.6, muDoublePrime: 0.49 },
            { frequency: 1620000, muPrime: 123.58, muDoublePrime: 0.48 },
            { frequency: 1680000, muPrime: 123.6, muDoublePrime: 0.5 },
            { frequency: 1750000, muPrime: 123.62, muDoublePrime: 0.48 },
            { frequency: 1820000, muPrime: 123.63, muDoublePrime: 0.51 },
            { frequency: 1900000, muPrime: 123.62, muDoublePrime: 0.5 },
            { frequency: 1970000, muPrime: 123.64, muDoublePrime: 0.5 },
            { frequency: 2060000, muPrime: 123.69, muDoublePrime: 0.49 },
            { frequency: 2140000, muPrime: 123.68, muDoublePrime: 0.51 },
            { frequency: 2230000, muPrime: 123.69, muDoublePrime: 0.51 },
            { frequency: 2320000, muPrime: 123.67, muDoublePrime: 0.52 },
            { frequency: 2410000, muPrime: 123.7, muDoublePrime: 0.55 },
            { frequency: 2510000, muPrime: 123.7, muDoublePrime: 0.55 },
            { frequency: 2610000, muPrime: 123.73, muDoublePrime: 0.54 },
            { frequency: 2720000, muPrime: 123.77, muDoublePrime: 0.56 },
            { frequency: 2830000, muPrime: 123.78, muDoublePrime: 0.56 },
            { frequency: 2950000, muPrime: 123.82, muDoublePrime: 0.57 },
            { frequency: 3070000, muPrime: 123.83, muDoublePrime: 0.57 },
            { frequency: 3190000, muPrime: 123.86, muDoublePrime: 0.62 },
            { frequency: 3320000, muPrime: 123.9, muDoublePrime: 0.59 },
            { frequency: 3460000, muPrime: 123.94, muDoublePrime: 0.6 },
            { frequency: 3600000, muPrime: 124.0, muDoublePrime: 0.61 },
            { frequency: 3750000, muPrime: 124.04, muDoublePrime: 0.6 },
            { frequency: 3900000, muPrime: 124.11, muDoublePrime: 0.66 },
            { frequency: 4060000, muPrime: 124.19, muDoublePrime: 0.64 },
            { frequency: 4230000, muPrime: 124.22, muDoublePrime: 0.67 },
            { frequency: 4400000, muPrime: 124.28, muDoublePrime: 0.7 },
            { frequency: 4580000, muPrime: 124.38, muDoublePrime: 0.71 },
            { frequency: 4760000, muPrime: 124.49, muDoublePrime: 0.71 },
            { frequency: 4960000, muPrime: 124.56, muDoublePrime: 0.72 },
            { frequency: 5160000, muPrime: 124.68, muDoublePrime: 0.76 },
            { frequency: 5370000, muPrime: 124.8, muDoublePrime: 0.78 },
            { frequency: 5590000, muPrime: 124.89, muDoublePrime: 0.77 },
            { frequency: 5820000, muPrime: 125.05, muDoublePrime: 0.81 },
            { frequency: 6060000, muPrime: 125.19, muDoublePrime: 0.84 },
            { frequency: 6310000, muPrime: 125.33, muDoublePrime: 0.86 },
            { frequency: 6560000, muPrime: 125.55, muDoublePrime: 0.87 },
            { frequency: 6830000, muPrime: 125.76, muDoublePrime: 0.92 },
          ],
        },
      },
      
      // Wire gauge data
      WIRE_GAUGE: [
        { awg: 10, diameter: 2.59, maxCurrent: 15.0 },
        { awg: 12, diameter: 2.05, maxCurrent: 9.3 },
        { awg: 14, diameter: 1.63, maxCurrent: 5.9 },
        { awg: 16, diameter: 1.29, maxCurrent: 3.7 },
        { awg: 18, diameter: 1.02, maxCurrent: 2.3 },
        { awg: 20, diameter: 0.81, maxCurrent: 1.5 },
        { awg: 22, diameter: 0.64, maxCurrent: 0.92 },
        { awg: 24, diameter: 0.51, maxCurrent: 0.58 },
        { awg: 26, diameter: 0.40, maxCurrent: 0.37 },
        { awg: 28, diameter: 0.32, maxCurrent: 0.23 },
        { awg: 30, diameter: 0.25, maxCurrent: 0.14 },
      ],
      
      // Constants
      MU0: 4 * Math.PI * 1e-7, // Permeability of free space (H/m)
      
      // Results
      designResult: null as DesignResult | null,
      isCalculating: false,
      showAdvancedOptions: false,
    }
  },
  computed: {
    coreOptions() {
      return Object.keys(this.CORE_DB).map(key => ({
        value: key,
        label: key
      }))
    },
    selectedCoreObj(): CoreSpec {
      return this.CORE_DB[this.selectedCore as keyof typeof this.CORE_DB]
    },
    freqMinHz(): number {
      return this.freqMinMHz * 1e6
    },
    freqMaxHz(): number {
      return this.freqMaxMHz * 1e6
    },
    impedanceRatio(): number {
      return this.zout / this.zin
    }
  },
  methods: {
    calculateDesign() {
      this.isCalculating = true
      
      // Create design parameters
      const params: DesignParameters = {
        zin: this.zin,
        zout: this.zout,
        type: this.transformerType,
        core: this.selectedCoreObj,
        freqMinHz: this.freqMinHz,
        freqMaxHz: this.freqMaxHz,
        powerW: this.powerW
      }
      
      // Perform the design calculation
      try {
        this.designResult = this.createDesign(params)
      } catch (error) {
        console.error('Design calculation error:', error)
        // Handle error
      } finally {
        this.isCalculating = false
      }
    },
    
    createDesign(params: DesignParameters): DesignResult {
      console.log(`\n=== Designing ${params.type} for ${params.zin}Ω → ${params.zout}Ω ===`)
      console.log(`Core: ${params.core.partNumber}-${params.core.material}`)
      console.log(`Frequency: ${params.freqMinHz / 1e6}MHz to ${params.freqMaxHz / 1e6}MHz`)
      console.log(`Power: ${params.powerW}W, Wire: ${params.wireType}`)

      const zw = Math.sqrt(params.zin * params.zout)
      const turnsRatio = this.calculateTurnsRatio(params.type, params.zin, params.zout)
      const optimized = this.optimizeTurns(params, turnsRatio, zw)
      return optimized // Already validated in optimizeTurns
    },

    optimizeTurns(params: DesignParameters, ratio: number, zw: number): DesignResult {
      // Calculate absolute minimum turns based on Rule of 4
      const minTurns = this.calculateMinimumTurns(params, zw)
      let bestDesign: DesignResult | null = null

      // Test turns from minimum up to minimum + 5
      for (let turns = minTurns; turns <= minTurns + 5; turns++) {
        const testDesign = this.createTestDesign(params, ratio, turns, zw)

        if (testDesign.isValid && (!bestDesign || turns < bestDesign.primaryTurns)) {
          bestDesign = testDesign
          // Early exit if we've found the minimal valid design
          if (turns === minTurns) break
        }
      }

      if (!bestDesign) {
        // If no valid design was found, return the best invalid design
        let bestInvalidDesign: DesignResult | null = null
        for (let turns = minTurns; turns <= minTurns + 10; turns++) {
          const testDesign = this.createTestDesign(params, ratio, turns, zw)
          if (!bestInvalidDesign || turns < bestInvalidDesign.primaryTurns) {
            bestInvalidDesign = testDesign
          }
        }
        return bestInvalidDesign!
      }

      return bestDesign
    },

    calculateMinimumTurns(params: DesignParameters, zw: number): number {
      const mu = this.interpolateMu(
        this.MATERIAL_DATA[params.core.material].muCurve,
        params.freqMinHz,
      ).muPrime

      // Rule of 4: X_L = 4 * Z_w at lowest frequency
      const lMin = (4 * zw) / (2 * Math.PI * params.freqMinHz)

      // Calculate minimum turns needed to achieve L_min
      const nMin = Math.sqrt(
        (lMin * params.core.le * 1e-3) /
          (this.MU0 * mu * params.core.Ae * 1e-6),
      )

      return Math.max(1, Math.ceil(nMin))
    },

    createTestDesign(
      params: DesignParameters,
      ratio: number,
      primaryTurns: number,
      zw: number,
    ): DesignResult {
      const secondaryTurns = Math.ceil(primaryTurns * ratio)
      const current = Math.sqrt(params.powerW / Math.min(params.zin, params.zout))
      // Determine wire type based on impedance
      const wireType = this.determineWireType(params.zin, params.zout)
      const wireGauge = this.selectWireGauge(current)

      // Calculate flux density
      const vRms = Math.sqrt(params.powerW * params.zin)
      const bMax = (vRms * 1e6) / (4.44 * params.freqMinHz * primaryTurns * params.core.Ae)

      // Calculate core loss
      const coreLoss = this.calculateCoreLoss(
        params.core.material,
        params.freqMinHz,
        bMax,
        params.core.Ae,
        params.core.le,
      )

      // Calculate wire resistance
      const lengthPerTurn_m = params.core.le * 1e-3 // Magnetic path length in meters
      const wireResistance = this.calculateWireResistance(
        parseInt(wireGauge),
        primaryTurns + secondaryTurns,
        lengthPerTurn_m,
      )

      // Calculate total losses
      const pTotal = coreLoss + Math.pow(current, 2) * wireResistance

      // Temperature rise with core-specific thermal resistance
      const tempRise = pTotal * params.core.thermalResistance

      // Check window fit
      const windowValid = this.checkWindowFit(primaryTurns, secondaryTurns, wireGauge, params.core.Wa)

      return {
        parameters: params,
        turnsRatio: ratio,
        primaryTurns,
        secondaryTurns,
        wireGauge,
        core: params.core,
        isValid: bMax <= 0.5 * params.core.Bsat && tempRise < 80 && windowValid,
        warnings: [
          bMax > 0.5 * params.core.Bsat ? 'Core saturation risk' : '',
          tempRise >= 80 ? 'Excessive temperature rise' : '',
          !windowValid ? 'Windings exceed core window' : '',
        ].filter(Boolean),
        thermalRiseC: tempRise,
        fluxDensityT: bMax,
        coreLossW: coreLoss,
      }
    },

    calculateWireResistance(awg: number, turns: number, lengthPerTurn_m: number): number {
      const wire = this.WIRE_GAUGE.find((w) => w.awg === awg)
      if (!wire) return 0

      const diameter_m = wire.diameter * 1e-3
      const area_m2 = Math.PI * Math.pow(diameter_m / 2, 2)
      const resistivity = 1.68e-8 // Copper resistivity (Ω·m)

      return (resistivity * (turns * lengthPerTurn_m)) / area_m2
    },

    calculateCoreLoss(
      material: CoreMaterial,
      freqHz: number,
      bMax: number,
      ae_mm2: number,
      le_mm: number,
    ): number {
      const { muDoublePrime } = this.interpolateMu(
        this.MATERIAL_DATA[material].muCurve,
        freqHz,
      )

      // Convert units to meters
      const ae_m2 = ae_mm2 * 1e-6
      const le_m = le_mm * 1e-3

      // Core loss formula using Steinmetz parameters
      return Math.PI * this.MU0 * muDoublePrime * freqHz * Math.pow(bMax, 2) * ae_m2 * le_m
    },

    interpolateMu(
      muCurve: FrequencyDependentMu[],
      freqHz: number,
    ): {
      muPrime: number
      muDoublePrime: number
    } {
      // Find the two nearest frequency points
      const sorted = [...muCurve].sort((a, b) => a.frequency - b.frequency)
      let lower = sorted[0]
      let upper = sorted[sorted.length - 1]

      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].frequency <= freqHz && sorted[i + 1].frequency >= freqHz) {
          lower = sorted[i]
          upper = sorted[i + 1]
          break
        }
      }

      if (freqHz <= lower.frequency) return lower
      if (freqHz >= upper.frequency) return upper

      // Logarithmic interpolation
      const logFreq = Math.log(freqHz)
      const logLower = Math.log(lower.frequency)
      const logUpper = Math.log(upper.frequency)
      const ratio = (logFreq - logLower) / (logUpper - logLower)

      return {
        muPrime: lower.muPrime + (upper.muPrime - lower.muPrime) * ratio,
        muDoublePrime: lower.muDoublePrime + (upper.muDoublePrime - lower.muDoublePrime) * ratio,
      }
    },

    selectWireGauge(current: number): string {
      // Find all wire gauges that can handle the current
      const suitableWires = this.WIRE_GAUGE.filter((w) => w.maxCurrent >= current)
      
      // Sort by diameter (ascending) to find the thinnest suitable wire
      const sortedWires = suitableWires.sort((a, b) => a.diameter - b.diameter)
      
      // Return the thinnest wire that can handle the current
      return sortedWires.length > 0 ? `${sortedWires[0].awg} AWG` : 'Unknown'
    },

    checkWindowFit(
      primaryTurns: number,
      secondaryTurns: number,
      wireGauge: string,
      windowArea_mm2: number,
    ): boolean {
      const wire = this.WIRE_GAUGE.find((w) => `${w.awg} AWG` === wireGauge)
      if (!wire) return false

      const wireArea = Math.PI * Math.pow(wire.diameter / 2, 2)
      const totalWireArea = wireArea * (primaryTurns + secondaryTurns)

      // Allow 70% window fill factor for practical winding
      return totalWireArea <= windowArea_mm2 * 0.7
    },

    calculateTurnsRatio(type: TransformerType, zin: number, zout: number): number {
      return type === 'voltage-balun' ? Math.sqrt(zout / zin) : Math.sqrt(zin / zout)
    },
    
    determineWireType(zin: number, zout: number): string {
      // Determine wire type based on impedance
      const zw = Math.sqrt(zin * zout)
      return zw > 75 ? '100-ohm' : '50-ohm'
    },
    
    resetForm() {
      this.zin = 50
      this.zout = 450
      this.transformerType = 'unun'
      this.selectedCore = 'FT-240-#43'
      this.freqMinMHz = 3.5
      this.freqMaxMHz = 30
      this.powerW = 100
      this.designResult = null
    }
  },
  mounted() {
    // Calculate a design with default parameters on component mount
    this.calculateDesign()
  }
})
</script>

<template>
  <div class="unun-calculator">
    <div class="calculator-introduction">
      <h2>Unun Designer: RF Impedance Transformer Calculator</h2>
      
      <p>
        Design unbalanced-to-unbalanced (unun) transformers for RF applications with precise
        impedance transformation ratios. This calculator helps you determine the optimal number
        of turns, wire gauge, and core specifications for your unun design.
      </p>
      
      <div class="introduction-details">
        <h3>What is an Unun?</h3>
        <p>
          An unun (unbalanced-to-unbalanced) transformer is used to match impedances between two unbalanced
          systems, such as connecting a coaxial feedline to an end-fed antenna or matching a transmitter
          to a non-resonant antenna system.
        </p>
        
        <h3>Common Unun Applications</h3>
        <p>
          Ununs are commonly used in:
        </p>
        <ul>
          <li><strong>End-fed antennas:</strong> 9:1 ununs for matching 450Ω end-fed wires to 50Ω coax</li>
          <li><strong>Antenna tuners:</strong> Various ratios for impedance transformation</li>
          <li><strong>Receiving applications:</strong> Matching antennas to receivers</li>
          <li><strong>Transmission line transformers:</strong> Creating specific impedance transformations</li>
        </ul>
        
        <p>
          The calculator uses ferrite core data from manufacturers to ensure accurate designs that
          avoid core saturation, excessive heating, and other common issues in unun construction.
        </p>
      </div>
    </div>

    <div class="calculator-form">
      <div class="form-section">
        <h3>Design Parameters</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="zin">Input Impedance (Ω):</label>
            <input type="number" id="zin" v-model="zin" min="1" step="1" />
          </div>
          
          <div class="form-group">
            <label for="zout">Output Impedance (Ω):</label>
            <input type="number" id="zout" v-model="zout" min="1" step="1" />
          </div>
        </div>
        
        <div class="impedance-ratio">
          <span class="ratio-label">Impedance Ratio:</span>
          <span class="ratio-value">{{ impedanceRatio }}:1</span>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="core-type">Core Type:</label>
            <select id="core-type" v-model="selectedCore">
              <option v-for="option in coreOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="freq-min">Min Frequency (MHz):</label>
            <input type="number" id="freq-min" v-model="freqMinMHz" min="0.1" step="0.1" />
          </div>
          
          <div class="form-group">
            <label for="freq-max">Max Frequency (MHz):</label>
            <input type="number" id="freq-max" v-model="freqMaxMHz" min="0.1" step="0.1" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="power">Power (W):</label>
            <input type="number" id="power" v-model="powerW" min="1" step="1" />
          </div>
        </div>
        
        <div class="form-actions">
          <button @click="calculateDesign" :disabled="isCalculating" class="primary-button">
            <span v-if="isCalculating">Calculating...</span>
            <span v-else>Calculate Design</span>
          </button>
          <button @click="resetForm" class="secondary-button">Reset</button>
        </div>
      </div>
      
      <div class="form-section">
        <h3>Core Specifications</h3>
        <div class="core-specs" v-if="selectedCoreObj">
          <div class="spec-item">
            <span class="spec-label">Part Number:</span>
            <span class="spec-value">{{ selectedCoreObj.partNumber }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Material:</span>
            <span class="spec-value">{{ selectedCoreObj.material }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Cross-section (Ae):</span>
            <span class="spec-value">{{ selectedCoreObj.Ae }} mm²</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Path Length (le):</span>
            <span class="spec-value">{{ selectedCoreObj.le }} mm</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Window Area (Wa):</span>
            <span class="spec-value">{{ selectedCoreObj.Wa }} mm²</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Saturation Flux (Bsat):</span>
            <span class="spec-value">{{ selectedCoreObj.Bsat }} T</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="designResult" class="design-results">
      <h3>Design Results</h3>
      
      <div class="result-status" :class="{ valid: designResult.isValid, invalid: !designResult.isValid }">
        <span v-if="designResult.isValid">✓ VALID DESIGN</span>
        <span v-else>✗ INVALID DESIGN</span>
      </div>
      
      <div v-if="designResult.warnings && designResult.warnings.length > 0" class="warnings">
        <h4>Warnings:</h4>
        <ul>
          <li v-for="(warning, index) in designResult.warnings" :key="index">{{ warning }}</li>
        </ul>
      </div>
      
      <div class="result-grid">
        <div class="result-section">
          <h4>Transformer Configuration</h4>
          <div class="result-item">
            <span class="result-label">Turns Ratio:</span>
            <span class="result-value">{{ designResult.turnsRatio.toFixed(2) }}:1</span>
          </div>
          <div class="result-item">
            <span class="result-label">Primary Turns:</span>
            <span class="result-value">{{ designResult.primaryTurns }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Secondary Turns:</span>
            <span class="result-value">{{ designResult.secondaryTurns }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Wire Gauge:</span>
            <span class="result-value">{{ designResult.wireGauge }}</span>
          </div>
        </div>
        
        <div class="result-section">
          <h4>Performance Metrics</h4>
          <div class="result-item">
            <span class="result-label">Flux Density:</span>
            <span class="result-value" :class="{ warning: designResult.fluxDensityT > 0.5 * designResult.core.Bsat }">
              {{ designResult.fluxDensityT.toFixed(3) }} T
              <small>(Max: {{ (0.5 * designResult.core.Bsat).toFixed(3) }} T)</small>
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Core Loss:</span>
            <span class="result-value">{{ designResult.coreLossW.toFixed(2) }} W</span>
          </div>
          <div class="result-item">
            <span class="result-label">Temperature Rise:</span>
            <span class="result-value" :class="{ warning: designResult.thermalRiseC >= 80 }">
              {{ designResult.thermalRiseC.toFixed(1) }} °C
            </span>
          </div>
        </div>
      </div>
      
      
      <div class="construction-notes">
        <h4>Construction Notes</h4>
        <ul>
          <li>Wind {{ designResult.primaryTurns }} turns for the primary winding using {{ designResult.wireGauge }} wire.</li>
          <li>Wind {{ designResult.secondaryTurns }} turns for the secondary winding.</li>
          <li>For a {{ designResult.parameters.type }}, use a bifilar winding technique with the appropriate taps.</li>
          <li>Ensure adequate ventilation if operating near maximum power.</li>
          <li>
            The design is optimized for {{ designResult.parameters.freqMinHz / 1e6 }}MHz to 
            {{ designResult.parameters.freqMaxHz / 1e6 }}MHz operation.
          </li>
        </ul>
      </div>
      
      <div class="common-configurations">
        <h4>Common Unun Configurations</h4>
        <div class="config-grid">
          <div class="config-item">
            <h5>1:1 Unun (Choke)</h5>
            <p>Used for common-mode current suppression without impedance transformation.</p>
          </div>
          <div class="config-item">
            <h5>4:1 Unun</h5>
            <p>Common for matching 200Ω loads to 50Ω systems.</p>
          </div>
          <div class="config-item">
            <h5>9:1 Unun</h5>
            <p>Popular for end-fed half-wave antennas, matching 450Ω to 50Ω.</p>
          </div>
          <div class="config-item">
            <h5>16:1 Unun</h5>
            <p>Used for very high impedance matching scenarios.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unun-calculator {
  max-width: 100%;
  margin: 0 auto;
}

.calculator-introduction {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border-left: 4px solid hsla(160, 100%, 37%, 0.8);
}

.introduction-details {
  margin-top: 1.5rem;
}

.introduction-details h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.introduction-details ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.introduction-details li {
  margin-bottom: 0.5rem;
}

.calculator-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.form-section {
  background-color: var(--color-background-soft);
  padding: 1.5rem;
  border-radius: 8px;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.impedance-ratio {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-mute);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.ratio-label {
  font-weight: bold;
  margin-right: 0.5rem;
}

.ratio-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: hsla(160, 100%, 37%, 1);
}

label {
  font-weight: bold;
  color: var(--color-heading);
}

input, select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.primary-button, .secondary-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-button {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
}

.primary-button:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
}

.secondary-button {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.secondary-button:hover {
  background-color: var(--color-border);
}

.core-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-mute);
  padding: 0.75rem;
  border-radius: 4px;
}

.spec-label {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.spec-value {
  font-weight: bold;
}

.design-results {
  background-color: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.design-results h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.result-status {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.result-status.valid {
  background-color: rgba(0, 128, 0, 0.1);
  color: green;
}

.result-status.invalid {
  background-color: rgba(255, 0, 0, 0.1);
  color: red;
}

.warnings {
  background-color: rgba(255, 165, 0, 0.1);
  border-left: 4px solid orange;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.warnings h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: orange;
}

.warnings ul {
  margin: 0;
  padding-left: 1.5rem;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.result-section {
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 8px;
}

.result-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.result-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.result-label {
  font-weight: bold;
}

.result-value {
  text-align: right;
}

.result-value.warning {
  color: orange;
}

.result-value small {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.hybrid-design {
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.hybrid-design h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.hybrid-note {
  font-style: italic;
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.hybrid-part {
  background-color: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.hybrid-part h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.hybrid-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.hybrid-spec {
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft);
  padding: 0.75rem;
  border-radius: 4px;
}

.construction-notes {
  margin-top: 2rem;
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 8px;
}

.construction-notes h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.construction-notes ul {
  margin: 0;
  padding-left: 1.5rem;
}

.construction-notes li {
  margin-bottom: 0.5rem;
}

.common-configurations {
  margin-top: 2rem;
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 8px;
}

.common-configurations h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.config-item {
  background-color: var(--color-background);
  padding: 1rem;
  border-radius: 4px;
}

.config-item h5 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}

.config-item p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.valid {
  color: green;
}

.invalid {
  color: red;
}

@media (max-width: 768px) {
  .calculator-form {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .result-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .hybrid-specs {
    grid-template-columns: 1fr;
  }
  
  .core-specs {
    grid-template-columns: 1fr;
  }
  
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
