import { MESSAGE_TYPES } from '../constants.config.js'
import handleUIEvent from './handle/handleUIEvent.js'
import handleSystemEvent from './handle/handleSystemEvent.js'
import handleStateEvent from './handle/handleStateEvent.js'

export default async function handleMessages(message, sender) {
    switch (message.type) {
        case MESSAGE_TYPES.UI_EVENT: {
            return await handleUIEvent(message);
        }

        case MESSAGE_TYPES.SYSTEM_EVENT: {
            return await handleSystemEvent(message);
        }

        case MESSAGE_TYPES.STATE_EVENT: {
            return await handleStateEvent(message);
        }

        default: {
            return { error: 'Tipo de mensaje no soportado' };
        }
    }
}