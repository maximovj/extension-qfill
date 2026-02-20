import getAllInputs from './getAllInputs.js';
import fillInput from './fillInput.js';
import isVisible from './isVisible.js';

// Escuchar mensajes del popup o background
// Obtener inputs
// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getInputs') {
        const soloVisibles = msg.soloVisibles || false;
        sendResponse(getAllInputs(soloVisibles));
    }

    if (msg.action === 'fillInput') {
        const { id, name, value } = msg.data;
        let el = id ? document.getElementById(id) : document.querySelector(`[name="${name}"]`);
        fillInput(el, value);
        sendResponse({ status: 'ok' });
    }

    if (msg.action === 'fillAllInputs') {
        const allData = msg.data; // array de {id,name,value}
        allData.forEach(input => {
        const el = input.id ? document.getElementById(input.id) : document.querySelector(`[name="${input.name}"]`);
        fillInput(el, input.value);
        });
        sendResponse({ status: 'ok' });
    }

    return true; // importante para async
});