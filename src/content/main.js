import { createApp } from 'vue'
import extConfig from '../extension.config.js'
import { MESSAGE_TYPES, ACTIONS } from '../constants.config.js'
import extensionState from '../extensionState.config.js'
import { sendMessage, dispatchRuntime, dispatchToBackground } from '@/helpers.config.js'

import App from './views/App.vue'
import './addListener.js';

if(extConfig.isDev) {
    // Modo de desarrollo
    const timestamps = new Date().toISOString(); 
    alert('Inicializando [CONTENT SCRIPTS] extensión QFill (DEV)... ');
    console.log('Timestamps: ' + timestamps);
    console.log('[CRXJS] Hello world from content script!');

    (async() => {
        await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
    })();

    document.qFill = {
        ver: () => console.log('Estado:', extensionState.get()),
        reset: async () => await extensionState.reset('all'),
        guardarPrueba: async () => {
            await extensionState.set('modoSelector.itemSeleccionado', {
                id: 'test-input',
                value: 'valor de prueba'
            });
            console.log('Datos de prueba guardados');
        },
        limpiar: async () => await extensionState.clearTemp()
    };
}


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
