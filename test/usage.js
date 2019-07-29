const test = require('tape');
const { join } = require('path');
const { spawnSync } = require('child_process');

const fixtures = join(__dirname, 'fixtures');

function dedent(str) {
	return str[0].replace(/\t/g, ' ');
}

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
	t.true(pid1.stdout.toString().includes('Available Commands\n    remote'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('subs.js', ['remote', '--help']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin remote [options]'), '~> shows "remote" help text');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('subs.js', ['remote', 'rename', '--help']);
	t.is(pid3.status, 0, 'exits without error code');
	t.true(pid3.stdout.toString().includes('Usage\n    $ bin remote rename <old> <new> [options]'), '~> shows "remote rename" help text');
	t.false(pid3.stdout.toString().includes('    $ bin remote child grandchild'), '~> does not show "remote child grandchild" help text');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	let pid4 = exec('subs.js', ['remote', 'child', '--help']);
	t.is(pid4.status, 0, 'exits without error code');
	t.true(pid4.stdout.toString().includes('Usage\n    $ bin remote child [options]'), '~> shows "remote child" help text');
	t.true(pid4.stdout.toString().includes('Available Commands\n    remote child grandchild    \n'), '~> only shows child commands of current command in help text');
	t.is(pid4.stderr.length, 0, '~> stderr is empty');

	let pid5 = exec('subs.js', ['remote', 'child', 'grandchild', '--help']);
	t.is(pid5.status, 0, 'exits without error code');
	t.true(pid5.stdout.toString().includes('Usage\n    $ bin remote child grandchild <arg> [options]'), '~> shows "remote child grandchild" help text');
	t.is(pid5.stderr.length, 0, '~> stderr is empty');

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
	t.is(pid1.stdout.toString(), '~> ran "foo" action\n', '~> ran default command');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['foo']);
	t.is(pid2.status, 0, 'exits without error code');
	t.is(pid2.stdout.toString(), '~> ran "foo" action\n', '~> ran default command (direct)');
	t.is(pid2.stderr.length, 0, '~> stderr is empty');

	let pid3 = exec('default.js', ['bar']);
	t.is(pid3.status, 0, 'exits without error code');
	t.is(pid3.stdout.toString(), '~> ran "bar" action\n', '~> ran "bar" command');
	t.is(pid3.stderr.length, 0, '~> stderr is empty');

	t.end();
});

test('(usage) default :: help', t => {
	let pid1 = exec('default.js', ['--help']);
	t.is(pid1.status, 0, 'exits without error code');
	t.true(pid1.stdout.toString().includes('Available Commands\n    foo    \n    bar'), '~> shows global help w/ "Available Commands" text');
	t.is(pid1.stderr.length, 0, '~> stderr is empty');

	let pid2 = exec('default.js', ['foo', '-h']);
	t.is(pid2.status, 0, 'exits without error code');
	t.true(pid2.stdout.toString().includes('Usage\n    $ bin foo [options]'), '~> shows command help w/ "Usage" text');
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
