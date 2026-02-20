import { createApp } from 'vue'
import App from './views/App.vue'

// Modo de desarrollo
const timestamps = new Date().toISOString(); 
alert('Inicializando [CONTENT SCRIPTS] extensión QFill (DEV)... ');
console.log('Timestamps: ' + timestamps);
console.log('[CRXJS] Hello world from content script!');

/**
 * Mount the Vue app to the DOM.
 */
function mountApp() {
  const container = document.createElement('div')
  container.id = 'crxjs-app'
  document.body.appendChild(container)
  const app = createApp(App)
  app.mount(container)
}

mountApp()
