import extConfig from '../extension.config.js'
import handleMessages from './handleMessages.js'
import extensionState from '../extensionState.config.js'

if(extConfig.isDev) {
    // Modo de desarrollo
    const timestamps = new Date().toISOString(); 
    console.log('Inicializando [SERVICE WORKER] extensión QFill (DEV)... ');
    console.log('Timestamps: ' + timestamps);
    (async () => {
        //await extensionState.reset();
        await extensionState.debugEstado();
    })();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            const resultado = await handleMessages(message, sender);
            console.log("Resultado de background:", {message, resultado});
            sendResponse(resultado);
        } catch (error) {
            console.log("Hubo un error en background:", error);
            sendResponse({ error: error.message });
        }
    })();
    
    return true;
});