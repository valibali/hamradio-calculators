<script setup lang="ts">
import { ref, computed } from 'vue'

// Define AWG wire options with their bare diameters in mm
const wireOptions = [
  { value: 'awg15', label: 'AWG 15', diameter: 1.450, radius: 0.725 },
  { value: 'awg16', label: 'AWG 16', diameter: 1.291, radius: 0.6455 },
  { value: 'awg18', label: 'AWG 18', diameter: 1.024, radius: 0.512 },
  { value: 'custom', label: 'Custom Diameter', diameter: 1.0, radius: 0.5 }
]

// Define insulation types with their permittivity
const insulationTypes = [
  { value: 'polyimide', label: 'Polyimide Enamel', permittivity: 3.5, thickness: 0.05 },
  { value: 'ptfe', label: 'PTFE', permittivity: 2.1, thickness: 0.1 },
  { value: 'pvc', label: 'PVC', permittivity: 3.0, thickness: 0.15 },
  { value: 'custom', label: 'Custom Insulation', permittivity: 3.5, thickness: 0.05 }
]

// Form inputs
const selectedWire = ref(wireOptions[0].value) // Default to AWG 15
const selectedInsulation = ref(insulationTypes[0].value) // Default to Polyimide Enamel
const customDiameter = ref(1.0) // mm
const customInsulationThickness = ref(0.05) // mm
const customPermittivity = ref(3.5)
const targetImpedance = ref(50) // Ohms
const airGap = ref(0.1) // mm

// Get the selected wire and insulation objects
const selectedWireObj = computed(() => {
  return wireOptions.find(w => w.value === selectedWire.value) || wireOptions[0]
})

const selectedInsulationObj = computed(() => {
  return insulationTypes.find(i => i.value === selectedInsulation.value) || insulationTypes[0]
})

// Get the effective wire radius (considering custom values if selected)
const wireRadius = computed(() => {
  if (selectedWire.value === 'custom') {
    return customDiameter.value / 2
  }
  return selectedWireObj.value.radius
})

// Get the insulation thickness (considering custom values if selected)
const insulationThickness = computed(() => {
  if (selectedInsulation.value === 'custom') {
    return customInsulationThickness.value
  }
  return selectedInsulationObj.value.thickness
})

// Get the insulation permittivity (considering custom values if selected)
const permittivity = computed(() => {
  if (selectedInsulation.value === 'custom') {
    return customPermittivity.value
  }
  return selectedInsulationObj.value.permittivity
})

// Calculate center-to-center distance (D)
const centerToCenter = computed(() => {
  // D = 2a + 2t + s (2 * wire radius + 2 * insulation thickness + air gap)
  return 2 * wireRadius.value + 2 * insulationThickness.value + airGap.value
})

// Calculate effective permittivity
const effectivePermittivity = computed(() => {
  // Total insulation thickness: 2t + s (enamel on both wires + air gap)
  const totalInsulation = 2 * insulationThickness.value + airGap.value
  
  // Effective permittivity calculation
  // εeff = Total Insulation / ((Enamel Thickness / εr) + (Air Gap / 1))
  const effectivePerm = totalInsulation / 
    ((2 * insulationThickness.value / permittivity.value) + airGap.value)
  
  return Math.round(effectivePerm * 100) / 100 // Round to 2 decimal places
})

// Calculate the characteristic impedance
const impedance = computed(() => {
  // Z0 = (120 / √εeff) * arccosh(D/2a)
  const ratio = centerToCenter.value / (2 * wireRadius.value)
  const arccosh = Math.log(ratio + Math.sqrt(ratio * ratio - 1))
  
  const impedanceValue = (120 / Math.sqrt(effectivePermittivity.value)) * arccosh
  
  return Math.round(impedanceValue * 100) / 100 // Round to 2 decimal places
})

// Calculate required air gap for target impedance
const calculatedAirGap = computed(() => {
  // Solve for s using the target impedance
  // First, calculate the required effective permittivity
  const arccosh = Math.log(centerToCenter.value / (2 * wireRadius.value) + 
    Math.sqrt(Math.pow(centerToCenter.value / (2 * wireRadius.value), 2) - 1))
  
  const requiredEffPerm = Math.pow((120 / targetImpedance.value) * arccosh, 2)
  
  // Then solve for s using the effective permittivity formula
  // s = (2t * εeff / (εr - εeff)) - (2t / εr)
  const t = insulationThickness.value
  const er = permittivity.value
  
  const gap = ((2 * t * requiredEffPerm) / (er - requiredEffPerm)) - ((2 * t) / er)
  
  return Math.max(0, Math.round(gap * 1000) / 1000) // Round to 3 decimal places, minimum 0
})
</script>

<template>
  <div class="calculator-container">
    <h2>Characteristic Impedance Calculator</h2>
    <p class="calculator-description">
      Calculate the characteristic impedance (Z₀) of parallel magnet wire pairs based on wire size, insulation, and air gap.
    </p>
    
    <div class="calculator-form">
      <div class="form-group">
        <label for="wire-type">Wire Size:</label>
        <select id="wire-type" v-model="selectedWire">
          <option v-for="option in wireOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <div v-if="selectedWire === 'custom'" class="custom-input">
          <label for="custom-diameter">Custom Diameter (mm):</label>
          <input type="number" id="custom-diameter" v-model="customDiameter" min="0.1" step="0.1" />
        </div>
      </div>
      
      <div class="form-group">
        <label for="insulation-type">Insulation Type:</label>
        <select id="insulation-type" v-model="selectedInsulation">
          <option v-for="option in insulationTypes" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <div v-if="selectedInsulation === 'custom'" class="custom-input">
          <label for="custom-thickness">Thickness (mm):</label>
          <input type="number" id="custom-thickness" v-model="customInsulationThickness" min="0.01" step="0.01" />
          
          <label for="custom-permittivity">Relative Permittivity (εᵣ):</label>
          <input type="number" id="custom-permittivity" v-model="customPermittivity" min="1" step="0.1" />
        </div>
      </div>
      
      <div class="form-group">
        <label for="air-gap">Air Gap (mm):</label>
        <input type="number" id="air-gap" v-model="airGap" min="0" step="0.01" />
      </div>
    </div>
    
    <div class="result">
      <h3>Characteristic Impedance (Z₀):</h3>
      <div class="impedance-value">{{ impedance }} Ω</div>
      
      <div class="parameters">
        <div class="parameter">
          <span class="parameter-label">Wire Radius (a):</span>
          <span class="parameter-value">{{ wireRadius }} mm</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Center-to-Center Distance (D):</span>
          <span class="parameter-value">{{ centerToCenter }} mm</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Effective Permittivity (εₑff):</span>
          <span class="parameter-value">{{ effectivePermittivity }}</span>
        </div>
      </div>
      
      <div class="target-impedance">
        <h4>Air Gap Calculator</h4>
        <div class="target-form">
          <label for="target-impedance">Target Impedance (Ω):</label>
          <input type="number" id="target-impedance" v-model="targetImpedance" min="1" step="1" />
        </div>
        <div class="calculated-gap">
          <span>Required Air Gap:</span>
          <span class="gap-value">{{ calculatedAirGap }} mm</span>
        </div>
      </div>
      
      <p class="formula">Formula: Z₀ = (120 / √εₑff) × arccosh(D/2a)</p>
      <p class="formula-explanation">Where D is center-to-center distance, a is wire radius, and εₑff is effective permittivity</p>
    </div>
  </div>
</template>

<style scoped>
.calculator-container {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.calculator-description {
  margin-bottom: 2rem;
  color: var(--color-text);
}

.calculator-form {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-input {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-background-mute);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: bold;
  color: var(--color-heading);
}

select, input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.result {
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 6px;
  text-align: center;
}

.impedance-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: hsla(160, 100%, 37%, 1);
  margin: 1rem 0;
}

.parameters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: var(--color-background);
  border-radius: 4px;
}

.parameter {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.parameter-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.parameter-value {
  font-weight: bold;
}

.target-impedance {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background);
  border-radius: 4px;
}

.target-impedance h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.target-form {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.calculated-gap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.gap-value {
  font-weight: bold;
  color: hsla(160, 100%, 37%, 1);
}

.formula {
  font-style: italic;
  margin-bottom: 0.5rem;
  margin-top: 1.5rem;
}

.formula-explanation {
  font-size: 0.9rem;
  color: var(--color-text-light-2);
}

@media (min-width: 768px) {
  .calculator-form {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
