<script lang="ts">
import { RouterLink } from 'vue-router'

export default {
  name: 'TwinLeadCharImp',
  components: {
    RouterLink,
  },

  data() {
    return {
      wireOptions: [
        { value: 'awg15', label: 'AWG 15', diameter: 1.45, radius: 0.725 },
        { value: 'awg16', label: 'AWG 16', diameter: 1.291, radius: 0.6455 },
        { value: 'awg18', label: 'AWG 18', diameter: 1.024, radius: 0.512 },
        { value: 'custom', label: 'Custom Diameter', diameter: 1.0, radius: 0.5 },
      ],

      insulationTypes: [
        { value: 'polyimide', label: 'Polyimide Enamel', permittivity: 3.5, thickness: 0.05 },
        { value: 'ptfe', label: 'PTFE', permittivity: 2.1, thickness: 0.1 },
        { value: 'pvc', label: 'PVC', permittivity: 3.0, thickness: 0.15 },
        { value: 'custom', label: 'Custom Insulation', permittivity: 3.5, thickness: 0.05 },
      ],

      selectedWire: 'awg15',
      selectedInsulation: 'polyimide',
      customDiameter: 1.0,
      customInsulationThickness: 0.05,
      customPermittivity: 3.5,
      targetImpedance: 50,
      airGap: 0.1,
      activeTab: 'impedance', // Default active tab
    }
  },

  computed: {
    selectedWireObj() {
      return this.wireOptions.find((w) => w.value === this.selectedWire) || this.wireOptions[0]
    },

    selectedInsulationObj() {
      return (
        this.insulationTypes.find((i) => i.value === this.selectedInsulation) ||
        this.insulationTypes[0]
      )
    },

    wireRadius() {
      if (this.selectedWire === 'custom') {
        return this.customDiameter / 2
      }
      return this.selectedWireObj.radius
    },

    insulationThickness() {
      if (this.selectedInsulation === 'custom') {
        return this.customInsulationThickness
      }
      return this.selectedInsulationObj.thickness
    },

    permittivity() {
      if (this.selectedInsulation === 'custom') {
        return this.customPermittivity
      }
      return this.selectedInsulationObj.permittivity
    },

    centerToCenter() {
      return 2 * this.wireRadius + 2 * this.insulationThickness + this.airGap
    },

    effectivePermittivity() {
      return this.calculateEffectivePermittivity(
        this.insulationThickness,
        this.airGap,
        this.permittivity,
      )
    },

    impedance() {
      return this.calculateCharacteristicImpedance(
        this.wireRadius,
        this.insulationThickness,
        this.airGap,
        this.permittivity,
      )
    },

    calculatedAirGap() {
      return this.calculateRequiredAirGap(
        this.wireRadius,
        this.insulationThickness,
        this.permittivity,
        this.targetImpedance,
      )
    },
  },

  methods: {
    calculateCharacteristicImpedance(
      wireRadius: number,
      insulationThickness: number,
      airGap: number,
      epsilonR: number,
    ): number {
      // Validate inputs
      if (insulationThickness < 0 || airGap < 0 || epsilonR < 1) {
        return 0
      }

      // Calculate center-to-center distance
      const D = 2 * wireRadius + 2 * insulationThickness + airGap

      // Calculate effective permittivity
      const epsilonEff = this.calculateEffectivePermittivity(insulationThickness, airGap, epsilonR)

      // Calculate impedance
      const ratio = D / (2 * wireRadius)
      if (ratio < 1) return 0 // Invalid geometry

      const arccosh = Math.log(ratio + Math.sqrt(ratio * ratio - 1))
      const Z0 = (120 / Math.sqrt(epsilonEff)) * arccosh

      return Math.round(Z0 * 100) / 100
    },

    calculateEffectivePermittivity(
      insulationThickness: number,
      airGap: number,
      epsilonR: number,
    ): number {
      const numerator = 2 * insulationThickness + airGap
      const denominator = (2 * insulationThickness) / epsilonR + airGap
      const epsilonEff = numerator / denominator
      return Math.round(epsilonEff * 100) / 100
    },

    calculateRequiredAirGap(
      wireRadius: number,
      insulationThickness: number,
      epsilonR: number,
      targetImpedance: number,
    ): number {
      // First calculate required effective permittivity
      const D = 2 * wireRadius + 2 * insulationThickness // Initial D without air gap
      const ratio = D / (2 * wireRadius)

      if (ratio < 1) return 0 // Invalid geometry

      const arccosh = Math.log(ratio + Math.sqrt(ratio * ratio - 1))
      const requiredEffPerm = Math.pow((120 / targetImpedance) * arccosh, 2)

      // Then solve for air gap
      const t = insulationThickness
      const er = epsilonR

      const gap = (2 * t * requiredEffPerm) / (er - requiredEffPerm) - (2 * t) / er

      return Math.max(0, Math.round(gap * 1000) / 1000)
    },
  },
}
</script>

<template>
  <div>
    <h2>Twin Lead Magnet Wire Characteristic Impedance</h2>
    <p class="calculator-description">
      Calculate the characteristic impedance (Z₀) of parallel magnet wire pairs based on wire size,
      insulation, and air gap.
    </p>

    <!-- Common Wire and Insulation Settings -->
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
          <input
            type="number"
            id="custom-thickness"
            v-model="customInsulationThickness"
            min="0.01"
            step="0.01"
          />

          <label for="custom-permittivity">Relative Permittivity (εᵣ):</label>
          <input
            type="number"
            id="custom-permittivity"
            v-model="customPermittivity"
            min="1"
            step="0.1"
          />
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'impedance' }" 
        @click="activeTab = 'impedance'"
      >
        Calculate Impedance
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'airgap' }" 
        @click="activeTab = 'airgap'"
      >
        Calculate Air Gap
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Impedance Calculator Tab -->
      <div v-if="activeTab === 'impedance'" class="tab-pane">
        <div class="form-group">
          <label for="air-gap">Air Gap (mm):</label>
          <input type="number" id="air-gap" v-model="airGap" min="0" step="0.01" />
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
        </div>
      </div>

      <!-- Air Gap Calculator Tab -->
      <div v-if="activeTab === 'airgap'" class="tab-pane">
        <div class="form-group">
          <label for="target-impedance">Target Impedance (Ω):</label>
          <input type="number" id="target-impedance" v-model="targetImpedance" min="1" step="1" />
        </div>

        <div class="result">
          <h3>Required Air Gap:</h3>
          <div class="impedance-value">{{ calculatedAirGap }} mm</div>

          <div class="parameters">
            <div class="parameter">
              <span class="parameter-label">Wire Radius (a):</span>
              <span class="parameter-value">{{ wireRadius }} mm</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Insulation Thickness:</span>
              <span class="parameter-value">{{ insulationThickness }} mm</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Permittivity (εᵣ):</span>
              <span class="parameter-value">{{ permittivity }}</span>
            </div>
          </div>
        </div>
      </div>

      <p class="formula">
        <router-link to="/formulas?calculator=twinlead"
          >Formula: Z₀ = (120 / √εₑff) × arccosh(D/2a)</router-link
        >
      </p>
      <p class="formula-explanation">
        Where D is center-to-center distance, a is wire radius, and εₑff is effective permittivity
      </p>
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
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

select,
input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

/* Tabs styling */
.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: bold;
  color: var(--color-text);
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: hsla(160, 100%, 37%, 0.8);
}

.tab-button.active {
  color: hsla(160, 100%, 37%, 1);
  border-bottom-color: hsla(160, 100%, 37%, 1);
}

.tab-content {
  margin-top: 1rem;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result {
  background-color: var(--color-background-mute);
  padding: 1.5rem;
  border-radius: 6px;
  text-align: center;
  margin-top: 1rem;
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
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
