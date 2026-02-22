import extConfig from '@/extension.config.js'
import constants from '@/constants.config.js'
import { sendToActiveTab, dispatchToActiveTab } from '@/helpers.config.js'

if(extConfig.isDev) {
    // Modo de desarrollo
    const timestamps = new Date().toISOString(); 
    console.log('Inicializando [SERVICE WORKER] extensión QFill (DEV)... ');
    console.log('Timestamps: ' + timestamps);
}

// Almacenamiento 
let selectElementItem = null;

// !! Escuchar mensajes del default_popup o content_scripts
chrome.runtime.onMessage.addListener( (msg, sender, sendResponse) => {
    
    switch (msg.type) {
        case constants.CONNECT: {
            console.log('Conexión establecida entre (default_popup o content_scripts) y (content_scripts y service_worker/background) ');
            sendResponse({ status: 'Conectado.'});
            break;
        }

        // Eventos que manipula el DOM
        case constants.SCAN_INPUTS:
        case constants.FILL_INPUT_BY_ID: 
        case constants.FILL_ALL_INPUTS: 
        case constants.SELECTOR_MODE_ENABLE: 
        case constants.SELECTOR_MODE_SET_ITEM: 
        case constants.SELECTOR_MODE_GET_ITEM: 
        {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, msg, sendResponse);
            });
            break;
        }

        default: {
            console.log("Tipo de mensaje no reconocida: ", msg);
            sendResponse({ status: 'ok' });
            break;
        }

    }

    return true; // importante para async
});