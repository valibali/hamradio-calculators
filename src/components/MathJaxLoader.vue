<script lang="ts">
export default {
  name: 'MathJaxLoader',
  
  mounted() {
    this.loadMathJax();
  },
  
  methods: {
    loadMathJax() {
      if (window.MathJax) {
        // If MathJax is already loaded but needs configuration
        if (window.MathJax.Hub) {
          // MathJax v2.x
          window.MathJax.Hub.Config({
            tex2jax: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              processEscapes: true
            }
          });
          window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        } else {
          // MathJax v3.x might need reconfiguration
          window.MathJax = {
            ...window.MathJax,
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              processEscapes: true
            },
            options: {
              enableMenu: false
            }
          };
        }
        return;
      }
      
      // Configure MathJax before loading the script
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true
        },
        svg: {
          fontCache: 'global'
        },
        startup: {
          typeset: true
        },
        options: {
          enableMenu: false
        }
      };
      
      // Create and append the script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      
      // Add event listener to retry typesetting if needed
      script.onload = () => {
        setTimeout(() => {
          if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise()
              .catch(err => console.error('MathJax typeset error:', err));
          }
        }, 500);
      };
      
      document.head.appendChild(script);
    }
  }
}
</script>

<template>
  <!-- This component doesn't render anything, it just loads MathJax -->
</template>
