import extConfig from '@/extension.config.js'

if(extConfig.isDev) {
  // Modo de desarrollo
  const timestamps = new Date().toISOString(); 
  console.log('Inicializando [SERVICE WORKER] extensión QFill (DEV)... ');
  console.log('Timestamps: ' + timestamps);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'rellenarFormulario':
      console.log('Rellenando formulario con datos:', msg.data);
      sendResponse({ status: 'ok' });
      break;

    case 'getPerfil':
      const perfil = { nombre: 'Juan', edad: 30 };
      sendResponse(perfil);
      break;

    case 'getPerfilAsync':
      chrome.storage.sync.get(['perfil'], (result) => {
        // Devuelve un valor por defecto si no hay datos
        sendResponse(result.perfil || { nombre: 'Juan', edad: 30 });
      });
      return true; // MUY IMPORTANTE para mantener el canal abierto

    default:
      console.warn('Acción desconocida:', msg.action);
  }
});