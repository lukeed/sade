const test = require('tape');
const $ = require('../lib/utils');

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
		['   --foo-bar  , -f  ', ['foo-bar', 'f']]
	].forEach(arr => {
		t.same($.parse(arr[0]), arr[1], `(${arr[0]}) ~~> [${arr[1]}]`);
	});
	t.end();
});
