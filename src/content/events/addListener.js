import scanInputs from './scanInputs.js'
import fillInputById from './fillInputById.js'

// Escuchar mensajes del popup o background
// Obtener inputs
// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'scanInputs') {
        const soloVisibles = msg.soloVisibles || false;
        sendResponse(scanInputs(soloVisibles));
    }

    if (msg.action === 'fillInputById') {
        const { id, name, value, autofillId } = msg.data; // objeto: {id, name, value, type, autofillId, options}
        fillInputById(autofillId, value);
        sendResponse({ status: 'ok' });
    }

    if (msg.action === 'fillAllInputs') {
        const allData = msg.data; // array de objetos: {id, name, value, type, autofillId, options}
        allData.forEach(input => {
            fillInputById(input.autofillId, input.value);
        });
        sendResponse({ status: 'ok' });
    }

    return true; // importante para async
});