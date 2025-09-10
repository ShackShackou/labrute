import { CombatSceneSpine } from './CombatSceneSpine.js';
import { LaBruteCombatEngine } from './LaBruteCombatEngine.js';

// Configuration Phaser avec plugin Spine
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    scene: [
      {
        key: 'SpinePlugin',
        plugin: window.SpinePlugin,
        mapping: 'spine'
      }
    ]
  },
  scene: CombatSceneSpine
};

// Initialiser le jeu
const game = new Phaser.Game(config);
const combatEngine = new LaBruteCombatEngine();

let scene = null;

// Attendre que la scène soit prête
game.events.once('ready', () => {
  scene = game.scene.getScene('CombatSceneSpine');
  
  // Générer un combat initial
  generateNewFight();
});

// Générer un nouveau combat
function generateNewFight() {
  // Récupérer les données des combattants depuis l'UI
  const fighter1Data = {
    name: document.getElementById('f1-name').value || 'Fighter 1',
    level: parseInt(document.getElementById('f1-level').value) || 10,
    strength: parseInt(document.getElementById('f1-str').textContent),
    agility: parseInt(document.getElementById('f1-agi').textContent),
    speed: parseInt(document.getElementById('f1-spd').textContent),
    endurance: parseInt(document.getElementById('f1-end').textContent),
    team: 'L',
    weapons: Array.from(document.getElementById('f1-weapons').selectedOptions).map(o => o.value),
    skills: []
  };
  
  const fighter2Data = {
    name: document.getElementById('f2-name').value || 'Fighter 2',
    level: parseInt(document.getElementById('f2-level').value) || 10,
    strength: parseInt(document.getElementById('f2-str').textContent),
    agility: parseInt(document.getElementById('f2-agi').textContent),
    speed: parseInt(document.getElementById('f2-spd').textContent),
    endurance: parseInt(document.getElementById('f2-end').textContent),
    team: 'R',
    weapons: Array.from(document.getElementById('f2-weapons').selectedOptions).map(o => o.value),
    skills: []
  };
  
  // Générer le combat avec le moteur LaBrute
  const fightData = combatEngine.generateFight(fighter1Data, fighter2Data);
  
  // Mettre à jour les HP affichés
  document.getElementById('f1-hp').textContent = fightData.fighters[0].maxHp;
  document.getElementById('f1-init').textContent = fightData.fighters[0].initiative.toFixed(3);
  document.getElementById('f2-hp').textContent = fightData.fighters[1].maxHp;
  document.getElementById('f2-init').textContent = fightData.fighters[1].initiative.toFixed(3);
  
  // Charger dans la scène
  if (scene) {
    scene.loadFightData(fightData);
    updateFightLog(fightData);
    updateStatsSummary(fightData);
  }
}

// Mettre à jour le journal de combat
function updateFightLog(fightData) {
  const logEl = document.getElementById('fight-log');
  logEl.innerHTML = '';
  
  let stepCount = 0;
  fightData.steps.forEach((step, index) => {
    if (stepCount > 100) return; // Limiter l'affichage
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    let text = `${index + 1}. `;
    let className = '';
    
    const fighter = fightData.fighters.find(f => f.id === step.fighter);
    const target = fightData.fighters.find(f => f.id === step.target);
    
    switch (step.type) {
      case 9: // Hit
        text += `${fighter?.name} frappe ${target?.name} → ${step.damage} dégâts`;
        className = 'log-hit';
        break;
      case 15: // Move
        text += `${fighter?.name} avance`;
        className = 'log-move';
        break;
      case 17: // MoveBack
        text += `${fighter?.name} recule`;
        className = 'log-move';
        break;
      case 18: // Equip
        text += `${fighter?.name} équipe ${step.weapon}`;
        className = 'log-skill';
        break;
      case 19: // AttemptHit
        text += `${fighter?.name} attaque ${target?.name}`;
        className = 'log-move';
        break;
      case 20: // Block
        text += `${fighter?.name} bloque!`;
        className = 'log-block';
        break;
      case 21: // Evade
        text += `${fighter?.name} esquive!`;
        className = 'log-evade';
        break;
      case 24: // Death
        text += `${fighter?.name} est K.O.!`;
        className = 'log-death';
        break;
      case 26: // End
        const winner = fightData.fighters.find(f => f.id === step.winner);
        text += winner ? `${winner.name} gagne!` : 'Match nul!';
        className = 'log-death';
        break;
      case 27: // Counter
        text += `${fighter?.name} contre-attaque!`;
        className = 'log-skill';
        break;
      case 28: // SkillActivate
        text += `${fighter?.name} : ${step.skill || 'Compétence activée'}`;
        className = 'log-skill';
        break;
      default:
        text = '';
    }
    
    if (text) {
      entry.textContent = text;
      if (className) {
        entry.classList.add(className);
      }
      logEl.appendChild(entry);
      stepCount++;
    }
  });
  
  // Scroll en bas
  logEl.scrollTop = logEl.scrollHeight;
}

// Mettre à jour les statistiques
function updateStatsSummary(fightData) {
  const statsEl = document.getElementById('stats-summary');
  
  const totalSteps = fightData.steps.length;
  const hits = fightData.steps.filter(s => s.type === 9).length;
  const blocks = fightData.steps.filter(s => s.type === 20).length;
  const evades = fightData.steps.filter(s => s.type === 21).length;
  const criticals = fightData.steps.filter(s => s.type === 28 && s.skill === 'critical').length;
  
  const totalDamage = fightData.steps
    .filter(s => s.type === 9)
    .reduce((sum, s) => sum + (s.damage || 0), 0);
  
  const winner = fightData.steps.find(s => s.type === 26)?.winner;
  const winnerName = winner ? fightData.fighters.find(f => f.id === winner)?.name : 'Aucun';
  
  statsEl.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div><small>Total steps:</small> <strong>${totalSteps}</strong></div>
      <div><small>Vainqueur:</small> <strong style="color: #ffd700;">${winnerName}</strong></div>
      <div><small>Coups:</small> <strong>${hits}</strong></div>
      <div><small>Blocages:</small> <strong>${blocks}</strong></div>
      <div><small>Esquives:</small> <strong>${evades}</strong></div>
      <div><small>Critiques:</small> <strong>${criticals}</strong></div>
      <div><small>Dégâts totaux:</small> <strong>${totalDamage}</strong></div>
      <div><small>Dégâts moyens:</small> <strong>${hits > 0 ? Math.round(totalDamage / hits) : 0}</strong></div>
    </div>
  `;
}

// Contrôles
document.getElementById('btn-generate').addEventListener('click', generateNewFight);

document.getElementById('btn-play').addEventListener('click', () => {
  if (scene) scene.play();
});

document.getElementById('btn-pause').addEventListener('click', () => {
  if (scene) scene.pause();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (scene) scene.reset();
});

// Contrôles de vitesse
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const speed = parseFloat(btn.dataset.speed);
    if (scene) scene.setSpeed(speed);
    
    // Mettre à jour les styles
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.remove('active-speed');
    });
    btn.classList.add('active-speed');
  });
});

// Randomisation des stats
function randomizeStats(fighterNum) {
  const stats = {
    str: 5 + Math.floor(Math.random() * 25),
    agi: 5 + Math.floor(Math.random() * 25),
    spd: 5 + Math.floor(Math.random() * 25),
    end: 5 + Math.floor(Math.random() * 25)
  };
  
  document.getElementById(`f${fighterNum}-str`).textContent = stats.str;
  document.getElementById(`f${fighterNum}-agi`).textContent = stats.agi;
  document.getElementById(`f${fighterNum}-spd`).textContent = stats.spd;
  document.getElementById(`f${fighterNum}-end`).textContent = stats.end;
}

// Ajouter des boutons de randomisation
document.querySelectorAll('.section h3').forEach((header, index) => {
  if (header.textContent.includes('Combattant')) {
    const btn = document.createElement('button');
    btn.textContent = '🎲';
    btn.style.float = 'right';
    btn.style.fontSize = '12px';
    btn.style.padding = '5px 10px';
    btn.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)';
    btn.addEventListener('click', () => {
      const fighterNum = header.textContent.includes('1') ? 1 : 2;
      randomizeStats(fighterNum);
    });
    header.appendChild(btn);
  }
});

// Export pour intégration iframe
window.LaBruteCombatEngine = {
  loadFight: (data) => {
    if (scene) scene.loadFightData(data);
  },
  play: () => {
    if (scene) scene.play();
  },
  pause: () => {
    if (scene) scene.pause();
  },
  reset: () => {
    if (scene) scene.reset();
  },
  setSpeed: (speed) => {
    if (scene) scene.setSpeed(speed);
  },
  generateFight: generateNewFight
};