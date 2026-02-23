import { ACTIONS } from '../../constants.config';
import { sendToActiveTab } from '../../helpers.config';
import extensionState from '../../extensionState.config';

function esObjetoLiteral(valor) {
    return Object.prototype.toString.call(valor) === "[object Object]";
}

export default async function handleStateEvent(msg) {
    switch(msg.action) {
        case ACTIONS.STATE_SET: {
            try {
                const { key, value } = msg.payload?.set;
                await extensionState.set(key, value);
                return { status: 'ok', msg: msg.payload };
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
        
        case ACTIONS.STATE_SET_MANY: {
            try {
                const setMany = msg.payload?.setMany;
                if(!esObjetoLiteral(setMany)) 
                    return { status: 'fail', msg: msg.payload };
                
                await extensionState.setMany(setMany);
                return { status: 'ok', msg: msg.payload };
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.STATE_RESET: {
            try {
                await extensionState.reset();

                return { status: 'ok', msg: extensionState.get()};
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
    }
}