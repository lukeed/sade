#!/usr/bin/env node
const sade = require('../../lib');

sade('bin <type> [dir]')
	.describe('hello description')
	.option('-g, --global', 'flag 1')
	.action((type, dir, opts) => {
		dir = dir || '~default~';
		console.log(`~> ran "single" w/ "${type}" and "${dir}" values`);
	})
	.parse(process.argv);
