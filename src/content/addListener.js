import scanInputs from './actions/scanInputs.js'
import fillInputById from './actions/fillInputById.js'
import selectElementEnable from './actions/selectElementEnable';

// !! Escuchar mensajes del content_scripts y service_worker/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    switch (msg.action) {

        case 'connect': {
            sendResponse({status: 'ok' });
            break;
        }

        case 'scanInputs': {
            const soloVisibles = msg.soloVisibles || false;
            sendResponse(scanInputs(soloVisibles));
            break;
        }

        case 'fillInputById': {
            const { autofillId, value } = msg.data;
            fillInputById(autofillId, value);
            sendResponse({ status: 'ok' });
            break;
        }

        case 'fillAllInputs': {
            msg.data.forEach(input => {
                fillInputById(input.autofillId, input.value);
            });
            sendResponse({ status: 'ok' });
            break;
        }

        case 'selectElementEnable': {
            selectElementEnable();
            break;
        }

        case 'selectElementItem': {
            selectElementItem = msg.data;
            console.log("selectElementItem: ", selectElementItem);
            break;
        }

        case 'selectElementGetItem': {
            console.log("selectElementGetItem: ", selectElementItem);
            sendResponse(selectElementItem);
        }
    }

    return true; // importante para async
});