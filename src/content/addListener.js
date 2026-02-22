import scanInputs from './actions/scanInputs.js'
import fillInputById from './actions/fillInputById.js'
import selectElementEnable from './actions/selectElementEnable'
import constants from '../constants.config.js'
import { sendMessage } from '../helpers.config.js'

// !! Escuchar mensajes del content_scripts y service_worker/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    switch (msg.type) {
        case constants.CONNECT: {
            sendResponse({status: 'ok' });
            break;
        }
        case constants.SCAN_INPUTS: {
            const soloVisibles = msg.payload.soloVisibles || false;
            sendResponse(scanInputs(soloVisibles));
            break;
        }
        case constants.FILL_INPUT_BY_ID: {
            const { autofillId, value } = msg.payload.data;
            fillInputById(autofillId, value);
            sendResponse({ status: 'ok' });
            break;
        }
        case constants.FILL_ALL_INPUTS: {
            msg.payload.data.forEach(input => {
                fillInputById(input.autofillId, input.value);
            });
            sendResponse({ status: 'ok' });
            break;
        }
        case constants.SELECTOR_MODE_ENABLE: {
            selectElementEnable();
            break;
        }
        case constants.SELECTOR_MODE_SET_ITEM: {
            selectElementItem = msg.payload.data;
            console.log("selectElementItem: ", selectElementItem);
            break;
        }
        case constants.SELECTOR_MODE_GET_ITEM: {
            console.log("selectElementGetItem: ", selectElementItem);
            sendResponse(selectElementItem);
            break;
        }
    }

    return true; // importante para async
});