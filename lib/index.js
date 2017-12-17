const mri = require('mri');
const $ = require('./utils');

const ALL = '__all__';
const DEF = '__default__';

class Sade {
	constructor(name) {
		this.curr = '';
		this.ver = '0.0.0';
		this.name = name;
		this.tree = {};
		// set internal shapes;
		this.command(ALL);
		this.command(`${DEF} <command>`)
			.option('-v, --version', 'Displays current version');
		this.default = this.curr = ''; // reset
	}

	command(str, desc, opts) {
		let [cmd, usage=''] = str.split(/\s+/);
		if (cmd in this.tree) {
			throw new Error(`Command already exists: ${cmd}`);
		}
		this.curr = cmd;
		opts = opts || {};
		(opts.default || !this.default) && (this.default=cmd);
		let config = { alias:{}, default:{} };
		this.tree[cmd] = { usage, options:[], config, examples:[] };
		desc && this.describe(desc);
		return this;
	}

	describe(str) {
		this.tree[this.curr || DEF].describe = Array.isArray(str) ? str : $.sentences(str);
		return this;
	}

	option(str, desc, val) {
		let cmd = this.tree[ this.curr || ALL ];

		let [flag, alias] = $.parse(str);
		(alias && alias.length > 1) && ([flag, alias]=[alias, flag]);

		str = `--${flag}`;
		if (alias && alias.length > 0) {
			str = `-${alias}, ${str}`;
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
		this.tree[ this.curr || DEF ].handler = handler;
		return this;
	}

	example(str) {
		this.tree[ this.curr || DEF ].examples.push(str);
		return this;
	}

	version(str) {
		this.ver = str;
		return this;
	}

	parse(arr) {
		let alias = { h:'help', v:'version' };
		let argv = mri(arr.slice(2), { alias });
		let name = argv._[0] || this.default;
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

		let opts = mri(arr.slice(3), cmd.config);
		let reqs = cmd.usage.split(/\s+/).filter(x => x.charAt(0)==='<');
		let args = opts._.splice(0, reqs.length);
		args.push(opts); // flags & co are last
		return cmd.handler.apply(null, args);
	}

	help(str) {
		console.log(
			$.help(this.name, this.tree, str || DEF)
		);
	}
}

module.exports = str => new Sade(str);
