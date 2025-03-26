<script lang="ts">
import TwinLeadCharImp from '../components/TwinLeadCharImp.vue'
import TwistedPairCharImp from '../components/TwistedPairCharImp.vue'

export default {
  name: 'CalculatorsView',
  components: {
    TwinLeadCharImp,
    TwistedPairCharImp
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
    if (calculator && ['twinlead', 'twistedpair'].includes(calculator)) {
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
          <li 
            :class="{ active: activeCalculator === 'twinlead' }"
            @click="setActiveCalculator('twinlead')"
          >
            Twin Lead Magnet Wire Characteristic Impedance
          </li>
          <li 
            :class="{ active: activeCalculator === 'twistedpair' }"
            @click="setActiveCalculator('twistedpair')"
          >
            Twisted Pair Magnet Wire Characteristic Impedance
          </li>
          <!-- Add more calculators here as they become available -->
          <li class="coming-soon">Antenna Length Calculator</li>
          <li class="coming-soon">Coil Inductance Calculator</li>
          <li class="coming-soon">Power and SWR Calculator</li>
          <li class="coming-soon">Transmission Line Loss Calculator</li>
        </ul>
      </div>
      
      <div class="calculator-container">
        <TwinLeadCharImp v-if="activeCalculator === 'twinlead'" />
        <TwistedPairCharImp v-if="activeCalculator === 'twistedpair'" />
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
  flex: 0 0 250px;
  background-color: var(--color-background-soft);
  padding: 1rem;
  border-radius: 8px;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.calculator-nav h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.calculator-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.calculator-nav li {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.calculator-nav li.active {
  background-color: var(--color-background-mute);
  font-weight: bold;
}

.calculator-nav li.coming-soon {
  color: var(--color-text-light);
  cursor: not-allowed;
  font-style: italic;
}

.calculator-nav li.coming-soon::after {
  content: " (Coming Soon)";
  font-size: 0.8em;
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
}
</style>
