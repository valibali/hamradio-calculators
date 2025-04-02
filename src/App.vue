<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import IconGitHub from '@/components/icons/IconGitHub.vue'
</script>

<template>
  <Analytics />
  <SpeedInsights />
  <header>
    <div class="header-content">
      <div class="logo-container">
        <img alt="HAM Radio logo" class="logo" src="@/assets/logo.svg" width="50" height="50" />
        <span class="site-title">HA5XB Radioamateur Homepage</span>
      </div>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/calculators">Calculators</RouterLink>
        <RouterLink to="/formulas">Formulas</RouterLink>
        <a 
          href="https://github.com/valibali/hamradio-calculators/issues/new" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="feedback-link"
        >
          <IconGitHub class="github-icon" />
          Got any feedback?
        </a>
      </nav>
    </div>
  </header>

  <RouterView />

  <footer>
    <div class="footer-content">
      <p>&copy; {{ new Date().getFullYear() }} HA5XB Radioamateur Website</p>
      <p>Tools for amateur radio enthusiasts</p>
    </div>
  </footer>
</template>

<style scoped>
header {
  background-color: var(--color-background-soft);
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.site-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-heading);
}

.logo {
  display: block;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
}

nav a.router-link-active {
  color: hsla(160, 100%, 37%, 1);
  font-weight: bold;
}

.feedback-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.feedback-link:hover {
  background-color: hsla(160, 100%, 30%, 1);
}

.github-icon {
  display: inline-block;
}

footer {
  background-color: var(--color-background-soft);
  padding: 2rem 1rem;
  margin-top: 4rem;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content p {
  margin: 0.5rem 0;
  color: var(--color-text-light-2);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  nav {
    width: 100%;
    justify-content: center;
  }
}
</style>
