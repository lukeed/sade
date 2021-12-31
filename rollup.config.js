import { minify } from 'terser';
import * as pkg from './package.json';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: 'src/index.js',
	output: [{
		format: 'esm',
		file: pkg.module,
		interop: false,
		freeze: false,
		strict: false
	}, {
		format: 'cjs',
		file: pkg.main,
		exports: 'default',
		preferConst: true,
		interop: false,
		freeze: false,
		strict: false
	}],
	external: [
		...Object.keys(pkg.dependencies),
		...require('module').builtinModules,
	],
	plugins: [
		{
			name: 'terser',
			renderChunk(code) {
				return minify(code, {
					module: true,
					toplevel: false
				})
			}
		}
	]
}

export default config;
