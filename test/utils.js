import test from 'tape';
import sade from '../src/index';
import * as $ from '../src/utils';

test('utils.parse', t => {
	[
		['--foo', ['foo']],
		['-foo', ['foo']],
		['-f', ['f']],
		['--foo-bar-baz', ['foo-bar-baz']],
		['--foo--bar', ['foo--bar']],
		['--foo-bar', ['foo-bar']],
		['-f, --foo', ['f', 'foo']],
		['--foo, -f', ['foo', 'f']],
		['--foo-bar, -f', ['foo-bar', 'f']],
		['   -f ,    --foo  ', ['f', 'foo']],
		['   --foo-bar  , -f  ', ['foo-bar', 'f']],
		['-f --foo', ['f', 'foo']],
		['--foo -f', ['foo', 'f']],
		['--foo-bar -f', ['foo-bar', 'f']],
	].forEach(arr => {
		t.same($.parse(arr[0]), arr[1], `(${arr[0]}) ~~> [${arr[1]}]`);
	});
	t.end();
});

test('utils.sentences', t => {
	[
		['foo bar', ['foo bar']], // no . or cap
		['foo. bar', ['foo. bar']], // no capital
		['foo. Bar', ['foo.', 'Bar']], // has capital
		['I haz $125.00 money. Hello', ['I haz $125.00 money.', 'Hello']],
		['Hello.     World!', ['Hello.', 'World!']] // trims
	].forEach(arr => {
		t.same($.sentences(arr[0]), arr[1], `(${arr[0]}) ~~> [${arr[1]}]`);
	});
	t.end();
});

test('utils.help', t => {
	let { bin, tree } = sade('foo').describe('global foo').command('bar', 'Hello. World.').command('fizz <buzz>');

	let foo = $.help(bin, tree, '__default__'); // global, 1 or 0 lines of desc per command
	t.is(foo, '\n  Description\n    global foo\n\n  Usage\n    $ foo <command> [options]\n\n  Available Commands\n    bar     Hello.\n    fizz    \n\n  For more info, run any command with the `--help` flag\n    $ foo bar --help\n    $ foo fizz --help\n\n  Options\n    -v, --version    Displays current version\n    -h, --help       Displays this message\n');

	let bar = $.help(bin, tree, 'bar'); // two-line description
	t.is(bar, '\n  Description\n    Hello.\n    World.\n\n  Usage\n    $ foo bar [options]\n\n  Options\n    -h, --help    Displays this message\n');

	let fizz = $.help(bin, tree, 'fizz'); // no description
	t.is(fizz, '\n  Usage\n    $ foo fizz <buzz> [options]\n\n  Options\n    -h, --help    Displays this message\n');

	t.end();
});

test('utils.help :: single', t => {
	let { bin, tree } = sade('foo <bar> [baz]', true).describe('global foo').option('-p, --port', 'Custom port value', 8000);

	let text = $.help(bin, tree, '__default__', true);
	t.is(text, '\n  Description\n    global foo\n\n  Usage\n    $ foo <bar> [baz] [options]\n\n  Options\n    -p, --port       Custom port value  (default 8000)\n    -v, --version    Displays current version\n    -h, --help       Displays this message\n');

	t.end();
});

test('utils.help :: alias', t => {
	let { bin, tree } = (
		sade('bin')
			.describe('program description')
			.command('foo', 'Hello, foo!', { alias: 'f' })
			.command('bar <fizz>', 'Heya, bar!', { alias: ['b', 'ba'] })
			.command('baz <buzz>', 'Howdy, baz~!')
			.alias('bz', 'bb', 'bza')
	);

	let txt = $.help(bin, tree, '__default__');
	t.is(txt, '\n  Description\n    program description\n\n  Usage\n    $ bin <command> [options]\n\n  Available Commands\n    foo    Hello, foo!\n    bar    Heya, bar!\n    baz    Howdy, baz~!\n\n  For more info, run any command with the `--help` flag\n    $ bin foo --help\n    $ bin bar --help\n\n  Options\n    -v, --version    Displays current version\n    -h, --help       Displays this message\n');

	let foo = $.help(bin, tree, 'foo');
	t.is(foo, '\n  Description\n    Hello, foo!\n\n  Usage\n    $ bin foo [options]\n\n  Aliases\n    $ bin f\n\n  Options\n    -h, --help    Displays this message\n');

	let bar = $.help(bin, tree, 'bar');
	t.is(bar, '\n  Description\n    Heya, bar!\n\n  Usage\n    $ bin bar <fizz> [options]\n\n  Aliases\n    $ bin b\n    $ bin ba\n\n  Options\n    -h, --help    Displays this message\n');

	let baz = $.help(bin, tree, 'baz');
	t.is(baz, '\n  Description\n    Howdy, baz~!\n\n  Usage\n    $ bin baz <buzz> [options]\n\n  Aliases\n    $ bin bz\n    $ bin bb\n    $ bin bza\n\n  Options\n    -h, --help    Displays this message\n');

	t.end();
});
