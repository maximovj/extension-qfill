import { ACTIONS, MESSAGE_TYPES } from '../../constants.config';
import { sendToActiveTab, dispatchToActiveTab } from '../../helpers.config';
import extensionState from '../../extensionState.config';
import IndexedDBManager from '../../indexedDBManager';

export default async function handleUIEvent(msg) {
    const db = IndexedDBManager;
    
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
                await db.put(db.STORES.ELEMENTOS, {
                    id: db.ID.ELEMENTOS_ID,
                    modo: modoEscaneo || 'visibles',
                    elementos: inputs,
                    actualizado: Date.now(),
                });
                return inputs;
            } catch (err) {
                await extensionState.reset();
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
        
        case ACTIONS.SELECTOR_MODE_ENABLE: {
            try {
                await db.put(db.STORES.CONFIGURACION, {
                    id: db.ID.CONFIGURACION_ID,
                    modo: "selector",
                    selectorActivado: true,
                    selectorAnidado: true,
                });
                return await dispatchToActiveTab(
                    MESSAGE_TYPES.UI_EVENT,
                    ACTIONS.SELECTOR_MODE_ENABLE
                );
            } catch (err) {
                await extensionState.reset();
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.SELECTOR_MODE_SET_ITEM:{
            try {
                const config = await db.get(db.STORES.CONFIGURACION, db.ID.CONFIGURACION_ID);
                const itemModoSelector = msg?.payload?.data;
                const inputs = extensionState.get('ultimoEscaneo.inputs') || [];

                if(Array.isArray(inputs) && config) {
                    await db.put(db.STORES.ELEMENTO_SELECCIONADO, {
                        id: db.ID.ELEMENTO_SELECCIONADO_ID,
                        elementoSeleccionado: itemModoSelector,
                        actualizado: Date.now(),
                        selectorActivado: config?.selectorActivado || true,
                        selectorAnidado: config?.selectorAnidado || true,
                    });

                    if(config?.selectorActivado && config?.selectorAnidado) {
                        inputs.push(itemModoSelector);
                        await db.put(db.STORES.ELEMENTOS, {
                            id: db.ID.ELEMENTOS_ID,
                            modo: "selector",
                            elementos: inputs,
                            actualizado: Date.now(),
                        });
                        await extensionState.set('ultimoEscaneo.inputs', inputs);
                    }

                }
                return itemModoSelector;
            } catch (err) {
                await extensionState.reset();
                console.log("Hubo un error:", err);
                return err;
            }
        }
    }
}