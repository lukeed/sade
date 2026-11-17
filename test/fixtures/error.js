#!/usr/bin/env node
const sade = require('../../lib');

let prog = sade('bin', true);

prog.action(() => {
	prog.error('something is wrong');
});

prog.parse(process.argv);
