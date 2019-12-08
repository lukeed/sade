#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo')
	.alias('f', 'fo')
	.action(() => {
		console.log('~> ran "foo" action');
	})
	.parse(process.argv);
