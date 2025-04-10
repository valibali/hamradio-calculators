<script lang="ts">
export default {
  name: 'MathJaxLoader',

  mounted() {
    this.loadMathJax()
  },

  methods: {
    loadMathJax() {
      if (window.MathJax) {
        // If MathJax is already loaded but needs configuration
        if (window.MathJax.Hub) {
          // MathJax v2.x
          window.MathJax.Hub.Config({
            tex2jax: {
              inlineMath: [
                ['$', '$'],
                ['\\(', '\\)'],
              ],
              displayMath: [
                ['$$', '$$'],
                ['\\[', '\\]'],
              ],
              processEscapes: true,
            },
          })
          window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub])
        } else {
          // MathJax v3.x might need reconfiguration
          window.MathJax = {
            ...window.MathJax,
            tex: {
              inlineMath: [
                ['$', '$'],
                ['\\(', '\\)'],
              ],
              displayMath: [
                ['$$', '$$'],
                ['\\[', '\\]'],
              ],
              processEscapes: true,
            },
            options: {
              enableMenu: false,
            },
          }
        }
        return
      }

      // Configure MathJax before loading the script
      window.MathJax = {
        tex: {
          inlineMath: [
            ['$', '$'],
            ['\\(', '\\)'],
          ],
          displayMath: [
            ['$$', '$$'],
            ['\\[', '\\]'],
          ],
          processEscapes: true,
          processEnvironments: true,
        },
        svg: {
          fontCache: 'global',
        },
        startup: {
          typeset: true,
          elements: [document.body],
        },
        options: {
          enableMenu: false,
          processHtmlClass: 'markdown-content',
        },
      }

      // Create and append the script
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
      script.async = true

      // Add event listener to retry typesetting if needed
      script.onload = () => {
        console.log('MathJax script loaded')
        setTimeout(() => {
          if (window.MathJax) {
            console.log('Attempting to typeset with MathJax')
            if (window.MathJax.typesetPromise) {
              window.MathJax.typesetPromise()
                .then(() => console.log('MathJax typesetting complete'))
                .catch((err: Error) => console.error('MathJax typeset error:', err))
            } else if (window.MathJax.typeset) {
              window.MathJax.typeset()
              console.log('MathJax typeset called')
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
              window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub])
              console.log('MathJax Hub Queue called')
            }
          }
        }, 1000)
      }

      document.head.appendChild(script)
    },
  },
}
</script>
