const name = 'QFill';
const author_name = 'Víctor J.';
const header_version = 'v1.0.0 (Beta)';
const header_description = 'Auto rellenar formularios de forma automatizado y personalizado';
const isProd = true;
const isDev = false;
const env = 'Release';

const extension = {
    name,
    author_name,
    header_title: `${name} (${env})`, 
    header_version,
    header_description,
    default_title: `${name} : ${header_description}`,
    host_permissions:  ['http://*/*', 'https://*/*'],
    permissions: [
        'storage',
        'tabs',
        'activeTab',
        'scripting',
        'sidePanel',
        'contentSettings',
    ],

    // Desarrollo
    env,
    isDev,
    isProd
};

export default extension;