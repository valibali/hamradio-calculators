<script setup lang="ts">
import CharacteristicImpedanceCalculator from '../components/CharacteristicImpedanceCalculator.vue'
</script>

<template>
  <div class="calculators">
    <h1>HAM Radio Calculators</h1>
    <p class="intro">
      A collection of useful calculators for HAM radio operators. Select a calculator from the options below.
    </p>
    
    <CharacteristicImpedanceCalculator />
    
    <div class="coming-soon">
      <h3>More Calculators Coming Soon</h3>
      <ul>
        <li>Antenna Length Calculator</li>
        <li>Coil Inductance Calculator</li>
        <li>Power and SWR Calculator</li>
        <li>Transmission Line Loss Calculator</li>
      </ul>
    </div>
  </div>
</template>

<style>
.calculators {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.intro {
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.coming-soon {
  margin-top: 3rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border-left: 4px solid hsla(160, 100%, 37%, 1);
}

.coming-soon h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.coming-soon ul {
  padding-left: 1.5rem;
}

.coming-soon li {
  margin-bottom: 0.5rem;
}

@media (min-width: 1024px) {
  .calculators {
    padding: 0 2rem;
  }
}
</style>
