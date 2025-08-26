import fs from 'fs';
import path from 'path';
import * as Fla from 'labrute-fla-parser';

interface SymbolData {
  name: string;
  regX?: number;
  regY?: number;
  offset?: { x?: number; y?: number };
}

const metaDir = path.resolve(__dirname, '../meta');
const partsFile = path.join(metaDir, 'parts.csv');
const todoFile = path.join(metaDir, 'todo.csv');

fs.mkdirSync(metaDir, { recursive: true });

const defaultZ: Record<string, number> = {
  head: 3,
  body: 1,
  weapon: 5,
  shield: 5,
};

const lines: string[] = ['part,gender,id,symbol,pivotX,pivotY,z'];
const todo: string[] = ['symbol'];

for (const [key, value] of Object.entries(Fla) as [string, SymbolData][]) {
  if (!key.startsWith('Symbol')) continue;
  const partMatch = /(head|body|weapon|shield|pet|misc)/i.exec(key);
  const genderMatch = /(male|female)/i.exec(key);
  const idMatch = /(\d+)/.exec(key);
  const part = partMatch?.[1]?.toLowerCase();
  const gender = genderMatch ? genderMatch[1].toLowerCase() : 'any';
  const id = idMatch ? parseInt(idMatch[1], 10) : undefined;

  if (!part || id === undefined) {
    todo.push(key);
    continue;
  }

  const pivotX = value.regX ?? value.offset?.x ?? 0;
  const pivotY = value.regY ?? value.offset?.y ?? 0;
  const z = defaultZ[part] ?? 0;

  lines.push(`${part},${gender},${id},${key},${pivotX},${pivotY},${z}`);
}

fs.writeFileSync(partsFile, lines.join('\n'), 'utf8');
if (todo.length > 1) {
  fs.writeFileSync(todoFile, todo.join('\n'), 'utf8');
  console.log(`Wrote ${partsFile}, unparsed symbols listed in ${todoFile}`);
  process.exitCode = 1;
} else {
  if (fs.existsSync(todoFile)) fs.rmSync(todoFile);
  console.log(`Wrote ${partsFile}`);
}
