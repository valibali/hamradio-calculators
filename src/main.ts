import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { marked } from 'marked'

import App from './App.vue'
import router from './router'
import MathJaxLoader from './components/MathJaxLoader.vue'

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Register the MathJaxLoader as a global component
app.component('MathJaxLoader', MathJaxLoader)

app.mount('#app')
