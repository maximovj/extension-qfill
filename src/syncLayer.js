// SyncLayerV2.js

import indexedDBManager from "./indexedDBManager.js";

class SyncLayerV2 {

  async init() {
    await indexedDBManager.initDatabase();

    // 🔥 Escuchar acciones externas (dispatch)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

      if (message.type === "DISPATCH") {
        this.dispatch(message.action)
          .then(result => sendResponse(result));
        return true;
      }

      if (message.type === "GET_STATE") {
        sendResponse(indexedDBManager.get());
      }

      return true;
    });

    // 🔥 Cuando el estado cambie → broadcast
    indexedDBManager.subscribe((state, path, value) => {
      chrome.runtime.sendMessage({
        type: "STATE_UPDATED",
        state,
        path,
        value
      });
    });
  }

  /* ======================================
     🧠 DISPATCH CENTRAL
  ====================================== */
  async dispatch(action) {

    console.log("🟣 ACTION:", action);

    switch (action.type) {

      /* =============================
         PERFILES
      ============================== */

      case "PERFIL_CREATE":
        return await indexedDBManager.create("perfiles", action.payload);

      case "PERFIL_UPDATE":
        return await indexedDBManager.update(
          "perfiles",
          action.payload.id,
          action.payload.changes
        );

      case "PERFIL_DELETE":
        return await indexedDBManager.delete(
          "perfiles",
          action.payload.id
        );

      /* =============================
         CONFIGURACION
      ============================== */

      case "CONFIG_SAVE":
        return await indexedDBManager.saveSingle(
          "configuracion",
          action.payload
        );

      default:
        console.warn("⚠️ Unknown action:", action.type);
        return null;
    }
  }
}

export default new SyncLayerV2();