<script setup lang="ts">
import { ref, computed } from 'vue'

// Define wire diameter options in mm
const wireDiameters = [
  { value: 0.1, label: '0.1 mm' },
  { value: 0.2, label: '0.2 mm' },
  { value: 0.3, label: '0.3 mm' },
  { value: 0.4, label: '0.4 mm' },
  { value: 0.5, label: '0.5 mm' },
  { value: 0.6, label: '0.6 mm' },
  { value: 0.8, label: '0.8 mm' },
  { value: 1.0, label: '1.0 mm' },
  { value: 1.2, label: '1.2 mm' },
  { value: 1.5, label: '1.5 mm' },
  { value: 2.0, label: '2.0 mm' }
]

// Define winding types
const windingTypes = [
  { value: 1, label: 'Single Wire', spacing: 1.0 },
  { value: 2, label: 'Bifilar', spacing: 2.1 },
  { value: 3, label: 'Trifilar', spacing: 3.2 },
  { value: 4, label: 'Twisted Pair', spacing: 2.0 }
]

// Define insulation types with their thickness factors
const insulationTypes = [
  { value: 'enamel', label: 'Enamel Coating', thickness: 0.05 },
  { value: 'ptfe', label: 'PTFE Tubing', thickness: 0.2 },
  { value: 'silicon', label: 'Silicon Tubing', thickness: 0.3 }
]

// Form inputs
const selectedDiameter = ref(wireDiameters[3].value) // Default to 0.4mm
const selectedWindingType = ref(windingTypes[0].value) // Default to Single Wire
const selectedInsulation = ref(insulationTypes[0].value) // Default to Enamel

// Calculate the characteristic impedance
// Formula: Z0 = 276 * log10(2s/d)
// Where s is the spacing between conductors and d is the diameter including insulation
const impedance = computed(() => {
  const diameter = selectedDiameter.value
  const windingType = windingTypes.find(w => w.value === selectedWindingType.value)
  const insulation = insulationTypes.find(i => i.value === selectedInsulation.value)
  
  if (!windingType || !insulation) return 0
  
  // Calculate effective diameter with insulation
  const effectiveDiameter = diameter + (2 * insulation.thickness)
  
  // Calculate spacing based on winding type and diameter
  const spacing = windingType.spacing * effectiveDiameter
  
  // Apply the formula Z0 = 276 * log10(2s/d)
  const impedanceValue = 276 * Math.log10(2 * spacing / effectiveDiameter)
  
  return Math.round(impedanceValue * 100) / 100 // Round to 2 decimal places
})
</script>

<template>
  <div class="calculator-container">
    <h2>Characteristic Impedance Calculator</h2>
    <p class="calculator-description">
      Calculate the characteristic impedance (Z₀) of magnet wires based on diameter, winding type, and insulation.
    </p>
    
    <div class="calculator-form">
      <div class="form-group">
        <label for="wire-diameter">Wire Diameter:</label>
        <select id="wire-diameter" v-model="selectedDiameter">
          <option v-for="option in wireDiameters" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="winding-type">Winding Type:</label>
        <select id="winding-type" v-model="selectedWindingType">
          <option v-for="option in windingTypes" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="insulation-type">Insulation Type:</label>
        <select id="insulation-type" v-model="selectedInsulation">
          <option v-for="option in insulationTypes" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="result">
      <h3>Characteristic Impedance (Z₀):</h3>
      <div class="impedance-value">{{ impedance }} Ω</div>
      <p class="formula">Formula: Z₀ = 276 × log₁₀(2s/d)</p>
      <p class="formula-explanation">Where s is the spacing between conductors and d is the wire diameter including insulation</p>
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

label {
  font-weight: bold;
  color: var(--color-heading);
}

select {
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

.formula {
  font-style: italic;
  margin-bottom: 0.5rem;
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
