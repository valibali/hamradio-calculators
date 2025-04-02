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
      activeCalculator: 'twinlead'
    }
  },
  mounted() {
    // Check if there's a calculator parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const calculator = urlParams.get('calculator');
    if (calculator && ['twinlead', 'twistedpair', 'singleconductor'].includes(calculator)) {
      this.activeCalculator = calculator;
    }
  },
  methods: {
    setActiveCalculator(calculator: string) {
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
    }
  }
}
</script>

<template>
  <div class="calculators">
    <h1>HAM Radio Calculators</h1>
    
    <div class="calculators-content">
      <div class="calculator-nav">
        <h3>Available Calculators</h3>
        <ul>
          <li :class="{ active: activeCalculator === 'twinlead' }">
            <button @click="setActiveCalculator('twinlead')">
              Twin Lead Magnet Wire Characteristic Impedance
            </button>
          </li>
          <li :class="{ active: activeCalculator === 'twistedpair' }">
            <button @click="setActiveCalculator('twistedpair')">
              Twisted Pair Magnet Wire Characteristic Impedance
            </button>
          </li>
          <li :class="{ active: activeCalculator === 'singleconductor' }">
            <button @click="setActiveCalculator('singleconductor')">
              Single Conductor Above Ground Plane
            </button>
          </li>
          <!-- Add more calculators here as they become available -->
          <li class="coming-soon">
            <button disabled>Antenna Length Calculator</button>
          </li>
          <li class="coming-soon">
            <button disabled>Coil Inductance Calculator</button>
          </li>
          <li class="coming-soon">
            <button disabled>Power and SWR Calculator</button>
          </li>
          <li class="coming-soon">
            <button disabled>Transmission Line Loss Calculator</button>
          </li>
        </ul>
      </div>
      
      <div class="calculator-container">
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
  flex: 0 0 280px;
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

.calculator-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calculator-nav li {
  padding: 0;
  margin: 0;
  border-radius: 6px;
}

.calculator-nav li button {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.calculator-nav li:not(.coming-soon) button:hover {
  background-color: var(--color-background-mute);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.calculator-nav li.active button {
  background-color: rgba(0, 128, 0, 0.15);
  border-left: 4px solid green;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.calculator-nav li.coming-soon button {
  color: var(--color-text-light);
  cursor: not-allowed;
  font-style: italic;
  opacity: 0.7;
  background-color: var(--color-background-soft);
}

.calculator-nav li.coming-soon button::after {
  content: " (Coming Soon)";
  font-size: 0.8em;
  opacity: 0.8;
}

.calculator-nav li:not(.coming-soon) button::before {
  content: "•";
  margin-right: 8px;
  font-size: 1em;
  color: var(--color-border-hover);
  flex-shrink: 0;
}

.calculator-container {
  flex: 1;
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
  }
  
  .calculator-nav ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .calculator-nav li button {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    min-height: 80px;
  }
  
  .calculator-nav li:not(.coming-soon) button::before {
    margin-right: 0;
    margin-bottom: 0.5rem;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .calculator-nav ul {
    grid-template-columns: 1fr;
  }
}
</style>
