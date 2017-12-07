const mri = require('mri');
const rpad = require('pad-right');

// @see https://stackoverflow.com/a/18914855/3577474
const bySentences = str => (str || '').replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
const parseFlags = str => (str || '').replace(/-{1,2}/g, '').split(/,?\s+/);

class Sade {
	constructor(name) {
		this.name = name;
		this.ver = '0.0.0';
		this.curr = '__all__';
		this.tree = {
			__all__: {
				options: [
					['--help, -h', 'Displays this message']
				]
			},
			__default__: {
				usage: '<command>',
				options: [
					['--version, -v', 'Displays current version']
				],
				examples: [
					[`$ ${name} start`]
				]
			}
		};
	}

	command(str, desc) {
		let [cmd, usage=''] = str.split(/\s+/);
		if (cmd in this.tree) {
			throw new Error(`Command already exists: ${cmd}`);
		}
		this.curr = cmd;
		let config = { alias:{}, default:{} };
		this.tree[cmd] = { usage, options:[], config, examples:[] };
		desc && this.describe(desc);
		return this;
	}

	describe(str) {
		this.tree[ this.curr ].describe = Array.isArray(str) ? str : bySentences(str);
		return this;
	}

	option(str, desc, val) {
		let cmd = this.tree[ this.curr ];

		let [flag, alias] = parseFlags(str);
		(alias && alias.length > 1) && ([flag, alias]=[alias, flag]);

		str = `--${flag}`;
		if (alias && alias.length > 0) {
			str += `, -${alias}`;
			let old = cmd.config.alias[alias];
			cmd.config.alias[alias] = (old || []).concat(flag);
		}

		let arr = [str, desc || ''];

		if (val !== void 0) {
			arr.push(val);
			cmd.config.default[flag] = val;
		}

		cmd.options.push(arr);
		return this;
	}

	action(handler) {
		this.tree[ this.curr ].handler = handler;
		return this;
	}

	example(str) {
		this.tree[ this.curr ].examples.push(str);
		return this;
	}

	version(str) {
		this.ver = str;
		return this;
	}

	parse(arr) {
		let alias = { h:'help', v:'version' };
		let argv = mri(arr.slice(2), { alias });
		let name = argv._[0] || 'TODO';
		let cmd = this.tree[name];

		if (cmd === void 0) {
			console.error(`CLI Error!\n  \`${name}\` is not a valid command.\nRun \`${this.name} --help\` for more info.`);
			process.exit(1);
		}

		if (argv.version) {
			return console.log(`${this.name}, ${this.ver}`);
		}

		if (argv.help) {
			return this.help(argv._.length > 0 && name);
		}

		let args = [];
		let opts = mri(arr.slice(3), cmd.config);
		// TODO: parse arguments (`_`)
		// TODO: push to new `arguments` arr per known key
		// TODO: append remaining `opts:options` to arr
		return cmd.handler(opts);
	}

	help(str) {

	}
}

module.exports = str => new Sade(str);
