Exacto 😎, y esto es **clave en Manifest V3**.

---

# 🔹 Background / Service Worker ≠ Document

* El **service worker** NO tiene acceso al **DOM**.
* No hay `document`, `window`, ni `body`.
* Solo tiene acceso al **runtime de la extensión**, APIs de Chrome (`chrome.*`), `fetch`, almacenamiento (`chrome.storage`), alarms, notificaciones, etc.
* Esto se debe a que el service worker está pensado para **trabajo en segundo plano**, no para mostrar UI ni manipular páginas.

---

# 🔹 Por eso:

| Contexto            | `document` disponible? | Qué puedes hacer                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------------------ |
| **Content Script**  | ✅ Sí                   | Manipular la página web, DOM, estilos, inputs                      |
| **Popup**           | ✅ Sí                   | Manipular tu propio HTML/CSS/JS del popup                          |
| **Background / SW** | ❌ No                   | Solo lógica de fondo, APIs de Chrome, almacenamiento, comunicación |

---

# 🔹 Cómo interactuar con la página desde Background

Si quieres que el **Background** haga algo en la página, tienes que:

1. Comunicarte con un **Content Script** que **sí tiene acceso al DOM**.
2. Content Script hace la manipulación del DOM y te puede responder si quieres.

**Ejemplo: Background → Content → DOM**

```js id="bg-to-content-dom"
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "FILL_INPUT", value: "Hola mundo" });
});
```

```js id="content-dom"
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "FILL_INPUT") {
    document.querySelector("#miInput").value = msg.value;
  }
});
```

✅ Así el Background “manda la orden”, pero el Content Script hace el trabajo en el **DOM de la página**.

---

Ah, aquí está la **clave de MV3** 😎:  

---

# 🔹 Comunicación Popup ↔ Content Script

En **Manifest V3**, **no puedes comunicarte directamente** desde `popup.html` con un content script usando solo `sendMessage`.  

- **Obligatorio pasar por el Background** si quieres que el popup y el content script hablen.  
- Esto se debe a que **popup y content script viven en contextos distintos y aislados**, no comparten el mismo runtime de la página.  

---

# 🔹 Cómo funciona lo recomendado

### 1️⃣ Popup envía mensaje al Background

```js id="popup-to-bg"
chrome.runtime.sendMessage({ type: "FROM_POPUP", data: "Hola content" });
```

### 2️⃣ Background reenvía al Content Script

```js id="bg-to-content"
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "FROM_BACKGROUND", data: "Hola content" });
});
```

### 3️⃣ Content Script recibe y responde (opcional)

```js id="content-listen"
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_BACKGROUND") {
    console.log("Mensaje del popup via background:", msg.data);
    sendResponse({ reply: "Content listo!" });
  }
});
```

---

# 🔹 Resumen de flujo recomendado

```
Popup  <--->  Background  <--->  Content Script
```

✅ Ventajas:

1. Centraliza la comunicación en **Background**, que actúa como hub.  
2. Evita problemas de **scope aislado** en MV3.  
3. Funciona tanto con `sendMessage` transitorio como con **puertos persistentes** (`connect`).  

---

# 🔹 Nota práctica

- Para acciones rápidas y únicas: `sendMessage` está perfecto.  
- Para comunicación continua (ej. actualizaciones en tiempo real, formularios dinámicos, streams de datos): usar **puertos** (`chrome.runtime.connect`) es más robusto.  

---

Ah, aquí hay un detalle muy importante 😎:  

---

# 🔹 ¿Puedes usar `chrome.tabs.sendMessage` desde **popup.html**?

✅ **Sí, puedes**, con algunas condiciones:  

1. **Necesitas un tab activo**, normalmente el tab actual donde quieres que el content script reciba el mensaje.  
2. Tu extensión debe tener **host permissions** para esa página (`matches` en `content_scripts` o `host_permissions` en `manifest.json`).  
3. El content script debe estar **inyectado** en ese tab.  

---

### Ejemplo en popup:

```js id="popup-send-message"
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "FROM_POPUP", data: "Hola content!" });
  }
});
```

### En el content script:

```js id="content-receive-message"
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FROM_POPUP") {
    console.log("Mensaje del popup:", msg.data);
  }
});
```

---

# 🔹 Diferencias con Background

- Cuando usas **popup → content directamente**, **no necesitas pasar por background**, siempre que solo quieras mandar un mensaje puntual al content script inyectado.  
- Sin embargo, si tu popup quiere:  
  - comunicarse con **múltiples tabs**,  
  - o mantener **mensajes persistentes**,  
  - o coordinar acciones con **otros contextos**,  

entonces **lo recomendado es pasar por Background** como hub central.  

---

# 🔹 Resumen práctico

| Escenario                          | Se puede directo desde popup? | Recomendación          |
|-----------------------------------|-------------------------------|-----------------------|
| Tab activo único, mensaje simple   | ✅ Sí                          | Directo con `tabs.sendMessage` |
| Múltiples tabs o persistencia      | ❌ Mejor vía Background        | Usar `runtime.sendMessage` o `connect` |
| Comunicación bidireccional continua| ❌ Mejor vía Background        | Usar puertos (`connect`) |

---

💡 **Tip:** si tu popup solo necesita decir “hey, content script, haz esto” en la página activa, **`chrome.tabs.sendMessage` desde popup está perfecto**.  
Si empiezas a complicarte con múltiples tabs o sincronización, **background es tu hub central**.  