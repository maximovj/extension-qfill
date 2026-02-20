import pkg from './package.json';
import extConfig from './src/extension.config';
import dotenv  from 'dotenv';

dotenv.config();
const env =  process.env.VITE_EXTENSION_MODE || 'dev';
const isProd = env === 'production' || env === 'prod';
const isDev = env === 'dev' || env === 'local';
const name = isProd ? 'QFill' : 'QFill (Dev)';

const extension = {
    ...extConfig,
    name,
    author_name: pkg.author.name,
    version: pkg.version,
    description: pkg.description,
    default_title: `${name} : ${pkg.description}`,
    // Desarrollo
    env,
    isDev,
    isProd
};

export default extension;