<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'WindingInstructionsAccordion',
  props: {
    designResults: {
      type: Object,
      required: true
    },
    showWindingInstructions: {
      type: Boolean,
      default: false
    },
    formatInstructions: {
      type: Function,
      required: true
    },
    WindingStyleCalculator: {
      type: Object,
      required: true
    }
  },
  emits: ['update:showWindingInstructions']
})
</script>

<template>
  <div class="accordion-item" v-if="designResults?.windingInfo">
    <div class="accordion-header" @click="$emit('update:showWindingInstructions', !showWindingInstructions)">
      <span class="accordion-title">Winding Instructions</span>
      <span class="accordion-icon">{{ showWindingInstructions ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showWindingInstructions }">
      <div class="winding-instructions">
        <h4>Winding Instructions</h4>
        <div class="winding-details">
          <div class="winding-info-grid">
            <div class="winding-info-item">
              <span class="winding-info-label">Winding Style:</span>
              <span class="winding-info-value">{{ designResults.windingInfo.style }}</span>
            </div>
            <div class="winding-info-item">
              <span class="winding-info-label">Construction Method:</span>
              <span class="winding-info-value">{{
                designResults.windingInfo.construction === 'classical'
                  ? 'Classical Transformer'
                  : 'Autotransformer'
              }}</span>
            </div>
            <div class="winding-info-item">
              <span class="winding-info-label">Wire Count:</span>
              <span class="winding-info-value">{{
                designResults.windingInfo.wireCount
              }}</span>
            </div>
            <div class="winding-info-item">
              <span class="winding-info-label">Connection Type:</span>
              <span class="winding-info-value">{{
                designResults.windingInfo.connectionDetails
              }}</span>
            </div>
          </div>

          <div
            class="winding-instructions-content"
            v-html="
              formatInstructions(
                WindingStyleCalculator.generateWindingInstructions(
                  designResults.windingInfo,
                  designResults.config.primaryTurns,
                  designResults.coreModel.id,
                ),
              )
            "
          ></div>

          <div
            v-if="
              designResults.windingInfo.construction === 'autotransformer' &&
              !designResults.config.useHybridDesign &&
              WindingStyleCalculator.shouldUseHybridDesign(
                designResults.config.inputImpedance,
                designResults.config.outputImpedance,
              )
            "
            class="winding-suggestion"
          >
            <div class="suggestion-icon">💡</div>
            <div class="suggestion-text">
              <strong>Construction Suggestion:</strong> For this non-standard impedance
              ratio (1:{{
                (
                  designResults.config.outputImpedance / designResults.config.inputImpedance
                ).toFixed(1)
              }}), consider using a hybrid design (1:1 current balun + unun) instead of the
              autotransformer approach for better performance and simpler construction.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
