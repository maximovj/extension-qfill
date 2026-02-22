En **MV3**, tu `popup.html` (o su `popup.js`) puede comunicarse con **Background** y **Content Script**, pero **cada uno con su forma correcta**. Te lo desgloso paso a paso.

---

# 1️⃣ Popup ↔ Background

Este es el más fácil: puedes usar **`chrome.runtime.sendMessage`** o **puertos persistentes** (`chrome.runtime.connect`).

### A. Con `sendMessage` (transitorio)

```js
// popup.js
// Enviar mensaje al background
chrome.runtime.sendMessage({ type: "HELLO_BACKGROUND", payload: "Hola bg!" }, (response) => {
  console.log("Respuesta del background:", response);
});

// Escuchar mensajes del background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_BACKGROUND") {
    console.log("Mensaje recibido en popup:", msg.payload);
  }
});
```

```js
// background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "HELLO_BACKGROUND") {
    console.log("Mensaje recibido del popup:", msg.payload);
    sendResponse({ reply: "Hola popup!" }); // respuesta opcional
  }
});
```

✅ Fácil para **request-response** simple.

---

### B. Con **puertos persistentes** (bidireccional)

```js
// popup.js
const port = chrome.runtime.connect({ name: "popup-bg" });
port.postMessage({ type: "PING" });

port.onMessage.addListener((msg) => {
  console.log("Mensaje del background:", msg);
});
```

```js
// background.js
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup-bg") {
    port.onMessage.addListener((msg) => {
      console.log("Recibido del popup:", msg);
      port.postMessage({ type: "PONG" });
    });
  }
});
```

💡 Ideal si quieres **actualizaciones en tiempo real**, no solo un envío único.

---

# 2️⃣ Popup ↔ Content Script

Aquí **no puedes comunicarte directo**. Debes pasar siempre por **Background**.

### A. Usando `sendMessage` con `tabs.sendMessage`

```js
// popup.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "FROM_POPUP", payload: "Hola content!" });
});
```

```js
// content.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_POPUP") {
    console.log("Mensaje recibido del popup:", msg.payload);
    sendResponse({ reply: "Hola popup, content dice hola!" });
  }
});
```

Si quieres que **Content responda al Popup**, lo mejor es **pasar la respuesta por el Background**.

---

### B. Usando puertos persistentes

1. **Content Script abre puerto al Background**
2. **Popup abre puerto al Background**
3. **Background hace de “hub”** para reenviar mensajes entre popup y content.

Esto permite **comunicación bidireccional persistente**:

```text
Popup <——> Background <——> Content
```

---

# 🔹 Resumen de comandos `chrome` desde popup

| Comunicación       | Comando popup                                                          | Comando background                                      | Comando content                                   |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Popup → Background | `chrome.runtime.sendMessage` o `chrome.runtime.connect`                | `chrome.runtime.onMessage` o `chrome.runtime.onConnect` | N/A                                               |
| Background → Popup | `chrome.runtime.sendMessage` o `port.postMessage`                      | N/A                                                     | N/A                                               |
| Popup → Content    | `chrome.tabs.query + chrome.tabs.sendMessage` o puertos via background | `chrome.tabs.sendMessage` / `port.onMessage`            | `chrome.runtime.onMessage` / `port.onMessage`     |
| Content → Popup    | Via Background                                                         | `chrome.runtime.sendMessage` / `port.postMessage`       | `chrome.runtime.sendMessage` / `port.postMessage` |