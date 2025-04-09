<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BandCoverageAccordion',
  props: {
    bandCoverage: {
      type: Array,
      required: true
    },
    showBandCoverage: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:showBandCoverage']
})
</script>

<template>
  <div class="accordion-item">
    <div class="accordion-header" @click="$emit('update:showBandCoverage', !showBandCoverage)">
      <span class="accordion-title">Band Coverage</span>
      <span class="accordion-icon">{{ showBandCoverage ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showBandCoverage }">
      <div class="band-coverage">
        <h4>Ham Band Coverage</h4>
        <div class="band-grid">
          <div
            v-for="band in bandCoverage"
            :key="band.name"
            class="band-item"
            :class="{ covered: band.covered }"
          >
            <span class="band-name">{{ band.name }}</span>
            <span class="band-status">{{ band.covered ? '✓' : '✗' }}</span>
            <span class="band-range">{{ band.min }}-{{ band.max }} MHz</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
