#!/usr/bin/env node
const sade = require('../../lib');

sade('bin <type> [dir]')
	.alias('error')
	.parse(process.argv);
