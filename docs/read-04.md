En **Manifest V3** Chrome divide tu extensión en **tres contextos principales**: **Popup**, **Content Scripts** y **Background (Service Worker)**. Cada uno tiene un propósito, cuándo y cómo usarlo, y cómo se comunican.

---

# 1️⃣ **Popup (`action.default_popup`)**

### Qué es

* Es la ventana emergente que aparece cuando el usuario hace click en el ícono de tu extensión.
* Vive **solo mientras el usuario la abre**.
* Tiene acceso a la API de extensión (`chrome.*`) pero no puede interactuar directamente con la página web.

### Cuándo usarlo

* Interfaz de usuario rápida: botones, formularios, ajustes, info del usuario.
* Ejecutar acciones que necesiten interacción directa del usuario.

### Cómo comunicarse

| Con quién      | Cómo usarlo                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| Background     | `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` o `chrome.runtime.connect`      |
| Content Script | Debe pasar por Background: `chrome.tabs.sendMessage(tabId, msg)` o puertos via Background |

**Ejemplo básico Popup → Background**:

```js
// popup.js
chrome.runtime.sendMessage({ type: "PING" }, (response) => {
  console.log("Respuesta del background:", response);
});
```

---

# 2️⃣ **Content Scripts (`content_scripts`)**

### Qué es

* Código que se **inyecta dentro de páginas web** que tu extensión tiene permiso de acceder (`matches`).
* Vive en **el contexto de la página**, aislado del DOM de la extensión.
* No puede usar `document.write` ni modificar scripts de la página directamente, pero puede manipular el DOM y escuchar eventos.

### Cuándo usarlo

* Modificar contenido de páginas web.
* Extraer información de la página.
* Detectar interacciones del usuario en la página.

### Cómo comunicarse

| Con quién  | Cómo usarlo                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| Background | `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` o puertos persistentes |
| Popup      | Pasando mensajes a través de Background                                          |

**Ejemplo Content → Background**:

```js
chrome.runtime.sendMessage({ type: "CONTENT_READY" }, (resp) => {
  console.log(resp.reply);
});
```

---

# 3️⃣ **Background / Service Worker (`background.service_worker`)**

### Qué es

* Código **en segundo plano**, central de la extensión.
* Siempre activo “en pausa” hasta que un evento lo despierta (MV3).
* Puede almacenar estado global, manejar alarmas, notificaciones, permisos, y actuar como “hub” de comunicación entre popup y content scripts.

### Cuándo usarlo

* Comunicación entre Contextos (popup ↔ content).
* Eventos globales: alarmas (`chrome.alarms`), escuchas de tabs (`chrome.tabs`), almacenamiento (`chrome.storage`).
* Procesos largos o persistentes (aunque limitado por MV3, porque el service worker se suspende cuando no hay actividad).

### Cómo comunicarse

| Con quién      | Cómo usarlo                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| Popup          | `chrome.runtime.onMessage` / `chrome.runtime.sendMessage` o `chrome.runtime.onConnect` |
| Content Script | `chrome.runtime.onMessage` / `chrome.tabs.sendMessage` o puertos persistentes          |

**Ejemplo Background → Content Script**:

```js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "HELLO_CONTENT" });
});
```

---

# 4️⃣ **Resumen: quién hace qué y cómo se comunica**

| Contexto       | Propósito principal                          | Comunicación típica                                              |
| -------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **Popup**      | UI rápida, botones, formularios              | `sendMessage` o `connect` a Background; vía Background a Content |
| **Content**    | Interacción con la página web, modificar DOM | `sendMessage` o `connect` a Background; no directo con Popup     |
| **Background** | Central, hub de mensajes, eventos globales   | `onMessage`, `tabs.sendMessage`, `connect` a Content o Popup     |

---

# 5️⃣ Reglas clave MV3

1. Cada **contexto necesita su propio listener** (`onMessage` o `onConnect`).
2. **Popup ↔ Content** → siempre via Background.
3. **Comunicación persistente** → usar puertos (`connect` / `onConnect`).
4. **Comunicación transitoria** → usar `sendMessage` / `onMessage`.
