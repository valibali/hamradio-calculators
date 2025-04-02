<script lang="ts">
import TwinLeadCharImp from '../components/TwinLeadCharImp.vue'
import TwistedPairCharImp from '../components/TwistedPairCharImp.vue'
import SingleConductorAboveGroundPlane from '../components/SingleConductorAboveGroundPlane.vue'

export default {
  name: 'CalculatorsView',
  components: {
    TwinLeadCharImp,
    TwistedPairCharImp,
    SingleConductorAboveGroundPlane
  },
  data() {
    return {
      activeCalculator: 'twinlead',
      categories: [
        {
          id: 'transmission-lines',
          name: 'Transmission Lines',
          description: 'Calculate characteristic impedance and parameters for various transmission line types',
          calculators: [
            { 
              id: 'twinlead', 
              name: 'Twin Lead Magnet Wire',
              description: 'Calculate impedance for parallel wire transmission lines'
            },
            { 
              id: 'twistedpair', 
              name: 'Twisted Pair Magnet Wire',
              description: 'Calculate impedance for twisted pair transmission lines'
            },
            { 
              id: 'singleconductor', 
              name: 'Single Conductor Above Ground',
              description: 'Calculate impedance for single wire above ground plane'
            }
          ]
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
              comingSoon: true
            },
            { 
              id: 'yagi', 
              name: 'Yagi-Uda Antenna',
              description: 'Calculate Yagi-Uda antenna dimensions (Coming Soon)',
              comingSoon: true
            }
          ]
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
              comingSoon: true
            },
            { 
              id: 'filter', 
              name: 'Filter Design',
              description: 'Calculate LC filter component values (Coming Soon)',
              comingSoon: true
            }
          ]
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
              comingSoon: true
            },
            { 
              id: 'line-loss', 
              name: 'Line Loss Calculator',
              description: 'Calculate transmission line losses (Coming Soon)',
              comingSoon: true
            }
          ]
        }
      ]
    }
  },
  mounted() {
    // Check if there's a calculator parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const calculator = urlParams.get('calculator');
    
    // Flatten all calculators to check if the requested one exists
    const allCalculators = this.categories.flatMap(category => 
      category.calculators.map(calc => calc.id)
    );
    
    if (calculator && allCalculators.includes(calculator) && 
        !this.getCalculatorById(calculator)?.comingSoon) {
      this.activeCalculator = calculator;
    }
  },
  methods: {
    setActiveCalculator(calculator: string) {
      // Don't set if it's a coming soon calculator
      if (this.getCalculatorById(calculator)?.comingSoon) {
        return;
      }
      
      this.activeCalculator = calculator;
      // Update URL without reloading the page
      const url = new URL(window.location.href);
      url.searchParams.set('calculator', calculator);
      window.history.pushState({}, '', url);
      
      // On mobile, scroll to the calculator content
      if (window.innerWidth <= 768) {
        // Use setTimeout to ensure the DOM has updated with the new calculator
        setTimeout(() => {
          const calculatorContainer = document.querySelector('.calculator-container');
          if (calculatorContainer) {
            calculatorContainer.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    },
    
    getCalculatorById(id: string) {
      for (const category of this.categories) {
        const calculator = category.calculators.find(calc => calc.id === id);
        if (calculator) {
          return calculator;
        }
      }
      return null;
    },
    
    getCategoryForCalculator(calculatorId: string) {
      return this.categories.find(category => 
        category.calculators.some(calc => calc.id === calculatorId)
      );
    }
  }
}
</script>

<template>
  <div class="calculators">
    <h1>HAM Radio Calculators</h1>
    
    <div class="calculators-content">
      <div class="calculator-nav">
        <h3>Calculator Categories</h3>
        
        <div class="categories-container">
          <div v-for="category in categories" :key="category.id" class="category">
            <div class="category-header">
              <h4>{{ category.name }}</h4>
              <p class="category-description">{{ category.description }}</p>
            </div>
            
            <ul class="calculator-list">
              <li 
                v-for="calculator in category.calculators" 
                :key="calculator.id"
                :class="{ 
                  active: activeCalculator === calculator.id,
                  'coming-soon': calculator.comingSoon 
                }"
              >
                <button 
                  @click="setActiveCalculator(calculator.id)"
                  :disabled="calculator.comingSoon"
                >
                  <span class="calculator-name">{{ calculator.name }}</span>
                  <span class="calculator-description">{{ calculator.description }}</span>
                </button>
              </li>
            </ul>
          </div>
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
        
        <TwinLeadCharImp v-if="activeCalculator === 'twinlead'" />
        <TwistedPairCharImp v-if="activeCalculator === 'twistedpair'" />
        <SingleConductorAboveGroundPlane v-if="activeCalculator === 'singleconductor'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}

.category-header {
  background-color: var(--color-background-mute);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.category-header h4 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.category-description {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-light);
  line-height: 1.4;
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
  content: " (Coming Soon)";
  font-size: 0.8em;
  opacity: 0.8;
  font-weight: normal;
}

.calculator-container {
  flex: 1;
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
  text-align: center;
}

@media (min-width: 1024px) {
  .calculators {
    min-height: 100vh;
    padding: 2rem 0;
  }
}

@media (max-width: 768px) {
  .calculators-content {
    flex-direction: column;
  }
  
  .calculator-nav {
    flex: 0 0 auto;
    position: static;
    max-height: none;
    width: 100%;
  }
  
  .categories-container {
    gap: 1rem;
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
