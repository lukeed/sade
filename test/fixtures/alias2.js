#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.alias('foo')
	.command('bar <src>')
	.parse(process.argv);
