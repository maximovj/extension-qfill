import pkg from './package.json';
import dotenv  from 'dotenv';

dotenv.config();
const env =  process.env.VITE_EXTENSION_MODE || 'dev';
const isProd = env === 'production' || env === 'prod';
const isDev = env === 'dev' || env === 'local';
const name = isProd ? 'QFill' : 'QFill (Dev)';

const extension = {
    name,
    author_name: pkg.author.name,
    version: pkg.version,
    description: pkg.description,
    default_title: `${name} : ${pkg.description}`,
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