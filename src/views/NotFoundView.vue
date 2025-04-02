<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const path = route.path

const goBack = () => {
  router.go(-1)
}
</script>

<template>
  <div class="not-found">
    <div class="content">
      <div class="error-code">404</div>
      <h1>Page Not Found</h1>
      <div class="divider"></div>
      <p class="message">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <p class="path">
        <span class="path-label">Path:</span> 
        <code>{{ path }}</code>
      </p>
      <div class="actions">
        <button @click="goBack" class="back-button">Go Back</button>
        <RouterLink to="/" class="home-button">Return to Home</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
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

.error-code {
  font-size: 6rem;
  font-weight: bold;
  color: hsla(160, 100%, 37%, 0.7);
  line-height: 1;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.divider {
  height: 4px;
  width: 60px;
  background-color: hsla(160, 100%, 37%, 1);
  margin: 1.5rem auto;
  border-radius: 2px;
}

.message {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.path {
  background-color: var(--color-background-mute);
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  text-align: left;
  overflow-wrap: break-word;
}

.path-label {
  font-weight: bold;
  margin-right: 0.5rem;
}

code {
  font-family: monospace;
  color: hsla(160, 100%, 37%, 1);
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.back-button, .home-button {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button {
  background-color: var(--color-background-mute);
  border: none;
  color: var(--color-text);
}

.back-button:hover {
  background-color: var(--color-background-mute-2);
}

.home-button {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  text-decoration: none;
}

.home-button:hover {
  background-color: hsla(160, 100%, 30%, 1);
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
  }
  
  .error-code {
    font-size: 4rem;
  }
  
  h1 {
    font-size: 2rem;
  }
}
</style>
