import React from 'react';
import PixiFight from '../components/Arena/PixiFight';
import { FightGetResponse } from '@labrute/core';

const TestTooltipView: React.FC = () => {
  // Create mock fight data
  const mockFight: FightGetResponse = {
    id: 'test-fight',
    brute1Id: 'brute1',
    brute2Id: 'brute2',
    brute1: {
      id: 'brute1',
      name: 'TestBrute1',
      level: 10,
      hp: 100,
      strength: 50,
      agility: 30,
      speed: 25,
      weapons: [1, 2],
      skills: [1, 2, 3],
      supers: [4]
    },
    brute2: {
      id: 'brute2',
      name: 'TestBrute2',
      level: 12,
      hp: 120,
      strength: 40,
      agility: 45,
      speed: 35,
      weapons: [3],
      skills: [5, 6, 7, 8],
      supers: []
    },
    fighters: [
      {
        index: 0,
        id: 'brute1',
        name: 'TestBrute1',
        level: 10,
        hp: 100,
        maxHp: 100,
        strength: 50,
        agility: 30,
        speed: 25,
        weapons: [1, 2],
        skills: [1, 2, 3],
        supers: [4],
        team: 'L'
      },
      {
        index: 1,
        id: 'brute2',
        name: 'TestBrute2',
        level: 12,
        hp: 120,
        maxHp: 120,
        strength: 40,
        agility: 45,
        speed: 35,
        weapons: [3],
        skills: [5, 6, 7, 8],
        supers: [],
        team: 'R'
      }
    ],
    steps: [],
    winner: 'brute1',
    loser: 'brute2',
    tournamentId: null,
    clanWarId: null,
    modifiers: [],
    date: new Date().toISOString(),
    favoritedBy: [],
    deletedBy: []
  } as any;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '50px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Test Tooltip - Survolez les portraits</h1>
      <div style={{
        border: '2px solid #444',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <PixiFight fight={mockFight} />
      </div>
      <div style={{ color: '#ccc', marginTop: '20px', textAlign: 'center' }}>
        <p>Instructions:</p>
        <p>1. Survolez les portraits des combattants en haut</p>
        <p>2. Le tooltip devrait apparaître instantanément et suivre la souris</p>
        <p>3. Ouvrez la console (F12) pour voir les messages de debug</p>
      </div>
    </div>
  );
};

export default TestTooltipView;