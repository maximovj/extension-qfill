import { ACTIONS } from '../../constants.config';
import { sendToActiveTab } from '../../helpers.config';
import extensionState from '../../extensionState.config';
import db from '../../indexedDBManager';

function esObjetoLiteral(valor) {
    return Object.prototype.toString.call(valor) === "[object Object]";
}

export default async function handleStateEvent(msg) {
    switch(msg.action) {
        case ACTIONS.STATE_SET: {
            try {
                const { key, value } = msg.payload?.set;
                await db.set(key, value);
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
                
                await db.setMany(setMany);
                return { status: 'ok', msg: msg.payload };
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.STATE_RESET: {
            try {
                await extensionState.reset();
                await db.set("configuracion", db.defaultConfiguracion());
                const stateDB = await db.get();
                return { status: 'ok', msg: stateDB };
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
    }
}