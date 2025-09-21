import React, { useEffect, useState } from 'react';
import PixiFight from '../components/Arena/PixiFight';
import { FightGetResponse } from '@labrute/core';

const TestFightMockView: React.FC = () => {
  const [fight, setFight] = useState<FightGetResponse | null>(null);

  useEffect(() => {
    // Créer un combat de test
    const mockFight: FightGetResponse = {
      id: 'test-123',
      brute1Id: 'brute1',
      brute2Id: 'brute2',
      brute1: {
        id: 'brute1',
        name: 'Brutus le Fort',
        level: 10,
        hp: 100,
        maxHp: 100,
        currentHp: 100,
        strength: 50,
        agility: 30,
        speed: 25,
        weapons: [1, 2],
        skills: [1, 2, 3],
        supers: [4],
        displayName: 'Brutus le Fort'
      },
      brute2: {
        id: 'brute2',
        name: 'Maximus le Rapide',
        level: 12,
        hp: 120,
        maxHp: 120,
        currentHp: 120,
        strength: 40,
        agility: 45,
        speed: 35,
        weapons: [3],
        skills: [5, 6, 7, 8],
        supers: [],
        displayName: 'Maximus le Rapide'
      },
      fighters: [
        {
          index: 0,
          id: 'brute1',
          name: 'Brutus le Fort',
          displayName: 'Brutus le Fort',
          level: 10,
          hp: 100,
          maxHp: 100,
          currentHp: 100,
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
          name: 'Maximus le Rapide',
          displayName: 'Maximus le Rapide',
          level: 12,
          hp: 120,
          maxHp: 120,
          currentHp: 120,
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

    setFight(mockFight);

    // Log pour debug
    console.log('Mock fight loaded:', mockFight);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        textAlign: 'center',
        zIndex: 100
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Test Combat avec Tooltip</h2>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Survolez les portraits des combattants (carrés bruns en haut)
        </p>
      </div>

      {fight && (
        <div style={{
          width: '500px',
          height: '300px',
          border: '2px solid #444',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <PixiFight fight={fight} speed={1} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        color: '#999',
        fontSize: '12px'
      }}>
        <p>Si le tooltip n'apparaît pas, ouvrez la console (F12) pour voir les erreurs</p>
      </div>
    </div>
  );
};

export default TestFightMockView;