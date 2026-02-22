export function sendToActiveTab(message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
            reject("No active tab");
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            } else {
            resolve(response);
            }
        });
        });
    });
}

export async function dispatchToActiveTab(type, payload) {
    return await sendToActiveTab({ type, payload });
}

export function sendMessage(type, payload = {}) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(response);
        }
        });
    });
}

export const dispatchRuntime = (type) => (payload = {}) =>
    new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, payload }, (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(res);
        });
    });

export function sendToBackground(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(response);
        }
        });
    });
}

export async function dispatchToBackground(type, payload) {
    return await sendToBackground({ type, payload });
}