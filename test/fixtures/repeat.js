#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo', 'original')
	.command('foo', 'duplicate')
	.action(() => {
		console.log('~> ran "foo" action');
	})
	.parse(process.argv);
