<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PerformanceDetailsAccordion',
  props: {
    designResults: {
      type: Object,
      required: true
    },
    showPerformanceDetails: {
      type: Boolean,
      default: false
    },
    dutyCycleFactor: {
      type: Object,
      required: true
    }
  },
  emits: ['update:showPerformanceDetails']
})
</script>

<template>
  <div class="accordion-item">
    <div class="accordion-header" @click="$emit('update:showPerformanceDetails', !showPerformanceDetails)">
      <span class="accordion-title">Performance Details</span>
      <span class="accordion-icon">{{ showPerformanceDetails ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showPerformanceDetails }">
      <div class="performance-details">
        <h4>Detailed Performance Analysis</h4>
        <div class="performance-grid">
          <div class="performance-item">
            <h5>Core Properties</h5>
            <div class="detail-item">
              <span class="detail-label">Core Model:</span>
              <span class="detail-value">{{ designResults.coreModel.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Mix:</span>
              <span class="detail-value">{{ designResults.coreModel.mix }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Initial Permeability:</span>
              <span class="detail-value">{{
                designResults.coreModel.initialPermeability
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Saturation Flux Density:</span>
              <span class="detail-value"
                >{{ designResults.coreModel.saturationFluxDensity }} mT</span
              >
            </div>
          </div>

          <div class="performance-item">
            <h5>Electrical Parameters</h5>
            <div class="detail-item">
              <span class="detail-label"
                >Impedance at {{ designResults.config.minFrequency }} MHz:</span
              >
              <span class="detail-value"
                >{{ designResults.impedanceAtMinFreq.toFixed(1) }} Ω</span
              >
            </div>
            <div class="detail-item">
              <span class="detail-label"
                >Reactance at {{ designResults.config.minFrequency }} MHz:</span
              >
              <span class="detail-value"
                >{{ designResults.reactanceAtMinFreq.toFixed(1) }} Ω</span
              >
            </div>
            <div class="detail-item">
              <span class="detail-label">Q Factor:</span>
              <span class="detail-value">{{
                designResults.qFactorAtMinFreq.toFixed(1)
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Flux Density:</span>
              <span class="detail-value"
                >{{ designResults.fluxDensityAtMinFreq.toFixed(1) }} mT</span
              >
            </div>
          </div>

          <div class="performance-item">
            <h5>Thermal Considerations</h5>
            <div class="detail-item">
              <span class="detail-label">Core Loss:</span>
              <span class="detail-value"
                >{{ designResults.coreLossAtMinFreq.toFixed(1) }} W</span
              >
            </div>
            <div class="detail-item">
              <span class="detail-label">Max Permissible Loss:</span>
              <span class="detail-value"
                >{{ designResults.maxPermissibleCoreLoss.toFixed(1) }} W</span
              >
            </div>
            <div class="detail-item">
              <span class="detail-label">Loss Ratio:</span>
              <span class="detail-value">{{
                (
                  designResults.coreLossAtMinFreq / designResults.maxPermissibleCoreLoss
                ).toFixed(2)
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Duty Cycle Factor:</span>
              <span class="detail-value"
                >{{ dutyCycleFactor[designResults.config.operationMode] }}x</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
