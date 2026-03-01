import scanInputs from './actions/scanInputs.js'
import fillInputById from './actions/fillInputById.js'
import selectElementEnable from './actions/selectElementEnable'
import { MESSAGE_TYPES, ACTIONS } from '../constants.config.js'
import { sendMessage, sendToActiveTab } from '../helpers.config.js'

// !! Escuchar mensajes del content_scripts y service_worker/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    switch (msg.action) {
        case "STATE_BRODCAST": {
            let respUpdate = "ok";
            (async () =>  {
                console.log("Enviando actualizacion a STATE_BRODCAST");
                return await sendMessage("STATE_UPDATE", "STATE_UPDATE");
            })().then( (rs) => {
                respUpdate = rs;
            });
            sendResponse({status: 'ok', msg: respUpdate });
            break;
        }
        case ACTIONS.CONNECT: {
            sendResponse({status: 'ok' });
            break;
        }
        case ACTIONS.SCAN_INPUTS: {
            const soloVisibles = msg.payload.soloVisibles || false;
            sendResponse(scanInputs(soloVisibles));
            break;
        }
        case ACTIONS.FILL_INPUT_BY_ID: {
            const { autofillId, value } = msg.payload.data;
            fillInputById(autofillId, value);
            sendResponse({ status: 'ok' });
            break;
        }
        case ACTIONS.FILL_ALL_INPUTS: {
            msg.payload.data.forEach(input => {
                fillInputById(input.autofillId, input.value);
            });
            sendResponse({ status: 'ok' });
            break;
        }
        case ACTIONS.SELECTOR_MODE_ENABLE: {
            selectElementEnable();
            break;
        }
        case ACTIONS.SELECTOR_MODE_SET_ITEM: {
            selectElementItem = msg.payload.data;
            console.log("selectElementItem: ", selectElementItem);
            break;
        }
        case ACTIONS.SELECTOR_MODE_GET_ITEM: {
            console.log("selectElementGetItem: ", selectElementItem);
            sendResponse(selectElementItem);
            break;
        }
    }

    return true; // importante para async
});