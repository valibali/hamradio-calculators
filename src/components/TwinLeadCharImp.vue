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
      activeTab: 'impedance',
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

      const D = 2 * wireRadius + 2 * insulationThickness + airGap
      const epsilonEff = this.calculateEffectivePermittivity(insulationThickness, airGap, epsilonR)
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
      return numerator / denominator
    },

    calculateRequiredAirGap(
      wireRadius: number,
      insulationThickness: number,
      epsilonR: number,
      targetImpedance: number,
    ): number {
      // Binary search parameters
      const precision = 0.001 // mm
      const maxIterations = 100
      let low = 0
      let high = 10 * wireRadius // Upper bound (10x wire radius)
      let bestGuess = (low + high) / 2

      for (let i = 0; i < maxIterations; i++) {
        const mid = (low + high) / 2
        const currentZ0 = this.calculateCharacteristicImpedance(
          wireRadius,
          insulationThickness,
          mid,
          epsilonR,
        )

        if (Math.abs(currentZ0 - targetImpedance) < 0.1) {
          return Math.round(mid / precision) * precision // Return with 0.001mm precision
        }

        if (currentZ0 < targetImpedance) {
          low = mid // Need larger air gap
        } else {
          high = mid // Need smaller air gap
        }

        bestGuess = mid
      }

      return Math.round(bestGuess * 1000) / 1000 // Return best guess if not converged
    },
  },
}
</script>

<template>
  <div>
    <!-- Added Introduction -->
    <div class="calculator-introduction">
      <h2>Twin Lead Wire Calculator: Building Better RF Transformers</h2>

      <p>
        This calculator helps you design and build precision transmission lines using common magnet
        wire, which is essential for creating high-performance impedance transformers like baluns
        and ununs in RF applications.
      </p>

      <div class="diagram-container">
        <img src="@/components/diagrams/twinlead.svg" alt="Twin Lead Wire Configuration" class="diagram" />
      </div>

      <div class="introduction-details">
        <h3>Why This Calculator Matters</h3>

        <p>
          When building RF transformers such as baluns (balanced-to-unbalanced) or ununs
          (unbalanced-to-unbalanced), the characteristic impedance of the transmission line is
          critical. These transformers don't just rely on magnetic coupling - they function because
          the wire itself forms a transmission line with a specific impedance when wound around the
          core.
        </p>

        <p>The impedance of this transmission line directly affects:</p>

        <ul>
          <li>Power handling capability</li>
          <li>Frequency response and bandwidth</li>
          <li>Insertion loss and SWR</li>
          <li>Overall performance of your antenna system</li>
        </ul>

        <p>
          By precisely controlling the spacing between wires and selecting appropriate insulation
          materials, you can create transmission lines with exact impedance values (commonly 50Ω,
          75Ω, or 100Ω) to match your system requirements.
        </p>

        <p>
          Whether you're building a 4:1 current balun, a 9:1 unun for an end-fed antenna, or
          experimenting with custom impedance ratios, this calculator helps you achieve the exact
          characteristic impedance needed for optimal performance.
        </p>
        
        <div class="formula-button-container">
          <router-link to="/formulas?calculator=twinlead" class="formula-button">
            View Mathematical Formulas
          </router-link>
        </div>
      </div>
    </div>

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
    </div>
  </div>
</template>

<style scoped>
h2 {
  color: var(--color-heading);
  margin-bottom: 1rem;
}

h3 {
  color: var(--color-heading);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

/* Added introduction styles */
.calculator-introduction {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border-left: 4px solid hsla(160, 100%, 37%, 0.8);
}

.diagram-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.diagram {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.introduction-details {
  margin-top: 1.5rem;
}

.introduction-details ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.introduction-details li {
  margin-bottom: 0.5rem;
}

.formula-button-container {
  margin-top: 1.5rem;
  text-align: center;
}

.formula-button {
  display: inline-block;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.2s, transform 0.2s;
}

.formula-button:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
  transform: translateY(-2px);
}

.formula-button:active {
  transform: translateY(0);
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
