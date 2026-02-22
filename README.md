## Estructura del Proyecto Qfill

Este es un proyecto de **extensión de Chrome** construida con **Vue 3** y **Vite**. Aquí te explico cada componente:

### 📦 **Archivos Raíz**

- **package.json** - Define dependencias (Vue 3, CRXJS, Vite) y scripts (`dev`, `build`)
- **manifest.config.js** - Configuración de la extensión de Chrome (versión 3). Especifica permisos, iconos y qué partes se ejecutan dónde
- **vite.config.js** - Configuración del bundler Vite
- **README.md** - Documentación del proyecto

---

### 📂 **Carpetas Principales**

#### **popup** - Panel emergente de la extensión
Cuando el usuario hace clic en el icono de la extensión en Chrome:
- `index.html` - Estructura HTML del popup
- main.js - Punto de entrada que monta la app Vue
- `App.vue` - Componente raíz del popup
- `style.css` - Estilos del popup

#### **sidepanel** - Panel lateral de la extensión
Abre un panel en el lado de la pantalla:
- `index.html` - Estructura HTML del panel lateral
- main.js - Punto de entrada que monta la app Vue
- `App.vue` - Componente raíz del panel
- `style.css` - Estilos del panel

#### **content** - Scripts de contenido
Se ejecutan **directamente en las páginas web** visitadas:
- main.js - Inyecta el componente Vue en la página
- `views/App.vue` - Componente que se ejecuta en el sitio web

#### **components** - Componentes Vue reutilizables
- `HelloWorld.vue` - Componente de ejemplo

#### **assets** - Archivos estáticos
Imágenes, fuentes, etc.

#### **public** - Recursos públicos
- `logo.png` - Icono de la extensión

---

### 🔄 **Cómo funciona**

1. **Popup**: Usuario hace clic en el icono → se abre un pequeño menú
2. **Side Panel**: Panel adicional en el lateral del navegador
3. **Content Script**: La extensión se "inyecta" en cualquier sitio que comience con `https://` y puede interactuar con la página

Esto es ideal para herramientas de productividad, análisis web o automatización integrada en tu navegador.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

4. Build for production:

```bash
npm run build
```