#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo', null, { alias: 'f', default:true })
	.action(() => console.log('~> ran "foo" action'))

	.command('bar')
	.alias('b')
	.action(() => console.log('~> ran "bar" action'))

	.parse(process.argv);
