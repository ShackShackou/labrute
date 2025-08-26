import { useState } from 'react';

export type Part = {
  part: string;
  gender: string;
  id: string;
  symbol: string;
  pivotX: number;
  pivotY: number;
  z: number;
};

export interface CharacterState {
  parts: Record<string, Part[]>;
  selection: Record<string, string>;
  randomize: () => void;
  getSeed: () => string;
  setSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const useCharacter = (partsCsv: Part[]): CharacterState => {
  const parts = partsCsv.reduce<Record<string, Part[]>>((acc, part) => {
    acc[part.part] = acc[part.part] || [];
    acc[part.part].push(part);
    return acc;
  }, {});

  const [selection, setSelection] = useState<Record<string, string>>({});

  const randomize = () => {
    const sel: Record<string, string> = {};
    for (const [p, list] of Object.entries(parts)) {
      sel[p] = list[Math.floor(Math.random() * list.length)].id;
    }
    setSelection(sel);
  };

  const getSeed = () => JSON.stringify(selection);

  return { parts, selection, randomize, getSeed, setSelection };
};
