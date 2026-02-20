import pkg from './package.json';

export default {
    name: 'QFill (Dev)',
    author_name: pkg.author.name,
    version: pkg.version,
    description: pkg.description,
    default_title: 'QFill (Dev) : ' + pkg.description,
    host_permissions: ['http://*/*', 'https://*/*'],
    permissions: [
        'activeTab',
        'scripting',
        'sidePanel',
        'contentSettings',
    ]
}