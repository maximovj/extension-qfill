import pkg from './package.json';
import extConfig from './src/extension.config';

const extension = {
    ...extConfig,
    author_name: pkg.author.name,
    version: pkg.version,
    description: pkg.description,
    default_title: `${extConfig.name} : ${pkg.description}`,
};

export default extension;