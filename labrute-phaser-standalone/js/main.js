import { BruteFightScene } from './BruteFightScene.js';
import { FightGenerator } from './FightGenerator.js';

// Initialize Phaser game
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: BruteFightScene
};

const game = new Phaser.Game(config);
const fightGenerator = new FightGenerator();

// Get scene reference
let scene = null;
game.events.once('ready', () => {
  scene = game.scene.getScene('BruteFightScene');
  
  // Generate initial fight
  generateNewFight();
});

// Control functions
function generateNewFight() {
  // Get fighter data from inputs
  const fighter1 = {
    name: document.getElementById('fighter1-name').value || 'Fighter 1',
    strength: parseInt(document.getElementById('fighter1-str').textContent),
    agility: parseInt(document.getElementById('fighter1-agi').textContent),
    speed: parseInt(document.getElementById('fighter1-spd').textContent),
    hp: parseInt(document.getElementById('fighter1-hp').textContent),
    level: 10,
    skills: [],
    weapons: ['sword', 'axe']
  };
  
  const fighter2 = {
    name: document.getElementById('fighter2-name').value || 'Fighter 2',
    strength: parseInt(document.getElementById('fighter2-str').textContent),
    agility: parseInt(document.getElementById('fighter2-agi').textContent),
    speed: parseInt(document.getElementById('fighter2-spd').textContent),
    hp: parseInt(document.getElementById('fighter2-hp').textContent),
    level: 10,
    skills: [],
    weapons: ['knife', 'broadsword']
  };
  
  // Generate fight
  const fightData = fightGenerator.generateFight(fighter1, fighter2);
  
  // Load into scene
  if (scene) {
    scene.loadFightData(fightData);
    updateFightLog(fightData);
  }
}

function updateFightLog(fightData) {
  const logEl = document.getElementById('fight-log');
  logEl.innerHTML = '';
  
  fightData.steps.forEach((step, index) => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    let text = `${index + 1}. `;
    let className = '';
    
    switch (step.type) {
      case 9: // Hit
        text += `Fighter ${step.fighter} hits Fighter ${step.target} for ${step.damage} damage`;
        className = 'log-hit';
        break;
      case 15: // Move
        text += `Fighter ${step.fighter} moves forward`;
        className = 'log-move';
        break;
      case 20: // Block
        text += `Fighter ${step.fighter} blocks!`;
        className = 'log-block';
        break;
      case 21: // Evade
        text += `Fighter ${step.fighter} evades!`;
        className = 'log-evade';
        break;
      case 24: // Death
        text += `Fighter ${step.fighter} is defeated!`;
        className = 'log-death';
        break;
      case 18: // Equip
        text += `Fighter ${step.fighter} equips ${step.weapon}`;
        className = 'log-skill';
        break;
      case 26: // End
        text += step.winner ? `Fighter ${step.winner} wins!` : 'Draw!';
        className = 'log-death';
        break;
      default:
        text += `Step type ${step.type}`;
    }
    
    entry.textContent = text;
    if (className) {
      entry.classList.add(className);
    }
    logEl.appendChild(entry);
  });
}

// Button controls
document.getElementById('btn-generate').addEventListener('click', () => {
  generateNewFight();
});

document.getElementById('btn-play').addEventListener('click', () => {
  if (scene) scene.play();
});

document.getElementById('btn-pause').addEventListener('click', () => {
  if (scene) scene.pause();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (scene) scene.reset();
});

// Speed controls
document.querySelectorAll('.speed-controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    const speed = parseFloat(btn.dataset.speed);
    if (scene) scene.setSpeed(speed);
    
    // Update button styles
    document.querySelectorAll('.speed-controls button').forEach(b => {
      b.style.background = '#2196F3';
    });
    btn.style.background = '#45a049';
  });
});

// Stat controls (for demo)
function randomizeStats(fighterNum) {
  const stats = {
    str: 5 + Math.floor(Math.random() * 20),
    agi: 5 + Math.floor(Math.random() * 20),
    spd: 5 + Math.floor(Math.random() * 20),
    hp: 50 + Math.floor(Math.random() * 150)
  };
  
  document.getElementById(`fighter${fighterNum}-str`).textContent = stats.str;
  document.getElementById(`fighter${fighterNum}-agi`).textContent = stats.agi;
  document.getElementById(`fighter${fighterNum}-spd`).textContent = stats.spd;
  document.getElementById(`fighter${fighterNum}-hp`).textContent = stats.hp;
}

// Add randomize buttons (for testing)
document.querySelectorAll('.control-section h3').forEach((header, index) => {
  if (index === 2 || index === 3) { // Fighter sections
    const btn = document.createElement('button');
    btn.textContent = '🎲 Random';
    btn.style.float = 'right';
    btn.style.fontSize = '12px';
    btn.style.padding = '5px 10px';
    btn.addEventListener('click', () => randomizeStats(index - 1));
    header.appendChild(btn);
  }
});

// Info overlay
const overlayInfo = document.getElementById('overlay-info');
overlayInfo.innerHTML = `
  <strong>LaBrute Combat Engine</strong><br>
  <small>
    ✅ Real combat mechanics<br>
    ✅ Damage formulas<br>
    ✅ Initiative system<br>
    ✅ All 31 step types<br>
    ✅ Weapon effects<br>
    ⏳ Spine animations (WIP)
  </small>
`;

// Export for iframe integration
window.LaBruteEngine = {
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
  }
};