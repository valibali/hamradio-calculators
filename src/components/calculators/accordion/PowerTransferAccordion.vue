<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PowerTransferAccordion',
  props: {
    designResults: {
      type: Object,
      required: true
    },
    bandPowerData: {
      type: Array,
      required: true
    },
    swrData: {
      type: Array,
      required: true
    },
    showPowerTransfer: {
      type: Boolean,
      default: false
    },
    determineBandCoverage: {
      type: Function,
      required: true
    }
  },
  emits: ['update:showPowerTransfer']
})
</script>

<template>
  <div class="accordion-item" v-if="bandPowerData && swrData">
    <div class="accordion-header" @click="$emit('update:showPowerTransfer', !showPowerTransfer)">
      <span class="accordion-title">Power Transfer Analysis</span>
      <span class="accordion-icon">{{ showPowerTransfer ? '▼' : '▶' }}</span>
    </div>
    <div class="accordion-content" :class="{ 'accordion-open': showPowerTransfer }">
      <div class="power-transfer">
        <h4>Power Transfer to Antenna</h4>
        <p class="power-transfer-explanation">
          This table shows how the balun's performance affects power transfer across
          different amateur bands. Higher efficiency values indicate better power transfer
          from the transmitter to the antenna.
        </p>

        <div class="power-transfer-table">
          <table>
            <thead>
              <tr>
                <th>Band</th>
                <th>Frequency (MHz)</th>
                <th>Inductance (μH)</th>
                <th>Reactance (Ω)</th>
                <th>Series R (Ω)</th>
                <th>Q Factor</th>
                <th>Flux Density (mT)</th>
                <th>Power Out (W)</th>
                <th>Efficiency (%)</th>
                <th>SWR</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(data, index) in bandPowerData"
                :key="index"
                :class="{
                  'covered-band': determineBandCoverage(
                    designResults.config.minFrequency,
                    Math.min(
                      designResults.config.maxFrequency,
                      designResults.maxFreqBasedOnLength,
                    ),
                    [
                      {
                        name: data.band,
                        min: data.frequency * 0.9,
                        max: data.frequency * 1.1,
                        covered: false,
                      },
                    ],
                  )[0].covered,
                }"
              >
                <td>{{ data.band }}</td>
                <td>{{ data.frequency.toFixed(2) }}</td>
                <td>{{ data.inductance.toFixed(1) }}</td>
                <td>{{ data.reactance.toFixed(1) }}</td>
                <td>{{ data.resistance.toFixed(1) }}</td>
                <td>{{ data.qFactor.toFixed(1) }}</td>
                <td :class="data.fluxDensity > 50 ? 'bad' : 'good'">
                  {{ data.fluxDensity.toFixed(1) }}
                </td>
                <td>{{ data.powerOut.toFixed(1) }}</td>
                <td :class="data.efficiency < 90 ? 'bad' : 'good'">
                  {{ data.efficiency.toFixed(1) }}
                </td>
                <td :class="data.swr > 2 ? 'bad' : 'good'">
                  {{ data.swr.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="swr-graph">
          <h5>SWR Across HF Spectrum</h5>
          <div class="graph-container">
            <svg width="100%" height="300" viewBox="0 0 800 300" preserveAspectRatio="none">
              <!-- Graph background -->
              <rect
                x="50"
                y="20"
                width="700"
                height="230"
                fill="#f8f9fa"
                stroke="#dee2e6"
              />

              <!-- X-axis -->
              <line x1="50" y1="250" x2="750" y2="250" stroke="#495057" stroke-width="2" />

              <!-- Y-axis -->
              <line x1="50" y1="20" x2="50" y2="250" stroke="#495057" stroke-width="2" />

              <!-- X-axis labels -->
              <text
                v-for="i in 6"
                :key="`x-${i}`"
                :x="50 + (i - 1) * 140"
                y="270"
                text-anchor="middle"
                font-size="12"
              >
                {{ (1 + (i - 1) * 6).toFixed(0) }}
              </text>
              <text x="400" y="290" text-anchor="middle" font-size="14">
                Frequency (MHz)
              </text>

              <!-- Y-axis labels -->
              <text
                v-for="i in 5"
                :key="`y-${i}`"
                x="40"
                :y="250 - i * 46"
                text-anchor="end"
                font-size="12"
              >
                {{ i * 2 }}
              </text>
              <text
                x="20"
                y="140"
                text-anchor="middle"
                font-size="14"
                transform="rotate(-90, 20, 140)"
              >
                SWR
              </text>

              <!-- Grid lines -->
              <line
                v-for="i in 5"
                :key="`grid-y-${i}`"
                x1="50"
                :y1="250 - i * 46"
                x2="750"
                :y2="250 - i * 46"
                stroke="#dee2e6"
                stroke-width="1"
                stroke-dasharray="5,5"
              />

              <line
                v-for="i in 5"
                :key="`grid-x-${i}`"
                :x1="50 + i * 140"
                y1="20"
                :x2="50 + i * 140"
                y2="250"
                stroke="#dee2e6"
                stroke-width="1"
                stroke-dasharray="5,5"
              />

              <!-- SWR curve -->
              <polyline
                :points="
                  swrData
                    .map((point) => {
                      const x = 50 + (point.frequency - 1) * (700 / 29) // Scale to 1-30 MHz
                      const y = 250 - Math.min(point.swr, 10) * 23 // Scale to SWR 1-10
                      return `${x},${y}`
                    })
                    .join(' ')
                "
                fill="none"
                stroke="hsla(160, 100%, 37%, 1)"
                stroke-width="2"
              />

              <!-- Highlight SWR=2 line -->
              <line
                x1="50"
                y1="204"
                x2="750"
                y2="204"
                stroke="#dc3545"
                stroke-width="1"
                stroke-dasharray="5,5"
              />
              <text x="755" y="204" text-anchor="start" font-size="12" fill="#dc3545">
                SWR=2
              </text>

              <!-- Highlight operating range -->
              <rect
                :x="50 + (designResults.config.minFrequency - 1) * (700 / 29)"
                y="20"
                :width="
                  (Math.min(
                    designResults.config.maxFrequency,
                    designResults.maxFreqBasedOnLength,
                  ) -
                    designResults.config.minFrequency) *
                  (700 / 29)
                "
                height="230"
                fill="rgba(0, 123, 255, 0.1)"
                stroke="rgba(0, 123, 255, 0.5)"
              />
            </svg>
          </div>
          <div class="graph-legend">
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: hsla(160, 100%, 37%, 1)"
              ></span>
              <span class="legend-label">SWR Curve</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: rgba(0, 123, 255, 0.5)"
              ></span>
              <span class="legend-label">Operating Range</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: #dc3545; height: 2px"
              ></span>
              <span class="legend-label">SWR=2 Threshold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
