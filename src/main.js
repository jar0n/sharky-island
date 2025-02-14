import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupThree } from './plugins/three'

// Initialize Three.js
setupThree()

const app = createApp(App)

app.use(router)

app.mount('#app')
