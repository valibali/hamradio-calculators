<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue'
import MathJaxLoader from '../MathJaxLoader.vue'
import {
  RFInductorCalculator,
  COAX_CABLES,
  HAM_BANDS_BY_REGION,
  type InductorParameters,
  type InductorResults,
  type FrequencyResponse,
  type HamBandData,
} from './src/rfInductorCalculator'

// Declare marked for TypeScript
declare const marked: any

export default defineComponent({
  name: 'RFInductorCalculator',
  components: {
    MathJaxLoader,
  },
  setup() {
    // Form values
    const coaxType = ref('2.00')
    const formerDiameter = ref(25)
    const pitchRatio = ref(1.4)
    const turnCount = ref(8)
    const iaruRegion = ref('Region 1')
    const hamBand = ref('144.200')

    // Results
    const results = ref<InductorResults | null>(null)
    const frequencyResponse = ref<FrequencyResponse[]>([])
    const isCalculating = ref(false)
    const showTechnicalGuide = ref(false)
    const technicalGuideContent = ref('')

    // Computed properties
    const coaxOptions = computed(() => {
      return Object.entries(COAX_CABLES).map(([key, value]) => ({
        value: key,
        label: `${value.name} (${value.outerDiameter}mm)`,
      }))
    })

    const iaruRegionOptions = computed(() => [
      { value: 'Region 1', label: 'Region 1 (Europe, Africa, Middle East)' },
      { value: 'Region 2', label: 'Region 2 (Americas)' },
      { value: 'Region 3', label: 'Region 3 (Asia-Pacific)' },
    ])

    const hamBandOptions = computed(() => {
      const bands = HAM_BANDS_BY_REGION[iaruRegion.value]
      return Object.entries(bands).map(([key, value]) => ({
        value: key,
        label: `${value.name} (${value.center} MHz)`,
      }))
    })

    const selectedBandData = computed((): HamBandData => {
      return HAM_BANDS_BY_REGION[iaruRegion.value][hamBand.value]
    })

    const plotData = computed(() => {
      if (!frequencyResponse.value.length || !results.value) return null

      const selectedFreq = selectedBandData.value.center
      const srfMHz = results.value.selfResonantFreq / 1e6

      // Extract data arrays
      const frequencies = frequencyResponse.value.map((p) => p.frequency)
      const impedanceMagnitudes = frequencyResponse.value.map((p) => p.impedanceMagnitude)
      const resistances = frequencyResponse.value.map((p) => p.resistance)
      const reactances = frequencyResponse.value.map((p) => p.reactance)

      // Find Y-axis range
      const validValues = [
        ...(impedanceMagnitudes.filter((v) => v !== null) as number[]),
        ...(resistances.filter((v) => v !== null) as number[]),
        ...reactances.filter((v) => v !== null).map((v) => Math.abs(v as number)),
      ]
      const yMin = Math.min(...validValues) * 0.1
      const yMax = Math.max(...validValues) * 10

      return {
        frequencies,
        impedanceMagnitudes,
        resistances,
        reactances,
        selectedFreq,
        srfMHz,
        yMin,
        yMax,
        startFreq: frequencies[0],
        stopFreq: frequencies[frequencies.length - 1],
      }
    })

    // Methods
    const calculate = () => {
      isCalculating.value = true

      try {
        const params: InductorParameters = {
          coaxType: coaxType.value,
          formerDiameter: formerDiameter.value,
          pitchRatio: pitchRatio.value,
          turnCount: turnCount.value,
          frequency: parseFloat(hamBand.value),
          iaruRegion: iaruRegion.value,
          hamBand: hamBand.value,
        }

        results.value = RFInductorCalculator.calculateInductor(params)

        // Generate frequency response for plotting
        const selectedFreq = parseFloat(hamBand.value)
        const startFreq = selectedFreq * 0.9
        const stopFreq = selectedFreq * 1.1
        frequencyResponse.value = RFInductorCalculator.generateFrequencyResponse(
          params,
          startFreq,
          stopFreq,
          100,
        )

        nextTick(() => {
          updatePlot()
        })
      } finally {
        isCalculating.value = false
      }
    }

    const updatePlot = () => {
      if (!plotData.value || !(window as any).Plotly) return

      const data = plotData.value
      const selectedBand = selectedBandData.value

      // Create traces
      const traces = [
        {
          x: data.frequencies,
          y: data.impedanceMagnitudes,
          name: '|Z| Magnitude',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#007bff', width: 3 },
          connectgaps: false,
        },
        {
          x: data.frequencies,
          y: data.resistances,
          name: 'Resistance',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#e74c3c', width: 2, dash: 'dot' },
          connectgaps: false,
        },
        {
          x: data.frequencies,
          y: data.reactances,
          name: 'Reactance',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#2ecc71', width: 2, dash: 'dash' },
          connectgaps: false,
        },
        // Operating frequency line
        {
          x: [data.selectedFreq, data.selectedFreq],
          y: [data.yMin, data.yMax],
          name: `Operating Freq (${selectedBand.name})`,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#764ba2', width: 1 },
          showlegend: true,
        },
      ]

      // Add SRF line if within range
      if (data.srfMHz >= data.startFreq && data.srfMHz <= data.stopFreq) {
        traces.push({
          x: [data.srfMHz, data.srfMHz],
          y: [data.yMin, data.yMax],
          name: 'SRF (Choke Limit)',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#f39c12', width: 2 },
          showlegend: true,
        })
      }

      const layout = {
        title: {
          text: `Common Mode Impedance vs Frequency <br>(±10% around ${selectedBand.name} - ${selectedBand.center.toFixed(3)} MHz, ${iaruRegion.value})`,
          font: { size: 16, color: 'var(--color-heading)' },
        },
        xaxis: {
          title: 'Frequency (MHz)',
          gridcolor: 'var(--color-border)',
          showgrid: true,
          range: [data.startFreq, data.stopFreq],
        },
        yaxis: {
          title: 'Impedance (Ω)',
          gridcolor: 'var(--color-border)',
          showgrid: true,
          type: 'log',
          range: [Math.log10(data.yMin), Math.log10(data.yMax)],
        },
        plot_bgcolor: 'var(--color-background)',
        paper_bgcolor: 'var(--color-background)',
        font: { color: 'var(--color-text)' },
        margin: { l: 80, r: 50, t: 60, b: 60 },
        legend: {
          x: 0.02,
          y: 0.98,
          bgcolor: 'rgba(255,255,255,0.8)',
          bordercolor: 'var(--color-border)',
          borderwidth: 1,
        },
        hovermode: 'x unified',
        shapes: [],
      }

      // Add performance zones
      const shapes = layout.shapes as any[]

      // Poor performance zone (below 1000Ω) - Red
      shapes.push({
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        y0: data.yMin,
        x1: 1,
        y1: 1000,
        fillcolor: 'rgba(231, 76, 60, 0.15)',
        line: { width: 0 },
        layer: 'below',
      })

      // Usable performance zone (1000-3000Ω) - Orange
      shapes.push({
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        y0: 1000,
        x1: 1,
        y1: 3000,
        fillcolor: 'rgba(243, 156, 18, 0.15)',
        line: { width: 0 },
        layer: 'below',
      })

      // Excellent performance zone (above 3000Ω) - Green
      shapes.push({
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        y0: 3000,
        x1: 1,
        y1: data.yMax,
        fillcolor: 'rgba(46, 204, 113, 0.15)',
        line: { width: 0 },
        layer: 'below',
      })

      // Add invalid region shading above SRF
      if (data.srfMHz < data.stopFreq && data.srfMHz >= data.startFreq) {
        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: data.srfMHz,
          y0: 0,
          x1: data.stopFreq,
          y1: 1,
          fillcolor: 'rgba(169, 169, 169, 0.3)',
          line: { width: 0 },
          layer: 'above',
        })
      }

      // Add band shading
      if (selectedBand.start >= data.startFreq || selectedBand.end <= data.stopFreq) {
        const bandStart = Math.max(selectedBand.start, data.startFreq)
        const bandEnd = Math.min(selectedBand.end, data.stopFreq)

        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: bandStart,
          y0: 0,
          x1: bandEnd,
          y1: 1,
          fillcolor: 'rgba(102, 126, 234, 0.1)',
          line: { width: 0 },
          layer: 'above',
        })
      }

      // Add band label annotation
      if (selectedBand.start < data.stopFreq && selectedBand.end > data.startFreq) {
        const labelX =
          (Math.max(selectedBand.start, data.startFreq) +
            Math.min(selectedBand.end, data.stopFreq)) /
          2

        ;(layout as any).annotations = [
          {
            x: labelX,
            y: 0.95,
            xref: 'x',
            yref: 'paper',
            text: `<b>${selectedBand.name} Band (${iaruRegion.value})</b><br>${selectedBand.start}-${selectedBand.end} MHz`,
            showarrow: false,
            font: {
              size: 12,
              color: 'hsla(160, 100%, 37%, 1)',
            },
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: 'hsla(160, 100%, 37%, 1)',
            borderwidth: 1,
            borderpad: 4,
          },
        ]

        // Add performance zone labels
        ;(layout as any).annotations.push({
          x: 0.98,
          y: 0.85,
          xref: 'paper',
          yref: 'paper',
          text: '<b>Performance Zones:</b><br><span style="color: #e74c3c;">■</span> Poor (&lt;1kΩ)<br><span style="color: #f39c12;">■</span> Usable (1-3kΩ)<br><span style="color: #2ecc71;">■</span> Excellent (&gt;3kΩ)',
          showarrow: false,
          font: {
            size: 10,
            color: 'var(--color-text)',
          },
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: 'var(--color-border)',
          borderwidth: 1,
          borderpad: 4,
          align: 'right',
          xanchor: 'right',
        })

        // Add invalid region annotation if SRF is visible
        if (data.srfMHz < data.stopFreq && data.srfMHz >= data.startFreq) {
          ;(layout as any).annotations.push({
            x: (data.srfMHz + data.stopFreq) / 2,
            y: 0.5,
            xref: 'x',
            yref: 'paper',
            text: '<b>Invalid Region</b><br>Above SRF<br>(Not functioning as choke)',
            showarrow: false,
            font: {
              size: 11,
              color: '#666',
            },
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: '#999',
            borderwidth: 1,
            borderpad: 4,
          })
        }
      }

      const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        displaylogo: false,
      }

      ;(window as any).Plotly.newPlot('impedancePlot', traces, layout, config)
    }

    const formatNumber = (value: number, decimals: number = 2): string => {
      return value.toFixed(decimals)
    }

##AI! improve formatEngineering. e.g. Capacitance is displayed in Farads instead of likely picofarads.
    const formatEngineering = (value: number, unit: string): string => {
      if (value >= 1e-3 && value < 1) {
        return `${(value * 1e6).toFixed(1)} μ${unit}`
      } else if (value >= 1e-6 && value < 1e-3) {
        return `${(value * 1e9).toFixed(1)} n${unit}`
      } else if (value >= 1e-9 && value < 1e-6) {
        return `${(value * 1e12).toFixed(1)} p${unit}`
      } else if (value >= 1e6) {
        return `${(value / 1e6).toFixed(1)} M${unit}`
      } else if (value >= 1e3) {
        return `${(value / 1e3).toFixed(1)} k${unit}`
      } else {
        return `${value.toFixed(2)} ${unit}`
      }
    }

    // Watchers
    watch([coaxType, formerDiameter, pitchRatio, turnCount, iaruRegion, hamBand], calculate)

    // Configure marked to preserve LaTeX delimiters
    const configureMarked = () => {
      if (typeof marked !== 'undefined') {
        marked.use({
          extensions: [
            {
              name: 'tex',
              level: 'inline',
              start(src: { match: (arg0: RegExp) => { (): any; new (): any; index: any } }) {
                return src.match(/\$\$|\$/)?.index
              },
              tokenizer(src: string) {
                const blockRule = /^\$\$([\s\S]+?)\$\$/
                const inlineRule = /^\$([\s\S]+?)\$/

                const blockMatch = blockRule.exec(src)
                if (blockMatch) {
                  return {
                    type: 'html',
                    raw: blockMatch[0],
                    text: `$$${blockMatch[1]}$$`,
                  }
                }

                const inlineMatch = inlineRule.exec(src)
                if (inlineMatch) {
                  return {
                    type: 'html',
                    raw: inlineMatch[0],
                    text: `$${inlineMatch[1]}$`,
                  }
                }

                return undefined
              },
            },
          ],
        })
      }
    }

    // Load technical guide markdown
    const loadTechnicalGuide = async () => {
      try {
        // Configure marked before parsing
        configureMarked()

        const response = await fetch('/docs/rf-inductor-technical-guide.md')
        const markdownContent = await response.text()

        // Render the markdown content using marked if available
        let html
        if (typeof marked !== 'undefined') {
          html = await marked.parse(markdownContent, { async: true })
        } else {
          // Fallback to simple conversion
          html = markdownContent
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^\s*---\s*$/gim, '<hr>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
          html = `<p>${html}</p>`
        }

        technicalGuideContent.value = html

        // Typeset math after content is loaded
        setTimeout(() => {
          if (window.MathJax) {
            console.log('Attempting to typeset LaTeX in RF inductor technical guide')
            if (window.MathJax.typesetPromise) {
              window.MathJax.typesetPromise()
                .then(() => console.log('MathJax typesetting complete'))
                .catch((err: Error) => console.error('MathJax typeset error:', err))
            } else if (window.MathJax.typeset) {
              window.MathJax.typeset()
              console.log('MathJax typeset called')
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
              window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub])
              console.log('MathJax Hub Queue called')
            }
          }
        }, 500)
      } catch (error) {
        console.error('Error loading technical guide:', error)
        technicalGuideContent.value = '<p>Error loading technical guide.</p>'
      }
    }

    // Load Plotly and marked scripts
    onMounted(() => {
      // Load marked.js first
      if (typeof marked === 'undefined') {
        const markedScript = document.createElement('script')
        markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/7.0.5/marked.min.js'
        markedScript.onload = () => {
          // Load Plotly after marked
          if (!(window as any).Plotly) {
            const plotlyScript = document.createElement('script')
            plotlyScript.src =
              'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.26.0/plotly.min.js'
            plotlyScript.onload = () => {
              calculate()
              loadTechnicalGuide()
            }
            document.head.appendChild(plotlyScript)
          } else {
            calculate()
            loadTechnicalGuide()
          }
        }
        document.head.appendChild(markedScript)
      } else {
        // marked is already loaded
        if (!(window as any).Plotly) {
          const plotlyScript = document.createElement('script')
          plotlyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.26.0/plotly.min.js'
          plotlyScript.onload = () => {
            calculate()
            loadTechnicalGuide()
          }
          document.head.appendChild(plotlyScript)
        } else {
          calculate()
          loadTechnicalGuide()
        }
      }
    })

    return {
      // Form values
      coaxType,
      formerDiameter,
      pitchRatio,
      turnCount,
      iaruRegion,
      hamBand,

      // Results
      results,
      isCalculating,
      showTechnicalGuide,
      technicalGuideContent,

      // Computed
      coaxOptions,
      iaruRegionOptions,
      hamBandOptions,
      selectedBandData,

      // Methods
      calculate,
      formatNumber,
      formatEngineering,
    }
  },
})
</script>

<template>
  <div class="rf-inductor-calculator">
    <div class="calculator-intro">
      <h3>RF Inductor Calculator</h3>
      <p>
        Design air-core coaxial cable inductors for RF applications. This calculator helps you
        determine the optimal dimensions and performance characteristics for your specific
        requirements.
      </p>

      <div class="technical-guide">
        <button class="toggle-button" @click="showTechnicalGuide = !showTechnicalGuide">
          {{ showTechnicalGuide ? 'Hide Technical Guide' : 'Show Technical Guide' }}
        </button>

        <div v-if="showTechnicalGuide" class="guide-content">
          <MathJaxLoader />
          <div class="markdown-content" v-html="technicalGuideContent"></div>
        </div>
      </div>
    </div>

    <div class="calculator-form">
      <div class="form-section">
        <h4>Design Parameters</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="coaxType">Coax Cable Type</label>
            <select id="coaxType" v-model="coaxType">
              <option v-for="option in coaxOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="iaruRegion">IARU Region</label>
            <select id="iaruRegion" v-model="iaruRegion">
              <option v-for="option in iaruRegionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="hamBand">Ham Band</label>
            <select id="hamBand" v-model="hamBand">
              <option v-for="option in hamBandOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="formerDiameter"
              >Former Diameter: {{ formatNumber(formerDiameter, 1) }} mm</label
            >
            <div class="slider-input-group">
              <input
                id="formerDiameter"
                v-model.number="formerDiameter"
                type="range"
                min="20.0"
                max="400.0"
                step="1.0"
              />
              <input
                v-model.number="formerDiameter"
                type="number"
                min="20.0"
                max="400.0"
                step="1.0"
                class="number-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="pitchRatio">Pitch Ratio (c/a): {{ formatNumber(pitchRatio, 2) }}</label>
            <div class="slider-input-group">
              <input
                id="pitchRatio"
                v-model.number="pitchRatio"
                type="range"
                min="1.1"
                max="4.0"
                step="0.01"
              />
              <input
                v-model.number="pitchRatio"
                type="number"
                min="1.1"
                max="4.0"
                step="0.01"
                class="number-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="turnCount">Number of Turns (N): {{ turnCount }}</label>
            <div class="slider-input-group">
              <input
                id="turnCount"
                v-model.number="turnCount"
                type="range"
                min="2"
                max="80"
                step="1"
              />
              <input
                v-model.number="turnCount"
                type="number"
                min="2"
                max="80"
                step="1"
                class="number-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="results" class="plot-container">
      <h3>Impedance vs Frequency</h3>
      <div id="impedancePlot" class="plot-area"></div>
    </div>

    <div v-if="results" class="results-section">
      <h3>Calculation Results</h3>

      <!-- Physical Dimensions - Full Width First -->
      <div class="result-card full-width">
        <h4>Physical Dimensions</h4>
        <div class="result-items-grid">
          <div class="result-item">
            <span class="result-label">Mean Diameter (Øm):</span>
            <span class="result-value"
              >{{ formatNumber(results.conductorMeanDiameter, 2) }} mm</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Outer Diameter (Øo):</span>
            <span class="result-value">{{ formatNumber(results.outerDiameter, 2) }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">Former Diameter (Øf):</span>
            <span class="result-value">{{ formatNumber(formerDiameter, 2) }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">Turn Spacing (c):</span>
            <span class="result-value">{{ formatNumber(results.turnSpacing, 2) }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">Edge-to-Edge Gap:</span>
            <span class="result-value">{{ formatNumber(results.edgeToEdgeGap, 2) }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">Coil Length (ℓ):</span>
            <span class="result-value">{{ formatNumber(results.coilLength, 1) }} mm</span>
          </div>
        </div>
      </div>

      <!-- Other Results - Two Column Grid -->
      <div class="results-grid">
        <div class="result-card">
          <h4>Frequency Independent</h4>
          <div class="result-item">
            <span class="result-label">Inductance (L):</span>
            <span class="result-value">{{ formatEngineering(results.inductance, 'H') }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Capacitance (C):</span>
            <span class="result-value">{{ formatEngineering(results.capacitance, 'F') }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">DC Resistance (Rdc):</span>
            <span class="result-value">{{ formatNumber(results.dcResistance, 2) }} Ω</span>
          </div>
          <div class="result-item">
            <span class="result-label">Self-Resonant Freq:</span>
            <span class="result-value"
              >{{ formatNumber(results.selfResonantFreq / 1e6, 1) }} MHz</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Wire Length:</span>
            <span class="result-value">{{ formatNumber(results.wireLength, 2) }} m</span>
          </div>
        </div>

        <div class="result-card">
          <h4>Frequency Dependent</h4>
          <div class="result-item">
            <span class="result-label">Frequency:</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ selectedBandData.center.toFixed(2) }} MHz
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Skin Depth (δ):</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.skinDepth * 1e6, 1) }} μm
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">AC Resistance (Rac):</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.acResistance, 2) }} Ω
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Inductive Reactance:</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.inductiveReactance, 1) }} Ω
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Complex Impedance:</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.complexImpedance.re, 1) }}
              {{ results.complexImpedance.im >= 0 ? ' + j' : ' - j'
              }}{{ formatNumber(Math.abs(results.complexImpedance.im), 1) }} Ω
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Impedance Magnitude:</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.impedanceMagnitude, 1) }} Ω
            </span>
          </div>
          <div class="result-item">
            <span class="result-label">Quality Factor (Q):</span>
            <span class="result-value" :class="{ 'over-srf': results.overSRF }">
              {{ formatNumber(results.qualityFactor, 1) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rf-inductor-calculator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.calculator-intro {
  margin-bottom: 2rem;
}

.calculator-intro h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.calculator-intro p {
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.technical-guide {
  margin-top: 1.5rem;
}

.toggle-button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: var(--color-background-mute);
  border-color: hsla(160, 100%, 37%, 0.5);
}

.guide-content {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  max-height: 500px;
  overflow-y: auto;
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content h1 {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.markdown-content h2 {
  font-size: 1.4rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.markdown-content h3 {
  font-size: 1.2rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.markdown-content p {
  margin-bottom: 1rem;
}

.markdown-content ul,
.markdown-content ol {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content li {
  margin-bottom: 0.5rem;
}

.markdown-content code {
  background-color: var(--color-background-mute);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.markdown-content pre {
  background-color: var(--color-background-mute);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2rem 0;
}

.markdown-content strong {
  font-weight: bold;
  color: var(--color-heading);
}

.calculator-form {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.form-group {
  flex: 1 1 calc(33.333% - 1rem);
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.form-group select:focus {
  border-color: hsla(160, 100%, 37%, 1);
  outline: none;
}

.slider-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-input-group input[type='range'] {
  flex: 1;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(to right, hsla(160, 100%, 37%, 0.8), hsla(160, 100%, 37%, 1));
  outline: none;
  -webkit-appearance: none;
}

.slider-input-group input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid hsla(160, 100%, 37%, 1);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-input-group input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid hsla(160, 100%, 37%, 1);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.number-input {
  width: 80px;
  padding: 5px 8px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  font-size: 0.9rem;
  text-align: center;
  transition: border-color 0.3s ease;
  color: var(--color-text);
}

.number-input:focus {
  border-color: hsla(160, 100%, 37%, 1);
  outline: none;
}

.results-section {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}

.results-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  text-align: center;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.result-card.full-width {
  width: 100%;
  margin-bottom: 2rem;
}

.result-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.result-items-grid .result-item {
  border-bottom: 1px solid var(--color-border-light, #eee);
  padding: 8px 0;
}

.result-items-grid .result-item:last-child {
  border-bottom: none;
}

.result-card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem;
}

.result-card h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light, #eee);
  font-size: 0.95rem;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-weight: bold;
  color: var(--color-text-light);
}

.result-value {
  color: var(--color-text);
  font-family: 'Courier New', monospace;
}

.result-value.over-srf {
  color: #e74c3c !important;
  font-weight: bold;
}

.plot-container {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

.plot-container h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  text-align: center;
}

.plot-area {
  width: 100%;
  height: 500px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}

@media (max-width: 768px) {
  .form-group {
    flex: 1 1 100%;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }

  .result-items-grid {
    grid-template-columns: 1fr;
  }

  .result-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .plot-area {
    height: 400px;
  }
}
</style>
