import type * as mri from 'mri';

type Arrayable<T> = T | T[];

declare function sade(usage: string, isSingle?: boolean): sade.Sade;

declare namespace sade {
	export type Value = number | string | boolean | null;
	export type Handler<T extends readonly Value[] = Value[]> = (...args: [...T, mri.Argv]) => any;

	export interface LazyOutput<T extends any[]> {
		name: string;
		handler: Handler<T>;
		args: string[];
	}

	export interface Sade {
		command(usage: string, description?: string, options?: {
			alias?: Arrayable<string>;
			default?: boolean;
		}): Sade;

		option(flag: string, description?: string, value?: Value): Sade;
		action<T extends Value[]>(handler: Handler<T>): Sade;
		describe(text: Arrayable<string>): Sade;
		alias(...names: string[]): Sade;
		example(usage: string): Sade;

		parse<T extends Value[]>(arr: string[], opts: { lazy: true } & mri.Options): LazyOutput<T>;
		parse(arr: string[], opts?: { lazy?: boolean } & mri.Options): void;

		version(value: string): Sade;
		help(cmd?: string): void;
	}
}

export = sade;
