#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('remote', '', { alias: 'r' })
  .action(opts => {
    console.log('~> ran "remote" action');
  })

	.command('remote add <name> <url>', '', { alias: 'ra' })
  .action((name, uri, opts) => {
		console.log(`~> ran "remote add" with "${name}" and "${uri}" args`);
  })

  .command('remote rename <old> <new>', '', { alias: 'rr' })
  .action((old, nxt, opts) => {
    console.log(`~> ran "remote rename" with "${old}" and "${nxt}" args`);
  })

	.parse(process.argv);
