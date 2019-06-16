#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo')
	.action(() => {
		console.log('~> ran "foo" action');
	})
	.parse(process.argv);
