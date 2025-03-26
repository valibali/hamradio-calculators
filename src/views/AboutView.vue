<template>
  <div class="about">
    <h1>About HAM Radio Calculators</h1>
    <div class="about-content">
      <p>
        This application provides a collection of useful calculators for amateur radio operators (HAM radio).
        The calculators are designed to help with various calculations commonly needed in HAM radio operations.
      </p>
      
      <h2>Characteristic Impedance Calculator</h2>
      <p>
        The characteristic impedance calculator helps determine the impedance of transmission lines made with
        magnet wires. It uses the formula:
      </p>
      <div class="formula">Z₀ = 276 × log₁₀(2s/d)</div>
      <p>Where:</p>
      <ul>
        <li>Z₀ is the characteristic impedance in ohms (Ω)</li>
        <li>s is the spacing between conductors</li>
        <li>d is the wire diameter including insulation</li>
      </ul>
      
      <h2>About Amateur Radio</h2>
      <p>
        Amateur radio, also known as ham radio, is a hobby and service that brings people, electronics, and
        communication together. People use ham radio to talk across town, around the world, or even into space,
        all without the Internet or cell phones.
      </p>
      
      <p>
        This application is designed to assist HAM radio operators with common calculations needed for
        building and operating radio equipment.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  margin-bottom: 2rem;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.formula {
  font-family: monospace;
  background-color: var(--color-background-soft);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  text-align: center;
  font-size: 1.2rem;
}

ul {
  margin: 1rem 0;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.5rem;
}
</style>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
