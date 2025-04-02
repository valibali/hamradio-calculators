<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const pageName = route.path.substring(1) // Remove the leading slash
</script>

<template>
  <div class="coming-soon">
    <div class="content">
      <div class="icon">🚧</div>
      <h1>Coming Soon!</h1>
      <p class="message">
        The <span class="highlight">{{ pageName || 'requested' }}</span> page is under construction.
      </p>
      <p class="sub-message">
        I'm working hard to bring you great content. Please check back later!
      </p>
      <div class="actions">
        <RouterLink to="/" class="home-button">Return to Home</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coming-soon {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 2rem;
}

.content {
  max-width: 600px;
  text-align: center;
  background-color: var(--color-background-soft);
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

h1 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.message {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.highlight {
  color: hsla(160, 100%, 37%, 1);
  font-weight: bold;
}

.sub-message {
  margin-bottom: 2rem;
  color: var(--color-text-light);
}

.actions {
  margin-top: 2rem;
}

.home-button {
  display: inline-block;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: hsla(160, 100%, 30%, 1);
}
</style>
