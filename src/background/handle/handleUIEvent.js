import { ACTIONS, MESSAGE_TYPES } from '../../constants.config';
import { sendToActiveTab, dispatchToActiveTab, sendMessage } from '../../helpers.config';
import extensionState from '../../extensionState.config';
import db from '../../indexedDBManager';

export default async function handleUIEvent(msg) {
    const stateLocal = await chrome.runtime.sendMessage({
        type: "GET_STATE"
    });
    const storeConfig = stateLocal?.configuracion;
    const storePerfiles = await db.get(db.STORES.PERFILES);
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
                
                return { status: 'ok', msg: "Elementos escaneados", payload: inputs };
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
                const { modoAccion } = msg?.payload;
                await db.set(db.STORES.CONFIGURACION, {
                    ...storeConfig,
                    actualizado: Date.now(),
                    elementoSeleccionado: {},
                    modo: "selector",
                    selectorActivado: true,
                    selectorAccion: modoAccion || "agregar",
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

        case ACTIONS.CREATE_PROFILE: {
            try {
                const { elementos } = msg?.payload;
                const contador = storePerfiles?.length;
                await db.set(db.STORES.PERFILES, [
                    ...storePerfiles,
                    {
                        nombre: `Perfil No. #${contador+1}`,    
                        descripcion: `${elementos?.length || 0} elementos disponibles`,
                        elementos,
                        actualizado: Date.now(),
                        creado: Date.now(),
                    }
                ]);
                return { status: 'ok', msg: "Perfil creado correctamente"};
            } catch (error) {
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