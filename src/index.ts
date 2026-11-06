export interface IniDocument {
  globals: Record<string, string>;
  sections: Record<string, Record<string, string>>;
}
export interface IniOptions {
  duplicates?: 'error' | 'last';
  maxLength?: number;
  maxEntries?: number;
}
function config(o: IniOptions): { max: number; entries: number; last: boolean } {
  const max = o.maxLength ?? 1_048_576,
    entries = o.maxEntries ?? 10000;
  if (!Number.isSafeInteger(max) || max < 0 || !Number.isSafeInteger(entries) || entries < 0)
    throw new RangeError('Invalid limits');
  if (o.duplicates !== undefined && o.duplicates !== 'error' && o.duplicates !== 'last')
    throw new TypeError('Invalid duplicate policy');
  return { max, entries, last: o.duplicates === 'last' };
}
function name(s: string): void {
  if (!/^[A-Za-z0-9_.-]+(?![\s\S])/.test(s)) throw new SyntaxError('Invalid INI name');
}
function value(s: string): string {
  if (!s.startsWith('"')) {
    if (s.includes('"')) throw new SyntaxError('Unexpected quote');
    return s;
  }
  if (!s.endsWith('"') || s.length < 2) throw new SyntaxError('Unclosed quote');
  let out = '';
  for (let i = 1; i < s.length - 1; i++) {
    const c = s[i]!;
    if (c === '"') throw new SyntaxError('Unexpected quote');
    if (c !== '\\') {
      out += c;
      continue;
    }
    const e = s[++i];
    if (i >= s.length - 1 || !e || !Object.hasOwn({ n: 1, r: 1, t: 1, '"': 1, '\\': 1 }, e))
      throw new SyntaxError('Invalid escape');
    out += e === 'n' ? '\n' : e === 'r' ? '\r' : e === 't' ? '\t' : e;
  }
  return out;
}
export function parseIni(text: string, o: IniOptions = {}): IniDocument {
  const c = config(o);
  if (text.length > c.max) throw new RangeError('Text limit exceeded');
  if (text.startsWith('\ufeff')) throw new SyntaxError('BOM is unsupported');
  const doc: IniDocument = {
    globals: Object.create(null) as Record<string, string>,
    sections: Object.create(null) as Record<string, Record<string, string>>,
  };
  let target = doc.globals,
    count = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(raw))
      throw new SyntaxError('Invalid physical control character');
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (/[\r\0]/.test(line)) throw new SyntaxError('Invalid control character');
    if (line.startsWith('[')) {
      if (!line.endsWith(']')) throw new SyntaxError('Malformed section');
      const key = line.slice(1, -1);
      name(key);
      if (Object.hasOwn(doc.sections, key)) {
        if (!c.last) throw new SyntaxError('Duplicate section');
        target = doc.sections[key]!;
      } else {
        if (++count > c.entries) throw new RangeError('Entry limit exceeded');
        target = Object.create(null) as Record<string, string>;
        doc.sections[key] = target;
      }
      continue;
    }
    const at = line.indexOf('=');
    if (at < 1) throw new SyntaxError('Expected key=value');
    const key = line.slice(0, at).trim();
    name(key);
    if (Object.hasOwn(target, key) && !c.last) throw new SyntaxError('Duplicate key');
    if (++count > c.entries) throw new RangeError('Entry limit exceeded');
    target[key] = value(line.slice(at + 1).trim());
  }
  return doc;
}
export function stringifyIni(doc: IniDocument, o: IniOptions = {}): string {
  const c = config(o),
    lines: string[] = [];
  let count = 0,
    length = 0;
  const push = (s: string): void => {
    length += s.length + 1;
    if (length > c.max) throw new RangeError('Text limit exceeded');
    lines.push(s);
  };
  const emit = (record: Record<string, string>): void => {
    for (const key of Object.keys(record)) {
      name(key);
      if (++count > c.entries) throw new RangeError('Entry limit exceeded');
      const v = record[key];
      if (typeof v !== 'string') throw new TypeError('INI values must be strings');
      push(key + '=' + JSON.stringify(v));
    }
  };
  emit(doc.globals);
  for (const section of Object.keys(doc.sections)) {
    name(section);
    if (++count > c.entries) throw new RangeError('Entry limit exceeded');
    push('[' + section + ']');
    emit(doc.sections[section]!);
  }
  const result = lines.length ? lines.join('\n') + '\n' : '';
  parseIni(result, o);
  return result;
}
