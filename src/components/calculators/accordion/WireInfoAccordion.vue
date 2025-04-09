<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'WireInfoAccordion',
  props: {
    recommendedWireInfo: {
      type: Object,
      required: true
    },
    showWireInfo: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:showWireInfo']
})
</script>

<template>
  <div class="accordion-item" v-if="recommendedWireInfo">
    <div class="accordion-header" @click="$emit('update:showWireInfo', !showWireInfo)">
      <span class="accordion-title">Wire Information</span>
      <span class="accordion-icon">{{ showWireInfo ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showWireInfo }">
      <div class="wire-info">
        <h4>Wire Information</h4>
        <div class="wire-details">
          <div class="wire-item">
            <span class="wire-label">Recommended Wire:</span>
            <span class="wire-value">AWG {{ recommendedWireInfo.gauge }}</span>
          </div>
          <div class="wire-item">
            <span class="wire-label">Wire Diameter:</span>
            <span class="wire-value">{{ recommendedWireInfo.diameter.toFixed(2) }} mm</span>
          </div>
          <div class="wire-item">
            <span class="wire-label">Cross-sectional Area:</span>
            <span class="wire-value">{{ recommendedWireInfo.area.toFixed(2) }} mm²</span>
          </div>
          <div class="wire-item">
            <span class="wire-label">Current Capacity:</span>
            <span class="wire-value">{{ recommendedWireInfo.currentCapacity.toFixed(2) }} A</span>
          </div>
        </div>
        <div class="wire-notes">
          <p>
            <strong>Note:</strong> For bifilar windings, use two identical wires placed
            parallel to each other. For optimal performance, use insulated wire (enamel,
            PTFE, etc.) to prevent shorts.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
