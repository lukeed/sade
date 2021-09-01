const GAP = 4;
const __ = '  ';
const ALL = '__all__';
const DEF = '__default__';
const NL = '\n';

export type Value = string|number|boolean;
export type Option = [string, string] | [string, string, Value];
export type Handler = (...args: any[]) => any;

export type Tree = {
	[command: string]: {
		usage: string;
		alibi: string[];
		options: Option[];
		examples: string[];
		alias: Record<string, string|string[]>;
		default: Record<string, Value|undefined>;
		describe?: string[];
		handler?: Handler;
	}
}

function format(arr: (Option | string[])[]): string[] {
	if (!arr.length) return [];
	let len = maxLen( arr.map(x => x[0]) ) + GAP;
	let join = (a: Option|string[]) => a[0] + ' '.repeat(len - a[0].length) + a[1] + (a[2] == null ? '' : `  (default ${a[2]})`);
	return arr.map(join);
}

function maxLen(arr: string[]): number {
  let c=0, d=0, l=0, i=arr.length;
  if (i) while (i--) {
    d = arr[i].length;
    if (d > c) {
      l = i; c = d;
    }
  }
  return arr[l].length;
}

function noop(s: string) {
	return s;
}

function section(str: string, arr: string[] | undefined, fn: (x: string) => string) {
	if (!arr || !arr.length) return '';
	let i=0, out='';
	out += (NL + __ + str);
	for (; i < arr.length; i++) {
		out += (NL + __ + __ + fn(arr[i]));
	}
	return out + NL;
}

export function help(bin: string, tree: Tree, key: string, single: boolean) {
	let out='', cmd=tree[key], pfx=`$ ${bin}`, all=tree[ALL];
	let prefix = (s: string) => `${pfx} ${s}`.replace(/\s+/g, ' ');

	// update ALL & CMD options
	let tail: Option[] = [['-h, --help', 'Displays this message']];
	if (key === DEF) tail.unshift(['-v, --version', 'Displays current version']);
	cmd.options = (cmd.options || []).concat(all.options, tail);

	// write options placeholder
	if (cmd.options.length > 0) cmd.usage += ' [options]';

	// description ~> text only; usage ~> prefixed
	out += section('Description', cmd.describe, noop);
	out += section('Usage', [cmd.usage], prefix);

	if (!single && key === DEF) {
		let key, rgx=/^__/, help='', cmds: string[][] = [];
		// General help :: print all non-(alias|internal) commands & their 1st line of helptext
		for (key in tree) {
			if (typeof tree[key] == 'string' || rgx.test(key)) continue;
			if (cmds.push([key, (tree[key].describe || [''])[0]]) < 3) {
				help += (NL + __ + __ + `${pfx} ${key} --help`);
			}
		}

		out += section('Available Commands', format(cmds), noop);
		out += (NL + __ + 'For more info, run any command with the `--help` flag') + help + NL;
	} else if (!single && key !== DEF) {
		// Command help :: print its aliases if any
		out += section('Aliases', cmd.alibi, prefix);
	}

	out += section('Options', format(cmd.options), noop);
	out += section('Examples', cmd.examples.map(prefix), noop);

	return out;
}

export function error(bin: string, str: string, num=1): never {
	let out = section('ERROR', [str], noop);
	out += (NL + __ + `Run \`$ ${bin} --help\` for more info.` + NL);
	console.error(out);
	Deno.exit(num);
}

// Strips leading `-|--` & extra space(s)
export function parse(str?: string) {
	return (str || '').split(/^-{1,2}|,|\s+-{1,2}|\s+/).filter(Boolean);
}

// @see https://stackoverflow.com/a/18914855/3577474
export function sentences(str?: string) {
	return (str || '').replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
}
