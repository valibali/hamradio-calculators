<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import IconGitHub from '@/components/icons/IconGitHub.vue'
import DonateButton from '@/components/DonateButton.vue'
import { ref, onMounted, onUnmounted } from 'vue'

// Scroll to top button logic
const showScrollTopButton = ref(false)

const handleScroll = () => {
  // Only show button on mobile
  if (window.innerWidth <= 768) {
    showScrollTopButton.value = window.scrollY > 300
  } else {
    showScrollTopButton.value = false
  }
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Analytics />
  <SpeedInsights />
  
  <button 
    v-show="showScrollTopButton" 
    @click="scrollToTop" 
    class="scroll-top-button"
    aria-label="Scroll to top"
  >
    <span class="arrow-up">↑</span>
  </button>
  
  <header>
    <div class="header-content">
      <div class="logo-container">
        <img alt="HAM Radio logo" class="logo" src="@/assets/logo.svg" width="50" height="50" />
        <span class="site-title">HA5XB Hungarian Amateur Radio Station</span>
      </div>

      <div class="nav-container">
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/calculators">Calculators</RouterLink>
          <RouterLink to="/formulas">Formulas</RouterLink>
          <RouterLink to="/my-story">My Story</RouterLink>
          <RouterLink to="/my-rig">My Rig</RouterLink>
          <RouterLink to="/homebrew">Homebrew</RouterLink>
        </nav>

        <div class="action-buttons">
          <DonateButton class="donate-btn" />

          <a
            href="https://github.com/valibali/hamradio-calculators/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            class="feedback-link"
            aria-label="Provide feedback on GitHub"
          >
            <IconGitHub class="github-icon" />
            <span class="feedback-text">Got any feedback?</span>
          </a>
        </div>
      </div>
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
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
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

.nav-container {
  display: flex;
  align-items: center;
  flex-grow: 1;
  justify-content: flex-end;
}

nav {
  display: flex;
  gap: 0.8rem;
  margin-right: 1rem;
}

nav a {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: border-color 0.3s;
}

nav a:hover {
  border-color: hsla(160, 100%, 37%, 1);
}

nav a.router-link-active {
  color: hsla(160, 100%, 37%, 1);
  font-weight: bold;
}

.action-buttons {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 100;
}

.donate-btn {
  align-self: flex-end;
}

.feedback-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px 0 0 4px;
  transition:
    background-color 0.3s,
    transform 0.2s;
}

.feedback-link:hover {
  background-color: hsla(160, 100%, 30%, 1);
  transform: translateX(-5px);
}

.github-icon {
  display: inline-block;
}

.feedback-text {
  display: inline;
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

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .nav-container {
    width: 100%;
    justify-content: center;
  }

  nav {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    margin-right: 0;
  }

  .action-buttons {
    flex-direction: row;
    bottom: 20px;
    top: auto;
    transform: none;
    right: 0;
  }

  .donate-btn {
    align-self: center;
  }

  .feedback-link {
    border-radius: 4px 0 0 4px;
  }

  .feedback-text {
    display: none;
  }
  
  .scroll-top-button {
    display: flex;
  }
}
</style>
