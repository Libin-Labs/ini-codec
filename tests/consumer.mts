import { parseIni, stringifyIni, type IniDocument } from '@lp-labs/ini-codec';
const doc: IniDocument = parseIni('a=b');
const text: string = stringifyIni(doc);
void text;
// @ts-expect-error values must be strings
stringifyIni({ globals: { x: 1 }, sections: {} });
