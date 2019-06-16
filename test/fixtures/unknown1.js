#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.option('-g, --global', 'global flag')

	.command('foo')
	.option('-l, --local', 'command flag')
	.action(opts => {
		console.log(`~> ran "foo" with ${JSON.stringify(opts)}`);
	})

	.parse(process.argv, {
		unknown: () => false
	});
