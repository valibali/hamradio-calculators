<script lang="ts">
export default {
  name: 'MathJaxLoader',
  
  mounted() {
    this.loadMathJax();
  },
  
  methods: {
    loadMathJax() {
      if (window.MathJax) {
        return;
      }
      
      // Configure MathJax before loading the script
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']]
        },
        svg: {
          fontCache: 'global'
        },
        startup: {
          typeset: true
        }
      };
      
      // Create and append the script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }
}
</script>

<template>
  <!-- This component doesn't render anything, it just loads MathJax -->
</template>
