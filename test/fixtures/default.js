#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo [dir]', null, { alias: 'f', default:true })
	.action(dir => console.log(`~> ran "foo" action w/ "${dir || '~EMPTY~'}" arg`))

	.command('bar')
	.alias('b')
	.action(() => console.log('~> ran "bar" action'))

	.parse(process.argv);
