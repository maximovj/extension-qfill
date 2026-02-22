# Manifest v3 | Referencia de la API

La mayoría de las extensiones necesitan acceso a una o más APIs de extensiones de Chrome para funcionar. En esta referencia de la API, se describen las APIs disponibles para usar en extensiones y se presentan ejemplos de casos de uso.

A partir de Chrome 146, todas las APIs de extensiones de Chrome también están disponibles en el espacio de nombres browser (p.ej., browser.tabs.create({})). Este es un alias para el espacio de nombres chrome (p.ej., chrome.tabs.create({})) que se proporciona para la compatibilidad con otros navegadores que usan el espacio de nombres browser para sus APIs de extensiones. Esta actualización se lanzará de forma gradual, por lo que es posible que aún no esté disponible en los navegadores de todos los usuarios. Debes asegurarte de que tu extensión pueda controlar los casos en los que browser esté definido o no.

Nota: El espacio de nombres browser no está disponible en los contextos de secuencias de comandos de extensiones si la extensión amplía las Herramientas para desarrolladores con una página de Herramientas para desarrolladores.
Funciones comunes de la API de Extensions
Una API de Extensiones consta de un espacio de nombres que contiene métodos y propiedades para realizar el trabajo de las extensiones y, por lo general, pero no siempre, campos de manifiesto para el archivo manifest.json. Por ejemplo, el espacio de nombres chrome.action requiere un objeto "action" en el manifiesto. Muchas APIs también requieren permisos en el manifiesto.

Los métodos de las APIs de extensión son asíncronos, a menos que se indique lo contrario. Los métodos asíncronos muestran resultados de inmediato, sin esperar a que finalice la operación que los llama. Usa promesas para obtener los resultados de estos métodos asíncronos.

- https://developer.chrome.com/docs/extensions/reference/api?hl=es-419

# Formato de archivo de manifiesto

Cada extensión debe tener un archivo manifest.json en su directorio raíz que enumere información importante sobre la estructura y el comportamiento de esa extensión. En esta página, se explica la estructura de los manifiestos de extensión y las funciones que pueden incluir.

Ejemplos
En los siguientes ejemplos de manifiestos, se muestra la estructura básica del manifiesto y algunas funciones de uso general como punto de partida para crear tu propio manifiesto:

Manifiesto mínimo
Registra una secuencia de comandos del contenido
Cómo insertar una secuencia de comandos del contenido
Ventana emergente con permisos
Más

````json
{
  "manifest_version": 3,
  "name": "Minimal Manifest",
  "version": "1.0.0",
  "description": "A basic example extension with only required keys",
  "icons": {
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
````

# Secuencias de comandos de contenido

Las secuencias de comandos de contenido son archivos que se ejecutan en el contexto de las páginas web. Con el modelo de objetos del documento (DOM) estándar, pueden leer detalles de las páginas web que visita el navegador, realizar cambios en ellas y pasar información a su extensión principal.

- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts?hl=es-419

# Conceptos básicos del service worker de extensiones

Los service workers de extensiones se instalan y actualizan de forma diferente a los service workers web. En esta página, se explican esas diferencias.

Registra los service workers
Para registrar un service worker de extensión, especifícalo en el campo "background" del archivo manifest.json. Usa la clave "service_worker", que especifica un solo archivo JavaScript. Los service workers en páginas web o apps web registran service workers primero detectando serviceWorker en navigator y, luego, llamando a register() dentro de la detección de atributos. Esto no funciona para las extensiones.

- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics?hl=es-419

# Manifiesto: fondo

Es una clave de manifiesto opcional que se usa para especificar un archivo JavaScript como el service worker de la extensión. Un service worker es una secuencia de comandos en segundo plano que actúa como el controlador de eventos principal de la extensión. Para obtener más información, consulta la introducción más completa a los service workers.


```json
{
  ...
   "background": {
      "service_worker": "service-worker.js",
      "type": "module"
    },
  ...
}
```

# Información acerca de los service workers de extensión

En esta sección, se explica lo que debes saber para usar service workers en extensiones. Debes leer esta sección aunque no estés familiarizado con los service workers. Los service workers de extensión son el controlador central de eventos de una extensión. Esto los diferencia lo suficiente de los service worker web, por lo que la enorme cantidad de artículos sobre service worker de la Web puede ser útil o no.

Los service workers de la extensión tienen algunas cosas en común con sus contrapartes web. Un service worker de extensión se carga cuando es necesario y se descarga cuando queda inactivo. Una vez cargado, un service worker de extensión suele ejecutarse mientras esté recibiendo eventos de forma activa, aunque puede cerrarse. Al igual que su equivalente web, un service worker de extensión no puede acceder al DOM, aunque puedes usarlo si es necesario con documentos fuera de pantalla.

Los service workers de extensión son más que proxies de red (ya que suelen describirse los service worker web). Además de los eventos de service worker estándar, también responden a eventos de extensión, como navegar a una página nueva, hacer clic en una notificación o cerrar una pestaña. También se registran y se actualizan de manera diferente a los trabajadores de servicios web.

- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers?hl=es-419#manifest

# chrome.sidePanel

Usa la API de chrome.sidePanel para alojar contenido en el panel lateral del navegador junto con el contenido principal de una página web.

Permisos
sidePanel
Para usar la API de Side Panel, agrega el permiso "sidePanel" en el archivo de manifiesto de la extensión:

manifest.json:

```json
{
  "name": "My side panel extension",
  ...
  "permissions": [
    "sidePanel"
  ]
}
```

- https://developer.chrome.com/docs/extensions/reference/api/sidePanel?hl=es-419

# chrome.storage

Usa la API de chrome.storage para almacenar, recuperar y hacer un seguimiento de los cambios en los datos del usuario.

Permisos
storage
Para usar la API de Storage, declara el permiso "storage" en el manifiesto de la extensión. Por ejemplo:


```json
{
  "name": "My extension",
  ...
  "permissions": [
    "storage"
  ],
  ...
}
```