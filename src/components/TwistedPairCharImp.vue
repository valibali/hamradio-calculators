<script lang="ts">
import { RouterLink } from 'vue-router'

export default {
  name: 'TwistedPairCharImp',
  components: {
    RouterLink
  },
  
  data() {
    return {
      // Define AWG wire options with their bare diameters in mm
      wireOptions: [
        { value: 'awg22', label: 'AWG 22', diameter: 0.644 },
        { value: 'awg24', label: 'AWG 24', diameter: 0.511 },
        { value: 'awg26', label: 'AWG 26', diameter: 0.405 },
        { value: 'custom', label: 'Custom Diameter', diameter: 0.5 }
      ],
      
      // Define insulation types with their permittivity
      insulationTypes: [
        { value: 'polyimide', label: 'Polyimide Enamel', permittivity: 3.5, thickness: 0.03 },
        { value: 'ptfe', label: 'PTFE', permittivity: 2.1, thickness: 0.1 },
        { value: 'pvc', label: 'PVC', permittivity: 3.0, thickness: 0.15 },
        { value: 'custom', label: 'Custom Insulation', permittivity: 3.5, thickness: 0.03 }
      ],
      
      // Form inputs
      selectedWire: 'awg24', // Default to AWG 24
      selectedInsulation: 'polyimide', // Default to Polyimide Enamel
      customDiameter: 0.5, // mm
      customInsulationThickness: 0.03, // mm
      customPermittivity: 3.5,
      twistPitch: 10, // mm
      twistTightness: 'medium' // loose, medium, tight
    }
  },
  
  computed: {
    // Get the selected wire and insulation objects
    selectedWireObj() {
      return this.wireOptions.find(w => w.value === this.selectedWire) || this.wireOptions[0]
    },
    
    selectedInsulationObj() {
      return this.insulationTypes.find(i => i.value === this.selectedInsulation) || this.insulationTypes[0]
    },
    
    // Get the wire diameter (considering custom values if selected)
    wireDiameter() {
      if (this.selectedWire === 'custom') {
        return this.customDiameter
      }
      return this.selectedWireObj.diameter
    },
    
    // Get the wire radius
    wireRadius() {
      return this.wireDiameter / 2
    },
    
    // Get the insulation thickness (considering custom values if selected)
    insulationThickness() {
      if (this.selectedInsulation === 'custom') {
        return this.customInsulationThickness
      }
      return this.selectedInsulationObj.thickness
    },
    
    // Get the insulation permittivity (considering custom values if selected)
    permittivity() {
      if (this.selectedInsulation === 'custom') {
        return this.customPermittivity
      }
      return this.selectedInsulationObj.permittivity
    },
    
    // Calculate effective radius including insulation
    effectiveRadius() {
      return this.wireRadius + this.insulationThickness
    },
    
    // Calculate center-to-center spacing based on twist pitch
    centerToCenter() {
      return this.twistPitch / Math.PI
    },
    
    // Calculate spacing to radius ratio
    spacingRatio() {
      return this.centerToCenter / this.effectiveRadius
    },
    
    // Calculate effective permittivity based on insulation and air
    effectivePermittivity() {
      // Adjust air gap based on twist tightness
      let airGapFactor = 1.0
      if (this.twistTightness === 'loose') {
        airGapFactor = 1.5
      } else if (this.twistTightness === 'tight') {
        airGapFactor = 0.7
      }
      
      // Simplified model: weighted average of insulation and air
      const totalThickness = 2 * this.insulationThickness + (this.centerToCenter - 2 * this.effectiveRadius) * airGapFactor
      const insulationPart = 2 * this.insulationThickness / totalThickness
      const airPart = 1 - insulationPart
      
      const effectivePerm = (insulationPart * this.permittivity) + (airPart * 1.0)
      
      return Math.round(effectivePerm * 100) / 100 // Round to 2 decimal places
    },
    
    // Calculate the arccosh term
    arccoshTerm() {
      const ratio = this.spacingRatio
      return Math.log(ratio + Math.sqrt(ratio * ratio - 1))
    },
    
    // Calculate the characteristic impedance
    impedance() {
      // Z0 = (120 / √εeff) * ln(s/r + √((s/r)² - 1))
      const impedanceValue = (120 / Math.sqrt(this.effectivePermittivity)) * this.arccoshTerm
      
      return Math.round(impedanceValue * 10) / 10 // Round to 1 decimal place
    },
    
    // Calculate twist density in Turns Per Inch (TPI)
    twistTPI() {
      return Math.round((25.4 / this.twistPitch) * 10) / 10 // Convert mm to inch and round to 1 decimal
    }
  }
}
</script>

<template>
  <div>
    <h2>Twisted Pair Magnet Wire Characteristic Impedance</h2>
    <p class="calculator-description">
      Calculate the characteristic impedance (Z₀) of twisted pair magnet wire based on wire size, insulation, and twist pitch.
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
        <label for="twist-pitch">Twist Pitch (mm):</label>
        <input type="number" id="twist-pitch" v-model="twistPitch" min="1" step="0.5" />
        
        <label for="twist-tightness">Twist Tightness:</label>
        <select id="twist-tightness" v-model="twistTightness">
          <option value="loose">Loose</option>
          <option value="medium">Medium</option>
          <option value="tight">Tight</option>
        </select>
      </div>
    </div>
    
    <div class="result">
      <h3>Characteristic Impedance (Z₀):</h3>
      <div class="impedance-value">{{ impedance }} Ω</div>
      
      <div class="parameters">
        <div class="parameter">
          <span class="parameter-label">Wire Diameter:</span>
          <span class="parameter-value">{{ wireDiameter }} mm</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Effective Radius (r):</span>
          <span class="parameter-value">{{ effectiveRadius }} mm</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Center-to-Center (s):</span>
          <span class="parameter-value">{{ centerToCenter.toFixed(2) }} mm</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Twist Density:</span>
          <span class="parameter-value">{{ twistTPI }} TPI</span>
        </div>
        <div class="parameter">
          <span class="parameter-label">Effective Permittivity (εₑff):</span>
          <span class="parameter-value">{{ effectivePermittivity }}</span>
        </div>
      </div>
      
      <p class="formula">
        <router-link to="/formulas?calculator=twistedpair">Formula: Z₀ = (120 / √εₑff) × ln(s/r + √((s/r)² - 1))</router-link>
      </p>
      <p class="formula-explanation">Where s is center-to-center spacing, r is effective radius, and εₑff is effective permittivity</p>
    </div>
  </div>
</template>

<style scoped>
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

.formula {
  font-style: italic;
  margin-bottom: 0.5rem;
  margin-top: 1.5rem;
}

.formula a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed var(--color-border);
  transition: color 0.2s;
}

.formula a:hover {
  color: hsla(160, 100%, 37%, 1);
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
