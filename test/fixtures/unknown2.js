#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.option('-g, --global', 'global flag')
	.option('--flag1', 'no alias or default')

	.command('foo')
	.option('-l, --local', 'command flag')
	.option('--flag2', 'no alias or default')
	.action(opts => {
		console.log(`~> ran "foo" with ${JSON.stringify(opts)}`);
	})

	.parse(process.argv, {
		unknown: x => `Custom error: ${x}`
	});
