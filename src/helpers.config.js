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

export async function dispatchToActiveTab(type, action, payload = {}) {
    return await sendToActiveTab({ type, action, payload });
}

export function sendMessage(type, action, payload = {}) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, action, payload }, (response) => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
        } else {
            resolve(response);
        }
        });
    });
}

export const dispatchRuntime = (type, action) => (payload = {}) =>
    new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, action, payload }, (res) => {
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

export async function dispatchToBackground(type, action, payload = {}) {
    return await sendToBackground({ type, action, payload });
}