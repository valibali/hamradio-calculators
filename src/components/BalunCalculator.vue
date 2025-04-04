<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MathJaxLoader from './MathJaxLoader.vue'

// Types
type FrequencyBand = '160m' | '80m' | '40m' | '20m' | '15m' | '10m'
type FerriteMaterial = '#31' | '#43'
type WireType = 'coax' | 'magnet_twin' | 'teflon_tube'
type CoreSize = 'FT-140' | 'FT-240'
type BalunType = 'balun' | 'unun' | 'hybrid'

interface FerriteProperties {
  frequencyPermeability: { frequency: number; permeability: number }[]
  coreGeometries: Record<CoreSize, CoreGeometry>
  saturationFluxDensity: number // Tesla
  maxOperatingTemperature: number // °C
}

interface CoreGeometry {
  crossSectionalArea: number // m²
  magneticPathLength: number // m
  volume: number // m³
  thermalResistance: number // °C/W
}

interface WireProperties {
  characteristicImpedance: number
  maxCurrent: number // A
  diameter: number // mm
  resistancePerMeter: number // Ω/m
}

interface BalunSolution {
  type: BalunType
  inputImpedance: number
  outputImpedance: number
  ratio: number
  primaryTurns: number
  secondaryTurns: number
  wireType: WireType
  wireLength: number // meters
  coreMaterial: FerriteMaterial
  coreSize: CoreSize
  fluxDensity: number // Tesla
  coreLoss: number // Watts
  temperatureRise: number // °C
  isValid: boolean
  warnings: string[]
  components?: BalunSolution[] // For hybrid solutions
}

// Input parameters
const inputImpedance = ref(50)
const outputImpedance = ref(200)
const material = ref<FerriteMaterial>('#43')
const coreSize = ref<CoreSize>('FT-140')
const wireType = ref<WireType>('coax')
const powerRating = ref(100)
const ambientTemperature = ref(25)
const calculatorType = ref<BalunType>('balun')

// Constants
const bands: FrequencyBand[] = ['160m', '80m', '40m', '20m', '15m', '10m']
const frequencyMap: Record<FrequencyBand, number> = {
  '160m': 1.8,
  '80m': 3.5,
  '40m': 7,
  '20m': 14,
  '15m': 21,
  '10m': 28,
}

const ferriteData: Record<FerriteMaterial, FerriteProperties> = {
  '#31': {
    frequencyPermeability: [
      { frequency: 1e3, permeability: 1500 },
      { frequency: 1e6, permeability: 1200 },
      { frequency: 1e7, permeability: 500 },
      { frequency: 1e8, permeability: 50 },
    ],
    coreGeometries: {
      'FT-140': {
        crossSectionalArea: 0.68e-4,
        magneticPathLength: 0.084,
        volume: 5.7e-6,
        thermalResistance: 20,
      },
      'FT-240': {
        crossSectionalArea: 1.23e-4,
        magneticPathLength: 0.145,
        volume: 17.8e-6,
        thermalResistance: 15,
      },
    },
    saturationFluxDensity: 0.44,
    maxOperatingTemperature: 120,
  },
  '#43': {
    frequencyPermeability: [
      { frequency: 1e3, permeability: 800 },
      { frequency: 1e6, permeability: 650 },
      { frequency: 1e7, permeability: 250 },
      { frequency: 1e8, permeability: 30 },
    ],
    coreGeometries: {
      'FT-140': {
        crossSectionalArea: 0.68e-4,
        magneticPathLength: 0.084,
        volume: 5.7e-6,
        thermalResistance: 20,
      },
      'FT-240': {
        crossSectionalArea: 1.23e-4,
        magneticPathLength: 0.145,
        volume: 17.8e-6,
        thermalResistance: 15,
      },
    },
    saturationFluxDensity: 0.38,
    maxOperatingTemperature: 130,
  },
}

const wireData: Record<WireType, WireProperties> = {
  coax: {
    characteristicImpedance: 50,
    maxCurrent: 5,
    diameter: 2.5,
    resistancePerMeter: 0.01,
  },
  magnet_twin: {
    characteristicImpedance: 50,
    maxCurrent: 3,
    diameter: 1.0,
    resistancePerMeter: 0.02,
  },
  teflon_tube: {
    characteristicImpedance: 100,
    maxCurrent: 2,
    diameter: 1.5,
    resistancePerMeter: 0.015,
  },
}

// Computed properties
const impedanceRatio = computed(() => outputImpedance.value / inputImpedance.value)
const solution = ref<BalunSolution | null>(null)

// Watch for changes in inputs and recalculate
watch(
  [inputImpedance, outputImpedance, material, coreSize, wireType, powerRating, ambientTemperature, calculatorType],
  () => {
    calculateBalun()
  },
  { immediate: true }
)

// Calculate balun based on selected type
function calculateBalun() {
  if (calculatorType.value === 'balun') {
    solution.value = calculateSingleBalun(
      inputImpedance.value,
      outputImpedance.value,
      material.value,
      coreSize.value,
      wireType.value,
      powerRating.value,
      ambientTemperature.value
    )
  } else if (calculatorType.value === 'unun') {
    solution.value = calculateUnun(
      inputImpedance.value,
      outputImpedance.value,
      material.value,
      coreSize.value,
      wireType.value,
      powerRating.value,
      ambientTemperature.value
    )
  } else if (calculatorType.value === 'hybrid') {
    solution.value = createHybridSolution(
      outputImpedance.value,
      inputImpedance.value,
      material.value,
      coreSize.value,
      wireType.value,
      powerRating.value,
      ambientTemperature.value
    )
  }
}

// Helper function to get effective permeability at a given frequency
function getEffectivePermeability(material: FerriteMaterial, frequencyHz: number): number {
  const points = ferriteData[material].frequencyPermeability
  let lower = points[0]
  let upper = points[points.length - 1]

  for (let i = 0; i < points.length; i++) {
    if (points[i].frequency <= frequencyHz) lower = points[i]
    if (points[i].frequency >= frequencyHz) {
      upper = points[i]
      break
    }
  }

  if (frequencyHz <= lower.frequency) return lower.permeability
  if (frequencyHz >= upper.frequency) return upper.permeability

  // Linear interpolation on log scale
  const logFreq = Math.log10(frequencyHz)
  const logLower = Math.log10(lower.frequency)
  const logUpper = Math.log10(upper.frequency)
  const frac = (logFreq - logLower) / (logUpper - logLower)
  return lower.permeability + frac * (upper.permeability - lower.permeability)
}

// Calculate core loss
function calculateCoreLoss(material: FerriteMaterial, power: number, fluxDensity: number): number {
  // Simplified core loss calculation
  const baseLoss = 0.01 // W/kg at 100 kHz, 0.1T
  const density = 4800 // kg/m³
  const coreVolume = ferriteData[material].coreGeometries['FT-140'].volume
  const mass = density * coreVolume

  // Scale with power and flux density (simplified)
  return baseLoss * mass * (power / 100) * (fluxDensity / 0.1)
}

// Calculate single balun
function calculateSingleBalun(
  inputImpedance: number,
  outputImpedance: number,
  material: FerriteMaterial,
  coreSize: CoreSize,
  wireType: WireType,
  powerRating: number,
  ambientTemperature: number
): BalunSolution {
  const ferrite = ferriteData[material]
  const core = ferrite.coreGeometries[coreSize]
  const wire = wireData[wireType]
  const mu0 = 4 * Math.PI * 1e-7

  const solution: BalunSolution = {
    type: 'balun',
    inputImpedance,
    outputImpedance,
    ratio: outputImpedance / inputImpedance,
    primaryTurns: 0,
    secondaryTurns: 0,
    wireType,
    wireLength: 0,
    coreMaterial: material,
    coreSize,
    fluxDensity: 0,
    coreLoss: 0,
    temperatureRise: 0,
    isValid: true,
    warnings: [],
  }

  // Calculate minimum turns for each band
  bands.forEach((band) => {
    const freqHz = frequencyMap[band] * 1e6
    const mu = getEffectivePermeability(material, freqHz)

    // Calculate minimum inductance (4x impedance rule)
    const L_primary = (4 * inputImpedance) / (2 * Math.PI * freqHz)
    const L_secondary = (4 * outputImpedance) / (2 * Math.PI * freqHz)

    // Calculate turns using inductance formula
    const N_primary = Math.ceil(
      Math.sqrt((L_primary * core.magneticPathLength) / (mu0 * mu * core.crossSectionalArea))
    )
    const N_secondary = Math.ceil(
      Math.sqrt((L_secondary * core.magneticPathLength) / (mu0 * mu * core.crossSectionalArea))
    )

    solution.primaryTurns = Math.max(solution.primaryTurns, N_primary)
    solution.secondaryTurns = Math.max(solution.secondaryTurns, N_secondary)
  })

  // Calculate wire length (approximate)
  const turns = Math.max(solution.primaryTurns, solution.secondaryTurns)
  solution.wireLength = turns * core.magneticPathLength * 1.2 // 20% extra for lead length

  // Calculate flux density at lowest frequency (most conservative)
  const lowestFreqHz = frequencyMap['160m'] * 1e6
  const muLow = getEffectivePermeability(material, lowestFreqHz)
  const current = Math.sqrt(powerRating / inputImpedance)
  solution.fluxDensity = (mu0 * muLow * solution.primaryTurns * current) / core.magneticPathLength

  // Check saturation
  if (solution.fluxDensity > ferrite.saturationFluxDensity) {
    solution.isValid = false
    solution.warnings.push(
      `Core saturation (${solution.fluxDensity.toFixed(3)}T > ${ferrite.saturationFluxDensity}T)`
    )
  }

  // Calculate core loss
  solution.coreLoss = calculateCoreLoss(material, powerRating, solution.fluxDensity)

  // Calculate temperature rise
  solution.temperatureRise = solution.coreLoss * core.thermalResistance
  if (ambientTemperature + solution.temperatureRise > ferrite.maxOperatingTemperature) {
    solution.warnings.push(
      `Temperature exceeds maximum (${(ambientTemperature + solution.temperatureRise).toFixed(1)}°C > ${
        ferrite.maxOperatingTemperature
      }°C)`
    )
  }

  // Check wire current rating
  if (current > wire.maxCurrent) {
    solution.warnings.push(`Current exceeds wire rating (${current.toFixed(2)}A > ${wire.maxCurrent}A)`)
  }

  return solution
}

// Calculate UNUN
function calculateUnun(
  inputImpedance: number,
  outputImpedance: number,
  material: FerriteMaterial,
  coreSize: CoreSize,
  wireType: WireType,
  powerRating: number,
  ambientTemperature: number
): BalunSolution {
  // Similar to balun calculation but without characteristic impedance constraints
  const unun = calculateSingleBalun(
    inputImpedance,
    outputImpedance,
    material,
    coreSize,
    wireType,
    powerRating,
    ambientTemperature
  )
  unun.type = 'unun'
  return unun
}

// Create hybrid solution
function createHybridSolution(
  outputImpedance: number,
  inputImpedance: number,
  material: FerriteMaterial,
  coreSize: CoreSize,
  wireType: WireType,
  powerRating: number,
  ambientTemperature: number
): BalunSolution {
  const solutions: BalunSolution[] = []

  // Try both possible balun configurations (50Ω and 100Ω)
  for (const balunZwire of [50, 100] as const) {
    const balunOutput = balunZwire
    const ununRatio = outputImpedance / balunOutput

    // Skip impractical ratios
    if (ununRatio < 0.25 || ununRatio > 4) continue

    // Calculate 1:1 balun part
    const balun = calculateSingleBalun(
      balunZwire,
      balunZwire,
      material,
      coreSize,
      wireType,
      powerRating,
      ambientTemperature
    )

    // Calculate UNUN part
    const unun = calculateUnun(
      balunZwire,
      outputImpedance,
      material,
      coreSize,
      wireType,
      powerRating,
      ambientTemperature
    )

    // Create hybrid solution
    const hybrid: BalunSolution = {
      type: 'hybrid',
      inputImpedance,
      outputImpedance,
      ratio: outputImpedance / inputImpedance,
      primaryTurns: balun.primaryTurns + unun.primaryTurns,
      secondaryTurns: balun.secondaryTurns + unun.secondaryTurns,
      wireType,
      wireLength: balun.wireLength + unun.wireLength,
      coreMaterial: material,
      coreSize,
      fluxDensity: Math.max(balun.fluxDensity, unun.fluxDensity),
      coreLoss: balun.coreLoss + unun.coreLoss,
      temperatureRise: balun.temperatureRise + unun.temperatureRise,
      isValid: balun.isValid && unun.isValid,
      warnings: [...balun.warnings, ...unun.warnings],
      components: [balun, unun],
    }

    solutions.push(hybrid)
  }

  // Select best solution (prioritize valid solutions, then fewer turns)
  let bestSolution = solutions
    .filter((s) => s.isValid)
    .sort((a, b) => a.primaryTurns + a.secondaryTurns - (b.primaryTurns + b.secondaryTurns))[0]

  if (!bestSolution) {
    // Fallback to first solution if no valid ones found
    bestSolution = solutions[0] || {
      type: 'hybrid',
      inputImpedance,
      outputImpedance,
      ratio: outputImpedance / inputImpedance,
      primaryTurns: 0,
      secondaryTurns: 0,
      wireType,
      wireLength: 0,
      coreMaterial: material,
      coreSize,
      fluxDensity: 0,
      coreLoss: 0,
      temperatureRise: 0,
      isValid: false,
      warnings: ['No valid hybrid solution found'],
      components: [],
    }
  }

  return bestSolution
}

// Format number with units
function formatWithUnits(value: number, unit: string, decimals: number = 2): string {
  return `${value.toFixed(decimals)} ${unit}`
}
</script>

<template>
  <div class="balun-calculator">
    <MathJaxLoader />
    
    <div class="calculator-description">
      <p>
        This calculator helps you design baluns and ununs for impedance transformation in RF systems.
        It calculates the required number of turns, wire length, and checks for core saturation and temperature rise.
      </p>
    </div>

    <div class="calculator-form">
      <div class="form-section">
        <h3>Balun Type</h3>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="calculatorType" value="balun" />
            <span>Balun (Balanced-Unbalanced)</span>
          </label>
          <label>
            <input type="radio" v-model="calculatorType" value="unun" />
            <span>Unun (Unbalanced-Unbalanced)</span>
          </label>
          <label>
            <input type="radio" v-model="calculatorType" value="hybrid" />
            <span>Hybrid Solution</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Impedance</h3>
        <div class="form-row">
          <label>
            Input Impedance (Ω):
            <input type="number" v-model.number="inputImpedance" min="1" max="1000" />
          </label>
        </div>
        <div class="form-row">
          <label>
            Output Impedance (Ω):
            <input type="number" v-model.number="outputImpedance" min="1" max="1000" />
          </label>
        </div>
        <div class="form-row">
          <label>
            Impedance Ratio:
            <input type="text" :value="impedanceRatio.toFixed(2)" disabled />
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Core Properties</h3>
        <div class="form-row">
          <label>
            Ferrite Material:
            <select v-model="material">
              <option value="#31">Type 31</option>
              <option value="#43">Type 43</option>
            </select>
          </label>
        </div>
        <div class="form-row">
          <label>
            Core Size:
            <select v-model="coreSize">
              <option value="FT-140">FT-140</option>
              <option value="FT-240">FT-240</option>
            </select>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Wire Properties</h3>
        <div class="form-row">
          <label>
            Wire Type:
            <select v-model="wireType">
              <option value="coax">Coaxial Cable (50Ω)</option>
              <option value="magnet_twin">Magnet Wire Twin Lead (50Ω)</option>
              <option value="teflon_tube">Teflon Tube Wire (100Ω)</option>
            </select>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Operating Conditions</h3>
        <div class="form-row">
          <label>
            Power Rating (W):
            <input type="number" v-model.number="powerRating" min="1" max="2000" />
          </label>
        </div>
        <div class="form-row">
          <label>
            Ambient Temperature (°C):
            <input type="number" v-model.number="ambientTemperature" min="-20" max="50" />
          </label>
        </div>
      </div>
    </div>

    <div class="results-section" v-if="solution">
      <h3>Balun Design Results</h3>
      
      <div class="warning-messages" v-if="solution.warnings.length > 0">
        <h4>Warnings:</h4>
        <ul>
          <li v-for="(warning, index) in solution.warnings" :key="index" class="warning">
            {{ warning }}
          </li>
        </ul>
      </div>
      
      <div class="results-grid">
        <div class="result-item">
          <span class="result-label">Type:</span>
          <span class="result-value">{{ solution.type.charAt(0).toUpperCase() + solution.type.slice(1) }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Impedance Ratio:</span>
          <span class="result-value">{{ solution.ratio.toFixed(2) }}:1</span>
        </div>
        <div class="result-item">
          <span class="result-label">Primary Turns:</span>
          <span class="result-value">{{ solution.primaryTurns }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Secondary Turns:</span>
          <span class="result-value">{{ solution.secondaryTurns }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Wire Length:</span>
          <span class="result-value">{{ formatWithUnits(solution.wireLength, 'm') }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Flux Density:</span>
          <span class="result-value" :class="{ 'warning-value': solution.fluxDensity > ferriteData[solution.coreMaterial].saturationFluxDensity }">
            {{ formatWithUnits(solution.fluxDensity, 'T', 3) }}
          </span>
        </div>
        <div class="result-item">
          <span class="result-label">Core Loss:</span>
          <span class="result-value">{{ formatWithUnits(solution.coreLoss, 'W') }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Temperature Rise:</span>
          <span class="result-value" :class="{ 'warning-value': solution.temperatureRise + ambientTemperature > ferriteData[solution.coreMaterial].maxOperatingTemperature }">
            {{ formatWithUnits(solution.temperatureRise, '°C') }}
          </span>
        </div>
        <div class="result-item">
          <span class="result-label">Final Temperature:</span>
          <span class="result-value" :class="{ 'warning-value': solution.temperatureRise + ambientTemperature > ferriteData[solution.coreMaterial].maxOperatingTemperature }">
            {{ formatWithUnits(solution.temperatureRise + ambientTemperature, '°C') }}
          </span>
        </div>
      </div>
      
      <!-- Hybrid solution components -->
      <div v-if="solution.type === 'hybrid' && solution.components && solution.components.length > 0" class="hybrid-components">
        <h4>Hybrid Solution Components</h4>
        
        <div v-for="(component, index) in solution.components" :key="index" class="component-details">
          <h5>Component {{ index + 1 }}: {{ component.type.charAt(0).toUpperCase() + component.type.slice(1) }}</h5>
          
          <div class="results-grid">
            <div class="result-item">
              <span class="result-label">Input Impedance:</span>
              <span class="result-value">{{ component.inputImpedance }}Ω</span>
            </div>
            <div class="result-item">
              <span class="result-label">Output Impedance:</span>
              <span class="result-value">{{ component.outputImpedance }}Ω</span>
            </div>
            <div class="result-item">
              <span class="result-label">Primary Turns:</span>
              <span class="result-value">{{ component.primaryTurns }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">Secondary Turns:</span>
              <span class="result-value">{{ component.secondaryTurns }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="theory-section">
      <h3>Theory and Formulas</h3>
      <div class="formula-block">
        <p>The minimum number of turns for a balun is calculated using the inductance formula:</p>
        <p class="formula">$$L = \frac{\mu_0 \mu_r N^2 A}{l}$$</p>
        <p>Where:</p>
        <ul>
          <li>\(L\) is the inductance (H)</li>
          <li>\(\mu_0\) is the permeability of free space (\(4\pi \times 10^{-7}\) H/m)</li>
          <li>\(\mu_r\) is the relative permeability of the core material</li>
          <li>\(N\) is the number of turns</li>
          <li>\(A\) is the cross-sectional area of the core (m²)</li>
          <li>\(l\) is the magnetic path length (m)</li>
        </ul>
        
        <p>For proper operation, the reactance should be at least 4 times the impedance at the lowest frequency:</p>
        <p class="formula">$$X_L = 2\pi f L \geq 4Z$$</p>
        
        <p>The flux density in the core is calculated as:</p>
        <p class="formula">$$B = \frac{\mu_0 \mu_r N I}{l}$$</p>
        <p>Where \(I\) is the current through the winding.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.balun-calculator {
  max-width: 100%;
  margin: 0 auto;
}

.calculator-description {
  margin-bottom: 2rem;
  background-color: var(--color-background-soft);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid hsla(160, 100%, 37%, 1);
}

.calculator-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-section {
  background-color: var(--color-background-soft);
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
}

.form-row input,
.form-row select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
}

.form-row input:disabled {
  background-color: var(--color-background-mute);
  color: var(--color-text-light);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.results-section {
  background-color: var(--color-background-soft);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.results-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.warning-messages {
  background-color: rgba(255, 200, 0, 0.1);
  border-left: 4px solid #ffc800;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.warning-messages h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #b38600;
}

.warning-messages ul {
  margin: 0;
  padding-left: 1.5rem;
}

.warning {
  color: #b38600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background-color: var(--color-background-mute);
  border-radius: 4px;
}

.result-label {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.result-value {
  font-weight: bold;
  font-size: 1.1rem;
}

.warning-value {
  color: #e74c3c;
}

.hybrid-components {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--color-border);
}

.hybrid-components h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.component-details {
  background-color: var(--color-background-mute);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.component-details h5 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.theory-section {
  background-color: var(--color-background-soft);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.theory-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.formula-block {
  background-color: var(--color-background-mute);
  padding: 1.25rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.formula {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .calculator-form {
    grid-template-columns: 1fr;
  }
  
  .results-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-row label {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-row input,
  .form-row select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>
