En **MV3**, el **background (service worker)** y el **content script** son contextos distintos, así que necesitan comandos específicos para enviarse mensajes entre sí.

---

# 1️⃣ Background → Content Script

El **background** no puede acceder directo al DOM de la página, así que debe usar **`chrome.tabs.sendMessage`** para enviar mensajes a un content script en un tab específico.

```js id="bg-to-content"
// background/index.js

// Envía mensaje a un content script en la pestaña activa
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "FROM_BACKGROUND", payload: "Hola content!" });
  }
});
```

En el **content script** debes tener el listener para recibirlo:

```js id="content-listen"
// content/main.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_BACKGROUND") {
    console.log("Mensaje recibido del background:", msg.payload);
    sendResponse({ reply: "Content recibe!" });
  }
});
```

✅ Esto es **request-response transitorio**.

---

# 2️⃣ Content Script → Background

El **content script** puede enviar un mensaje al **background** usando **`chrome.runtime.sendMessage`**:

```js id="content-to-bg"
// content/main.js
chrome.runtime.sendMessage({ type: "FROM_CONTENT", payload: "Hola background!" }, (response) => {
  console.log("Respuesta del background:", response);
});
```

En el **background**:

```js id="bg-listen"
// background/index.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_CONTENT") {
    console.log("Mensaje recibido del content:", msg.payload);
    sendResponse({ reply: "Background recibe!" });
  }
});
```

---

# 3️⃣ Comunicación persistente (opcional)

Si quieres comunicación continua **bidireccional** (por ejemplo, actualizaciones en tiempo real):

### Content Script abre puerto al Background

```js id="content-port"
const port = chrome.runtime.connect({ name: "content-bg" });
port.postMessage({ type: "HELLO" });

port.onMessage.addListener((msg) => {
  console.log("Content recibe:", msg);
});
```

### Background escucha y responde

```js id="bg-port"
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "content-bg") {
    port.onMessage.addListener((msg) => {
      console.log("Background recibe:", msg);
      port.postMessage({ type: "REPLY", payload: "Hola content desde background!" });
    });
  }
});
```

✅ Ventaja: comunicación **bidireccional persistente** sin depender de mensajes individuales.

---

# 🔹 Resumen de comandos `chrome.*` para Background ↔ Content

| Dirección                 | Comando Background                              | Comando Content Script                      |
| ------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Background → Content      | `chrome.tabs.sendMessage(tabId, msg)`           | `chrome.runtime.onMessage.addListener`      |
| Content → Background      | `chrome.runtime.onMessage.addListener`          | `chrome.runtime.sendMessage(msg)`           |
| Bidireccional persistente | `chrome.runtime.onConnect` + `port.postMessage` | `chrome.runtime.connect` + `port.onMessage` |