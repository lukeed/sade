const mri = require('mri');
const $ = require('./utils');

const ALL = '__all__';
const DEF = '__default__';

class Sade {
	constructor(name) {
		this.tree = {};
		this.name = name;
		this.ver = '0.0.0';
		this.default = '';
		// set internal shapes;
		this.command(ALL);
		this.command(`${DEF} <command>`)
			.option('-v, --version', 'Displays current version');
		this.curr = ''; // reset
	}

	command(str, desc, opts) {
		let [cmd, ...usage] = str.split(/\s+/);

		if (cmd in this.tree) {
			throw new Error(`Command already exists: ${cmd}`);
		}

		this.curr = cmd;
		(opts && opts.default) && (this.default=cmd);

		!~cmd.indexOf('__') && usage.unshift(cmd); // re-include `cmd`
		usage = usage.join(' '); // to string

		this.tree[cmd] = { usage, options:[], alias:{}, default:{}, examples:[] };
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
			let old = cmd.alias[alias];
			cmd.alias[alias] = (old || []).concat(flag);
		}

		let arr = [str, desc || ''];

		if (val !== void 0) {
			arr.push(val);
			cmd.default[flag] = val;
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

	parse(arr, opts={}) {
		let alias = { h:'help', v:'version' };
		let argv = mri(arr.slice(2), { alias });
		let bin = this.name;

		let name = argv._[0]; // may be undefined
		let cmd = this.tree[name];
		let isVoid = (cmd === void 0);

		if (isVoid) {
			if (this.default) {
				name = this.default;
				cmd = this.tree[name];
				arr.unshift(name);
			} else if (name) {
				return $.error(bin, `Invalid command: ${name}`);
			} //=> else: cmd not specified, wait for now...
		}

		if (argv.version) {
			return console.log(`${bin}, ${this.ver}`);
		}

		if (argv.help) {
			return this.help(!isVoid && name);
		}

		if (cmd === void 0) {
			return $.error(bin, 'No command specified.');
		}

		let all = this.tree[ALL];
		// merge all objects :: params > command > all
		opts.alias = Object.assign(all.alias, cmd.alias, opts.alias);
		opts.default = Object.assign(all.default, cmd.default, opts.default);

		let vals = mri(arr.slice(3), opts);
		let reqs = cmd.usage.split(/\s+/).filter(x => x.charAt(0)==='<');
		let args = vals._.splice(0, reqs.length);

		if (args.length < reqs.length) {
			name && (bin += ` ${name}`); // for help text
			return $.error(bin, 'Insufficient arguments!');
		}

		args.push(vals); // flags & co are last
		return cmd.handler.apply(null, args);
	}

	help(str) {
		console.log(
			$.help(this.name, this.tree, str || DEF)
		);
	}
}

module.exports = str => new Sade(str);
