#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('foo', null, { default:true })
	.action(() => console.log('~> ran "foo" action'))

	.command('bar')
	.action(() => console.log('~> ran "bar" action'))

	.parse(process.argv);
