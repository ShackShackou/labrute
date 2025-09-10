// Configuration des parties de corps et couleurs LaBrute
// Basé sur l'analyse du code source du jeu

// Parties de corps disponibles par genre
const availableBodyParts = {
    male: {
        p1: 1,
        p1a: 1, 
        p1b: 1,
        p2: 7,
        p3: 11,
        p4: 5,
        p5: 1,
        p6: 1,
        p7: 6,
        p7b: 2,
        p8: 4,
    },
    female: {
        p1: 1,
        p1a: 1,
        p1b: 1,
        p2: 0,
        p3: 11,
        p4: 3,
        p5: 1,
        p6: 0,
        p7: 6,
        p7b: 2,
        p8: 4,
    }
};

// ✅ VRAIES descriptions des parties de corps (depuis schema.prisma)
const bodyPartsInfo = {
    p1: {
        name: "Base",
        description: "Élément de base de la brute (toujours présent).",
        category: "Base",
        variants: {
            0: "Base normale",
            1: "Base alternative"
        }
    },
    p1a: {
        name: "Ceinture", 
        description: "Ceinture basique autour de la taille.",
        category: "Accessoires",
        variants: {
            0: "Avec ceinture",
            1: "Sans ceinture"
        }
    },
    p1b: {
        name: "Ceinture Romaine",
        description: "Ceinture de style romain/gladiateur.",
        category: "Accessoires",
        variants: {
            0: "Avec ceinture romaine",
            1: "Sans ceinture romaine"
        }
    },
    p2: {
        name: "Taille du Corps",
        description: "Détermine la corpulence de la brute (hommes seulement).",
        category: "Corps",
        variants: {
            0: "Très maigre",
            1: "Maigre",
            2: "Mince",
            3: "Normal",
            4: "Musclé",
            5: "Costaud",
            6: "Très costaud",
            7: "Énorme"
        }
    },
    p3: {
        name: "Cheveux/Coiffure",
        description: "Style de cheveux de la brute.",
        category: "Tête",
        variants: {
            0: "Cheveux courts",
            1: "Cheveux mi-longs",
            2: "Cheveux longs",
            3: "Crête iroquoise",
            4: "Chauve",
            5: "Afro",
            6: "Queue de cheval",
            7: "Dreadlocks",
            8: "Coupe punk",
            9: "Cheveux ébouriffés",
            10: "Coupe classique",
            11: "Coupe sauvage",
            12: "Sans tête (spécial)"
        }
    },
    p4: {
        name: "Barbe (H) / Mèches (F)",
        description: "Barbe pour les hommes, mèches avant pour les femmes.",
        category: "Tête",
        variantsMale: {
            0: "Barbe de 3 jours",
            1: "Bouc",
            2: "Barbe complète",
            3: "Moustache",
            4: "Barbe viking",
            5: "Rasé de près"
        },
        variantsFemale: {
            0: "Mèches courtes",
            1: "Mèches longues",
            2: "Frange",
            3: "Sans mèches"
        }
    },
    p5: {
        name: "Chemise/Haut",
        description: "Port d'un haut ou torse nu.",
        category: "Vêtements",
        variants: {
            0: "Torse nu",
            1: "Avec chemise"
        }
    },
    p6: {
        name: "Bas",
        description: "Type de vêtement pour le bas du corps.",
        category: "Vêtements",
        variantsMale: {
            0: "Shorts",
            1: "Pantalons"
        },
        variantsFemale: {
            0: "Shorts",
            1: "Rien (jambes nues)"
        }
    },
    p7: {
        name: "Vêtement Principal",
        description: "Tenue principale du combattant.",
        category: "Vêtements",
        variants: {
            0: "Armure légère",
            1: "Tunique",
            2: "Armure lourde",
            3: "Tenue de combat",
            4: "Toge",
            5: "Tenue barbare",
            6: "Armure de gladiateur",
            7: "Nu (aucun vêtement)"
        }
    },
    p7b: {
        name: "Dessous de Chaussures",
        description: "Visibilité de la semelle des chaussures.",
        category: "Accessoires",
        variants: {
            0: "Semelles cachées",
            1: "Semelles cachées (alt)",
            2: "Semelles visibles"
        }
    },
    p8: {
        name: "Chaussures (Buggé)",
        description: "Censé être les chaussures mais ne change rien visuellement (bug du jeu).",
        category: "Accessoires",
        variants: {
            0: "Type 0 (sans effet)",
            1: "Type 1 (sans effet)",
            2: "Type 2 (sans effet)",
            3: "Type 3 (sans effet)",
            4: "Type 4 (sans effet)"
        }
    }
};

// ✅ VRAIES descriptions des couleurs (depuis schema.prisma)
const colorInfo = {
    col0: "Couleur de Peau",
    col0a: "Couleur du Visage",
    col0c: "Couleur des Oreilles",
    col1: "Couleur des Cheveux",
    col1a: "Cheveux Arrière",
    col1b: "Cheveux Arrière 2",
    col1c: "Cheveux Avant",
    col1d: "Sourcils",
    col2: "Couleur Secondaire",
    col2a: "Accent 3",
    col2b: "Accent 1",
    col3: "Couleur Primaire (inclut les yeux)",
    col3b: "Accent 2",
    col4: "Couleur de la Chemise",
    col4a: "Accent des Chaussures",
    col4b: "Couleur Mystère"
};

// Palettes de couleurs par genre
const colors = {
    male: {
        skin: [
            '#996600',
            '#eccd57', 
            '#cb841b',
            '#d79b75',
            '#fbe6c8',
            '#f8d198'
        ],
        hair: [
            '#784129',
            '#fff9ae',
            '#b85f1d',
            '#4f677d', 
            '#df7e37',
            '#fbcd15',
            '#ffaa1e',
            '#952f04',
            '#a2886f',
            '#fff2df'
        ],
        clothing: [
            '#7bad30',
            '#b78104',
            '#bb1111',
            '#559399',
            '#fae31f',
            '#784129',
            '#7a73c8',
            '#fff9ae',
            '#f0dc99',
            '#b6e7a9',
            '#d31818',
            '#b85f1d',
            '#97cbff',
            '#8ba3d7',
            '#df7e37',
            '#d5eaff',
            '#ffaa1e',
            '#cbff97',
            '#ffcc79',
            '#fff2df'
        ]
    },
    female: {
        skin: [
            '#996600',
            '#f8cdc2',
            '#cb841b',
            '#eaaca6',
            '#fbe6c8',
            '#f8d198'
        ],
        hair: [
            '#fff9ae',
            '#b85f1d',
            '#eea2c9',
            '#8e63ad',
            '#fbcd15',
            '#ffaa1e',
            '#952f04',
            '#a2886f',
            '#fff2df'
        ],
        clothing: [
            '#7bad30',
            '#b78104',
            '#bb1111',
            '#559399',
            '#fae31f',
            '#784129',
            '#7a73c8',
            '#fff9ae',
            '#f0dc99',
            '#b6e7a9',
            '#d31818',
            '#b85f1d',
            '#97cbff',
            '#8ba3d7',
            '#df7e37',
            '#d5eaff',
            '#ffaa1e',
            '#cbff97',
            '#ffcc79',
            '#fff2df'
        ]
    },
    special: [
        '#000000'
    ]
};

// Mapping des couleurs vers les types (AVEC VRAIES SIGNIFICATIONS)
const colorMapping = {
    // Couleurs de peau
    col0: { type: 'skin', name: colorInfo.col0 },
    col0a: { type: 'skin', name: colorInfo.col0a },
    col0c: { type: 'skin', name: colorInfo.col0c },
    
    // Couleurs de cheveux
    col1: { type: 'hair', name: colorInfo.col1 },
    col1a: { type: 'hair', name: colorInfo.col1a },
    col1b: { type: 'hair', name: colorInfo.col1b },
    col1c: { type: 'hair', name: colorInfo.col1c },
    col1d: { type: 'hair', name: colorInfo.col1d },
    
    // Couleurs de vêtements
    col2: { type: 'clothing', name: colorInfo.col2 },
    col2a: { type: 'clothing', name: colorInfo.col2a },
    col2b: { type: 'clothing', name: colorInfo.col2b },
    col3: { type: 'clothing', name: colorInfo.col3 },
    col3b: { type: 'clothing', name: colorInfo.col3b },
    col4: { type: 'clothing', name: colorInfo.col4 },
    col4a: { type: 'clothing', name: colorInfo.col4a },
    col4b: { type: 'clothing', name: colorInfo.col4b }
};

// Ordre des couleurs dans la string
const colorOrder = [
    'col0', 'col0a', 'col0c',
    'col1', 'col1a', 'col1b', 'col1c', 'col1d',
    'col2', 'col2a', 'col2b',
    'col3', 'col3b',
    'col4', 'col4a', 'col4b'
];

// Ordre des parties de corps dans la string
const bodyPartsOrder = [
    'p1', 'p1a', 'p1b', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p7b', 'p8'
];

// Skills disponibles (50+ compétences) - CHEMINS CORRIGÉS
const skills = [
    { id: 'herculeanStrength', name: 'Force herculéenne', icon: 'herculeanStrength.svg' },
    { id: 'felineAgility', name: 'Agilité féline', icon: 'felineAgility.svg' },
    { id: 'lightningBolt', name: 'Éclair', icon: 'lightningBolt.svg' },
    { id: 'vitality', name: 'Vitalité', icon: 'vitality.svg' },
    { id: 'immortality', name: 'Immortalité', icon: 'immortality.svg' },
    { id: 'reconnaissance', name: 'Reconnaissance', icon: 'reconnaissance.svg' },
    { id: 'weaponsMaster', name: 'Maître d\'armes', icon: 'weaponsMaster.svg' },
    { id: 'martialArts', name: 'Arts martiaux', icon: 'martialArts.svg' },
    { id: 'sixthSense', name: 'Sixième sens', icon: 'sixthSense.svg' },
    { id: 'hostility', name: 'Hostilité', icon: 'hostility.svg' },
    { id: 'fistsOfFury', name: 'Poings de fureur', icon: 'fistsOfFury.svg' },
    { id: 'shield', name: 'Bouclier', icon: 'shield.svg' },
    { id: 'armor', name: 'Armure', icon: 'armor.svg' },
    { id: 'toughenedSkin', name: 'Peau endurcie', icon: 'toughenedSkin.svg' },
    { id: 'untouchable', name: 'Intouchable', icon: 'untouchable.svg' },
    { id: 'sabotage', name: 'Sabotage', icon: 'sabotage.svg' },
    { id: 'shock', name: 'Choc', icon: 'shock.svg' },
    { id: 'bodybuilder', name: 'Culturiste', icon: 'bodybuilder.svg' },
    { id: 'relentless', name: 'Implacable', icon: 'relentless.svg' },
    { id: 'survival', name: 'Survie', icon: 'survival.svg' },
    { id: 'leadSkeleton', name: 'Squelette de plomb', icon: 'leadSkeleton.svg' },
    { id: 'balletShoes', name: 'Chaussons de ballet', icon: 'balletShoes.svg' },
    { id: 'determination', name: 'Détermination', icon: 'determination.svg' },
    { id: 'firstStrike', name: 'Première frappe', icon: 'firstStrike.svg' },
    { id: 'resistant', name: 'Résistant', icon: 'resistant.svg' },
    { id: 'counterAttack', name: 'Contre-attaque', icon: 'counterAttack.svg' },
    { id: 'ironHead', name: 'Tête de fer', icon: 'ironHead.svg' },
    { id: 'thief', name: 'Voleur', icon: 'thief.svg' },
    { id: 'fierceBrute', name: 'Brute féroce', icon: 'fierceBrute.svg' },
    { id: 'tragicPotion', name: 'Potion tragique', icon: 'tragicPotion.svg' },
    { id: 'net', name: 'Filet', icon: 'net.svg' },
    { id: 'bomb', name: 'Bombe', icon: 'bomb.svg' },
    { id: 'hammer', name: 'Marteau', icon: 'hammer.svg' },
    { id: 'cryOfTheDamned', name: 'Cri des damnés', icon: 'cryOfTheDamned.svg' },
    { id: 'hypnosis', name: 'Hypnose', icon: 'hypnosis.svg' },
    { id: 'flashFlood', name: 'Crue éclair', icon: 'flashFlood.svg' },
    { id: 'tamer', name: 'Dompteur', icon: 'tamer.svg' },
    { id: 'regeneration', name: 'Régénération', icon: 'regeneration.svg' },
    { id: 'chef', name: 'Chef', icon: 'chef.svg' },
    { id: 'spy', name: 'Espion', icon: 'spy.svg' },
    { id: 'saboteur', name: 'Saboteur', icon: 'saboteur.svg' },
    { id: 'backup', name: 'Renfort', icon: 'backup.svg' },
    { id: 'hideaway', name: 'Planque', icon: 'hideaway.svg' },
    { id: 'monk', name: 'Moine', icon: 'monk.svg' },
    { id: 'vampirism', name: 'Vampirisme', icon: 'vampirism.svg' },
    { id: 'chaining', name: 'Enchaînement', icon: 'chaining.svg' },
    { id: 'haste', name: 'Hâte', icon: 'haste.svg' },
    { id: 'treat', name: 'Soigner', icon: 'treat.svg' },
    { id: 'repulse', name: 'Repousser', icon: 'repulse.svg' },
    { id: 'fastMetabolism', name: 'Métabolisme rapide', icon: 'fastMetabolism.svg' }
];

// Armes disponibles (26+ armes) - CHEMINS CORRIGÉS
const weapons = [
    { id: 'fan', name: 'Éventail', icon: 'fan.png', type: 'fast' },
    { id: 'keyboard', name: 'Clavier', icon: 'keyboard.png', type: 'fast' },
    { id: 'knife', name: 'Couteau', icon: 'knife.png', type: 'sharp' },
    { id: 'leek', name: 'Poireau', icon: 'leek.png', type: 'blunt' },
    { id: 'mug', name: 'Chope', icon: 'mug.png', type: 'blunt' },
    { id: 'sai', name: 'Saï', icon: 'sai.png', type: 'sharp' },
    { id: 'racquet', name: 'Raquette', icon: 'racquet.png', type: 'fast' },
    { id: 'axe', name: 'Hache', icon: 'axe.png', type: 'heavy' },
    { id: 'bumps', name: 'Brassard', icon: 'bumps.png', type: 'blunt' },
    { id: 'flail', name: 'Fléau', icon: 'flail.png', type: 'heavy' },
    { id: 'fryingPan', name: 'Poêle', icon: 'fryingPan.png', type: 'blunt' },
    { id: 'hatchet', name: 'Hachette', icon: 'hatchet.png', type: 'sharp' },
    { id: 'mammothBone', name: 'Os de mammouth', icon: 'mammothBone.png', type: 'heavy' },
    { id: 'morningStar', name: 'Étoile du matin', icon: 'morningStar.png', type: 'heavy' },
    { id: 'trombone', name: 'Trombone', icon: 'trombone.png', type: 'long' },
    { id: 'baton', name: 'Bâton', icon: 'baton.png', type: 'long' },
    { id: 'halbard', name: 'Hallebarde', icon: 'halbard.png', type: 'long' },
    { id: 'lance', name: 'Lance', icon: 'lance.png', type: 'long' },
    { id: 'trident', name: 'Trident', icon: 'trident.png', type: 'long' },
    { id: 'whip', name: 'Fouet', icon: 'whip.png', type: 'long' },
    { id: 'noodleBowl', name: 'Bol de nouilles', icon: 'noodleBowl.png', type: 'thrown' },
    { id: 'piopio', name: 'Piopio', icon: 'piopio.png', type: 'thrown' },
    { id: 'shuriken', name: 'Shuriken', icon: 'shuriken.png', type: 'thrown' },
    { id: 'broadsword', name: 'Épée large', icon: 'broadsword.png', type: 'sharp' },
    { id: 'scimitar', name: 'Cimeterre', icon: 'scimitar.png', type: 'sharp' },
    { id: 'sword', name: 'Épée', icon: 'sword.png', type: 'sharp' }
];

// Fonction pour convertir une valeur numérique en hexadécimal
function toHex(value) {
    return value.toString(16).padStart(1, '0');
}

// Fonction pour convertir hex en nombre
function fromHex(hex) {
    return parseInt(hex, 16);
}

// Fonction pour générer une string de body parts
function generateBodyString(parts) {
    return bodyPartsOrder.map(part => toHex(parts[part] || 0)).join('');
}

// Fonction pour lire une string de body parts
function readBodyString(bodyString) {
    const parts = {};
    bodyPartsOrder.forEach((part, index) => {
        parts[part] = fromHex(bodyString[index] || '0');
    });
    return parts;
}

// Fonction pour générer une string de couleurs
function generateColorString(colorValues) {
    return colorOrder.map(color => {
        const value = colorValues[color] || 0;
        return value.toString().padStart(2, '0');
    }).join('');
}

// Fonction pour lire une string de couleurs
function readColorString(colorString) {
    const colors = {};
    colorOrder.forEach((color, index) => {
        const startPos = index * 2;
        colors[color] = parseInt(colorString.substr(startPos, 2) || '00');
    });
    return colors;
}

// Fonction pour obtenir une couleur par genre, type et index
function getColor(gender, colorType, colorIndex) {
    const genderColors = colors[gender];
    if (!genderColors) return '#ffffff';
    
    const colorArray = genderColors[colorType];
    if (!colorArray) return '#ffffff';
    
    const color = colorArray[colorIndex];
    if (color) return color;
    
    // Couleur spéciale si index trop grand
    const specialIndex = 99 - colorIndex;
    return colors.special[specialIndex] || '#ffffff';
}

// Fonction pour générer une brute aléatoire
function generateRandomBrute(gender) {
    const parts = {};
    const colorValues = {};
    const availableParts = availableBodyParts[gender];
    
    // Générer des parties aléatoires
    bodyPartsOrder.forEach(part => {
        const maxValue = availableParts[part] || 0;
        parts[part] = Math.floor(Math.random() * (maxValue + 1));
    });
    
    // Générer des couleurs aléatoires
    colorOrder.forEach(color => {
        const colorType = colorMapping[color]?.type || 'clothing';
        const maxValue = colors[gender][colorType]?.length || 1;
        colorValues[color] = Math.floor(Math.random() * maxValue);
    });
    
    return {
        gender,
        parts,
        colors: colorValues,
        bodyString: generateBodyString(parts),
        colorString: generateColorString(colorValues)
    };
}

// ⚠️ NOUVELLE FONCTION : Créer des sprites placeholder pour démo
function createDemoSprites() {
    return {
        skills: skills.map(skill => ({
            ...skill,
            demoPath: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="%234a90e2" rx="8"/><text x="25" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="10">${skill.name.substring(0,8)}</text></svg>`
        })),
        weapons: weapons.map(weapon => ({
            ...weapon,
            demoPath: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="%23e74c3c" rx="8"/><text x="25" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="10">${weapon.name.substring(0,8)}</text></svg>`
        }))
    };
}

// ✅ NOUVELLE FONCTION : Obtenir la description d'une variante de partie
function getPartVariantDescription(partKey, value, gender) {
    const partInfo = bodyPartsInfo[partKey];
    if (!partInfo) return `Variante ${value}`;
    
    // Gérer les parties avec des variantes différentes par genre
    if (partKey === 'p4') {
        const variants = gender === 'male' ? partInfo.variantsMale : partInfo.variantsFemale;
        return variants?.[value] || `Variante ${value}`;
    } else if (partKey === 'p6') {
        const variants = gender === 'male' ? partInfo.variantsMale : partInfo.variantsFemale;
        return variants?.[value] || `Variante ${value}`;
    }
    
    // Autres parties avec variantes normales
    return partInfo.variants?.[value] || `Variante ${value}`;
}

// Assets de référence pour le navigateur - CHEMINS CORRIGÉS VERS VRAIS ASSETS
const assetCategories = {
    skills: {
        name: 'Skills (SVG)',
        basePath: '../client/public/images/skills/',
        items: skills.map(skill => ({
            id: skill.id,
            name: skill.name,
            file: skill.icon,
            path: `../client/public/images/skills/${skill.icon}`
        }))
    },
    weapons: {
        name: 'Armes (PNG)',
        basePath: '../client/public/images/weapons/',
        items: weapons.map(weapon => ({
            id: weapon.id,
            name: weapon.name,
            file: weapon.icon,
            type: weapon.type,
            path: `../client/public/images/weapons/${weapon.icon}`
        }))
    },
    achievements: {
        name: 'Achievements',
        basePath: '../client/public/images/achievements/',
        items: [] // Sera populé dynamiquement
    },
    misc: {
        name: 'Sprites de Combat',
        basePath: '../client/public/images/game/',
        items: [
            { id: 'misc-atlas', name: 'Atlas Principal', file: 'misc.png', path: '../client/public/images/game/misc.png' },
            { id: 'misc-json', name: 'Atlas Data', file: 'misc.json', path: '../client/public/images/game/misc.json' },
            { id: 'thrown-weapons', name: 'Armes Lancées', file: 'thrown-weapons.png', path: '../client/public/images/game/thrown-weapons.png' },
            { id: 'thrown-json', name: 'Armes Data', file: 'thrown-weapons.json', path: '../client/public/images/game/thrown-weapons.json' }
        ]
    }
};

// Export pour utilisation dans app.js
window.LabruteData = {
    availableBodyParts,
    bodyPartsInfo,
    colorInfo,
    colors,
    colorMapping,
    colorOrder,
    bodyPartsOrder,
    skills,
    weapons,
    assetCategories,
    createDemoSprites,
    getPartVariantDescription,
    
    // Fonctions utilitaires
    toHex,
    fromHex,
    generateBodyString,
    readBodyString,
    generateColorString,
    readColorString,
    getColor,
    generateRandomBrute
}; 