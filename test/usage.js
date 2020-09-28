const test = require('tape');
const { join } = require('path');
const { spawnSync } = require('child_process');

const fixtures = join(__dirname, 'fixtures');

function exec(file, argv=[]) {
	return spawnSync('node', [file, ...argv], { cwd:fixtures });
}

test('(usage) basic', t => {
	let pid = exec('basic.js', ['foo']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.is(pid.stdout.toString(), '~> ran "foo" action\n', '~> command invoked');
	t.end();
});

test('(usage) basic :: error :: missing command', t => {
	let pid = exec('basic.js');
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    No command specified.\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "No command specified" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) basic :: error :: invalid command', t => {
	let pid = exec('basic.js', ['foobar']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Invalid command: foobar\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Invalid command: foobar" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) basic :: error :: duplicate command', t => {
	let pid = exec('repeat.js', ['foo']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Command already exists: foo'), '~> threw Error w/ message');
	t.end();
});

test('(usage) basic :: help', t => {
	let pid1 = exec('basic.js', ['-h']);
	t.is(pid1.status, 0, 'exits with error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('basic.js', ['foo', '-h']);
	t.is(pid2.status, 0, 'exits with error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});



test('(usage) args.required', t => {
	let pid = exec('args.js', ['foo', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "foo" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) args.required :: error :: missing argument', t => {
	let pid = exec('args.js', ['foo']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Insufficient arguments!\n\n  Run `$ bin foo --help` for more info.\n\n',
		'~> stderr has "Insufficient arguments!" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) args.optional', t => {
	let pid = exec('args.js', ['bar']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "~default~" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) args.optional w/ value', t => {
	let pid = exec('args.js', ['bar', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});



test('(usage) options.long', t => {
	let pid1 = exec('options.js', ['foo', '--long']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['foo', '-l']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) options.short', t => {
	let pid1 = exec('options.js', ['foo', '--short']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['foo', '-s']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) options.hello', t => {
	let pid1 = exec('options.js', ['foo', '--hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "hello" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	// shows that '-h' is always reserved
	let pid2 = exec('options.js', ['foo', '-h']);
	let stdout = pid2.stdout.toString();
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.not(stdout, '~> ran "long" option\n', '~> did NOT run custom "-h" option');
	t.true(stdout.includes('-h, --help      Displays this message'), '~~> shows `--help` text');

	t.end();
});

test('(usage) options.extra', t => {
	let pid = exec('options.js', ['foo', '--extra=opts', '--404']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> default with {"404":true,"_":[],"extra":"opts"}\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) options.global', t => {
	let pid1 = exec('options.js', ['foo', '--global']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> default with {"_":[],"global":true,"g":true}\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['foo', '-g', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> default with {"_":[],"g":"hello","global":"hello"}\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) options w/o alias', t => {
	let pid1 = exec('options.js', ['bar', 'hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	let pid2 = exec('options.js', ['bar', 'hello', '--only']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> (only) "bar" with "hello" value\n', '~> command invoked');

	let pid3 = exec('options.js', ['bar', 'hello', '-o']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');
	t.is(pid3.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	t.end();
});



test('(usage) unknown', t => {
	let pid1 = exec('unknown1.js', ['foo', '--global']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"global":true,"g":true}\n', '~> command invoked');

	let pid2 = exec('unknown1.js', ['foo', '-l']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> ran "foo" with {"_":[],"l":true,"local":true}\n', '~> command invoked');

	let pid3 = exec('unknown1.js', ['foo', '--bar']);
	t.is(pid3.status, 1, 'exits with error code');
	t.is(pid3.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid3.stderr.toString(),
		'\n  ERROR\n    Parsed unknown option flag(s)!\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Parsed unknown option flag" error message (default)'
	);

	t.end();
});

test('(usage) unknown.custom', t => {
	let pid1 = exec('unknown2.js', ['foo', '--global', '--local']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"global":true,"local":true,"g":true,"l":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['foo', '--bar']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --bar\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Custom error: --bar" error message'
	);

	t.end();
});

test('(usage) unknown.plain', t => {
	let pid1 = exec('unknown2.js', ['foo', '--flag1', '--flag2']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"flag1":true,"flag2":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['foo', '--flag3']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --flag3\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Custom error: --flag3" error message'
	);

	t.end();
});



test('(usage) subcommands', t => {
	let pid1 = exec('subs.js', ['remote']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "remote" action\n', '~> ran parent');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['remote', 'rename', 'origin', 'foobar']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "remote rename" with "origin" and "foobar" args\n', '~> ran "rename" child');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['remote', 'add', 'origin', 'foobar']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "remote add" with "origin" and "foobar" args\n', '~> ran "add" child');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) subcommands :: help', t => {
	let pid1 = exec('subs.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    remote           \n    remote add       \n    remote rename'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['remote', '--help']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin remote [options]'), '~> shows "remote" help text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['remote', 'rename', '--help']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin remote rename <old> <new> [options]'), '~> shows "remote rename" help text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});



/*
// TODO: Should this happen instead?
test('(usage) subcommands :: error :: invalid command', t => {
	let pid = exec('subs.js', ['remote', 'foobar']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Invalid command: remote foobar.\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Invalid command: remote foobar" error message'
	);

	t.end();
});
*/



test('(usage) default', t => {
	let pid1 = exec('default.js', []);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['foo']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['bar']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "bar" action\n', '~> ran "bar" command');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) default :: args', t => {
	let pid1 = exec('default.js', ['hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['foo', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) default :: help', t => {
	let pid1 = exec('default.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo    \n    bar'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['foo', '-h']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [dir] [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['bar', '-h']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin bar [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});



test('(usage) single :: error :: missing argument', t => {
	let pid = exec('single1.js', []);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Insufficient arguments!\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Insufficient arguments!" error message'
	);

	t.end();
});

test('(usage) single', t => {
	let pid1 = exec('single1.js', ['type']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "single" w/ "type" and "~default~" values\n', '~> ran single command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('single1.js', ['type', 'dir']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "single" w/ "type" and "dir" values\n', '~> ran single command');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) single is catch all', t => {
	let pid1 = exec('single2.js', ['type']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), `~> ran "single" with: {"_":["type"]}\n`, '~> ran single command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('single2.js', ['type', 'dir', '--global']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), `~> ran "single" with: {"_":["type","dir"],"global":true,"g":true}\n`, '~> ran single command');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) single :: command() throws', t => {
	let pid = exec('single3.js', ['foo']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Disable "single" mode to add commands'), '~> threw Error w/ message');
	t.end();
});

test('(usage) single :: help', t => {
	let pid1 = exec('single1.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.false(pid1.stdout.toString().includes('Available Commands'), '~> global help does NOT show "Available Commands" text');
	t.false(pid1.stdout.toString().includes('run any command with the `--help` flag'), '~> global help does NOT show "run any command with the `--help` flag" text');

	let pid2 = exec('single1.js', ['--help']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin <type> [dir] [options]'), '~> shows single-command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('single1.js', ['bar', '--help']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin <type> [dir] [options]'), '~> shows single-command help w/ "Usage" text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});


// ---
// Command Aliases
// ---


test('(usage) alias :: basic', t => {
	let pid1 = exec('basic.js', ['f']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" action\n', '~> command invoked');

	let pid2 = exec('basic.js', ['fo']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> ran "foo" action\n', '~> command invoked');

	t.end();
});

test('(usage) alias :: basic :: error :: invalid command', t => {
	let pid = exec('basic.js', ['fff']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Invalid command: fff\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Invalid command: fff" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) alias :: basic :: help', t => {
	let pid1 = exec('basic.js', ['-h']);
	t.is(pid1.status, 0, 'exits with error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('basic.js', ['f', '-h']);
	t.is(pid2.status, 0, 'exits with error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});


test('(usage) alias :: args.required', t => {
	let pid = exec('args.js', ['f', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "foo" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) alias :: args.required :: error :: missing argument', t => {
	let pid = exec('args.js', ['f']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Insufficient arguments!\n\n  Run `$ bin foo --help` for more info.\n\n',
		'~> stderr has "Insufficient arguments!" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) alias :: args.optional', t => {
	let pid = exec('args.js', ['b']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "~default~" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) alias :: args.optional w/ value', t => {
	let pid = exec('args.js', ['b', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});



test('(usage) alias :: options.long', t => {
	let pid1 = exec('options.js', ['f', '--long']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['f', '-l']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: options.short', t => {
	let pid1 = exec('options.js', ['f', '--short']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['f', '-s']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: options.hello', t => {
	let pid1 = exec('options.js', ['f', '--hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "hello" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	// shows that '-h' is always reserved
	let pid2 = exec('options.js', ['f', '-h']);
	let stdout = pid2.stdout.toString();
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.not(stdout, '~> ran "long" option\n', '~> did NOT run custom "-h" option');
	t.true(stdout.includes('-h, --help      Displays this message'), '~~> shows `--help` text');

	t.end();
});

test('(usage) alias :: options.extra', t => {
	let pid = exec('options.js', ['f', '--extra=opts', '--404']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> default with {"404":true,"_":[],"extra":"opts"}\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) alias :: options.global', t => {
	let pid1 = exec('options.js', ['f', '--global']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> default with {"_":[],"global":true,"g":true}\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['f', '-g', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> default with {"_":[],"g":"hello","global":"hello"}\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: options w/o alias', t => {
	let pid1 = exec('options.js', ['b', 'hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	let pid2 = exec('options.js', ['b', 'hello', '--only']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> (only) "bar" with "hello" value\n', '~> command invoked');

	let pid3 = exec('options.js', ['b', 'hello', '-o']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');
	t.is(pid3.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	t.end();
});



test('(usage) alias :: unknown', t => {
	let pid1 = exec('unknown1.js', ['f', '--global']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"global":true,"g":true}\n', '~> command invoked');

	let pid2 = exec('unknown1.js', ['f', '-l']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> ran "foo" with {"_":[],"l":true,"local":true}\n', '~> command invoked');

	let pid3 = exec('unknown1.js', ['f', '--bar']);
	t.is(pid3.status, 1, 'exits with error code');
	t.is(pid3.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid3.stderr.toString(),
		'\n  ERROR\n    Parsed unknown option flag(s)!\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Parsed unknown option flag" error message (default)'
	);

	t.end();
});

test('(usage) alias :: unknown.custom', t => {
	let pid1 = exec('unknown2.js', ['f', '--global', '--local']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"global":true,"local":true,"g":true,"l":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['f', '--bar']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --bar\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Custom error: --bar" error message'
	);

	t.end();
});

test('(usage) alias :: unknown.plain', t => {
	let pid1 = exec('unknown2.js', ['f', '--flag1', '--flag2']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"flag1":true,"flag2":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['f', '--flag3']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --flag3\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Custom error: --flag3" error message'
	);

	t.end();
});



test('(usage) alias :: subcommands', t => {
	let pid1 = exec('subs.js', ['r']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "remote" action\n', '~> ran parent');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['rr', 'origin', 'foobar']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "remote rename" with "origin" and "foobar" args\n', '~> ran "rename" child');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['ra', 'origin', 'foobar']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "remote add" with "origin" and "foobar" args\n', '~> ran "add" child');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: subcommands :: help', t => {
	let pid1 = exec('subs.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    remote           \n    remote add       \n    remote rename'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['r', '--help']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin remote [options]'), '~> shows "remote" help text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['rr', '--help']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin remote rename <old> <new> [options]'), '~> shows "remote rename" help text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});


test('(usage) alias :: default', t => {
	let pid1 = exec('default.js', []);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['f']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['f', 'hello']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n', '~> ran default command (direct)');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	let pid4 = exec('default.js', ['b']);
	t.is(pid4.status, 0, 'exits without error code');
	t.is(pid4.stdout.toString(), '~> ran "bar" action\n', '~> ran "bar" command');
	t.is(pid4.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) default :: args', t => {
	let pid1 = exec('default.js', ['hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['f', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: default :: help', t => {
	let pid1 = exec('default.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo    \n    bar'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['f', '-h']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [dir] [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['b', '-h']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin bar [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) alias :: single :: throws', t => {
	let pid = exec('alias1.js');
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Cannot call `alias()` in "single" mode'), '~> threw Error w/ message');
	t.end();
});

test('(usage) alias :: pre-command :: throws', t => {
	let pid = exec('alias2.js');
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Cannot call `alias()` before defining a command'), '~> threw Error w/ message');
	t.end();
});


// ---
// Input Order
// ---


test('(usage) order :: basic', t => {
	let pid1 = exec('basic.js', ['--foo', 'bar', 'f']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" action\n', '~> command invoked');

	let pid2 = exec('basic.js', ['--foo', 'bar', 'fo']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> ran "foo" action\n', '~> command invoked');

	t.end();
});

test('(usage) order :: basic :: error :: invalid command', t => {
	let pid = exec('basic.js', ['--foo', 'bar', 'fff']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Invalid command: fff\n\n  Run `$ bin --help` for more info.\n\n',
		'~> stderr has "Invalid command: fff" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) order :: basic :: help', t => {
	let pid1 = exec('basic.js', ['--foo', 'bar', '-h']);
	t.is(pid1.status, 0, 'exits with error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('basic.js', ['--foo', 'bar', 'f', '-h']);
	t.is(pid2.status, 0, 'exits with error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});


test('(usage) order :: args.required', t => {
	let pid = exec('args.js', ['--foo', 'bar', 'f', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "foo" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) order :: args.required :: error :: missing argument', t => {
	let pid = exec('args.js', ['--foo', 'bar', 'f']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(
		pid.stderr.toString(),
		'\n  ERROR\n    Insufficient arguments!\n\n  Run `$ bin foo --help` for more info.\n\n',
		'~> stderr has "Insufficient arguments!" error message'
	);
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	t.end();
});

test('(usage) order :: args.optional', t => {
	let pid = exec('args.js', ['--foo', 'bar', 'b']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "~default~" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) order :: args.optional w/ value', t => {
	let pid = exec('args.js', ['--foo', 'bar', 'b', 'value']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> ran "bar" with "value" arg\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});



test('(usage) order :: options.long', t => {
	let pid1 = exec('options.js', ['--foo', 'bar', 'f', '--long']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['--foo', 'bar', 'f', '-l']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "long" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: options.short', t => {
	let pid1 = exec('options.js', ['--foo', 'bar', 'f', '--short']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['--foo', 'bar', 'f', '-s']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "short" option\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: options.hello', t => {
	let pid1 = exec('options.js', ['--foo', 'bar', 'f', '--hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "hello" option\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	// shows that '-h' is always reserved
	let pid2 = exec('options.js', ['--foo', 'bar', 'f', '-h']);
	let stdout = pid2.stdout.toString();
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.not(stdout, '~> ran "long" option\n', '~> did NOT run custom "-h" option');
	t.true(stdout.includes('-h, --help      Displays this message'), '~~> shows `--help` text');

	t.end();
});

test('(usage) order :: options.extra', t => {
	let pid = exec('options.js', ['--foo', 'bar', 'f', '--extra=opts', '--404']);
	t.is(pid.status, 0, 'exits without error code');
	t.is(pid.stdout.toString(), '~> default with {"404":true,"_":[],"foo":"bar","extra":"opts"}\n', '~> command invoked');
	t.is(pid.stderr.length, 0, '~> stderr is empty');
	t.end();
});

test('(usage) order :: options.global', t => {
	let pid1 = exec('options.js', ['--foo', 'bar', 'f', '--global']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> default with {"_":[],"foo":"bar","global":true,"g":true}\n', '~> command invoked');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('options.js', ['--foo', 'bar', 'f', '-g', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> default with {"_":[],"foo":"bar","g":"hello","global":"hello"}\n', '~> command invoked');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: options w/o alias', t => {
	let pid1 = exec('options.js', ['--foo', 'bar', 'b', 'hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	let pid2 = exec('options.js', ['--foo', 'bar', 'b', 'hello', '--only']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');
	t.is(pid2.stdout.toString(), '~> (only) "bar" with "hello" value\n', '~> command invoked');

	let pid3 = exec('options.js', ['--foo', 'bar', 'b', 'hello', '-o']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');
	t.is(pid3.stdout.toString(), '~> "bar" with "hello" value\n', '~> command invoked');

	t.end();
});


test('(usage) order :: unknown.custom', t => {
	let pid1 = exec('unknown2.js', ['f', '--global', '--local']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"global":true,"local":true,"g":true,"l":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['--foo', 'bar', 'f', '--bar']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --foo\n\n  Run `$ bin --help` for more info.\n\n', // came first
		'~> stderr has "Custom error: --foo" error message' // came first
	);

	t.end();
});


test('(usage) order :: unknown.plain', t => {
	let pid1 = exec('unknown2.js', ['f', '--flag1', '--flag2']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');
	t.is(pid1.stdout.toString(), '~> ran "foo" with {"_":[],"flag1":true,"flag2":true}\n', '~> command invoked');

	let pid2 = exec('unknown2.js', ['--foo', 'bar', 'f', '--flag3']);
	t.is(pid2.status, 1, 'exits with error code');
	t.is(pid2.stdout.length, 0, '~> stdout is empty');
	t.is(
		pid2.stderr.toString(),
		'\n  ERROR\n    Custom error: --foo\n\n  Run `$ bin --help` for more info.\n\n', // came first
		'~> stderr has "Custom error: --foo" error message' // came first
	);

	t.end();
});



test('(usage) order :: subcommands', t => {
	let pid1 = exec('subs.js', ['--foo', 'bar', 'r']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "remote" action\n', '~> ran parent');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['--foo', 'bar', 'rr', 'origin', 'foobar']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "remote rename" with "origin" and "foobar" args\n', '~> ran "rename" child');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['--foo', 'bar', 'ra', 'origin', 'foobar']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "remote add" with "origin" and "foobar" args\n', '~> ran "add" child');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	let pid4 = exec('subs.js', ['--foo', 'bar', 'remote', 'new', 'origin', 'foobar']);
	t.is(pid4.status, 0, 'exits without error code');
	t.is(pid4.stdout.toString(), '~> ran "remote add" with "origin" and "foobar" args\n', '~> ran "add" child');
	t.is(pid4.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: subcommands :: help', t => {
	let pid1 = exec('subs.js', ['--foo', 'bar', '--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    remote           \n    remote add       \n    remote rename'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['--foo', 'bar', 'r', '--help']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin remote [options]'), '~> shows "remote" help text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['--foo', 'bar', 'rr', '--help']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin remote rename <old> <new> [options]'), '~> shows "remote rename" help text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	let pid4 = exec('subs.js', ['--foo', 'bar', 'remote', 'new', '--help']);
	t.is(pid4.status, 0, 'exits without error code');
	t.is(pid4.stdout.toString(), '\n  Usage\n    $ bin remote add <name> <url> [options]\n\n  Aliases\n    $ bin ra\n    $ bin remote new\n\n  Options\n    -h, --help    Displays this message\n\n');
	t.is(pid4.stderr.length, 0, '~> stderr is empty');

	t.end();
});


test('(usage) order :: default', t => {
	let pid1 = exec('default.js', ['--foo', 'bar']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['--foo', 'bar', 'f']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "~EMPTY~" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['--foo', 'bar', 'b']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "bar" action\n', '~> ran "bar" command');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) default :: args', t => {
	let pid1 = exec('default.js', ['--foo', 'bar', 'hello']);
	t.is(pid1.status, 0, 'exits without error code');
	t.is(pid1.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['--foo', 'bar', 'foo', 'hello']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['--foo', 'bar', 'foo', 'hello']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "foo" action w/ "hello" arg\n', '~> ran default command (direct)');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: default :: help', t => {
	let pid1 = exec('default.js', ['--foo', 'bar', '--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo    \n    bar'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['--foo', 'bar', 'f', '-h']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [dir] [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['--foo', 'bar', 'b', '-h']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin bar [options]'), '~> shows command help w/ "Usage" text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) order :: single :: throws', t => {
	let pid = exec('alias1.js', ['--foo', 'bar']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Cannot call `alias()` in "single" mode'), '~> threw Error w/ message');
	t.end();
});

test('(usage) order :: pre-command :: throws', t => {
	let pid = exec('alias2.js', ['--foo', 'bar']);
	t.is(pid.status, 1, 'exits with error code');
	t.is(pid.stdout.length, 0, '~> stdout is empty');
	// throws an error in the process
	t.true(pid.stderr.toString().includes('Error: Cannot call `alias()` before defining a command'), '~> threw Error w/ message');
	t.end();
});
