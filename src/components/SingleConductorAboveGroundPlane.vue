<script lang="ts">
export default {
  name: 'SingleConductorAboveGround',
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
    impedance() {
      if (this.conductorDiameter <= 0 || this.heightAboveGround <= 0) return 0
      const ratio = (4 * this.heightAboveGround) / this.conductorDiameter
      return (138 / Math.sqrt(this.dielectricConstant)) * Math.log10(ratio)
    },
    calculatedHeight() {
      if (this.conductorDiameter <= 0 || this.targetImpedance <= 0) return 0
      const term = Math.pow(10, (this.targetImpedance * Math.sqrt(this.dielectricConstant)) / 138)
      return (term * this.conductorDiameter) / 4
    },
  },
}
</script>

<template>
  <div class="calculator">
    <h2>Single Conductor Above Ground Plane</h2>
    <p>Calculates characteristic impedance for a single wire above a ground plane.</p>

    <div class="tabs">
      <button @click="activeTab = 'impedance'" :class="{ active: activeTab === 'impedance' }">
        Calculate Impedance
      </button>
      <button @click="activeTab = 'height'" :class="{ active: activeTab === 'height' }">
        Calculate Height
      </button>
    </div>

    <div v-if="activeTab === 'impedance'" class="tab-content">
      <div class="input-group">
        <label>Conductor Diameter (mm):</label>
        <input type="number" v-model="conductorDiameter" min="0.1" step="0.1" />
      </div>
      <div class="input-group">
        <label>Height Above Ground (mm):</label>
        <input type="number" v-model="heightAboveGround" min="0.1" step="0.1" />
      </div>
      <div class="input-group">
        <label>Dielectric Constant (ε):</label>
        <input type="number" v-model="dielectricConstant" min="1" step="0.1" />
      </div>

      <div class="result">
        <h3>Characteristic Impedance:</h3>
        <div class="value">{{ impedance.toFixed(2) }} Ω</div>
      </div>
    </div>

    <div v-if="activeTab === 'height'" class="tab-content">
      <div class="input-group">
        <label>Conductor Diameter (mm):</label>
        <input type="number" v-model="conductorDiameter" min="0.1" step="0.1" />
      </div>
      <div class="input-group">
        <label>Target Impedance (Ω):</label>
        <input type="number" v-model="targetImpedance" min="1" step="1" />
      </div>
      <div class="input-group">
        <label>Dielectric Constant (ε):</label>
        <input type="number" v-model="dielectricConstant" min="1" step="0.1" />
      </div>

      <div class="result">
        <h3>Required Height Above Ground:</h3>
        <div class="value">{{ calculatedHeight.toFixed(2) }} mm</div>
      </div>
    </div>
  </div>
</template>
