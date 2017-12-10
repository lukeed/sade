const rpad = require('pad-right');

const GAP = 4;
const __ = '  ';
const NL = '\n';

function format(arr) {
	let len = maxLen( arr.map(x => x[0]) ) + GAP;
	let join = a => rpad(a[0], len, ' ') + a[1] + (a[2] == null ? '' : `  (default ${a[2]})`);
	return arr.map(join);
}

function maxLen(arr) {
  let c=0, d=0, l=0, i=arr.length;
  if (i) while (i--) {
    d = arr[i].length;
    if (d > c) {
      l = i; c = d;
    }
  }
  return arr[l].length;
}

function noop(s) {
	return s;
}

function section(str, arr, fn) {
	if (!arr || !arr.length) return '';
	let i=0, out='';
	out += (NL + __ + str);
	for (; i < arr.length; i++) {
		out += (NL + __ + __ + fn(arr[i]));
	}
	return out + NL;
}

exports.help = function (bin, tree, key) {
	let out='', cmd=tree[key], pfx=`$ ${bin}`;
	// write options placeholder
	(cmd.options.length > 0) && (cmd.usage += ' [options]');
	// TODO: __all__
	cmd.options.push(['--help, -h', 'Displays this message']);

	// description ~> text only; usage ~> prefixed
	out += section('Description', cmd.describe, noop);
	out += section('Usage', [cmd.usage], s => `${pfx} ${s}`);

	if (!cmd) {
		// General help :: print all non-internal commands & their 1st line of text
		let arr = Object.keys(tree).filter(k => !/__/.test(k)).map(k => [k, tree[k].describe[0]]);
		out += section('Available Commands', format(arr), noop);

		out += (NL + __ + 'For more info, run any command with the `--help` flag');
		out += (NL + __ + __ + `${pfx} start --help`);
		out += (NL + __ + __ + `${pfx} init --help`);
		out += NL;
	}

	out += section('Options', format(cmd.options), noop);
	out += section('Examples', cmd.examples, noop);

	return out;
}

exports.parse = function (str) {
	return (str || '').replace(/-{1,2}/g, '').split(/,?\s+/);
}

// @see https://stackoverflow.com/a/18914855/3577474
exports.sentences = function (str) {
	return (str || '').replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
}
