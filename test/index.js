const test = require('tape');
const sade = require('../lib');

function isShapely(t, tree, key) {
	t.is(typeof tree[key].usage, 'string', `~> tree[${key}].usage is a string`);
	t.ok(Array.isArray(tree[key].options), `~> tree[${key}].options is an array`);
	t.ok(Array.isArray(tree[key].examples), `~> tree[${key}].examples is an array`);
	t.is(typeof tree[key].default, 'object', `~> tree[${key}].default is an object`);
	t.is(typeof tree[key].alias, 'object', `~> tree[${key}].alias is an object`);
}

test('sade', t => {
	t.is(typeof sade, 'function', 'exports a function');
	t.end();
});

test('sade()', t => {
	let ctx = sade('foo');
	t.ok(ctx.constructor && ctx.constructor.name === 'Sade', 'returns instance of Sade');
	t.is(ctx.name, 'foo', 'sets Program name to `foo`');
	t.is(ctx.ver, '0.0.0', 'defaults `ver` to `0.0.0`');
	t.is(ctx.curr, '', 'is empty command-name scope');
	t.is(ctx.default, '', 'has no default command (yet)');
	t.is(typeof ctx.tree, 'object', 'creates a `tree` object');
	let k, keys = Object.keys(ctx.tree);
	t.is(keys.length, 2, 'internal `tree` has two keys');
	for (k in ctx.tree) {
		isShapely(t, ctx.tree, k);
	}
	let obj = ctx.tree.__default__;
	t.deepEqual(obj.alias, { v:['version'] }, 'add `-v, --version` alias');
	t.deepEqual(obj.options[0], ['-v, --version', 'Displays current version'], 'add `-v, --version` flag');
	t.end();
});

test('prog.version (global)', t => {
	let ctx = sade('foo').version('1.0.0');
	t.is(ctx.ver, '1.0.0', 'sets a new version~!');
	t.end();
});

test('prog.option (global)', t => {
	let ctx = sade('foo');
	t.is(ctx.tree.__all__.options.length, 0, 'no global options (default)');
	ctx.option('--foo, -f', 'bar', 'baz.js');
	let arr = ctx.tree.__all__.options;
	t.is(arr.length, 1, 'adds an option successfully');
	let item = arr[0];
	t.ok(Array.isArray(item), 'options entry is also an array');
	t.is(item.length, 3, 'entry has 3 segments (flags, desc, default)');
	t.is(item[0], '-f, --foo', 'flips the flags order; alias is first');
	t.end();
});

test('prog.option (hypenated)', t => {
	let ctx = sade('foo');
	ctx.option('--foo-bar, -f');
	ctx.option('--foo-bar-baz');
	let arr = ctx.tree.__all__.options;
	t.is(arr[0][0], '-f, --foo-bar', 'keeps mid-hyphen; flips order so alias is first');
	t.is(arr[1][0], '--foo-bar-baz', 'keeps all mid-hyphens');
	t.end();
});

test('prog.describe (global)', t => {
	let ctx = sade('foo').describe('Who is on first. What is on second.');
	let arr = ctx.tree.__default__.describe;
	t.ok(Array.isArray(arr), 'adds a `describe` array for Program info');
	t.is(arr.length, 2, 'splits the description into 2 sentence items');
	t.end();
});

test('prog.example (global)', t => {
	let ctx = sade('foo').example('hello --local');
	let arr = ctx.tree.__default__.examples;
	t.ok(Array.isArray(arr), 'adds a `examples` array for Program info');
	t.is(arr.length, 1, 'contains the single example');
	t.is(arr[0], 'hello --local', 'does not manipulate contents (yet)')
	t.end();
});

test('prog.command', t => {
	let ctx = sade('foo').command('bar');
	let bar = ctx.tree.bar;
	t.ok(bar, 'adds `bar` key to the command tree');
	isShapely(t, ctx.tree, 'bar');
	t.is(bar.usage, 'bar', 'stores usage as is');

	// Options
	t.is(bar.options.length, 0, 'has no options initially');
	ctx.option('-f, --force', 'force');
	t.is(bar.options.length, 1, 'adds new Command option successfully');
	t.deepEqual(bar.alias, { f:['force'] }, 'adds option flag & alias');

	// Examples
	t.is(bar.examples.length, 0, 'has no examples initially');
	ctx.example('bar --force');
	t.is(bar.examples.length, 1, 'adds new Command exmaple successfully');
	t.is(bar.examples[0], 'bar --force', 'adds example, as written');

	// Description
	t.ok(bar.describe === void 0, 'has no description initially');
	ctx.describe('hello world');
	t.ok(Array.isArray(bar.describe), 'adds new Command description as Array');
	t.is(bar.describe[0], 'hello world', 'stores description, as written');

	// Add new Command
	ctx.command('quz');
	let quz = ctx.tree.quz;
	t.ok(quz, 'adds `quz` key to the command tree');
	isShapely(t, ctx.tree, 'quz');
	t.is(quz.usage, 'quz', 'stores usage as is');

	// Show that command state changed
	ctx.describe('this is quz');
	t.is(quz.describe[0], 'this is quz', 'adds description for second command');
	t.is(bar.describe[0], 'hello world', 'does not affect first Command');

	// Add third, with description & change default
	ctx.command('fizz <buzz>', 'FizzBuzz', { default:true });
	let fizz = ctx.tree.fizz;
	t.ok(fizz, 'adds `fizz` key to the command tree');
	isShapely(t, ctx.tree, 'fizz');
	t.is(fizz.usage, 'fizz <buzz>', 'stores usage as is');

	// Add Example
	ctx.example('fizz 15');
	t.is(fizz.examples.length, 1, 'adds new Command exmaple successfully');
	t.is(fizz.examples[0], 'fizz 15', 'adds example, as written');

	t.is(bar.examples.length, 1, '1st command example count unchanged');
	t.is(bar.examples[0], 'bar --force', 'first command example unaffected');
	t.is(quz.examples.length, 0, '2nd command example count unchanged');

	t.is(ctx.default, 'fizz', 'default command was updated~!');

	t.end();
});

test('prog.action', t => {
	t.plan(13);
	let a='Bob', b, c, d, e;

	let ctx = sade('foo')
		.command('greet <name>')
		.option('--loud', 'Be loud?')
		.option('--with-kiss, -k', 'Super friendly?')
		.action((name, opts) => {
			t.is(name, a, '~> receives the required value as first parameter');
			b && t.ok(opts.loud, '~> receives the `loud` flag (true) when parsed');
			c && t.ok(opts['with-kiss'], '~> receives the `with-kiss` flag (true) when parsed :: preserves mid-hyphen');
			d && t.is(opts['with-kiss'], 'cheek', '~> receives the `with-kiss` flag (`cheek`) when parsed :: preserves mid-hyphen');
			e && t.is(opts['with-kiss'], false, '~> receive the `--no-with-kiss` flag (false) :: preserves mid-hyphen');
			b = c = d = e = false; // reset
		});

	// Simulate `process.argv` entry
	let run = args => ctx.parse(['', '', 'greet', a].concat(args || []));

	let cmd = ctx.tree.greet;
	t.ok(cmd.handler, 'added a `handler` key to the command leaf');
	t.is(typeof cmd.handler, 'function', 'the `handler` is a function');

	run(); // +1 test
	(b=true) && run('--loud'); // +2 tests
	(c=true) && run('--with-kiss'); // +2 tests
	(d=true) && run('--with-kiss=cheek'); // +2 tests
	(d=true) && run(['--with-kiss', 'cheek']); // +2 tests
	(e=true) && run('--no-with-kiss'); // +2 tests
});

test('prog.action (multi requires)', t => {
	t.plan(7);

	let a='aaa', b='bbb', c=false;

	let ctx = sade('foo')
		.command('build <src> <dest>')
		.option('-f, --force', 'Force foo overwrite')
		.action((src, dest, opts) => {
			t.is(src, a, '~> receives `src` param first');
			t.is(dest, b, '~> receives `dest` param second');
			c && t.ok(opts.force, '~> receives the `force` flag (true) when parsed');
			c && t.ok(opts.f, '~> receives the `f` alias (true) when parsed');
		});

	t.is(ctx.tree.build.usage, 'build <src> <dest>', 'writes all required params to usage');

	let run = _ => ctx.parse(['', '', 'build', a, b, c && '-f']);

	run(); // +2 tests
	(c=true) && run(); // +4 tests
});

test('prog.action (multi optional)', t => {
	t.plan(7);

	let a='aaa', b='bbb', c=false;

	let ctx = sade('foo')
		.command('build [src] [dest]')
		.option('-f, --force', 'Force foo overwrite')
		.action((src, dest, opts) => {
			t.is(src, a, '~> receives `src` param first');
			t.is(dest, b, '~> receives `dest` param second');
			c && t.ok(opts.force, '~> receives the `force` flag (true) when parsed');
			c && t.ok(opts.f, '~> receives the `f` alias (true) when parsed');
		});

	t.is(ctx.tree.build.usage, 'build [src] [dest]', 'writes all positional params to usage');

	let run = _ => ctx.parse(['', '', 'build', a, b, c && '-f']);

	run(); // +2 tests
	(c=true) && run(); // +4 tests
});

test('prog.parse :: lazy', t => {
	t.plan(14);

	let val='aaa', f=false;

	let ctx = sade('foo')
		.command('build <src>')
		.option('--force').action((src, opts) => {
			t.is(src, val, '~> receives `src` param first');
			f && t.ok(opts.force, '~> receives the `force` flag (true) when parsed');
		});

	let run = _ => ctx.parse(['', '', 'build', val, f && '--force'], { lazy:true });

	let foo = run();
	t.is(foo.constructor, Object, 'returns an object');
	t.same(Object.keys(foo), ['args', 'name', 'handler'], 'contains `args`,`name`,`handler` keys');
	t.ok(Array.isArray(foo.args), '~> returns the array of arguments');
	t.is(foo.args[0], val, '~> preserves the `src` value first');
	t.is(foo.args[1].constructor, Object, '~> preserves the `opts` value last');
	t.ok(Array.isArray(foo.args[1]._), '~> ensures `opts._` is still `[]` at least');
	t.is(typeof foo.handler, 'function', '~> returns the action handler');
	t.is(foo.name, 'build', '~> returns the command name');

	foo.handler.apply(null, foo.args); // must be manual bcuz lazy; +1 test

	let bar = run(f=true);
	t.is(bar.constructor, Object, 'returns an object');
	t.is(bar.args[1].constructor, Object, '~> preserves the `opts` value last');
	t.is(bar.args[1].force, true, '~> attaches the `force:true` option');

	bar.handler.apply(null, bar.args); // manual bcuz lazy; +2 tests
});

test('prog.parse :: lazy :: single', t => {
	t.plan(14);

	let val='aaa', f=false;

	let ctx = sade('foo <src>').option('--force').action((src, opts) => {
		t.is(src, val, '~> receives `src` param first');
		f && t.ok(opts.force, '~> receives the `force` flag (true) when parsed');
	});

	let run = _ => ctx.parse(['', '', val, f && '--force'], { lazy:true });

	let foo = run();
	t.is(foo.constructor, Object, 'returns an object');
	t.same(Object.keys(foo), ['args', 'name', 'handler'], 'contains `args`,`name`,`handler` keys');
	t.ok(Array.isArray(foo.args), '~> returns the array of arguments');
	t.is(foo.args[0], val, '~> preserves the `src` value first');
	t.is(foo.args[1].constructor, Object, '~> preserves the `opts` value last');
	t.ok(Array.isArray(foo.args[1]._), '~> ensures `opts._` is still `[]` at least');
	t.is(typeof foo.handler, 'function', '~> returns the action handler');
	t.is(foo.name, '', '~> returns empty command name');

	foo.handler.apply(null, foo.args); // must be manual bcuz lazy; +1 test

	let bar = run(f=true);
	t.is(bar.constructor, Object, 'returns an object');
	t.is(bar.args[1].constructor, Object, '~> preserves the `opts` value last');
	t.is(bar.args[1].force, true, '~> attaches the `force:true` option');

	bar.handler.apply(null, bar.args); // manual bcuz lazy; +2 tests
});
