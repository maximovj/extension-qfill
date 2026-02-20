const name = 'QFill';
const author_name = 'Víctor J.';
const version = '1.0.0';
const description = 'Auto rellenar formularios de forma automatizado y personalizado';

const extension = {
    name,
    author_name,
    version,
    description,
    default_title: `${name} : ${description}`,
    host_permissions:  ['http://*/*', 'https://*/*'],
    permissions: [
        'storage',
        'tabs',
        'activeTab',
        'scripting',
        'sidePanel',
        'contentSettings',
    ],
};

export default extension;