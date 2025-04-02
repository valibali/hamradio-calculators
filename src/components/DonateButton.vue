<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

// Prevent dropdown from closing when clicking on options
const handleOptionClick = (event: Event) => {
  event.stopPropagation()
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const container = document.querySelector('.donate-container')
  
  if (container && !container.contains(target)) {
    closeDropdown()
  }
}

// Add and remove event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="donate-container">
    <div v-if="isOpen" class="donate-dropdown" @click="handleOptionClick">
      <a href="https://thanks.dev/u/gh/valibali" target="_blank" rel="noopener noreferrer" class="donate-option">
        <span class="donate-option-icon">🙏</span>
        <span class="donate-option-text">thanks.dev</span>
      </a>
      <a href="https://ko-fi.com/balazsvalkony" target="_blank" rel="noopener noreferrer" class="donate-option">
        <span class="donate-option-icon">☕</span>
        <span class="donate-option-text">Ko-fi</span>
      </a>
    </div>
    
    <button @click="toggleDropdown" class="donate-button" aria-haspopup="true" :aria-expanded="isOpen">
      <span class="donate-icon">❤️</span>
      <span class="donate-text">Donate</span>
    </button>
  </div>
</template>

<style scoped>
.donate-container {
  position: relative;
  display: inline-block;
}

.donate-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.donate-button:hover {
  background-color: #2980b9;
}

.donate-icon {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.donate-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 180px;
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.donate-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  color: var(--color-text);
  text-decoration: none;
  transition: background-color 0.2s;
}

.donate-option:hover {
  background-color: var(--color-background-soft);
}

.donate-option:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.donate-option-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .donate-text {
    display: none;
  }
  
  .donate-button {
    padding: 0.5rem;
  }
}
</style>
