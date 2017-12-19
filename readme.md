# sade [![Build Status](https://travis-ci.org/lukeed/sade.svg?branch=master)](https://travis-ci.org/lukeed/sade)

> Smooth (CLI) Operator 🎶

Sade is a small but powerful tool for building command-line interface (CLI) applications for Node.js that are fast, responsive, and helpful!

It enables default commands, option flags with aliases, default option values with type-casting, and automated help text generation! Your app's UX will be as smooth as butter... just like [Sade's voice](https://www.youtube.com/watch?v=4TYv2PhG89A). 😉


## Install

```
$ npm install --save sade
```


## Usage

***Input:***

```js
const sade = require('sade');

const prog = sade('my-cli');

prog
  .version('1.0.5')
  .option('--global, -g', 'An example global flag')
  .option('-c, --config', 'Provide path to custom config', 'foo.config.js');

prog
  .command('build <src> <dest>')
  .describe('Build the source directory. Expects an `index.js` entry file.')
  .option('-o, --output', 'Change the name of the output file', 'bundle.js')
  .example('build src build --global --config my-conf.js')
  .example('build app public -o main.js')
  .action((src, dest, opts) => {
    console.log(`> building from ${src} to ${dest}`);
    console.log('> these are extra opts', opts);
  });

prog.parse(process.argv);
```

***Output:***

```a
$ my-cli --help

  Usage
    $ my-cli <command> [options]

  Available Commands
    build    Build the source directory.

  For more info, run any command with the `--help` flag
    $ my-cli build --help

  Options
    -v, --version    Displays current version
    -g, --global     An example global flag
    -c, --config     Provide path to custom config  (default foo.config.js)
    -h, --help       Displays this message


$ my-cli build --help

  Description
    Build the source directory.
    Expects an `index.js` entry file.

  Usage
    $ my-cli build <src> [options]

  Options
    -o, --output    Change the name of the output file  (default bundle.js)
    -g, --global    An example global flag
    -c, --config    Provide path to custom config  (default foo.config.js)
    -h, --help      Displays this message

  Examples
    $ my-cli build src build --global --config my-conf.js
    $ my-cli build app public -o main.js
```

## Tips

- **Define your global/program-wide version, options, description, and/or examples first.**<br>
  _Once you define a Command, you can't access the global-scope again._

- **Don't worry about manually displaying help~!**<br>
  _Your help text is displayed automatically... including command-specific help text!_

- **Your usage patterns should only include required parameters.**<br>
  _The `[options]` inclusion is appended for you automatically._

- **Only define what you want to display!**<br>
  _Help text sections (example, options, etc) will only display if you provide values._


## API

### sade(name)

#### name

Type: `String`<br>
Returns: `Program`

The name of your bin/program. Returns the `Program` itself, wherein all other methods are available.

### prog.command(usage, desc, opts)

Create a new Command for your Program. This changes the current state of your Program.

All configuration methods (`prog.describe`, `prog.action`, etc) will apply to this Command until another Command has been created!

#### usage

Type: `String`

The usage pattern for your current Command. This will be included in the general or command-specific `--help` output.

You must wrap **required** parameter names with `<` and `>`; for example, `<foo>` and `<bar>`. These are ***positionally important***, which means they are passed to your current Command's [`handler`](#handler) function in the order that they were defined.

```js
sade('foo')
  .command('greet <adjective> <noun>')
  .action((adjective, noun, opts) => {
    console.log(`Hello, ${adjective} ${noun}!`);
  })

// $ foo greet beautiful person
//=> Hello, beautiful person!
```


#### desc

Type: `String`<br>
Default: `''`

The Command's description. The value is passed directly to [`prog.describe`](#progdescribetext).

#### opts

Type: `Object`<br>
Default: `{}`

##### opts.default

Type: `Boolean`

Manually set/force the current Command to be the Program's default command. This ensures that the current Command will run if no command was specified.

```js
const prog = sade('greet');

prog.command('hello');
//=> only runs if :: `$ greet hello`

prog.command('howdy', '', { default:true });
//=> runs as `$ greet` OR `$ greet howdy`

// $ greet
//=> runs 'howdy' handler
```


### prog.describe(text)

Add a description to the current Command.

#### text

Type: `String|Array`

The description text for the current Command. This will be included in the general or command-specific `--help` output.

Internally, your description will be separated into an `Array` of sentences.

For general `--help` output, ***only*** the first sentence will be displayed. However, **all sentences** will be printed for command-specific `--help` text.

> **Note:** Pass an `Array` if you don't want internal assumptions. However, the first item is _always_ displayed in general help, so it's recommended to keep it short.


### prog.action(handler)

Attach a callback to the current Command.

#### handler

Type: `Function`

The function to run when the current Command is executed.

Its parameters are based on your [`usage`](#usage) definition.

All options, flags, and extra/unknown values are included as the last parameter.

```js
sade('foo')
  .command('cp <src> <dest>')
  .option('-f, --force', 'Overwrite without confirmation')
  .option('-v, --verbose', 'Enable verbose output')
  .action((src, dest, opts) => {
    console.log(`Copying files from ${src} --> ${dest}`);
    console.log('My options:', opts);
  })

// $ foo cp original clone -v
//=> Copying files from original --> clone
//=> My options: { _:[], v:true, verbose:true }
```


### prog.example(str)

Add an example for the current Command.

#### str

Type: `String`

The example string to add. This will be included in the general or command-specific `--help` output.

> **Note:** Your example's `str` will be prefixed with your Programs's [`name`](#sadename).


### prog.option(flags, desc, value)

Add an Option to the current Command.

#### flags

Type: `String`

The Option's flags, which may optionally include an alias.

You may use a comma (`,`) or a space (` `) to separate the flags.

> **Note:** The short & long flags can be declared in any order. However, the alias will always be displayed first.

```js
prog.option('--global'); // no alias
prog.option('-g, --global'); // alias first, comma
prog.option('--global -g'); // alias last, space
// etc...
```

#### desc

Type: `String`

The description for the Option.

#### value

Type: `String`

The **default** value for the Option.

Flags and aliases, if parsed, are `true` by default. See [`mri`](https://github.com/lukeed/mri#minimist) for more info.

> **Note:** You probably only want to define a default `value` if you're expecting a `String` or `Number` value type.

If you _do_ pass a `String` or `Number` value type, your flag value will be casted to the same type. See [`mri#options.default`](https://github.com/lukeed/mri#optionsdefault) for info~!


### prog.version(str)

The `--version` and `-v` flags will automatically output the Program version.

#### str

Type: `String`<br>
Default: `0.0.0`

The new version number for your Program.

> **Note:** Your Program `version` is `0.0.0` until you change it.

### prog.parse(arr)

Parse a set of CLI arguments.

#### arr

Type: `Array`

Your Program's `process.argv` input.

> **Important:** Do not `.slice(2)`! Doing so will break parsing~!

### prog.help(cmd)

Manually display the help text for a given command. If no command name is provided, the general/global help is printed.

Your general and command-specific help text is automatically attached to the `--help` and `-h` flags.

> **Note:** You don't have to call this directly! It's automatically run when you `bin --help`

#### cmd
Type: `String`<br>
Default: `null`

The name of the command for which to display help. Otherwise displays the general help.


## License

MIT © [Luke Edwards](https://lukeed.com)
