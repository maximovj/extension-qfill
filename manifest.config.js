import { defineManifest } from '@crxjs/vite-plugin'
import extension from './extension.properties';

export default defineManifest({
  manifest_version: 3,
  name: extension.name,
  version: extension.version,
  author: extension.author_name,
  description: extension.description,
  host_permissions: extension.host_permissions,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    //default_popup: 'src/popup/index.html',
    default_title: extension.default_title,
  },
  content_scripts: [{
    js: ['src/content/main.js'],
    matches: extension.host_permissions,
  }],
  permissions: extension.permissions,
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: "src/background/main.js",
    type: "module",
  },
  commands: {
    "scan-page": {
      suggested_key: {
        default: "Ctrl+Shift+L",
      },
      description: "Escanear en busca de INPUTS sobre está página",
    },
  },
})
