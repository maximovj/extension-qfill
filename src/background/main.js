import extConfig from '../extension.config.js'
import handleMessages from './handleMessages.js'
import extensionState from '../extensionState.config.js'
import IndexedDBManager from '../IndexedDBManager.js';

// Se ejecuta cuando la extensión se instala o actualiza
chrome.runtime.onInstalled.addListener(async () => {
    try {
        await IndexedDBManager.init();       // crea DB y stores si no existen
        await IndexedDBManager.initDatabase(); // asegura defaults
    } catch (err) {
        console.error("Error inicializando IndexedDB:", err);
    }
});

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
        //await extensionState.reset();
        await extensionState.debugEstado();
        const datos = await IndexedDBManager.getAllData();
        console.log(IndexedDBManager.DB_NAME,  datos);
        chrome.qfilldb = IndexedDBManager;
    })();
}