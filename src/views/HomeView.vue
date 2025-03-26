<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home">
    <div class="hero">
      <h1>HAM Radio Calculators</h1>
      <p class="tagline">Essential tools for amateur radio operators</p>
      
      <div class="cta-buttons">
        <RouterLink to="/calculators" class="cta-button primary">
          Try Our Calculators
        </RouterLink>
        <RouterLink to="/about" class="cta-button secondary">
          Learn More
        </RouterLink>
      </div>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">📡</div>
        <h3>Characteristic Impedance</h3>
        <p>Calculate impedance for magnet wires with different diameters and insulation types.</p>
        <RouterLink to="/calculators" class="feature-link">Try it now</RouterLink>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📏</div>
        <h3>Coming Soon: Antenna Length</h3>
        <p>Calculate the optimal length for various antenna types based on frequency.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🧮</div>
        <h3>Coming Soon: Coil Inductance</h3>
        <p>Determine the inductance of coils based on dimensions and winding specifications.</p>
      </div>
    </div>
    
    <div class="about-section">
      <h2>About HAM Radio Calculators</h2>
      <p>
        Our calculators are designed to help amateur radio enthusiasts with common calculations
        needed for building and operating radio equipment. Whether you're designing transmission
        lines, antennas, or other components, our tools can help you get accurate results quickly.
      </p>
      <p>
        All calculations use industry-standard formulas and provide clear explanations of the
        parameters involved.
      </p>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 2rem 1rem 3rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.tagline {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.cta-button {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
  transition: all 0.3s ease;
}

.cta-button.primary {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
}

.cta-button.primary:hover {
  background-color: hsla(160, 100%, 30%, 1);
}

.cta-button.secondary {
  border: 2px solid hsla(160, 100%, 37%, 1);
  color: hsla(160, 100%, 37%, 1);
}

.features {
  display: grid;
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.feature-card p {
  margin-bottom: 1rem;
}

.feature-link {
  display: inline-block;
  font-weight: bold;
}

.about-section {
  background-color: var(--color-background-mute);
  border-radius: 8px;
  padding: 2rem;
}

.about-section h2 {
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.about-section p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .cta-buttons {
    flex-direction: row;
    justify-content: center;
  }
  
  .features {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .hero {
    padding: 4rem 2rem;
  }
  
  .hero h1 {
    font-size: 3rem;
  }
}
</style>
