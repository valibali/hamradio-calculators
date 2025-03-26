<script lang="ts">
import { marked } from 'marked'
import MathJaxLoader from '../components/MathJaxLoader.vue'

export default {
  name: 'FormulasView',
  components: {
    MathJaxLoader,
  },
  data() {
    return {
      characteristicImpedanceHtml: '',
      markdownContent: '',
    }
  },
  mounted() {
    this.loadMarkdownFile()
  },
  methods: {
    async loadMarkdownFile() {
      try {
        // Load the markdown file from the docs directory
        const response = await fetch('/src/docs/twinlead-magnetwire-charimp.md')
        this.markdownContent = await response.text()

        // Render the markdown content
        this.characteristicImpedanceHtml = marked.parse(this.markdownContent)

        // Typeset math after the content is rendered
        this.$nextTick(() => {
          if (window.MathJax) {
            window.MathJax.typeset()
          }
        })
      } catch (error) {
        console.error('Error loading markdown file:', error)
      }
    },
  },
}
</script>

<template>
  <div class="formulas">
    <MathJaxLoader />

    <h1>HAM Radio Calculator Formulas</h1>

    <div class="formulas-content">
      <div class="formula-nav">
        <h3>Available Calculators</h3>
        <ul>
          <li class="active">Twin Lead Magnet Wire Characteristic Impedance</li>
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

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
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

.markdown-content :deep(th),
.markdown-content :deep(td) {
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
