# @lp-labs/ini-codec

A safe bounded INI subset with sections, quoted values and explicit duplicate policy.

## Install

```sh
npm install @lp-labs/ini-codec
```

Node.js 18+; standalone browser-compatible ES2022 core with DOM codec types. Zero runtime or peer dependencies. ESM and CommonJS with separate declarations. No filesystem, network or environment side effects.

## Quickstart

```js
import { parseIni, stringifyIni } from '@lp-labs/ini-codec';
const document = parseIni('name=demo\n[server]\nport=8080');
console.log(stringifyIni(document));
```

CommonJS consumers use `const api = require('@lp-labs/ini-codec')`. The same named API is available in both module formats. No default export.

## API, behavior, errors and limits

parseIni returns IniDocument with null-prototype globals and section maps; names including **proto** are data, never prototype setters. Names use ASCII letters, digits, underscore, dot, hyphen; names are case-sensitive. Lines use LF or CRLF; whole-line #/; comments only. Unquoted values are trimmed, literal strings, including inline comment markers. Double-quoted values support only backslash, quote, n/r/t escapes; no multiline values, interpolation, arrays, nested sections, BOM, or arbitrary JSON escapes. duplicates defaults 'error'; 'last' overwrites keys and reopens/merges sections. maxLength defaults 1,048,576 UTF-16 units, maxEntries 10,000 (section creations plus assignments). stringifyIni emits quoted values with a final LF and validates the same subset: control characters not representable by supported escapes are rejected. SyntaxError is invalid syntax/name/duplicates; RangeError is bounds; TypeError invalid options/value types. O(text length) parsing with linear storage; serialization scales with emitted data. Does not read files.

All exports: `IniDocument`, `IniOptions`, `parseIni`, `stringifyIni`.

## Full TypeScript declarations

```ts
export interface IniDocument {
  globals: Record<string, string>;
  sections: Record<string, Record<string, string>>;
}
export interface IniOptions {
  duplicates?: 'error' | 'last';
  maxLength?: number;
  maxEntries?: number;
}
export declare function parseIni(text: string, o?: IniOptions): IniDocument;
export declare function stringifyIni(doc: IniDocument, o?: IniOptions): string;
```

## Development

```sh
npm ci --offline
npm run typecheck
npm test
npm run format:check
```

TypeScript ^5.9.3 and Prettier ^3.6.2 are development-only. Build emits dist/esm and dist/cjs. Tests use Node's test runner; consumer.mts and consumer.cts exercise bare package imports including negative type assertions.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
