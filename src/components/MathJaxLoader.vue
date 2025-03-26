<script setup lang="ts">
import { onMounted } from 'vue'

// Function to load MathJax
const loadMathJax = () => {
  if (window.MathJax) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
    script.async = true
    script.onload = () => {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']]
        },
        svg: {
          fontCache: 'global'
        }
      }
      resolve()
    }
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  await loadMathJax()
})
</script>

<template>
  <!-- This component doesn't render anything, it just loads MathJax -->
</template>
