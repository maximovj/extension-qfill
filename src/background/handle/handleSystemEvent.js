import { ACTIONS } from '../../constants.config';
import extensionStateConfig from '../../extensionState.config';

export default async function handleSystemEvent(msg) {
    switch(msg.action) {
        case ACTIONS.CONNECT: {
            const state = extensionStateConfig.get();
            return { status: 'ok', msg: state };
        }
    }
}