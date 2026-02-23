import { MESSAGE_TYPES, ACTIONS } from '../constants.config.js'
import handleUIEvent from './handle/handleUIEvent.js';
import handleSystemEvent from './handle/handleSystemEvent.js';

export default async function handleMessages(message, sender) {
    switch (message.type) {
        case MESSAGE_TYPES.UI_EVENT: {
            return await handleUIEvent(message);
        }

        case MESSAGE_TYPES.SYSTEM_EVENT: {
            return await handleSystemEvent(message);
        }

        default: {
            return { error: 'Tipo de mensaje no soportado' };
        }
    }
}