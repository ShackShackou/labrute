import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import Spritesmith from 'spritesmith';
import sharp from 'sharp';
import * as Fla from 'labrute-fla-parser';

type Row = {
  part: string;
  gender: string;
  id: string;
  symbol: string;
  pivotX: string;
  pivotY: string;
  z: string;
};

const metaDir = path.resolve(__dirname, '../meta');
const sheetDir = path.resolve(__dirname, '../sheets');
fs.mkdirSync(sheetDir, { recursive: true });

const rows: Row[] = [];
fs.createReadStream(path.join(metaDir, 'parts.csv'))
  .pipe(csv.parse({ headers: true }))
  .on('data', (data: Row) => rows.push(data))
  .on('end', async () => {
    const groups = rows.reduce<Record<string, Row[]>>((acc, row) => {
      acc[row.part] = acc[row.part] || [];
      acc[row.part].push(row);
      return acc;
    }, {});

    for (const [part, list] of Object.entries(groups)) {
      const tmp = fs.mkdtempSync(path.join(sheetDir, `${part}-`));
      const images: string[] = [];
      for (const item of list) {
        const symbol = (Fla as any)[item.symbol];
        const svg = symbol?.parts?.[0]?.svg as string | undefined;
        if (!svg) continue;
        const file = path.join(tmp, `${item.symbol}.png`);
        await sharp(Buffer.from(svg)).png().toFile(file);
        images.push(file);
      }
      const result: Spritesmith.Result = await new Promise((resolve, reject) => {
        Spritesmith.run({ src: images }, (err, res) => {
          if (err) reject(err); else resolve(res);
        });
      });
      fs.writeFileSync(path.join(sheetDir, `${part}.png`), result.image);
      fs.writeFileSync(
        path.join(sheetDir, `${part}.json`),
        JSON.stringify({ frames: result.coordinates }, null, 2)
      );
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
