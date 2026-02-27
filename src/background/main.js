import extConfig from '../extension.config.js'
import handleMessages from './handleMessages.js'
import extensionState from '../extensionState.config.js'
import db from '../indexedDBManager.js';

// Se ejecuta cuando la extensión se instala o actualiza
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true
    });
    (async () => {
        try {
            await db.initDatabase(); // asegura defaults
        } catch (err) {
            console.error("Error inicializando IndexedDB:", err);
        }
    })();
});

//  Se ejecute justo en el momento en que se inicia el navegador 
chrome.runtime.onStartup.addListener(() => {
    (async () => {
        try {
            await db.initDatabase(); // asegura defaults
        } catch (err) {
            console.error("Error inicializando IndexedDB:", err);
        }
    })();
});

// Abrir el sidepanel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

//  Escucha y recibe las comunicaciones que le envían otras partes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            const resultado = await handleMessages(message, sender);
            console.log("Resultado de background:", {message, resultado});
            sendResponse(resultado);
        } catch (error) {
            await extensionState.reset();
            console.log("Hubo un error en background:", error);
            sendResponse({ error: error.message });
        }
    })();
    
    return true;
});

if(extConfig.isDev) {
    // Modo de desarrollo
    const timestamps = new Date().toISOString(); 
    console.log('Inicializando [SERVICE WORKER] extensión QFill (DEV)... ');
    console.log('Timestamps: ' + timestamps);
    (async () => {
        await extensionState.debugEstado();
        const stateDB = await db.get();
        console.log(db.DB_NAME,  stateDB);
        chrome.qfilldb = db;
    })();
}