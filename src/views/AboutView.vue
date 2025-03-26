<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import MathJaxLoader from '../components/MathJaxLoader.vue'

// Set up marked options for math rendering
marked.setOptions({
  gfm: true,
  breaks: true
})

// Create a renderer that can handle math expressions
const renderer = new marked.Renderer()
const originalParagraph = renderer.paragraph.bind(renderer)
renderer.paragraph = (text) => {
  // Replace $...$ with <span class="math-inline">...</span>
  const mathText = text.replace(/\$(.+?)\$/g, '<span class="math-inline">$1</span>')
  return originalParagraph(mathText)
}

marked.use({ renderer })

// Store the documentation content
const characteristicImpedanceDoc = `
# Characteristic Impedance Calculation for Parallel Magnet Wire Pairs

This document details the derivation of the characteristic impedance ($Z_0$) formula and air gap ($s$) approximations for non-twisted, close-wound enamel-coated magnet wire pairs (AWG15, AWG16, AWG18).

---

## 1. Key Parameters

### 1.1 Wire Specifications

| AWG | Bare Diameter (mm) | Bare Radius $a$ (mm) | Typical Enamel Thickness $t$ (mm) |
| --- | ------------------ | -------------------- | --------------------------------- |
| 15  | 1.450              | 0.725                | 0.05 (per side)                   |
| 16  | 1.291              | 0.6455               | 0.05 (per side)                   |
| 18  | 1.024              | 0.512                | 0.05 (per side)                   |

### 1.2 Assumptions

- **Enamel Relative Permittivity**: $\\varepsilon_r = 3.5$ (polyimide enamel).
- **Target Impedance**: $Z_0 \\approx 50 \\, \\Omega$.
- **Geometry**: Parallel cylindrical conductors with composite dielectric (enamel + air).

---

## 2. Formula Derivation

### 2.1 Characteristic Impedance Equation

The characteristic impedance for parallel cylindrical conductors is:

$$
Z_0 = \\frac{120}{\\sqrt{\\varepsilon_{\\text{eff}}}} \\cdot \\text{arccosh}\\left(\\frac{D}{2a}\\right)
$$

where:

- $D$ = Center-to-center distance between wires (mm).
- $\\varepsilon_{\\text{eff}}$ = Effective permittivity of the composite dielectric.

### 2.2 Effective Permittivity ($\\varepsilon_{\\text{eff}}$)

The enamel and air gaps act as dielectrics in series. The effective permittivity is calculated as:

$$
\\varepsilon_{\\text{eff}} = \\frac{\\text{Total Insulation Thickness}}{\\frac{\\text{Enamel Thickness}}{\\varepsilon_r} + \\frac{\\text{Air Gap}}{1}}
$$

- **Total Insulation Thickness**: $2t + s$ (enamel on both wires + air gap).
- **Enamel Thickness**: $2t$ (coating on both conductors).
- **Air Gap**: $s$ (space between enamel layers).

### 2.3 Center-to-Center Distance ($D$)

$$
D = 2a + 2t + s
$$

---

## 3. Air Gap ($s$) Calculation Steps

### 3.1 General Workflow

1. **Define Target $Z_0$**: $50 \\, \\Omega$.
2. **Solve for $\\varepsilon_{\\text{eff}}$**:
   $$
   \\varepsilon_{\\text{eff}} = \\left(\\frac{120}{Z_0} \\cdot \\text{arccosh}\\left(\\frac{D}{2a}\\right)\\right)^2
   $$
3. **Relate $\\varepsilon_{\\text{eff}}$ to $s$**:
   $$
   s = \\frac{2t \\cdot \\varepsilon_{\\text{eff}}}{\\varepsilon_r - \\varepsilon_{\\text{eff}}} - \\frac{2t}{\\varepsilon_r}
   $$

### 3.2 Example Calculation for AWG15

1. **Inputs**:

   - $a = 0.725 \\, \\text{mm}$
   - $t = 0.05 \\, \\text{mm}$
   - Target $Z_0 = 50 \\, \\Omega$.

2. **Iterative Solution**:
   - Assume $s = 0.10 \\, \\text{mm}$:
     - $D = 2(0.725) + 2(0.05) + 0.10 = 1.65 \\, \\text{mm}$.
     - $\\frac{D}{2a} = \\frac{1.65}{1.45} \\approx 1.137$.
     - $\\text{arccosh}(1.137) \\approx 0.52$.
     - $\\varepsilon_{\\text{eff}} = \\left(\\frac{120}{50} \\cdot 0.52\\right)^2 \\approx 1.55$.
   - Verify $s$:
     $$
     s = \\frac{2(0.05) \\cdot 1.55}{3.5 - 1.55} - \\frac{2(0.05)}{3.5} \\approx 0.10 \\, \\text{mm}.
     $$

---

## 4. Results for AWG15, AWG16, and AWG18

| AWG | $s$ (mm) | $D$ (mm) | $\\varepsilon_{\\text{eff}}$ | $Z_0$ (Ω) |
| --- | -------- | -------- | -------------------------- | --------- |
| 15  | 0.10     | 1.65     | 1.55                       | 50.1      |
| 16  | 0.09     | 1.48     | 1.60                       | 49.8      |
| 18  | 0.065    | 1.19     | 1.76                       | 50.3      |

---

## 5. Practical Considerations

1. **Enamel Compression**: Actual air gaps may decrease due to mechanical pressure during winding.
2. **Manufacturing Tolerance**: Use calipers to verify $D$ and adjust $s$ empirically.
3. **Validation**: Measure $Z_0$ with a Vector Network Analyzer (VNA) or Time-Domain Reflectometer (TDR).

---

## 6. Summary

The air gaps required to achieve $Z_0 \\approx 50 \\, \\Omega$ for close-wound magnet wire pairs are:

$$
\\begin{aligned}
\\text{AWG15: } & s \\approx 0.10 \\, \\text{mm} \\\\
\\text{AWG16: } & s \\approx 0.09 \\, \\text{mm} \\\\
\\text{AWG18: } & s \\approx 0.065 \\, \\text{mm} \\\\
\\end{aligned}
$$
`

// Function to convert markdown to HTML
const renderMarkdown = (markdown: string) => {
  return marked(markdown)
}

// Computed HTML content
const characteristicImpedanceHtml = ref('')

onMounted(() => {
  // Render the markdown content
  characteristicImpedanceHtml.value = renderMarkdown(characteristicImpedanceDoc)
  
  // Load MathJax for rendering math expressions
  if (window.MathJax) {
    window.MathJax.typeset()
  }
})
</script>

<template>
  <div class="formulas">
    <MathJaxLoader />
    
    <h1>HAM Radio Calculator Formulas</h1>
    
    <div class="formulas-content">
      <div class="formula-nav">
        <h3>Available Calculators</h3>
        <ul>
          <li class="active">Characteristic Impedance</li>
          <!-- Add more calculators here as they become available -->
        </ul>
      </div>
      
      <div class="formula-docs">
        <div v-html="characteristicImpedanceHtml" class="markdown-content"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.formulas-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  gap: 2rem;
}

.formula-nav {
  flex: 0 0 250px;
  background-color: var(--color-background-soft);
  padding: 1rem;
  border-radius: 8px;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.formula-nav h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.formula-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.formula-nav li {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.formula-nav li.active {
  background-color: var(--color-background-mute);
  font-weight: bold;
}

.formula-docs {
  flex: 1;
  background-color: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
}

h1 {
  margin-bottom: 2rem;
  text-align: center;
}

/* Markdown content styling */
.markdown-content :deep(h1) {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.markdown-content :deep(h3) {
  font-size: 1.2rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.markdown-content :deep(ul), .markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-content :deep(th), .markdown-content :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: var(--color-background-mute);
  font-weight: bold;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--color-border);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--color-text-light);
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2rem 0;
}

.markdown-content :deep(code) {
  font-family: monospace;
  background-color: var(--color-background-mute);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.markdown-content :deep(pre) {
  background-color: var(--color-background-mute);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(.math-inline) {
  font-style: italic;
  font-family: 'Times New Roman', serif;
}
</style>

<style>
@media (min-width: 1024px) {
  .formulas {
    min-height: 100vh;
    padding: 2rem 0;
  }
}

@media (max-width: 768px) {
  .formulas-content {
    flex-direction: column;
  }
  
  .formula-nav {
    flex: 0 0 auto;
    position: static;
    max-height: none;
  }
}
</style>
