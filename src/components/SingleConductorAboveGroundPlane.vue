<script lang="ts">
import { RouterLink } from 'vue-router'

export default {
  name: 'SingleConductorAboveGroundPlane',
  components: {
    RouterLink,
  },
  data() {
    return {
      conductorDiameter: 1.0,
      heightAboveGround: 10.0,
      dielectricConstant: 1.0,
      targetImpedance: 50,
      activeTab: 'impedance',
    }
  },
  computed: {
    conductorRadius() {
      return this.conductorDiameter / 2
    },
    impedance() {
      if (this.conductorDiameter <= 0 || this.heightAboveGround <= 0) return 0
      const ratio = (2 * this.heightAboveGround) / this.conductorRadius
      return Math.round(((138 / Math.sqrt(this.dielectricConstant)) * Math.log10(ratio)) * 100) / 100
    },
    calculatedHeight() {
      if (this.conductorDiameter <= 0 || this.targetImpedance <= 0) return 0
      const term = Math.pow(10, (this.targetImpedance * Math.sqrt(this.dielectricConstant)) / 138)
      return Math.round(((term * this.conductorRadius) / 2) * 1000) / 1000
    },
  },
}
</script>

<template>
  <div>
    <!-- Introduction -->
    <div class="calculator-introduction">
      <h2>Single Conductor Above Ground Plane Calculator</h2>

      <p>
        This calculator helps you determine the characteristic impedance of a single conductor
        transmission line above a ground plane, which is useful for microstrip lines, antenna feed
        systems, and other RF applications.
      </p>

      <div class="introduction-details">
        <h3>Applications</h3>

        <p>
          Single conductor transmission lines above a ground plane are commonly used in:
        </p>

        <ul>
          <li>Microstrip PCB designs</li>
          <li>Open-wire feed lines</li>
          <li>Antenna matching sections</li>
          <li>RF test fixtures</li>
        </ul>

        <p>
          The impedance of this transmission line is determined by the conductor diameter, 
          height above the ground plane, and the dielectric constant of the material between
          the conductor and ground.
        </p>
        
        <div class="formula-button-container">
          <router-link to="/formulas?calculator=singleconductor" class="formula-button">
            View Mathematical Formulas
          </router-link>
        </div>
      </div>
    </div>

    <h2>Single Conductor Above Ground Plane</h2>
    <p class="calculator-description">
      Calculate the characteristic impedance (Z₀) of a single conductor above a ground plane
      based on conductor size, height, and dielectric constant.
    </p>

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
        :class="{ active: activeTab === 'height' }"
        @click="activeTab = 'height'"
      >
        Calculate Height
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Impedance Calculator Tab -->
      <div v-if="activeTab === 'impedance'" class="tab-pane">
        <div class="calculator-form">
          <div class="form-group">
            <label for="conductor-diameter">Conductor Diameter (mm):</label>
            <input type="number" id="conductor-diameter" v-model="conductorDiameter" min="0.1" step="0.1" />
          </div>
          <div class="form-group">
            <label for="height-above-ground">Height Above Ground (mm):</label>
            <input type="number" id="height-above-ground" v-model="heightAboveGround" min="0.1" step="0.1" />
          </div>
          <div class="form-group">
            <label for="dielectric-constant">Dielectric Constant (ε):</label>
            <input type="number" id="dielectric-constant" v-model="dielectricConstant" min="1" step="0.1" />
          </div>
        </div>

        <div class="result">
          <h3>Characteristic Impedance (Z₀):</h3>
          <div class="impedance-value">{{ impedance }} Ω</div>

          <div class="parameters">
            <div class="parameter">
              <span class="parameter-label">Conductor Radius:</span>
              <span class="parameter-value">{{ conductorRadius }} mm</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Height/Radius Ratio:</span>
              <span class="parameter-value">{{ ((2 * heightAboveGround) / conductorRadius).toFixed(2) }}</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Dielectric Constant (ε):</span>
              <span class="parameter-value">{{ dielectricConstant }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Height Calculator Tab -->
      <div v-if="activeTab === 'height'" class="tab-pane">
        <div class="calculator-form">
          <div class="form-group">
            <label for="conductor-diameter-height">Conductor Diameter (mm):</label>
            <input type="number" id="conductor-diameter-height" v-model="conductorDiameter" min="0.1" step="0.1" />
          </div>
          <div class="form-group">
            <label for="target-impedance">Target Impedance (Ω):</label>
            <input type="number" id="target-impedance" v-model="targetImpedance" min="1" step="1" />
          </div>
          <div class="form-group">
            <label for="dielectric-constant-height">Dielectric Constant (ε):</label>
            <input type="number" id="dielectric-constant-height" v-model="dielectricConstant" min="1" step="0.1" />
          </div>
        </div>

        <div class="result">
          <h3>Required Height Above Ground:</h3>
          <div class="impedance-value">{{ calculatedHeight }} mm</div>

          <div class="parameters">
            <div class="parameter">
              <span class="parameter-label">Conductor Radius:</span>
              <span class="parameter-value">{{ conductorRadius }} mm</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Target Impedance:</span>
              <span class="parameter-value">{{ targetImpedance }} Ω</span>
            </div>
            <div class="parameter">
              <span class="parameter-label">Dielectric Constant (ε):</span>
              <span class="parameter-value">{{ dielectricConstant }}</span>
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

/* Introduction styles */
.calculator-introduction {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border-left: 4px solid hsla(160, 100%, 37%, 0.8);
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

@media (min-width: 768px) {
  .calculator-form {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
