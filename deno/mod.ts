import { parse } from "https://deno.land/std@0.106.0/flags/mod.ts";
import type { Args, ArgParsingOptions } from "https://deno.land/std@0.106.0/flags/mod.ts";
import * as $ from "./utils.ts";

const ALL = '__all__';
const DEF = '__default__';

class Sade {
	private bin: string;
	private ver: string;
	private tree: $.Tree;
	private default: string;
	private single: boolean;
	private curr: string;

	constructor(name: string, isOne?: boolean) {
		let [bin, ...rest] = name.split(/\s+/);
		isOne = isOne || rest.length > 0;

		this.bin = bin;
		this.ver = '0.0.0';
		this.default = '';
		this.tree = {};
		// set internal shapes;
		this.command(ALL);
		this.command([DEF].concat(isOne ? rest : '<command>').join(' '));
		this.single = isOne;
		this.curr = ''; // reset
	}

	command(str: string, desc?: string, opts: { alias?: string|string[]; default?: boolean }= {}) {
		if (this.single) {
			throw new Error('Disable "single" mode to add commands');
		}

		// All non-([|<) are commands
		let rgx = /(\[|<)/;
		let c: string[] = [], u: string[] = [];
		str.split(/\s+/).forEach(x => {
			(rgx.test(x.charAt(0)) ? u : c).push(x);
		});

		// Back to string~!
		let cmd = c.join(' ');

		if (cmd in this.tree) {
			throw new Error(`Command already exists: ${cmd}`);
		}

		// re-include `cmd` for commands
		cmd.includes('__') || u.unshift(cmd);
		let usage = u.join(' '); // to string

		this.curr = cmd;
		if (opts.default) this.default=cmd;

		this.tree[cmd] = { usage, alibi:[], options:[], alias:{}, default:{}, examples:[] };
		if (opts.alias) this.alias(opts.alias);
		if (desc) this.describe(desc);

		return this;
	}

	describe(str: string[] | string) {
		this.tree[this.curr || DEF].describe = Array.isArray(str) ? str : $.sentences(str);
		return this;
	}

	alias(...names: (string | string[])[]) {
		if (this.single) throw new Error('Cannot call `alias()` in "single" mode');
		if (!this.curr) throw new Error('Cannot call `alias()` before defining a command');
		let arr = this.tree[this.curr].alibi = this.tree[this.curr].alibi.concat(...names);
		arr.forEach(key => this.tree[key] = this.tree[this.curr]);
		return this;
	}

	option(str: string, desc?: string, val?: $.Value) {
		let cmd = this.tree[ this.curr || ALL ];

		let [flag, alias] = $.parse(str);
		if (alias && alias.length > 1) [flag, alias]=[alias, flag];

		str = `--${flag}`;
		if (alias && alias.length > 0) {
			str = `-${alias}, ${str}`;
			cmd.alias[alias] = (cmd.alias[alias] || []).concat(flag);
		}

		let arr: $.Option = [str, desc || ''];

		if (val !== void 0) {
			arr.push(val as string);
			cmd.default[flag] = val;
		} else if (!alias) {
			cmd.default[flag] = void 0;
		}

		cmd.options.push(arr);
		return this;
	}

	action(handler: $.Handler) {
		this.tree[ this.curr || DEF ].handler = handler;
		return this;
	}

	example(str: string) {
		this.tree[ this.curr || DEF ].examples.push(str);
		return this;
	}

	version(str: string) {
		this.ver = str;
		return this;
	}

	parse(arr: string[], opts: ArgParsingOptions & { lazy?: boolean } = {}) {
		let offset=0, tmp, idx, isVoid, cmd;
		let alias = { h:'help', v:'version' };
		let argv = parse(arr, { alias });
		let isSingle = this.single;
		let bin = this.bin;
		let name = '';

		if (isSingle) {
			cmd = this.tree[DEF];
		} else {
			// Loop thru possible command(s)
			let i=1, xyz, len=argv._.length + 1;
			for (; i < len; i++) {
				tmp = argv._.slice(0, i).join(' ');
				xyz = this.tree[tmp];
				if (typeof xyz === 'string') {
					// @ts-ignore: alias
					idx = (name=xyz).split(' ');
					arr.splice(arr.indexOf(argv._[0] as string), i, ...idx);
					i += (idx.length - i);
				} else if (xyz) {
					name = tmp;
				} else if (name) {
					break;
				}
			}

			cmd = this.tree[name];
			isVoid = (cmd === void 0);

			if (isVoid) {
				if (this.default) {
					name = this.default;
					cmd = this.tree[name];
					arr.unshift(name);
					offset++;
				} else if (tmp) {
					return $.error(bin, `Invalid command: ${tmp}`);
				} //=> else: cmd not specified, wait for now...
			}
		}

		// show main help if relied on "default" for multi-cmd
		if (argv.help) return this.help(!isSingle && !isVoid && name);
		if (argv.version) return this._version();

		if (!isSingle && cmd === void 0) {
			return $.error(bin, 'No command specified.');
		}

		let all = this.tree[ALL];
		// merge all objects :: params > command > all
		opts.alias = Object.assign(all.alias, cmd.alias, opts.alias);
		opts.default = Object.assign(all.default, cmd.default, opts.default);

		tmp = name.split(' ');
		idx = arr.indexOf(tmp[0], 2);
		if (~idx) arr.splice(idx, tmp.length);

		let vals = parse(arr.slice(offset), opts);
		if (!vals || typeof vals === 'string') {
			return $.error(bin, vals || 'Parsed unknown option flag(s)!');
		}

		let segs = cmd.usage.split(/\s+/);
		let reqs = segs.filter(x => x.charAt(0)==='<');
		let args: (Args|string|number|undefined)[] = vals._.splice(0, reqs.length);

		if (args.length < reqs.length) {
			if (name) bin += ` ${name}`; // for help text
			return $.error(bin, 'Insufficient arguments!');
		}

		segs.filter(x => x.charAt(0)==='[').forEach(_ => {
			args.push(vals._.shift()); // adds `undefined` per [slot] if no more
		});

		args.push(vals); // flags & co are last
		let handler = cmd.handler;
		return opts.lazy ? { args, name, handler } : handler!.apply(null, args);
	}

	help(str?: string | false) {
		console.log(
			$.help(this.bin, this.tree, str || DEF, this.single)
		);
	}

	_version() {
		console.log(`${this.bin}, ${this.ver}`);
	}
}

export default (str: string, isOne?: boolean) => new Sade(str, isOne);
