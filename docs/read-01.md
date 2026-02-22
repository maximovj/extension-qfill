El **popup** es un contexto más, distinto tanto del **content script** como del **service worker**. En MV3, los contextos son:

1. **Background (Service Worker)** – siempre activo en segundo plano.
2. **Content Script** – inyectado en páginas, aislado del DOM de la extensión.
3. **Popup** – la ventana emergente de `action.default_popup`, solo viva mientras el usuario la abre.

---

# 🔹 Comunicación desde el popup

## 1️⃣ Con el **background**

Puedes enviar y recibir mensajes directamente usando `chrome.runtime.sendMessage`:

```js
// src/popup/index.js
chrome.runtime.sendMessage({ type: "FROM_POPUP" }, (response) => {
  console.log("Respuesta del background:", response);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_BACKGROUND") {
    console.log("Mensaje recibido en popup:", msg.payload);
  }
});
```

✅ Esto funciona siempre porque **el popup y el background comparten el runtime de la extensión**.

---

## 2️⃣ Con un **content script**

El popup **no puede comunicarse directamente con un content script usando `sendMessage` global**.
Debes pasar primero por el background y luego enviar al tab activo:

```js
// src/popup/index.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "FROM_POPUP_TO_CONTENT" });
});
```

Y en el content script:

```js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_POPUP_TO_CONTENT") {
    console.log("Mensaje recibido del popup");
  }
});
```

---

# ⚠️ Resumen

| Contexto       | Puede enviar a…                        | Puede recibir de…                      |
| -------------- | -------------------------------------- | -------------------------------------- |
| **Popup**      | Background ✅, Content vía Background ✅ | Background ✅, Content vía Background ✅ |
| **Content**    | Background ✅                           | Background ✅                           |
| **Background** | Popup ✅, Content ✅                     | Popup ✅, Content ✅                     |

💡 Tip: Siempre que quieras comunicar popup ↔ content, hazlo **pasando por el background**. Directo no funciona en MV3.

---

Perfecto 😎, vamos a visualizarlo. Imagina los tres contextos de tu extensión como **islas separadas**, y los mensajes como **puentes o barcos que viajan entre ellas**.  

---

# 🌉 Diagrama de comunicación MV3

```
      ┌─────────────┐
      │   Popup     │
      │ src/popup   │
      └─────┬───────┘
            │
            │ chrome.runtime.sendMessage / onMessage
            ▼
      ┌─────────────┐
      │ Background  │
      │ service_worker │
      └─────┬───────┘
            │
            │ chrome.tabs.sendMessage / onMessage
            ▼
      ┌─────────────┐
      │ Content     │
      │ src/content │
      └─────────────┘
```

---

# 🔹 Cómo fluyen los mensajes

1. **Popup → Background**  
   - `chrome.runtime.sendMessage({type: "hola"})`  
   - Background recibe con `chrome.runtime.onMessage.addListener`.

2. **Background → Popup**  
   - `chrome.runtime.sendMessage({type: "respuesta"})`  
   - Popup recibe con su propio `chrome.runtime.onMessage.addListener`.

3. **Popup → Content Script**  
   - No puedes hacerlo directo.  
   - Primero el popup envía al background, y este reenvía al content con `chrome.tabs.sendMessage(tabId, msg)`.

4. **Content Script → Popup**  
   - Igual: Content envía al background (`sendMessage`), y background se lo pasa al popup.

---

# 💡 Extra tip

Si quieres comunicación **bidireccional persistente** con el content script (por ejemplo, updates constantes), conviene usar **puertos (`chrome.runtime.connect`)**, porque `sendMessage` es transitorio y solo maneja un request-response rápido.

---

¡Genial! 😄 Vamos a hacer un diagrama **MV3 con puertos persistentes**, para que veas cómo popup, background y content script pueden hablar **bidireccionalmente y en tiempo real**.

---

# 🌐 Comunicación persistente con `chrome.runtime.connect`

```id="m6u3xv"
      ┌─────────────┐
      │   Popup     │
      │ src/popup   │
      └─────┬───────┘
            │
      ┌─────▼───────┐
      │ Background  │
      │ service_worker │
      └─────┬───────┘
            │
      ┌─────▼───────┐
      │ Content     │
      │ src/content │
      └─────────────┘
```

---

# 🔹 Flujo con puertos

1. **Popup abre puerto al Background**

```js id="popup-port"
// src/popup/index.js
const port = chrome.runtime.connect({name: "popup-background"});
port.postMessage({type: "hello_from_popup"});
port.onMessage.addListener((msg) => {
  console.log("Popup recibe:", msg);
});
```

2. **Background escucha puerto del Popup**

```js id="background-port"
// src/background/index.js
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup-background") {
    port.onMessage.addListener((msg) => {
      console.log("Background recibe del popup:", msg);
      port.postMessage({type: "reply_to_popup", text: "Hola popup!"});
    });
  }
});
```

3. **Content Script abre puerto al Background**

```js id="content-port"
// src/content/main.js
const port = chrome.runtime.connect({name: "content-background"});
port.postMessage({type: "hello_from_content"});
port.onMessage.addListener((msg) => {
  console.log("Content recibe:", msg);
});
```

4. **Background reenvía entre Popup y Content**

```js id="background-reconnect"
// src/background/index.js
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "content-background") {
    port.onMessage.addListener((msg) => {
      console.log("Background recibe del content:", msg);
      // Ejemplo: reenviar al popup si existe
      if (popupPort) popupPort.postMessage({type: "from_content", payload: msg});
    });
  }
});
```

---

# 🔹 Ventajas de usar puertos

* Comunicación **bidireccional persistente**.
* No dependes de `sendMessage` para cada evento.
* Ideal para **streams de datos**, actualizaciones en tiempo real o interacción continua popup ↔ content.
* MV3 **despierta el service worker** cuando recibe mensajes, pero los puertos lo mantienen conectado mientras la extensión esté activa.

---
