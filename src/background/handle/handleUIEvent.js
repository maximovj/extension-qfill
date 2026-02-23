import { ACTIONS, MESSAGE_TYPES } from '../../constants.config';
import { sendToActiveTab, dispatchToActiveTab } from '../../helpers.config';
import extensionState from '../../extensionState.config';

export default async function handleUIEvent(msg) {
    switch(msg.action) {
        case ACTIONS.FILL_INPUT_BY_ID: 
        case ACTIONS.FILL_ALL_INPUTS:
        {
            return await sendToActiveTab(msg);
        }

        case ACTIONS.SCAN_INPUTS: {
            try {
                const { modoEscaneo } = msg?.payload;
                const inputs = await sendToActiveTab(msg);
                await extensionState.setMany({
                    // Desactivar
                    'modoSelector.activo':  false,
                    'modoSelector.status':  'error',
                    'modoSelector.mensaje': 'Modo Selector Desactivado',

                    
                    'ultimoEscaneo.modo':  modoEscaneo || 'visibles',
                    'ultimoEscaneo.escaneado':  true,
                    'ultimoEscaneo.timestamp':  Date.now(),
                    'ultimoEscaneo.inputs': inputs,
                });
                return inputs;
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
        
        case ACTIONS.SELECTOR_MODE_ENABLE: {
            try {
                await extensionState.setMany({
                    // Desactivar
                    'ultimoEscaneo.escaneado':  false,
                    'ultimoEscaneo.timestamp':  null,

                    'ultimoEscaneo.modo': 'selector',
                    'modoSelector.activo':  true,
                    'modoSelector.status':  'success',
                    'modoSelector.mensaje': 'Modo Selector Activado',
                });
                return await dispatchToActiveTab(
                    MESSAGE_TYPES.UI_EVENT,
                    ACTIONS.SELECTOR_MODE_ENABLE
                );
            } catch (err) {
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.SELECTOR_MODE_SET_ITEM:{
            try {
                const itemModoSelector = msg?.payload?.data;
                const inputs = extensionState.get('ultimoEscaneo.inputs') || [];
                if(Array.isArray(inputs)) {
                    inputs.push(itemModoSelector);
                    await extensionState.set('ultimoEscaneo.inputs', inputs);
                }
                return itemModoSelector;
            } catch (err) {
                console.log("Hubo un error:", err);
                return err;
            }
        }
    }
}