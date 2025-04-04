<script lang="ts">
import { marked } from 'marked'
import MathJaxLoader from '../components/MathJaxLoader.vue'

interface Formula {
  id: string
  name: string
  description?: string
  file: string
  html: string
  comingSoon?: boolean
}

interface Category {
  id: string
  name: string
  description: string
  formulas: Formula[]
}

export default {
  name: 'FormulasView',
  components: {
    MathJaxLoader,
  },
  data() {
    return {
      activeFormula: 'twinlead',
      activeCategory: 'transmission-lines',
      showScrollTopButton: false,
      categories: [
        {
          id: 'transmission-lines',
          name: 'Transmission Lines',
          description: 'Formulas for various transmission line types',
          formulas: [
            {
              id: 'twinlead',
              name: 'Twin Lead Magnet Wire',
              description: 'Formulas for parallel wire transmission lines',
              file: 'twinlead-magnetwire-charimp.md',
              html: '',
            },
            {
              id: 'twistedpair',
              name: 'Twisted Pair Magnet Wire',
              description: 'Formulas for twisted pair transmission lines',
              file: 'twistedpair-magnetwire-charimp.md',
              html: '',
            },
            {
              id: 'singleconductor',
              name: 'Single Conductor Above Ground',
              description: 'Formulas for single wire above ground plane',
              file: 'single-conductor-above-ground.md',
              html: '',
            },
          ],
        },
        {
          id: 'antennas',
          name: 'Antennas',
          description: 'Formulas for antenna design and analysis',
          formulas: [
            {
              id: 'dipole',
              name: 'Dipole Antenna',
              description: 'Formulas for dipole antenna design (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
            {
              id: 'yagi',
              name: 'Yagi-Uda Antenna',
              description: 'Formulas for Yagi-Uda antenna design (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
          ],
        },
        {
          id: 'components',
          name: 'Components',
          description: 'Formulas for RF components and circuits',
          formulas: [
            {
              id: 'coil',
              name: 'Coil Inductance',
              description: 'Formulas for air-core and toroidal coils (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
            {
              id: 'filter',
              name: 'Filter Design',
              description: 'Formulas for LC filter design (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
          ],
        },
        {
          id: 'rf-power',
          name: 'RF Power',
          description: 'Formulas for RF power calculations',
          formulas: [
            {
              id: 'swr',
              name: 'SWR Calculations',
              description: 'Formulas for SWR, return loss, and reflection coefficient (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
            {
              id: 'line-loss',
              name: 'Line Loss Calculations',
              description: 'Formulas for transmission line losses (Coming Soon)',
              file: '',
              html: '',
              comingSoon: true,
            },
          ],
        },
      ] as Category[],
    }
  },
  computed: {
    filteredFormulas() {
      const category = this.categories.find(c => c.id === this.activeCategory)
      return category ? category.formulas : []
    },
    currentFormula() {
      const formula = this.getFormulaById(this.activeFormula)
      return formula || this.categories[0].formulas[0]
    },
    hasActiveFormula() {
      // Check if there's at least one non-coming-soon formula in the active category
      const activeCategory = this.categories.find(c => c.id === this.activeCategory)
      if (!activeCategory) return false
      
      // Check if the active formula belongs to this category and is not coming soon
      const formula = this.getFormulaById(this.activeFormula)
      if (formula && !formula.comingSoon) {
        const formulaCategory = this.getCategoryForFormula(this.activeFormula)
        if (formulaCategory && formulaCategory.id === this.activeCategory) {
          return true
        }
      }
      
      // Check if there's any non-coming-soon formula in this category
      return activeCategory.formulas.some(form => !form.comingSoon)
    }
  },
  mounted() {
    // Check if there's a formula parameter in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const formula = urlParams.get('formula')
    const category = urlParams.get('category')

    // Add scroll event listener for scroll-to-top button
    window.addEventListener('scroll', this.handleScroll)

    // Flatten all formulas to check if the requested one exists
    const allFormulas = this.categories.flatMap((category: Category) =>
      category.formulas.map((form: Formula) => form.id),
    )

    if (
      formula &&
      allFormulas.includes(formula) &&
      !this.getFormulaById(formula)?.comingSoon
    ) {
      this.activeFormula = formula
      
      // Set the active category based on the formula
      const formulaCategory = this.getCategoryForFormula(formula)
      if (formulaCategory) {
        this.activeCategory = formulaCategory.id
      }
      
      // Load the markdown for the active formula
      this.loadMarkdownFile(formula)
    } else if (category && this.categories.some(c => c.id === category)) {
      this.activeCategory = category
      
      // Find the first non-coming-soon formula in this category
      const categoryObj = this.categories.find(c => c.id === category)
      if (categoryObj) {
        const firstFormula = categoryObj.formulas.find(f => !f.comingSoon)
        if (firstFormula) {
          this.activeFormula = firstFormula.id
          this.loadMarkdownFile(firstFormula.id)
        }
      }
    } else {
      // Load the markdown for the default active formula
      this.loadMarkdownFile(this.activeFormula)
    }
  },
  methods: {
    scrollToTop(): void {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    
    handleScroll(): void {
      // Only show button on mobile
      if (window.innerWidth <= 768) {
        this.showScrollTopButton = window.scrollY > 300
      } else {
        this.showScrollTopButton = false
      }
    },
    
    selectCategory(categoryId: string): void {
      this.activeCategory = categoryId
      
      // Update URL without reloading the page
      const url = new URL(window.location.href)
      url.searchParams.set('category', categoryId)
      window.history.pushState({}, '', url)
      
      // Find the first non-coming-soon formula in this category
      const category = this.categories.find(c => c.id === categoryId)
      if (category) {
        const firstFormula = category.formulas.find(f => !f.comingSoon)
        if (firstFormula && firstFormula.id !== this.activeFormula) {
          this.setActiveFormula(firstFormula.id)
        }
      }
      
      // Scroll to the formula nav area
      this.$nextTick(() => {
        const navElement = document.querySelector('.formula-nav')
        if (navElement) {
          // Get header height to adjust scroll position
          const headerHeight = document.querySelector('header')?.offsetHeight || 0
          const navPosition = navElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20 // 20px extra padding
          window.scrollTo({
            top: navPosition,
            behavior: 'smooth'
          })
        }
      })
    },
    
    setActiveFormula(formulaId: string): void {
      // Don't set if it's a coming soon formula
      if (this.getFormulaById(formulaId)?.comingSoon) {
        return
      }

      this.activeFormula = formulaId
      this.loadMarkdownFile(formulaId)
      
      // Update URL without reloading the page
      const url = new URL(window.location.href)
      url.searchParams.set('formula', formulaId)
      
      // Also update the category in the URL
      const formulaCategory = this.getCategoryForFormula(formulaId)
      if (formulaCategory) {
        this.activeCategory = formulaCategory.id
        url.searchParams.set('category', formulaCategory.id)
      }
      
      window.history.pushState({}, '', url)

      // Only scroll to the formula content on mobile
      if (window.innerWidth <= 768) {
        // Use setTimeout to ensure the DOM has updated with the new formula
        setTimeout(() => {
          const formulaContainer = document.querySelector('.formula-container')
          if (formulaContainer) {
            formulaContainer.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    },

    getFormulaById(id: string): Formula | null {
      for (const category of this.categories) {
        const formula = category.formulas.find((form: Formula) => form.id === id)
        if (formula) {
          return formula
        }
      }
      return null
    },

    getCategoryForFormula(formulaId: string): Category | undefined {
      return this.categories.find((category: Category) =>
        category.formulas.some((form: Formula) => form.id === formulaId),
      )
    },
    
    async loadMarkdownFile(formulaId: string) {
      try {
        const formula = this.getFormulaById(formulaId)
        if (!formula || formula.comingSoon) return

        // Skip if already loaded
        if (formula.html) {
          this.$nextTick(() => {
            if (window.MathJax) {
              window.MathJax.typeset()
            }
          })
          return
        }

        // Load the markdown file from the docs directory
        const response = await fetch(`/docs/${formula.file}`)
        const markdownContent = await response.text()

        // Render the markdown content
        await marked.parse(markdownContent, { async: true }).then((res) => {
          formula.html = res
        })

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
  
  beforeUnmount() {
    // Clean up the scroll event listener
    window.removeEventListener('scroll', this.handleScroll)
  }
}
</script>

<template>
  <div class="formulas">
    <MathJaxLoader />

    <h1>HAM Radio Calculator Formulas</h1>

    <button 
      v-show="showScrollTopButton" 
      @click="scrollToTop" 
      class="scroll-top-button"
      aria-label="Scroll to top"
    >
      <span class="arrow-up">↑</span>
    </button>

    <div class="category-tiles">
      <div 
        v-for="category in categories" 
        :key="category.id" 
        class="category-tile"
        @click="selectCategory(category.id)"
        :class="{ active: activeCategory === category.id }"
      >
        <h3>{{ category.name }}</h3>
        <p>{{ category.description }}</p>
      </div>
    </div>

    <div class="formulas-content">
      <div class="formula-nav">
        <h3>Formulas</h3>
        
        <div class="formulas-list-container">
          <ul class="formula-list">
            <li
              v-for="formula in filteredFormulas"
              :key="formula.id"
              :class="{
                active: activeFormula === formula.id,
                'coming-soon': formula.comingSoon,
              }"
            >
              <button
                @click="setActiveFormula(formula.id)"
                :disabled="formula.comingSoon"
              >
                <span class="formula-name">{{ formula.name }}</span>
                <span class="formula-description">{{ formula.description }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="formula-container">
        <div class="formula-header">
          <h2>
            {{ getFormulaById(activeFormula)?.name }}
            <span class="category-badge">
              {{ getCategoryForFormula(activeFormula)?.name }}
            </span>
          </h2>
        </div>

        <div v-if="!hasActiveFormula" class="coming-soon-message">
          <h3>Stay tuned, this will update soon!</h3>
          <p>We're working on adding formulas for this category.</p>
        </div>
        <div v-else class="formula-docs">
          <div v-html="currentFormula.html" class="markdown-content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin: 0 auto 2rem auto;
  padding: 0 1rem;
}

.category-tile {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-tile:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.category-tile.active {
  border-color: hsla(160, 100%, 37%, 1);
  background-color: rgba(0, 128, 0, 0.1);
}

.category-tile h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-heading);
}

.category-tile p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.formulas-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  gap: 2rem;
}

.formula-nav {
  flex: 0 0 320px;
  background-color: var(--color-background-soft);
  padding: 1.25rem;
  border-radius: 8px;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border);
}

.formula-nav h3 {
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: var(--color-heading);
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
  font-size: 1.2rem;
}

.formulas-list-container {
  display: flex;
  flex-direction: column;
}

.formula-list {
  list-style: none;
  padding: 0.75rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formula-list li {
  padding: 0;
  margin: 0;
  border-radius: 6px;
}

.formula-list li button {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.formula-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.formula-description {
  font-size: 0.85rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.formula-list li:not(.coming-soon) button:hover {
  background-color: var(--color-background-mute);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.formula-list li.active button {
  background-color: rgba(0, 128, 0, 0.15);
  border-left: 4px solid hsla(160, 100%, 37%, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.formula-list li.coming-soon button {
  color: var(--color-text-light);
  cursor: not-allowed;
  font-style: italic;
  opacity: 0.7;
  background-color: var(--color-background-soft);
}

.formula-list li.coming-soon .formula-name::after {
  content: ' (Coming Soon)';
  font-size: 0.8em;
  opacity: 0.8;
  font-weight: normal;
}

.formula-container {
  flex: 1;
}

.formula-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.formula-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.category-badge {
  font-size: 0.8rem;
  font-weight: normal;
  background-color: hsla(160, 100%, 37%, 0.2);
  color: hsla(160, 100%, 37%, 1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
}

.formula-docs {
  background-color: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
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

.scroll-top-button {
  display: none;
  position: fixed;
  bottom: 80px; /* Position above feedback button */
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.arrow-up {
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
}

.scroll-top-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.coming-soon-message {
  text-align: center;
  padding: 3rem 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px dashed var(--color-border);
}

.coming-soon-message h3 {
  color: hsla(160, 100%, 37%, 1);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.coming-soon-message p {
  color: var(--color-text-light);
  font-size: 1.1rem;
}

@media (min-width: 1024px) {
  .formulas {
    min-height: 100vh;
    padding: 2rem 0;
  }
}

@media (max-width: 768px) {
  .category-tiles {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .category-tile {
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .category-tile p {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .formulas-content {
    flex-direction: column;
  }

  .formula-nav {
    flex: 0 0 auto;
    position: static;
    max-height: none;
    width: 100%;
  }

  .formula-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .formula-list li button {
    height: 100%;
    min-height: 80px;
  }
  
  .scroll-top-button {
    display: flex;
  }
}

@media (max-width: 480px) {
  .formula-list {
    grid-template-columns: 1fr;
  }

  .formula-header h2 {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .category-badge {
    align-self: flex-start;
  }
}
</style>
