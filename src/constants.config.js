const MESSAGE_TYPES = {
    CONNECT: "system.connect",
    STORAGE_GET: "storage.get",
    STORAGE_SET: "storage.set",

    // Eventos que manipula el DOM
    SCAN_INPUTS: "content.scanInputs",
    FILL_INPUT_BY_ID: "content.fillInputById",
    FILL_ALL_INPUTS: "content.fillAllInputs",
    SELECTOR_MODE_ENABLE: "content.selectorModeEnable",
    SELECTOR_MODE_SET_ITEM: "content.selectorModeSetItem",
    SELECTOR_MODE_GET_ITEM: "content.selectorModeGetItem",
};

export default MESSAGE_TYPES;