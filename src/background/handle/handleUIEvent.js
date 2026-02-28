import { ACTIONS, MESSAGE_TYPES } from '../../constants.config';
import { sendToActiveTab, dispatchToActiveTab, sendMessage } from '../../helpers.config';
import extensionState from '../../extensionState.config';
import db from '../../indexedDBManager';

export default async function handleUIEvent(msg) {
    const storeConfig = await db.get(db.STORES.CONFIGURACION);
    let configDB = {};
    
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
                await db.set(db.STORES.CONFIGURACION, {
                    ...storeConfig,
                    actualizado: Date.now(),
                    elementoSeleccionado: {},
                    elementos: inputs,
                    modo: modoEscaneo || "visibles",
                    selectorActivado: false
                });

                return { status: 'ok', msg: "Elementos escaneados" };
                //return { status: 'ok', msg: { configDB: {...configDB }, respuesta} };
            } catch (err) {
                await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
        
        case ACTIONS.SELECTOR_MODE_ENABLE: {
            try {
                console.log("ACTIONS.SELECTOR_MODE_ENABLE", { msg });
                await db.set(db.STORES.CONFIGURACION, {
                    ...storeConfig,
                    actualizado: Date.now(),
                    elementoSeleccionado: {},
                    modo: "selector",
                    selectorActivado: true
                });
                await dispatchToActiveTab(
                    MESSAGE_TYPES.UI_EVENT,
                    ACTIONS.SELECTOR_MODE_ENABLE
                );
                
                return { status: 'ok', msg: "Modo selector activado" };
                //return { status: 'ok', msg: { configDB: {...configDB }, respuesta} };
            } catch (err) {
                await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.SELECTOR_MODE_SET_ITEM:{
            try {
                console.log("ACTIONS.SELECTOR_MODE_SET_ITEM", { msg });
                const itemModoSelector = msg?.payload?.data;
                const elementosActual = storeConfig?.elementos || [];

                if(Array.isArray(elementosActual) && storeConfig) {
                    await db.set(db.STORES.CONFIGURACION, {
                        ...storeConfig,
                        actualizado: Date.now(),
                        elementoSeleccionado: itemModoSelector,
                        elementos: [itemModoSelector],
                        modo: "selector",
                    });
                    
                    if(storeConfig?.selectorActivado && storeConfig?.selectorAccion === "agregar") {
                        elementosActual.push(itemModoSelector);
                        await db.set(db.STORES.CONFIGURACION, {
                            ...storeConfig,
                            actualizado: Date.now(),
                            elementoSeleccionado: itemModoSelector,
                            elementos: elementosActual,
                            modo: "selector",
                            selectorActivado: storeConfig?.selectorActivado || true,
                            selectorAccion: storeConfig?.selectorAccion || "agregar",
                        });
                    }

                }
                return { status: 'ok', msg: "Elemento seleccionado en Modo Selector" };
                //return { status: 'ok', msg: {configDB: {...configDB }, itemModoSelector, elementosActual} };
            } catch (err) {
                await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }

        case ACTIONS.CLOSE_POPUP: {
            try {
                window.close();
                
                return { status: 'ok', msg: "Popup cerrado correctamente" };
                //return { status: 'ok', msg: {configDB: {...configDB }} };
            } catch (err) {
                await sendMessage(MESSAGE_TYPES.STATE_EVENT, ACTIONS.STATE_RESET);
                console.log("Hubo un error:", {err, msg});
                return err;
            }
        }
    }
}