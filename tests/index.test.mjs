import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseIni, stringifyIni } from '../dist/esm/index.js';

test('sections and escapes', () => {
  const d = parseIni('a=one\n[s]\nb="two\\nlines"\n');
  assert.equal(d.globals.a, 'one');
  assert.equal(d.sections.s.b, 'two\nlines');
});
test('safe names and prototypes', () => {
  const d = parseIni('__proto__=x\n[constructor]\nprototype=y');
  assert.equal(Object.getPrototypeOf(d.globals), null);
  assert.equal(d.globals.__proto__, 'x');
  assert.equal(d.sections.constructor.prototype, 'y');
  assert.equal({}.polluted, undefined);
});
test('duplicates', () => {
  assert.throws(() => parseIni('a=1\na=2'), SyntaxError);
  assert.equal(parseIni('a=1\na=2', { duplicates: 'last' }).globals.a, '2');
  assert.throws(() => parseIni('[x]\n[x]'), SyntaxError);
});
test('strict subset', () => {
  for (const s of ['a', '[x', 'a="bad\\q"', 'a="x" trailing', 'a="a"b"', 'a=bad\rx'])
    assert.throws(() => parseIni(s), SyntaxError);
  assert.equal(parseIni('a=x # literal').globals.a, 'x # literal');
});
test('exact bounds', () => {
  assert.equal(parseIni('a=b', { maxLength: 3, maxEntries: 1 }).globals.a, 'b');
  assert.throws(() => parseIni('a=b', { maxLength: 2 }), RangeError);
  assert.throws(() => parseIni('[x]\na=b', { maxEntries: 1 }), RangeError);
});
test('round trip', () => {
  const d = parseIni('a="x\\t\\\\\\\""\n[s]\nb=ok');
  assert.deepEqual(parseIni(stringifyIni(d)), d);
  assert.equal(stringifyIni(parseIni('')), '');
});
test('physical controls, BOM and invalid names reject', () => {
  for (const text of ['\ufeffa=b', 'a=b\r', 'a=x\0', 'a=x\b', '[bad name]\na=b'])
    assert.throws(() => parseIni(text), SyntaxError);
  assert.throws(() => stringifyIni({ globals: { ['a\n']: 'b' }, sections: {} }), SyntaxError);
});
test('last section reopens without losing members', () => {
  const doc = parseIni('[x]\na=1\n[x]\nb=2', { duplicates: 'last' });
  assert.equal(doc.sections.x.a, '1');
  assert.equal(doc.sections.x.b, '2');
  assert.throws(() => stringifyIni(doc, { maxEntries: 2 }), RangeError);
});
test('all supported escapes roundtrip and serializer exact size', () => {
  const doc = parseIni('a="x\\n\\r\\t\\\\\\\""');
  const text = stringifyIni(doc);
  assert.equal(stringifyIni(doc, { maxLength: text.length }), text);
  assert.throws(() => stringifyIni(doc, { maxLength: text.length - 1 }), RangeError);
  assert.deepEqual(parseIni(text), doc);
  assert.throws(() => stringifyIni({ globals: { a: '\b' }, sections: {} }), SyntaxError);
});
