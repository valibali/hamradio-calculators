<script lang="ts">
import { defineComponent } from 'vue'
import TwinLeadCharImp from '../components/TwinLeadCharImp.vue'
import TwistedPairCharImp from '../components/TwistedPairCharImp.vue'
import SingleConductorAboveGroundPlane from '../components/SingleConductorAboveGroundPlane.vue'

interface Calculator {
  id: string
  name: string
  description: string
  comingSoon?: boolean
  categoryId?: string
}

interface Category {
  id: string
  name: string
  description: string
  calculators: Calculator[]
}

export default defineComponent({
  name: 'CalculatorsView',
  components: {
    TwinLeadCharImp,
    TwistedPairCharImp,
    SingleConductorAboveGroundPlane,
  },
  data() {
    return {
      activeCalculator: 'twinlead',
      activeCategory: 'transmission-lines',
      categories: [
        {
          id: 'transmission-lines',
          name: 'Transmission Lines',
          description:
            'Calculate characteristic impedance and parameters for various transmission line types',
          calculators: [
            {
              id: 'twinlead',
              name: 'Twin Lead Magnet Wire',
              description: 'Calculate impedance for parallel wire transmission lines',
            },
            {
              id: 'twistedpair',
              name: 'Twisted Pair Magnet Wire',
              description: 'Calculate impedance for twisted pair transmission lines',
            },
            {
              id: 'singleconductor',
              name: 'Single Conductor Above Ground',
              description: 'Calculate impedance for single wire above ground plane',
            },
          ],
        },
        {
          id: 'antennas',
          name: 'Antennas',
          description: 'Calculate antenna dimensions, gain, and radiation patterns',
          calculators: [
            {
              id: 'dipole',
              name: 'Dipole Antenna',
              description: 'Calculate dipole antenna length (Coming Soon)',
              comingSoon: true,
            },
            {
              id: 'yagi',
              name: 'Yagi-Uda Antenna',
              description: 'Calculate Yagi-Uda antenna dimensions (Coming Soon)',
              comingSoon: true,
            },
          ],
        },
        {
          id: 'components',
          name: 'Components',
          description: 'Calculate values for inductors, capacitors, and other RF components',
          calculators: [
            {
              id: 'coil',
              name: 'Coil Inductance',
              description: 'Calculate inductance of air-core and toroidal coils (Coming Soon)',
              comingSoon: true,
            },
            {
              id: 'filter',
              name: 'Filter Design',
              description: 'Calculate LC filter component values (Coming Soon)',
              comingSoon: true,
            },
          ],
        },
        {
          id: 'rf-power',
          name: 'RF Power',
          description: 'Calculate power, SWR, and transmission line losses',
          calculators: [
            {
              id: 'swr',
              name: 'SWR Calculator',
              description: 'Calculate SWR, return loss, and reflection coefficient (Coming Soon)',
              comingSoon: true,
            },
            {
              id: 'line-loss',
              name: 'Line Loss Calculator',
              description: 'Calculate transmission line losses (Coming Soon)',
              comingSoon: true,
            },
          ],
        },
      ] as Category[],
    }
  },
  computed: {
    filteredCalculators() {
      const category = this.categories.find((c) => c.id === this.activeCategory)
      return category ? category.calculators : []
    },
    hasActiveCalculator() {
      // Check if there's at least one non-coming-soon calculator in the active category
      const activeCategory = this.categories.find((c) => c.id === this.activeCategory)
      if (!activeCategory) return false

      // Check if the active calculator belongs to this category and is not coming soon
      const calculator = this.getCalculatorById(this.activeCalculator)
      if (calculator && !calculator.comingSoon) {
        const calculatorCategory = this.getCategoryForCalculator(this.activeCalculator)
        if (calculatorCategory && calculatorCategory.id === this.activeCategory) {
          return true
        }
      }

      // Check if there's any non-coming-soon calculator in this category
      return activeCategory.calculators.some((calc) => !calc.comingSoon)
    },
  },
  mounted() {
    // Check if there's a calculator parameter in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const calculator = urlParams.get('calculator')
    const category = urlParams.get('category')


    // Flatten all calculators to check if the requested one exists
    const allCalculators = this.categories.flatMap((category: Category) =>
      category.calculators.map((calc: Calculator) => calc.id),
    )

    if (
      calculator &&
      allCalculators.includes(calculator) &&
      !this.getCalculatorById(calculator)?.comingSoon
    ) {
      this.activeCalculator = calculator

      // Set the active category based on the calculator
      const calculatorCategory = this.getCategoryForCalculator(calculator)
      if (calculatorCategory) {
        this.activeCategory = calculatorCategory.id
      }
    } else if (category && this.categories.some((c) => c.id === category)) {
      this.activeCategory = category
    }
  },
  methods: {

    selectCategory(categoryId: string): void {
      this.activeCategory = categoryId

      // Update URL without reloading the page
      const url = new URL(window.location.href)
      url.searchParams.set('category', categoryId)
      
      // Always select the first calculator in the category
      const category = this.categories.find(c => c.id === categoryId)
      if (category && category.calculators.length > 0) {
        // Get the first calculator in this category
        const firstCalculator = category.calculators[0]
        
        // Update the active calculator
        this.activeCalculator = firstCalculator.id
        
        // Add calculator to URL
        url.searchParams.set('calculator', firstCalculator.id)
      }
      
      window.history.pushState({}, '', url)

      // Only scroll to the nav area on mobile devices
      if (window.innerWidth <= 768) {
        this.$nextTick(() => {
          const navElement = document.querySelector('.calculator-nav')
          if (navElement) {
            // Get header height to adjust scroll position
            const headerHeight = document.querySelector('header')?.offsetHeight || 0
            const navPosition =
              navElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20 // 20px extra padding
            window.scrollTo({
              top: navPosition,
              behavior: 'smooth',
            })
          }
        })
      }
    },

    setActiveCalculator(calculator: string): void {
      // Don't set if it's a coming soon calculator
      if (this.getCalculatorById(calculator)?.comingSoon) {
        return
      }

      this.activeCalculator = calculator

      // Update URL without reloading the page
      const url = new URL(window.location.href)
      url.searchParams.set('calculator', calculator)

      // Also update the category in the URL
      const calculatorCategory = this.getCategoryForCalculator(calculator)
      if (calculatorCategory) {
        this.activeCategory = calculatorCategory.id
        url.searchParams.set('category', calculatorCategory.id)
      }

      window.history.pushState({}, '', url)

      // Only scroll to the calculator content on mobile devices
      if (window.innerWidth <= 768) {
        // Use setTimeout to ensure the DOM has updated with the new calculator
        setTimeout(() => {
          const calculatorContainer = document.querySelector('.calculator-container')
          if (calculatorContainer) {
            calculatorContainer.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    },

    getCalculatorById(id: string): Calculator | null {
      for (const category of this.categories) {
        const calculator = category.calculators.find((calc: Calculator) => calc.id === id)
        if (calculator) {
          return calculator
        }
      }
      return null
    },

    getCategoryForCalculator(calculatorId: string): Category | undefined {
      return this.categories.find((category: Category) =>
        category.calculators.some((calc: Calculator) => calc.id === calculatorId),
      )
    },
  },

})
</script>

<template>
  <div class="calculators">
    <h1>HAM Radio Calculators</h1>


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

    <div class="calculators-content">
      <div class="calculator-nav">
        <h3>Calculators</h3>

        <div class="calculators-list-container">
          <ul class="calculator-list">
            <li
              v-for="calculator in filteredCalculators"
              :key="calculator.id"
              :class="{
                active: activeCalculator === calculator.id,
                'coming-soon': calculator.comingSoon,
              }"
            >
              <button @click="setActiveCalculator(calculator.id)" :disabled="calculator.comingSoon">
                <span class="calculator-name">{{ calculator.name }}</span>
                <span class="calculator-description">{{ calculator.description }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="calculator-container">
        <div class="calculator-header">
          <h2>
            {{ getCalculatorById(activeCalculator)?.name }}
            <span class="category-badge">
              {{ getCategoryForCalculator(activeCalculator)?.name }}
            </span>
          </h2>
        </div>

        <div v-if="!hasActiveCalculator" class="coming-soon-message">
          <h3>Stay tuned, this will update soon!</h3>
          <p>We're working on adding calculators for this category.</p>
        </div>
        <TwinLeadCharImp v-else-if="activeCalculator === 'twinlead'" />
        <TwistedPairCharImp v-else-if="activeCalculator === 'twistedpair'" />
        <SingleConductorAboveGroundPlane v-else-if="activeCalculator === 'singleconductor'" />
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
  font-size: clamp(1rem, 3vw, 1.25rem);
}

.category-tile p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.calculators-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  gap: 2rem;
}

.calculator-nav {
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

.calculator-nav h3 {
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: var(--color-heading);
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
  font-size: 1.2rem;
}

.calculators-list-container {
  display: flex;
  flex-direction: column;
}

.calculator-list {
  list-style: none;
  padding: 0.75rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calculator-list li {
  padding: 0;
  margin: 0;
  border-radius: 6px;
}

.calculator-list li button {
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

.calculator-name {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.calculator-description {
  font-size: 0.85rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.calculator-list li:not(.coming-soon) button:hover {
  background-color: var(--color-background-mute);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.calculator-list li.active button {
  background-color: rgba(0, 128, 0, 0.15);
  border-left: 4px solid hsla(160, 100%, 37%, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.calculator-list li.coming-soon button {
  color: var(--color-text-light);
  cursor: not-allowed;
  font-style: italic;
  opacity: 0.7;
  background-color: var(--color-background-soft);
}

.calculator-list li.coming-soon .calculator-name::after {
  content: ' (Coming Soon)';
  font-size: 0.8em;
  opacity: 0.8;
  font-weight: normal;
}

.calculator-container {
  flex: 1;
  position: relative;
  z-index: 1;
}

.calculator-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.calculator-header h2 {
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

h1 {
  margin-bottom: 2rem;
  margin-top: 0.5rem;
  text-align: center;
  font-size: clamp(1.75rem, 5vw, 2.5rem);
}

.calculators {
  min-height: 100vh;
  padding: 2rem 0;
}

@media (min-width: 1024px) {
  .calculators {
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

  .calculators-content {
    flex-direction: column;
    padding: 0;
  }

  .calculator-nav {
    flex: 0 0 auto;
    position: static;
    max-height: none;
    width: 100%;
  }

  .calculator-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .calculator-list li button {
    height: 100%;
    min-height: 80px;
  }
  
  .calculator-container {
    width: 100%;
    padding: 0;
    margin-bottom: 100px; /* Add space at the bottom for action buttons */
  }
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

@media (max-width: 480px) {
  .calculator-list {
    grid-template-columns: 1fr;
  }

  .calculator-header h2 {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .category-badge {
    align-self: flex-start;
  }

}
</style>
