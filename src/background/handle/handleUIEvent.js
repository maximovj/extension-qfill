import { ACTIONS, MESSAGE_TYPES } from '../../constants.config';
import { sendToActiveTab, dispatchToActiveTab } from '../../helpers.config';

// Almacenamiento 
let selectElementItem = {};

export default async function handleUIEvent(msg) {
    switch(msg.action) {
        case ACTIONS.SCAN_INPUTS:
        case ACTIONS.FILL_INPUT_BY_ID: 
        case ACTIONS.FILL_ALL_INPUTS:
        {
            return await sendToActiveTab(msg);
        }

        case ACTIONS.SELECTOR_MODE_ENABLE: {
            selectElementItem = msg?.payload;
            return await dispatchToActiveTab(
                MESSAGE_TYPES.UI_EVENT,
                ACTIONS.SELECTOR_MODE_ENABLE
            );
        }

        case ACTIONS.SELECTOR_MODE_SET_ITEM:{
            const itemModoSelector = msg?.payload?.data;
            selectElementItem = {
                ...selectElementItem,
                itemModoSelector
            }
            return selectElementItem;
        }
        
        case ACTIONS.SELECTOR_MODE_GET_ITEM: {
            return selectElementItem;
        }
    }
}