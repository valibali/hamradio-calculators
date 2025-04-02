<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home">
    <div class="hero">
      <h1>HA5XB op. Balazs</h1>
      <p class="tagline">Amateur Radio Station & Resources</p>

      <div class="cta-buttons">
        <RouterLink to="/calculators" class="cta-button primary">Explore Resources</RouterLink>
        <RouterLink to="/about" class="cta-button secondary">About Me</RouterLink>
      </div>
    </div>

    <div class="content-categories">
      <h2>Explore My Ham Radio World</h2>
      
      <div class="category-grid">
        <div class="category-card">
          <div class="category-icon">🧮</div>
          <h3>Calculators</h3>
          <p>Essential tools for amateur radio operators including impedance calculators, antenna length, and more.</p>
          <RouterLink to="/calculators" class="category-link">View Calculators</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">📖</div>
          <h3>My Story</h3>
          <p>Learn about my journey in amateur radio and how I got started in this fascinating hobby.</p>
          <RouterLink to="/my-story" class="category-link">Read More</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">📡</div>
          <h3>My Rig</h3>
          <p>Explore my radio equipment setup, antennas, and station configuration.</p>
          <RouterLink to="/my-rig" class="category-link">See My Setup</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">🔧</div>
          <h3>Homebrew Stuff</h3>
          <p>DIY projects, custom-built equipment, and homebrew solutions for amateur radio.</p>
          <RouterLink to="/homebrew" class="category-link">View Projects</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">🛒</div>
          <h3>For Sale</h3>
          <p>Ham radio equipment and components available for purchase or trade.</p>
          <RouterLink to="/for-sale" class="category-link">Browse Items</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">📝</div>
          <h3>Articles</h3>
          <p>Technical articles, guides, and insights about amateur radio topics.</p>
          <RouterLink to="/articles" class="category-link">Read Articles</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">📓</div>
          <h3>My Log</h3>
          <p>Records of my contacts, QSOs, and radio activities over the years.</p>
          <RouterLink to="/my-log" class="category-link">View Log</RouterLink>
        </div>

        <div class="category-card">
          <div class="category-icon">📊</div>
          <h3>Hamledger - The Logger</h3>
          <p>A powerful logging tool for amateur radio operators to track contacts and activities.</p>
          <RouterLink to="/hamledger" class="category-link">Try Hamledger</RouterLink>
        </div>
      </div>
    </div>

    <div class="featured-section">
      <h2>Featured Calculators</h2>
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
    </div>

    <div class="about-section">
      <h2>About HA5XB Amateur Radio Station</h2>
      <p>
        Welcome to my amateur radio website! I'm passionate about all aspects of ham radio, from
        technical calculations to building equipment and making contacts around the world.
      </p>
      <p>
        This site serves as a hub for various resources I've developed and collected over the years,
        including calculators, articles, project documentation, and more. Whether you're a seasoned
        ham or just getting started, I hope you'll find something useful here.
      </p>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.content-categories {
  margin-bottom: 3rem;
}

.content-categories h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--color-heading);
}

.category-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(1, 1fr);
}

.category-card {
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.category-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.category-card h3 {
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.category-card p {
  margin-bottom: 1rem;
  flex-grow: 1;
}

.category-link {
  display: inline-block;
  font-weight: bold;
  color: hsla(160, 100%, 37%, 1);
}

.category-link:hover {
  text-decoration: underline;
}

.featured-section {
  margin-bottom: 3rem;
}

.featured-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--color-heading);
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
  color: hsla(160, 100%, 37%, 1);
}

.feature-link:hover {
  text-decoration: underline;
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

@media (min-width: 640px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
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
  
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
