#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.option('-g, --global', 'global')
	.command('foo')
	.alias('f')
	.option('-l, --long', 'long flag')
	.option('-s, --short', 'short flag')
	.option('-h, --hello', 'override')
	.action(opts => {
		if (opts.long) return console.log('~> ran "long" option');
		if (opts.short) return console.log('~> ran "short" option');
		if (opts.hello) return console.log('~> ran "hello" option');
		console.log(`~> default with ${JSON.stringify(opts)}`);
	})

	.command('bar <dir>')
	.alias('b')
	.option('--only', 'no short alias')
	.action((dir, opts) => {
		let pre = opts.only ? '~> (only)' : '~>';
		console.log(pre + ` "bar" with "${dir}" value`);
	})
	.parse(process.argv);
