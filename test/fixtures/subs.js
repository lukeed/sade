#!/usr/bin/env node
const sade = require('../../lib');

sade('bin')
	.command('remote')
  .action(opts => {
    console.log('~> ran "remote" action');
  })

  .command('remote add <name> <url>')
  .action((name, uri, opts) => {
    console.log(`~> ran "remote add" with "${name}" and "${uri}" args`);
  })

  .command('remote rename <old> <new>')
  .action((old, nxt, opts) => {
    console.log(`~> ran "remote rename" with "${old}" and "${nxt}" args`);
  })

  .command('remote child')
  .action((opts) => {
    console.log(`~> ran "remote child" action`);
  })

  .command('remote child grandchild <arg>')
  .action((arg, opts) => {
    console.log(`~> ran "remote child grandchild" with "${arg}" arg`);
  })

	.parse(process.argv);
