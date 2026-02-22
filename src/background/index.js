import extConfig from '@/extension.config.js';

if(extConfig.isDev) {
    // Modo de desarrollo
    const timestamps = new Date().toISOString(); 
    console.log('Inicializando [SERVICE WORKER] extensión QFill (DEV)... ');
    console.log('Timestamps: ' + timestamps);
}

// Almacenamiento 
let selectElementItem = null;

// !! Escuchar mensajes del default_popup o content_scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("Message Recibio:", msg);
    const { type, desc, payload } = msg;
    console.log("Ejecutando acción:", desc);

    if(type.contains("popup.ui")) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { 
                event: payload.event, 
                action: payload.action,
                data: payload.data,
            }, 
            (response) => {
                sendResponse(response);
            });
        });
    }

    return true; // importante para async
});