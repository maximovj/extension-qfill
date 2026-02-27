export const MESSAGE_TYPES = {
    SYSTEM_EVENT: "SYSTEM_EVENT",
    STORAGE_EVENT: "STORAGE_EVENT",
    UI_EVENT: "UI_EVENT",
    STATE_EVENT: "STATE_EVENT"
};

export const ACTIONS = {
    CONNECT: "system.connect",
    STORAGE_GET: "storage.get",
    STORAGE_SET: "storage.set",

    // Eventos que manipula el state
    STATE_SET: "state.set",
    STATE_SET_MANY: "state.seMany",
    STATE_RESET: "state.reset",

    // Eventos que manipula el DOM
    CLOSE_POPUP: "ui.closePopup",
    SCAN_INPUTS: "ui.scanInputs",
    FILL_INPUT_BY_ID: "ui.fillInputById",
    FILL_ALL_INPUTS: "ui.fillAllInputs",
    SELECTOR_MODE_ENABLE: "ui.selectorModeEnable",
    SELECTOR_MODE_SET_ITEM: "ui.selectorModeSetItem",
    SELECTOR_MODE_GET_ITEM: "ui.selectorModeGetItem",
};