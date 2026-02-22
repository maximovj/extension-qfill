import extConfig from '@/extension.config.js'
import { MESSAGE_TYPES, ACTIONS } from '@/constants.config.js'
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

    // !! Eventos que manipula el DOM
    if(msg.type === MESSAGE_TYPES.UI_EVENT) {
        switch(msg.action) {
            case ACTIONS.SCAN_INPUTS:
            case ACTIONS.FILL_INPUT_BY_ID: 
            case ACTIONS.FILL_ALL_INPUTS: 
            case ACTIONS.SELECTOR_MODE_ENABLE: 
            case ACTIONS.SELECTOR_MODE_SET_ITEM: 
            case ACTIONS.SELECTOR_MODE_GET_ITEM: 
            {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, msg, sendResponse);
                });
                break;
            }
        }
    // !! Eventos del sistema
    }else if(msg.type === MESSAGE_TYPES.SYSTEM_EVENT) {
        switch(msg.action) {
            case ACTIONS.CONNECT: {
                console.log('Conexión establecida entre (default_popup o content_scripts) y (content_scripts y service_worker/background) ');
                sendResponse({ status: 'Conectado.'});
                break;
            }
        }
    } else {
        console.log("Tipo de mensaje no reconocida: ", msg);
        sendResponse({ status: 'ok' });
    }

    return true; // importante para async
});