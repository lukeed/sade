#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo <dir>')
	.action(dir => {
		console.log(`~> ran "foo" with "${dir}" arg`);
	})
	.command('bar [dir]')
	.action(dir => {
		dir = dir || '~default~';
		console.log(`~> ran "bar" with "${dir}" arg`);
	})
	.parse(process.argv);
