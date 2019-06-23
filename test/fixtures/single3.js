#!/usr/bin/env node
const sade = require('../../lib');

sade('bin', true)
	.command('foo <bar>')
	.action((bar, opts) => {
		console.log(`~> ran "foo" with: ${JSON.stringify(opts)}`);
	})
	.parse(process.argv);
