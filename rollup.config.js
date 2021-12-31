import * as pkg from './package.json';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: 'src/index.js',
	output: [{
		format: 'cjs',
		file: pkg.main,
		exports: 'default',
		interop: false,
		freeze: false,
		strict: false
	}],
	external: [
		...Object.keys(pkg.dependencies),
		...require('module').builtinModules,
	]
}

export default config;
