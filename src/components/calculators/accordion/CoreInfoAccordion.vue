<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CoreInfoAccordion',
  props: {
    designResults: {
      type: Object,
      required: true
    },
    showCoreInfo: {
      type: Boolean,
      default: false
    },
    CoreCalculator: {
      type: Object,
      required: true
    }
  },
  emits: ['update:showCoreInfo']
})
</script>

<template>
  <div class="accordion-item">
    <div class="accordion-header" @click="$emit('update:showCoreInfo', !showCoreInfo)">
      <span class="accordion-title">Core Information</span>
      <span class="accordion-icon">{{ showCoreInfo ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showCoreInfo }">
      <div class="core-detailed-info">
        <h4>Core Specifications</h4>
        
        <div class="core-dimensions">
          <h5>Core Type</h5>
          <div class="core-type-info">
            <div class="core-type-item">
              <span class="core-type-label">Model:</span>
              <span class="core-type-value">{{ designResults.coreModel.id }}</span>
            </div>
            <div class="core-type-item">
              <span class="core-type-label">Mix:</span>
              <span class="core-type-value">{{ designResults.coreModel.mix }}</span>
            </div>
            <div class="core-type-item">
              <span class="core-type-label">Initial Permeability:</span>
              <span class="core-type-value">{{ designResults.coreModel.initialPermeability }}</span>
            </div>
          </div>
          
          <h5>Physical Dimensions</h5>
          <div class="dimensions-grid">
            <div class="dimension-item">
              <span class="dimension-label">Outside Diameter (OD):</span>
              <span class="dimension-value">{{ designResults.coreModel.dimensions.od }} mm</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Inside Diameter (ID):</span>
              <span class="dimension-value">{{ designResults.coreModel.dimensions.id }} mm</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Height:</span>
              <span class="dimension-value">{{ designResults.coreModel.dimensions.height }} mm</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Effective Path Length (Le):</span>
              <span class="dimension-value">{{ designResults.coreModel.dimensions.le || ((Math.PI * (designResults.coreModel.dimensions.od + designResults.coreModel.dimensions.id)) / 20).toFixed(2) }} cm</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Effective Cross-Section (Ae):</span>
              <span class="dimension-value">{{ designResults.coreModel.dimensions.ae || (((designResults.coreModel.dimensions.od - designResults.coreModel.dimensions.id) * designResults.coreModel.dimensions.height) / 200).toFixed(2) }} cm²</span>
            </div>
          </div>
        </div>
        
        <div class="permeability-data">
          <h5>Permeability Data for Mix {{ designResults.coreModel.mix }}</h5>
          <div class="permeability-table-container">
            <table class="permeability-table">
              <thead>
                <tr>
                  <th>Frequency (MHz)</th>
                  <th>μ' (Real)</th>
                  <th>μ" (Imaginary)</th>
                  <th>|μ| (Complex)</th>
                  <th>Q Factor</th>
                  <th>tanδ/μ'</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(freq, index) in [1, 2, 5, 10, 20, 30]" :key="index">
                  <td>{{ freq }}</td>
                  <td>{{ CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[0].toFixed(1) }}</td>
                  <td>{{ CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[1].toFixed(1) }}</td>
                  <td>{{ Math.sqrt(Math.pow(CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[0], 2) + Math.pow(CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[1], 2)).toFixed(1) }}</td>
                  <td>{{ (CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[0] / CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[1]).toFixed(1) }}</td>
                  <td>{{ (CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[1] / CoreCalculator.interpolatePermeability(freq, designResults.coreModel)[0]).toFixed(4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
