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
		let cmd=[], usage=[], rgx=/(\[|<)/;
		// All non-([|<) are commands
		str.split(/\s+/).forEach(x => {
			(rgx.test(x.charAt(0)) ? usage : cmd).push(x);
		});

		// Back to string~!
		cmd = cmd.join(' ');

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
		let offset = 2; // argv slicer
		let alias = { h:'help', v:'version' };
		let argv = mri(arr.slice(offset), { alias });
		let bin = this.name;

		// Loop thru possible command(s)
		let tmp, name='';
		let i=1, len=argv._.length + 1;
		for (; i < len; i++) {
			tmp = argv._.slice(0, i).join(' ');
			if (this.tree[tmp] !== void 0) {
				name=tmp; offset=(i + 2); // argv slicer
			}
		}

		let cmd = this.tree[name];
		let isVoid = (cmd === void 0);

		if (isVoid) {
			if (this.default) {
				name = this.default;
				cmd = this.tree[name];
				arr.unshift(name);
				offset++;
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

		let vals = mri(arr.slice(offset), opts);
		let segs = cmd.usage.split(/\s+/);
		let reqs = segs.filter(x => x.charAt(0)==='<');
		let args = vals._.splice(0, reqs.length);

		if (args.length < reqs.length) {
			name && (bin += ` ${name}`); // for help text
			return $.error(bin, 'Insufficient arguments!');
		}

		segs.filter(x => x.charAt(0)==='[').forEach(_ => {
			args.push(vals._.pop()); // adds `undefined` per [slot] if no more
		});

		args.push(vals); // flags & co are last
		let handler = cmd.handler;
		return opts.lazy ? { args, name, handler } : handler.apply(null, args);
	}

	help(str) {
		console.log(
			$.help(this.name, this.tree, str || DEF)
		);
	}
}

module.exports = str => new Sade(str);
