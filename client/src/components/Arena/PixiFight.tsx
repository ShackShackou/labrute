/* eslint-disable unicode-bom, quotes, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars, no-multi-spaces, max-len, lines-between-class-members, one-var, one-var-declaration-per-line, no-empty, comma-spacing, space-infix-ops, key-spacing, arrow-spacing, arrow-parens, object-curly-spacing, block-spacing, space-before-function-paren, default-case, no-promise-executor-return, @typescript-eslint/no-floating-promises */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Application, Container, Graphics, Text, Assets, Sprite, Rectangle, BlurFilter } from 'pixi.js';
// @ts-ignore - official Spine v8 runtime for Pixi v8
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { FightGetResponse, WeaponById, WeaponId, weapons, StepType, WeaponType, SkillId, SkillById, skills } from '@labrute/core';

// SKILL CATEGORIZATION - Based on core/src/brute/skills.ts
// This is the OFFICIAL and COMPLETE categorization from LaBrute source
// IDs are based on the SkillId enum (starting from 0)
const SKILL_CATEGORIES = {
  // Type 'super' - Active combat skills with limited uses
  SUPERS: [
    27, // thief
    28, // fierceBrute
    29, // tragicPotion
    30, // net
    31, // bomb
    32, // hammer
    33, // cryOfTheDamned
    34, // hypnosis
    35, // flashFlood
    36, // tamer
    48, // vampirism
    50, // haste
    51, // treat
  ],

  // Type 'talent' - Special abilities (shown in "Supers" section in UI)
  TALENTS: [
    41, // regeneration
    42, // chef
    43, // spy
    44, // saboteur
    45, // backup
    46, // hideaway
    47, // monk
  ],

  // Type 'booster' - Stat boosting skills
  BOOSTERS: [
    0,  // herculeanStrength
    1,  // felineAgility
    2,  // lightningBolt
    3,  // vitality
    4,  // immortality
    5,  // reconnaissance
  ],

  // Type 'passive' - All passive combat skills
  PASSIVES: [
    6,  // weaponsMaster
    7,  // martialArts
    8,  // sixthSense
    9,  // hostility
    10, // fistsOfFury
    11, // shield
    12, // armor
    13, // toughenedSkin
    14, // untouchable
    15, // sabotage
    16, // shock
    17, // bodybuilder
    18, // relentless
    19, // survival
    20, // leadSkeleton
    21, // balletShoes
    22, // determination
    23, // firstStrike
    24, // resistant
    25, // counterAttack
    26, // ironHead
    49, // chaining (PASSIVE, not super!)
    52, // repulse (PASSIVE, not super!)
    53, // fastMetabolism (PASSIVE, not super!)
  ],
};

// Helper to check skill type
const isSuper = (skillId: number) => SKILL_CATEGORIES.SUPERS.includes(skillId);
const isTalent = (skillId: number) => SKILL_CATEGORIES.TALENTS.includes(skillId);
const isBooster = (skillId: number) => SKILL_CATEGORIES.BOOSTERS.includes(skillId);
const isPassive = (skillId: number) => SKILL_CATEGORIES.PASSIVES.includes(skillId);
const isSuperOrTalent = (skillId: number) => isSuper(skillId) || isTalent(skillId);

type Props = {
  fight: FightGetResponse | null,
  speed?: number,
  onStep?: (index:number, step:any, elapsedMs:number)=>void,
  // Tunables
  scale?: number,
  speedBoost?: number,
  stageOffsetX?: number,
  stageOffsetY?: number,
  clampYMinRatio?: number,
  clampYMaxRatio?: number,
  leftOffsetX?: number,
  leftOffsetY?: number,
  rightOffsetX?: number,
  rightOffsetY?: number,
  approachOffset?: number,
  preferVideoBackground?: boolean,
  useCustomBg?: boolean,
  customBgIndex?: number,
  bgStretch?: number,
  bgScale?: number,
  charPx?: number,
  drift?: number,
  contactBias?: number,
  returnFactor?: number,
};

const W = 500; const H = 300;

const PixiFight: React.FC<Props> = ({
  fight,
  
  speed = 2,
  onStep,
  scale = 0.245,
  speedBoost = 1.6,
  stageOffsetX = 0,
  stageOffsetY = 12,
  clampYMinRatio = 0.58,
  clampYMaxRatio = 0.98,
  leftOffsetX = -11,
  leftOffsetY = 0,
  rightOffsetX = 0,
  rightOffsetY = 0,
  approachOffset = 1,
  preferVideoBackground = false,
  useCustomBg = false,
  customBgIndex = 1,
  bgStretch = 1.15,
  bgScale = 1.0,
  charPx = 50, // Changed from 52 to 50 as requested
  drift = 40,
  contactBias = 5,
  returnFactor = 2,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const spinesRef = useRef<{ L: any | null, R: any | null, scene: Container | null }>({ L: null, R: null, scene: null });
  const charPxRef = useRef<number | null>(null);
  const debugLayerRef = useRef<Container | null>(null);
  const traceOnRef = useRef<boolean>(false);
  const traceRowsRef = useRef<{ t:number, who:'L'|'R', rootX:number, rootY:number, anim:string, trackTime:number }[]>([]);
  const traceT0Ref = useRef<number | null>(null);
  const debugVectorsRef = useRef<{ g: Graphics, life: number }[]>([]);
  // Overlay A/B trace comparison refs
  const overlayRefData = useRef<{ L: {t:number,x:number,y:number}[], R: {t:number,x:number,y:number}[] } | null>(null);
  const overlayOnRef = useRef<boolean>(false);
  const overlayStartRef = useRef<number | null>(null);
  const overlayGraphicsRef = useRef<{ L: Graphics, R: Graphics, text: Text } | null>(null);

  type TooltipRowElements = { row: HTMLDivElement; label: HTMLSpanElement; value: HTMLSpanElement; };
  type TooltipElements = {
    root: HTMLDivElement;
    name: HTMLDivElement;
    level: HTMLDivElement;
    hpValue: HTMLSpanElement;
    statRows: {
      strength: { fill: HTMLDivElement; value: HTMLSpanElement; accent: string; };
      agility: { fill: HTMLDivElement; value: HTMLSpanElement; accent: string; };
      speed: { fill: HTMLDivElement; value: HTMLSpanElement; accent: string; };
    };
    supers: TooltipRowElements;
    skills: TooltipRowElements;
  };

  const tooltipElementsRef = useRef<TooltipElements | null>(null);
  const tooltipFadeTimeoutRef = useRef<number | null>(null);
  const tooltipStateRef = useRef<{ fighter: any | null; anchorX: number; anchorY: number; portraitWidth: number; portraitHeight: number; visible: boolean }>({ fighter: null, anchorX: 0, anchorY: 0, portraitWidth: 0, portraitHeight: 0, visible: false });

  const hideTooltip = () => {
    tooltipStateRef.current.visible = false;
    tooltipStateRef.current.fighter = null;
    tooltipStateRef.current.portraitWidth = 0;
    tooltipStateRef.current.portraitHeight = 0;
    const root = tooltipElementsRef.current?.root;
    if (tooltipFadeTimeoutRef.current) {
      try { clearTimeout(tooltipFadeTimeoutRef.current); } catch {}
      tooltipFadeTimeoutRef.current = null;
    }
    if (root) {
      root.style.opacity = '0';
      tooltipFadeTimeoutRef.current = window.setTimeout(() => {
        if (!tooltipStateRef.current.visible && tooltipElementsRef.current?.root === root) {
          root.style.display = 'none';
        }
        tooltipFadeTimeoutRef.current = null;
      }, 240);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.position = containerRef.current.style.position || 'relative';
    }
    if (!containerRef.current || !fight) {
      hideTooltip();
      return undefined;
    }

    if (appRef.current) { try { (appRef.current as any).ticker?.stop?.(); } catch {} try { appRef.current.destroy(true); } catch {} appRef.current = null; }

    // Silence audio errors from Pixi
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = String(args[0]);
      if (msg.includes('AudioBufferSourceNode') || msg.includes('AudioScheduledSourceNode')) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };

    const app = new Application();
    appRef.current = app;
    let disposed = false;
    const ticks = new Set<(tk:any)=>void>();
    const timeouts = new Set<number>();
    const addTick = (fn:(tk:any)=>void) => { ticks.add(fn); app.ticker.add(fn); };
    const removeAllTicks = () => { ticks.forEach((fn)=>{ try{ app.ticker.remove(fn); } catch{} }); ticks.clear(); };
    const clearAllTimeouts = () => { timeouts.forEach((id)=>{ try{ clearTimeout(id); } catch{} }); timeouts.clear(); };

    const mediaSprites: Sprite[] = [];
    const run = async () => {
      await app.init({ width: W, height: H, background: '#202428', antialias: true });
      if (disposed) return;
      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      // Align global timing with official renderer
      try { (app.ticker as any).speed = 0.5; } catch {}

      // Enable zIndex sorting so overlay stays on top
      // @ts-ignore
      (app.stage as any).sortableChildren = true;

      // Fixed UI overlay for non-scene elements (e.g., HP bars)
      const ui = new Container();
      try { (ui as any).eventMode = 'passive'; } catch {}
      // @ts-ignore
      (ui as any).zIndex = 999;
      app.stage.addChild(ui);
      // Debug layer DISABLED - no debug graphics
      // const debugLayer = new Container();
      // @ts-ignore
      // (debugLayer as any).zIndex = 998;
      // app.stage.addChild(debugLayer);
      // debugLayerRef.current = debugLayer;


      const ensureTooltip = (): TooltipElements => {
        let parts = tooltipElementsRef.current;
        if (!parts || !parts.root.isConnected) {
          const root = parts?.root ?? document.createElement("div");
          root.style.position = "absolute";
          root.style.display = "none";
          root.style.pointerEvents = "none";
          root.style.opacity = "0";
          root.style.transition = "opacity 240ms ease-out";
          root.style.willChange = "opacity, left, top";
          root.style.zIndex = "10000";
          root.style.background = "#FFF6D5";
          root.style.border = "1px solid #8B6534";
          root.style.borderRadius = "6px";
          root.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.28)";
          root.style.padding = "10px 12px";
          root.style.fontFamily = "Verdana, Arial, sans-serif";
          root.style.fontSize = "13px";
          root.style.color = "#5B3618";
          root.style.minWidth = "200px";
          root.style.maxWidth = "230px";
          if (!parts) {
            const nameEl = document.createElement("div");
            nameEl.style.fontWeight = "700";
            nameEl.style.fontSize = "16px";
            nameEl.style.marginBottom = "4px";
            nameEl.style.color = "#5B3618";
            root.appendChild(nameEl);

            const levelEl = document.createElement("div");
            levelEl.style.fontVariant = "small-caps";
            levelEl.style.fontWeight = "700";
            levelEl.style.letterSpacing = "0.6px";
            levelEl.style.marginBottom = "8px";
            levelEl.style.color = "#B0782E";
            root.appendChild(levelEl);

            const statsWrapper = document.createElement("div");
            statsWrapper.style.display = "flex";
            statsWrapper.style.alignItems = "center";
            statsWrapper.style.gap = "10px";
            statsWrapper.style.marginBottom = "8px";
            root.appendChild(statsWrapper);

            const hpBadge = document.createElement("div");
            hpBadge.style.width = "42px";
            hpBadge.style.height = "42px";
            hpBadge.style.borderRadius = "50%";
            hpBadge.style.display = "flex";
            hpBadge.style.alignItems = "center";
            hpBadge.style.justifyContent = "center";
            hpBadge.style.fontWeight = "800";
            hpBadge.style.fontSize = "18px";
            hpBadge.style.color = "#FFFFFF";
            hpBadge.style.background = "radial-gradient(circle at 30% 30%, #FFC982 0%, #E65D26 70%)";
            hpBadge.style.border = "2px solid #B44619";
            hpBadge.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";
            const hpValue = document.createElement("span");
            hpValue.textContent = "0";
            hpBadge.appendChild(hpValue);
            statsWrapper.appendChild(hpBadge);

            const statsCol = document.createElement("div");
            statsCol.style.flex = "1";
            statsCol.style.display = "flex";
            statsCol.style.flexDirection = "column";
            statsCol.style.gap = "5px";
            statsWrapper.appendChild(statsCol);

            const makeStatRow = (label: string, accent: string, fillColor: string) => {
              const row = document.createElement("div");
              row.style.display = "flex";
              row.style.alignItems = "center";
              row.style.gap = "6px";

              const labelEl = document.createElement("span");
              labelEl.textContent = label;
              labelEl.style.fontWeight = "700";
              labelEl.style.width = "30px";
              labelEl.style.color = accent;
              row.appendChild(labelEl);

              const track = document.createElement("div");
              track.style.flex = "1";
              track.style.height = "7px";
              track.style.borderRadius = "4px";
              track.style.background = "#F0D8AC";
              track.style.boxShadow = "inset 0 1px 2px rgba(0, 0, 0, 0.22)";
              row.appendChild(track);

              const fill = document.createElement("div");
              fill.style.height = "100%";
              fill.style.width = "0%";
              fill.style.borderRadius = "4px";
              fill.style.background = fillColor;
              fill.style.boxShadow = "0 1px 1px rgba(0, 0, 0, 0.25)";
              track.appendChild(fill);

              const valueEl = document.createElement("span");
              valueEl.style.fontWeight = "700";
              valueEl.style.width = "32px";
              valueEl.style.textAlign = "right";
              valueEl.style.color = accent;
              valueEl.textContent = "0";
              row.appendChild(valueEl);

              statsCol.appendChild(row);
              return { fill, value: valueEl, accent };
            };

            const statRows = {
              strength: makeStatRow("STR", "#C34527", "linear-gradient(90deg, #FFD78E 0%, #E98328 100%)"),
              agility: makeStatRow("AGI", "#1E70CE", "linear-gradient(90deg, #AAD3FF 0%, #3F7CEF 100%)"),
              speed: makeStatRow("SPD", "#C7A12A", "linear-gradient(90deg, #FBEAA0 0%, #D4B437 100%)"),
            };

            const listWrapper = document.createElement("div");
            listWrapper.style.display = "flex";
            listWrapper.style.flexDirection = "column";
            listWrapper.style.gap = "4px";
            root.appendChild(listWrapper);

            const makeListRow = (label: string): TooltipRowElements => {
              const row = document.createElement("div");
              row.style.color = "#5B3618";
              row.style.fontSize = "13px";

              const labelEl = document.createElement("span");
              labelEl.textContent = `${label}: `;
              labelEl.style.fontWeight = "700";
              labelEl.style.marginRight = "4px";
              row.appendChild(labelEl);

              const valueEl = document.createElement("span");
              valueEl.textContent = t('none');
              row.appendChild(valueEl);

              listWrapper.appendChild(row);
              return { row, label: labelEl, value: valueEl };
            };

            const supersRow = makeListRow(t('supers'));
            const skillsRow = makeListRow(t('skills'));

            tooltipElementsRef.current = {
              root,
              name: nameEl,
              level: levelEl,
              hpValue,
              statRows,
              supers: supersRow,
              skills: skillsRow,
            };
            parts = tooltipElementsRef.current;
          }
          const host = containerRef.current ?? document.body;
          if (!root.parentElement || root.parentElement !== host) {
            host.appendChild(root);
          }
        }
        return tooltipElementsRef.current as TooltipElements;
      };
      const classifySkills = (fighterData: any) => {
        const supers = new Set<string>();
        const regular = new Set<string>();

        const addSkill = (value: unknown) => {
          if (typeof value !== 'number') {
            return;
          }
          const mapping = SkillById as Record<number, string>;
          const key = mapping[value];
          if (!key) {
            return;
          }
          const definition = skills.find((s) => s.name === key);
          const label = t(key);
          if (definition?.type === 'super' || definition?.type === 'talent') {
            supers.add(label);
          } else {
            regular.add(label);
          }
        };

        if (Array.isArray(fighterData?.skills)) {
          (fighterData.skills as number[]).forEach(addSkill);
        }
        if (Array.isArray(fighterData?.supers)) {
          (fighterData.supers as number[]).forEach(addSkill);
        }

        return {
          supers: Array.from(supers),
          skills: Array.from(regular),
        };
      };


      const updateTooltipContent = (fighterData: any) => {
        const elements = ensureTooltip();
        if (!fighterData) {
          elements.root.style.display = 'none';
          tooltipStateRef.current.visible = false;
          return;
        }

        elements.name.textContent = String(fighterData?.name ?? '').toUpperCase();
        elements.level.textContent = `${t('level').toUpperCase()} ${fighterData?.level ?? 0}`;

        const hp = Math.max(0, Math.round(Number(fighterData?.hp ?? fighterData?.maxHp ?? 0)));
        elements.hpValue.textContent = hp.toString();

        const strength = Math.round(Number(fighterData?.strength ?? fighterData?.strengthValue ?? fighterData?.strengthStat ?? 0));
        const agility = Math.round(Number(fighterData?.agility ?? fighterData?.agilityValue ?? fighterData?.agilityStat ?? 0));
        const speedValue = Math.round(Number(fighterData?.speed ?? fighterData?.speedValue ?? fighterData?.speedStat ?? 0));
        const maxStat = Math.max(1, strength, agility, speedValue);

        const applyStat = (target: { fill: HTMLDivElement; value: HTMLSpanElement; accent: string }, value: number) => {
          const width = Math.max(6, (value / maxStat) * 100);
          target.fill.style.width = `${Math.min(100, width)}%`;
          target.value.textContent = value.toString();
          target.value.style.color = target.accent;
        };

        applyStat(elements.statRows.strength, strength);
        applyStat(elements.statRows.agility, agility);
        applyStat(elements.statRows.speed, speedValue);

        const separated = classifySkills(fighterData);
        elements.supers.label.textContent = `${t('supers')}: `;
        elements.skills.label.textContent = `${t('skills')}: `;
        elements.supers.value.textContent = separated.supers.length ? separated.supers.join(', ') : t('none');
        elements.skills.value.textContent = separated.skills.length ? separated.skills.join(', ') : t('none');
        elements.supers.value.style.opacity = separated.supers.length ? '1' : '0.65';
        elements.skills.value.style.opacity = separated.skills.length ? '1' : '0.65';
      };

      const positionTooltip = () => {
        const elements = tooltipElementsRef.current;
        const host = containerRef.current;
        const canvasEl = app.canvas as HTMLCanvasElement;
        if (!elements || !host || !canvasEl || !tooltipStateRef.current.visible) {
          return;
        }
        const canvasRect = canvasEl.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const internalWidth = canvasEl.width || canvasRect.width || 1;
        const internalHeight = canvasEl.height || canvasRect.height || 1;
        const scaleX = canvasRect.width / internalWidth;
        const scaleY = canvasRect.height / internalHeight;
        const centerX = tooltipStateRef.current.anchorX;
        const topY = tooltipStateRef.current.anchorY;
        const screenCenterX = canvasRect.left + centerX * scaleX;
        const screenTopY = canvasRect.top + topY * scaleY;

        elements.root.style.display = 'block';
        const bounds = elements.root.getBoundingClientRect();
        const width = bounds.width || 200;
        const height = bounds.height || 110;
        const margin = 6;
        const gap = 6;

        let localX = screenCenterX - hostRect.left - width / 2;
        localX = Math.max(margin, Math.min(localX, hostRect.width - width - margin));

        let localY = screenTopY - hostRect.top - gap - height;
        localY = Math.max(margin, Math.min(localY, hostRect.height - height - margin));

        elements.root.style.left = `${localX}px`;
        elements.root.style.top = `${localY}px`;
      };

      const showTooltipForFighter = (fighterData: any, bounds: Rectangle) => {
        if (!fighterData) {
          return;
        }
        tooltipStateRef.current.fighter = fighterData;
        tooltipStateRef.current.anchorX = bounds.x + (bounds.width / 2);
        tooltipStateRef.current.anchorY = bounds.y;
        tooltipStateRef.current.portraitWidth = bounds.width;
        tooltipStateRef.current.portraitHeight = bounds.height;
        tooltipStateRef.current.visible = true;
        const elements = ensureTooltip();
        if (tooltipFadeTimeoutRef.current) {
          try { clearTimeout(tooltipFadeTimeoutRef.current); } catch {}
          tooltipFadeTimeoutRef.current = null;
        }
        elements.root.style.display = 'block';
        requestAnimationFrame(() => {
          if (tooltipStateRef.current.visible && tooltipElementsRef.current?.root === elements.root) {
            elements.root.style.opacity = '1';
          }
        });
        updateTooltipContent(fighterData);
        positionTooltip();
      };

      const moveTooltip = (bounds: Rectangle) => {
        if (!tooltipStateRef.current.visible) {
          return;
        }
        tooltipStateRef.current.anchorX = bounds.x + (bounds.width / 2);
        tooltipStateRef.current.anchorY = bounds.y;
        tooltipStateRef.current.portraitWidth = bounds.width;
        tooltipStateRef.current.portraitHeight = bounds.height;
        positionTooltip();
      };
      // hideTooltip(); // Old tooltip system - commented out

      const scene = new Container();
      // Depth sort by Y
      // @ts-ignore
      (scene as any).sortableChildren = true;
      scene.position.set(stageOffsetX, stageOffsetY);
      app.stage.addChild(scene);
      spinesRef.current.scene = scene;

      // Resolve tunables and helpers
      const params = new URLSearchParams(window.location.search);
      const SCALE = Number(params.get('pixiScale') ?? (scale ?? 0.22));
      const BOOST = Number(params.get('pixiBoost') ?? (speedBoost ?? 1));
      // Multiplicateur pour ralentir/accÃ©lÃ©rer UNIQUEMENT l'approche (aller)
      // Mode strict: rejoue les steps sans tolérances visuelles
      const STRICT = (params.get('pixiStrict') === '1') || (localStorage.getItem('compare.pixiStrict') === '1');
      let approachScale = (() => {
        const u = params.get('pixiApproachScale');
        const ls = localStorage.getItem('compare.pixiApproachScale');
        const n = Number(u ?? ls ?? '1');
        return Number.isFinite(n) && n > 0 ? n : 1;
      })();
      if (STRICT) { approachScale = 1; }
      const boostFallback = isNaN(BOOST) ? 1 : BOOST;
      const clampMin = Number(params.get('pixiClampMin') ?? `${clampYMinRatio}`);
      const clampMax = Number(params.get('pixiClampMax') ?? `${clampYMaxRatio}`);
      const clampY = (y:number) => Math.max(H * clampMin, Math.min(H * clampMax, y));
      const preferVideo = (params.get('bgVideo') === '1' || params.get('bgVideo') === 'true') || !!preferVideoBackground;
      const debugDiag = false; // DISABLED - debug diagnostics
      // const debugDiag = (params.get('pixiDiag') === '1' || localStorage.getItem('compare.pixiDiag') === '1');
      const traceEnabled = false; // DISABLED - debug traces
      // const traceEnabled = (params.get('pixiTrace') === '1' || localStorage.getItem('compare.pixiTrace') === '1');
      // Calibration multipliers per side (R often needs to be slowed down)
      const mulL = (() => { const u = params.get('pixiMulL'); const ls = localStorage.getItem('compare.pixiMulL'); const n = Number(u ?? ls ?? '1'); return isNaN(n) ? 1 : n; })();
      const mulR = (() => { const u = params.get('pixiMulR'); const ls = localStorage.getItem('compare.pixiMulR'); const n = Number(u ?? ls ?? '1'); return isNaN(n) ? 1 : n; })();

      // ===== TOOLTIP SYSTEM =====
      let tooltipDiv: HTMLDivElement | null = null;
      let currentHoveredFighter: any = null;
      let tooltipFadeTimeout: number | null = null;

      const createTooltipDiv = () => {
        if (tooltipDiv) return;

        tooltipDiv = document.createElement('div');
        tooltipDiv.style.position = 'fixed';  // Use fixed to handle scroll properly
        tooltipDiv.style.zIndex = '99999';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.display = 'none';
        tooltipDiv.style.opacity = '0';
        tooltipDiv.style.transition = 'opacity 0.2s ease-in-out';

        // Style exact de la carte originale
        tooltipDiv.style.background = '#FFF6D5';
        tooltipDiv.style.border = '2px solid #8B4513';
        tooltipDiv.style.borderRadius = '6px';
        tooltipDiv.style.padding = '2px 4px';
        tooltipDiv.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
        tooltipDiv.style.fontFamily = 'Arial, sans-serif';
        tooltipDiv.style.fontSize = '11px';
        tooltipDiv.style.width = '150px';

        document.body.appendChild(tooltipDiv);
      };

      const showTooltip = (fighter: any, mouseX: number, mouseY: number) => {
        createTooltipDiv();
        if (!tooltipDiv || !fighter) return;

        currentHoveredFighter = fighter;

        // Clear fade timeout
        if (tooltipFadeTimeout) {
          clearTimeout(tooltipFadeTimeout);
          tooltipFadeTimeout = null;
        }

        // Build tooltip content
        const level = fighter.level || 1;
        const hp = Math.round(fighter.hp || fighter.maxHp || 100);
        const strength = Math.round(fighter.strength || fighter.str || 0);
        const agility = Math.round(fighter.agility || fighter.agi || 0);
        const speed = Math.round(fighter.speed || fighter.spd || 0);

        // Get skills - Using OFFICIAL categorization from core/src/brute/skills.ts
        const skills = fighter.skills || [];

        // Supers: ONLY 'super' category (talents go to Skills in official UI)
        const supers = skills.filter((id: number) => isSuper(id));

        // Skills section: everything else (passive, booster, talent)
        const normalSkills = skills.filter((id: number) => !isSuper(id));

        // Display names: camelCase -> Title Case (handles small words)
        const toTitle = (raw: string) => {
          try {
            const parts = raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim().split(/\s+/);
            const lower = new Set(['of', 'the', 'and', 'to', 'in']);
            return parts.map((w,i)=>{
              const lw = w.toLowerCase();
              if (i>0 && lower.has(lw)) return lw;
              return lw.charAt(0).toUpperCase() + lw.slice(1);
            }).join(' ');
          } catch { return raw; }
        };
        const getSkillName = (id: number) => {
          try {
            const raw = (SkillById[id as SkillId] as unknown as string) || `Skill${id}`;
            // Prefer localized label if available; fallback to Title Case
            try {
              const localized = t(raw);
              if (localized && typeof localized === 'string' && localized !== raw) return localized;
            } catch {}
            return toTitle(raw);
          } catch { return `Skill${id}`; }
        };

        const supersText = supers.length > 0
          ? supers.map((id:number)=>({ id, n: getSkillName(id) })).sort((a,b)=>a.n.localeCompare(b.n)).map(s=>s.n).join(', ')
          : '';
        const skillsText = normalSkills.length > 0
          ? normalSkills.map((id:number)=>({ id, n: getSkillName(id) })).sort((a,b)=>a.n.localeCompare(b.n)).map(s=>s.n).join(', ')
          : '';

        // Create HTML content EXACTLY like the reference image
        tooltipDiv.innerHTML = `
          <div style="margin-bottom: 1px;">
            <span style="color: #8B4513; font-weight: bold; font-size: 11px;">${fighter.name || 'Unknown'}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="color: #D2691E; font-weight: bold; font-size: 9px;">LEVEL</span>
            <span style="color: #333; font-weight: bold; font-size: 9px;"> ${level}</span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 2px; margin-bottom: 2px;">
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 16px; line-height: 1;">🧡</span>
              <span style="position: absolute; color: white; font-weight: bold; font-size: 9px; text-shadow: 1px 1px 1px rgba(0,0,0,0.8);">${hp}</span>
            </div>
            <div style="flex: 1;">
              <!-- Strength Bar -->
              <div style="display: flex; align-items: center; height: 9px;">
                <span style="width: 10px; font-size: 8px;">💪</span>
                <div style="flex: 1; position: relative; height: 8px; background: #E8E8E8; border: 1px solid #AAA; margin: 0 3px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFD700, #FFA500); width: ${Math.min(100, (strength / 20) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; width: 14px; font-size: 9px; text-align: right;">${strength}</span>
              </div>
              <!-- Agility Bar -->
              <div style="display: flex; align-items: center; height: 9px;">
                <span style="width: 10px; font-size: 8px;">🪶</span>
                <div style="flex: 1; position: relative; height: 8px; background: #E8E8E8; border: 1px solid #AAA; margin: 0 3px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFD700, #FFA500); width: ${Math.min(100, (agility / 20) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; width: 14px; font-size: 9px; text-align: right;">${agility}</span>
              </div>
              <!-- Speed Bar -->
              <div style="display: flex; align-items: center; height: 9px;">
                <span style="width: 10px; font-size: 8px;">⚡</span>
                <div style="flex: 1; position: relative; height: 8px; background: #E8E8E8; border: 1px solid #AAA; margin: 0 3px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFD700, #FFA500); width: ${Math.min(100, (speed / 20) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; width: 14px; font-size: 9px; text-align: right;">${speed}</span>
              </div>
            </div>
          </div>
          <div style="padding-top: 1px; font-size: 8px; line-height: 1.1;">
            <div style="margin-bottom: 1px;">
              <span style="color: #8B4513; font-weight: bold; font-size: 8px;">Supers:</span>
              <span style="color: #8B4513; font-size: 8px;"> ${supersText}</span>
            </div>
            <div>
              <span style="color: #8B4513; font-weight: bold; font-size: 8px;">Skills:</span>
              <span style="color: #8B4513; font-size: 8px;"> ${skillsText}</span>
            </div>
          </div>
        `;

        // Position tooltip
        tooltipDiv.style.display = 'block';

        // Force layout calculation
        const tipRect = tooltipDiv.getBoundingClientRect();

        // Simple positioning: tooltip follows mouse and appears above it
        let x = mouseX - (tipRect.width / 2);  // Center horizontally on mouse
        let y = mouseY - tipRect.height - 5;    // Position just above (5px gap)

        // Keep on screen
        x = Math.max(5, Math.min(x, window.innerWidth - tipRect.width - 5));

        // If too high, show below cursor instead
        if (y < 5) {
          y = mouseY + 15;
        }

        tooltipDiv.style.left = `${x}px`;
        tooltipDiv.style.top = `${y}px`;

        // Fade in
        requestAnimationFrame(() => {
          if (tooltipDiv) tooltipDiv.style.opacity = '1';
        });
      };

      const hideTooltip = () => {
        if (!tooltipDiv) return;

        currentHoveredFighter = null;

        // Start fade out
        tooltipDiv.style.opacity = '0';

        // Clear existing timeout
        if (tooltipFadeTimeout) {
          clearTimeout(tooltipFadeTimeout);
        }

        // Hide completely after fade
        tooltipFadeTimeout = window.setTimeout(() => {
          if (tooltipDiv) {
            tooltipDiv.style.display = 'none';
          }
          tooltipFadeTimeout = null;
        }, 200); // Match transition duration
      };

      // Deterministic RNG (for lanes/arrive) when strict or explicitly enabled
      const DETERMINISTIC = STRICT || (params.get('pixiDeterministic') === '1' || localStorage.getItem('compare.pixiDeterministic') === '1');
      const hash32 = (str: string) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      };
      // RNG/Event tracing (optional)
      const rngTraceOn = (params.get('pixiLogRng') === '1' || localStorage.getItem('compare.pixiLogRng') === '1');
      const eventTraceOn = (params.get('pixiLogEvents') === '1' || localStorage.getItem('compare.pixiLogEvents') === '1');
      const rngTrace: { t:number, out:number }[] = [];
      const eventTrace: { t:number, i:number, a:number, f:number|null, tId:number|null }[] = [];
      const traceT0 = performance.now() / 1000;
      try {
        (window as any).pixiGetRngTrace = () => rngTrace.slice();
        (window as any).pixiGetEventTrace = () => eventTrace.slice();
      } catch {}

      let rngState = hash32(String((fight as any)?.id ?? 'fight')) || 123456789;
      const rand = () => {
        let out: number;
        if (!DETERMINISTIC) out = Math.random();
        else {
          // LCG: Numerical Recipes
          rngState = (Math.imul(1664525, rngState) + 1013904223) | 0;
          out = ((rngState >>> 0) / 4294967296);
        }
        if (rngTraceOn) rngTrace.push({ t: performance.now() / 1000 - traceT0, out });
        return out;
      };

      // Arrival jump tunables
      const arriveMs = (() => { const u=params.get('pixiArriveMs'); const n=Number(u ?? '420'); return Number.isFinite(n) && n>0 ? n : 420; })();
      const arriveArc = (() => { const u=params.get('pixiArriveArc'); const n=Number(u ?? '28'); return Number.isFinite(n) ? n : 28; })();
      const arriveBounce = (params.get('pixiArriveBounce') ?? '1') === '1';
      const addVector = (x1:number,y1:number,x2:number,y2:number,color=0x00ff88) => {
        if (!debugDiag) return;
        try {
          const g = new Graphics();
          g.moveTo(x1,y1).lineTo(x2,y2).stroke({ width: 2, color: color, alpha: 0.9 });
          const ang = Math.atan2(y2-y1, x2-x1);
          const ah = 6;
          g.lineTo(x2 - Math.cos(ang-0.3)*ah, y2 - Math.sin(ang-0.3)*ah);
          g.moveTo(x2,y2);
          g.lineTo(x2 - Math.cos(ang+0.3)*ah, y2 - Math.sin(ang+0.3)*ah);
          // Add to debug layer only if it exists
          if (debugLayerRef.current && !disposed) {
            debugLayerRef.current.addChild(g);
            debugVectorsRef.current.push({ g, life: 2000 });
          }
        } catch {}
      };

      // Tick-managed vector cleanup to avoid destroying during render build
      const vectorTick = (tk:any) => {
        if (!debugDiag) return; // no-op if disabled
        try {
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          for (let i = debugVectorsRef.current.length - 1; i >= 0; i--) {
            const v = debugVectorsRef.current[i]!;
            v.life -= dm;
            if (v.life <= 0) {
              // Batcher safety: juste masquer, ne pas retirer du render tree pendant le tick
              try { 
                v.g.renderable = false; 
                v.g.visible = false; 
                v.g.alpha = 0; 
              } catch {}
              // Marquer pour suppression ultÃ©rieure
              (v as any).toRemove = true;
              debugVectorsRef.current.splice(i, 1);
            }
          }
        } catch {}
      };
      addTick(vectorTick);

      // Background from /backgrounds (synced from repo root \backgrounds)
      try {
        const loadVideoSprite = async (baseName: string): Promise<Sprite|null> => {
          const vids = ['.webm', '.mp4'];
          for (const ext of vids) {
            try {
              const video = document.createElement('video');
              video.src = `/backgrounds/${baseName}${ext}`;
              video.crossOrigin = 'anonymous';
              video.loop = true; video.muted = true; (video as any).playsInline = true; (video as any).autoplay = true;
              const ready = await new Promise<boolean>((resolve) => {
                const timer = window.setTimeout(() => resolve(false), 800);
                const onReady = () => { try { video.removeEventListener('canplay', onReady); } catch {} try { clearTimeout(timer); } catch {} resolve(true); };
                const onError = (ev: Event) => {
                  try { (ev as any).stopImmediatePropagation?.(); } catch {}
                  try { (ev as any).stopPropagation?.(); } catch {}
                  try { (ev as any).preventDefault?.(); } catch {}
                  try { video.removeEventListener('error', onError as any); } catch {}
                  try { clearTimeout(timer); } catch {}
                  resolve(false);
                };
                video.addEventListener('canplay', onReady, { once: true });
                video.addEventListener('error', onError as any, { once: true });
              });
              if (!ready) continue;
              try { await video.play().catch(() => {}); } catch {}
              const spr = Sprite.from(video as any);
              return spr;
            } catch {}
          }
          return null;
        };
        // Background override via URL: ?bg=filename (with or without extension)
        const exts = ['.png', '.jpg', '.jpeg', '.webp'];
        let loaded: any = null;
        const bgParam = params.get('bg');
        
        // Use custom backgrounds if enabled
        if (useCustomBg && !bgParam) {
          // Use the selected custom background
          const bgIdx = customBgIndex || 1;
          const customBgName = bgIdx === 7 ? 'bg7.gif' : `bg${bgIdx}.png`;
          try {
            loaded = await Assets.load(`/backgrounds/${customBgName}`);
          } catch {}
        } else if (bgParam) {
          if (preferVideo) {
            const baseP0 = bgParam.includes('.') ? bgParam.replace(/\.[^/.]+$/, '') : bgParam;
            const spr0 = await loadVideoSprite(baseP0);
            if (spr0) { loaded = spr0; }
          }
          if (!loaded && bgParam.includes('.')) {
            try { loaded = await Assets.load(`/backgrounds/${encodeURIComponent(bgParam)}`); } catch {}
          }
          if (!loaded) {
            const baseP = bgParam.replace(/\.[^/.]+$/, '');
            for (const ext of exts) { try { loaded = await Assets.load(`/backgrounds/${encodeURIComponent(baseP)}${ext}`); break; } catch {} }
          }
          if (!loaded) {
            // Fallback to official resources folder (numbered backgrounds)
            const baseP = bgParam.replace(/\.[^/.]+$/, '');
            const candidates = [baseP, `${parseInt(baseP, 10) || ''}`, '1'];
            for (const c of candidates) {
              if (!c) continue;
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.jpg`); break; } catch {}
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.png`); break; } catch {}
            }
          }
        } else {
          const base = String((fight as any).background ?? '').replace(/\.[^/.]+$/, '');
          if (preferVideo && !loaded && base) {
            const spr1 = await loadVideoSprite(base);
            if (spr1) { loaded = spr1; }
          }
          // Avoid loading heavy animated GIF backgrounds by default for performance
          if (!loaded && base) { for (const ext of exts) { try { loaded = await Assets.load(`/backgrounds/${base}${ext}`); break; } catch {} } }
          if (!loaded) {
            const candidates = [base, `${parseInt(base, 10) || ''}`, '1'];
            for (const c of candidates) {
              if (!c) continue;
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.jpg`); break; } catch {}
              try { loaded = await Assets.load(`/images/game/resources/misc/background/${c}.png`); break; } catch {}
            }
          }
        }
      if (loaded) {
          if (loaded instanceof Sprite) {
            const spr = loaded as Sprite; spr.zIndex = -10; spr.width = W; spr.height = H; 
            spr.y = -12; // Lower by 4px more (was -16, now -12)
            scene.addChildAt(spr, 0);
            try {
              const src = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
              if (src && typeof src.pause === 'function') { mediaSprites.push(spr); }
            } catch {}
          } else {
            const bg = new Sprite(loaded as any);
            // Only apply stretch and scale to custom backgrounds
            if (useCustomBg) {
              const stretch = bgStretch || 1.15;
              const scaleVal = bgScale || 1.0;
              bg.width = W * scaleVal; 
              bg.height = H * stretch * scaleVal;
              bg.x = (W - bg.width) / 2; // Center horizontally if scaled
            } else {
              // Official backgrounds keep original dimensions
              bg.width = W;
              bg.height = H;
            }
            bg.zIndex = -10;
            bg.y = -12; // Lower by 4px more (was -16, now -12)
            scene.addChildAt(bg, 0);
          }
        }
      } catch {}

      // UI helpers (trace overlay)
      try {
        if (traceEnabled) {
          const makeBtn = (text:string, x:number, y:number, onTap:()=>void) => {
            const c = new Container();
            const g = new Graphics(); g.roundRect(0, 0, 86, 18, 5).fill({ color: 0x333333, alpha: 0.85 });
            // Enable events on the graphic shape (reliable hit area)
            // @ts-ignore
            g.eventMode = 'static';
            // @ts-ignore
            g.cursor = 'pointer';
            g.on('pointertap', onTap);
            const t = new Text(text, { fontSize: 11, fill: 0xffffff } as any); t.position.set(6, 2);
            c.addChild(g, t); c.position.set(x,y); // @ts-ignore
            (c as any).zIndex = 1000; ui.addChild(c); return c;
          };
          makeBtn('Save Trace', 6, 6, () => { try { (window as any).pixiTraceDownload?.(); } catch {} });
          makeBtn('Load Ref CSV', 98, 6, () => {
            try { const input = document.createElement('input'); input.type='file'; input.accept='.csv,.txt';
              input.onchange = () => {
                const f = (input.files && input.files[0]) || null; if (!f) return;
                const rdr=new FileReader(); rdr.onload=()=>{
                  try {
                    const txt = String(rdr.result||''); const lines = txt.split(/\r?\n/).filter(Boolean);
                    const L: {t:number,x:number,y:number}[]=[]; const R: {t:number,x:number,y:number}[]=[];
                    const header = lines[0] || '';
                    const start = header.startsWith('t') ? 1 : 0;
                    for (let i=start;i<lines.length;i++){
                      const line = lines[i] || '';
                      const parts = line.split(','); if (parts.length<4) continue; const who=(parts[1]||'').trim();
                      const row = { t: Number(parts[0])||0, x: Number(parts[2])||0, y: Number(parts[3])||0 };
                      if (who==='L') L.push(row); else if (who==='R') R.push(row);
                    }
                    overlayRefData.current = { L, R }; overlayOnRef.current = true; overlayStartRef.current = performance.now()/1000;
                  } catch {} };
                rdr.readAsText(f);
              };
              input.click(); } catch {} });
          makeBtn('Overlay On/Off', 200, 6, () => {
            overlayOnRef.current = !overlayOnRef.current;
            if (!overlayOnRef.current) {
              try {
                const og = overlayGraphicsRef.current;
                if (og) {
                  try {
                    if (og.L && typeof og.L.clear === 'function') { og.L.clear(); }
                    if (og.R && typeof og.R.clear === 'function') { og.R.clear(); }
                  } catch {}
                  try { og.text.text = ''; } catch {}
                }
              } catch {}
            }
          });
          // overlay graphics + tick (DISABLED - debug feature)
          // const gL = new Graphics(); const gR = new Graphics();
          // const info = new Text('', { fontSize: 10, fill: 0xffffff, stroke: 0x000000, strokeThickness: 2 } as any);
          // info.position.set(W/2 - 60, 6);
          // @ts-ignore
          // (gL as any).zIndex = 999; (gR as any).zIndex = 999; (info as any).zIndex = 999;
          // ui.addChild(gL, gR, info);
          // overlayGraphicsRef.current = { L: gL, R: gR, text: info };
          const errBufL:number[]=[]; const errBufR:number[]=[];
          const sampleAt = (arr:{t:number,x:number,y:number}[], t:number) => {
            if (!arr || arr.length===0) return null;
            let lo=0, hi=arr.length-1; while (lo<hi){ const mid=(lo+hi)>>1; if(arr[mid] && arr[mid].t < t) lo=mid+1; else hi=mid; }
            return arr[lo] || null;
          };
          // Debug overlay disabled
          const tickOverlay = () => {
            // Disabled - debug feature
            return;
          };
          // addTick(tickOverlay); // Disabled
        }
      } catch {}

      // Positions corrigÃ©es d'aprÃ¨s l'analyse CSV du 10 septembre
      const baseLX = 43 + leftOffsetX; const baseLY = 223 + leftOffsetY;
      const baseRX = 520 + rightOffsetX; const baseRY = 223 + rightOffsetY;
      // Placeholders (not visible) to avoid debug circles
      const leftPlaceholder = new Container(); leftPlaceholder.position.set(baseLX, baseLY); (leftPlaceholder as any).visible = false; scene.addChild(leftPlaceholder);
      const rightPlaceholder = new Container(); rightPlaceholder.position.set(baseRX, baseRY); (rightPlaceholder as any).visible = false; scene.addChild(rightPlaceholder);
      let left: any = { node: leftPlaceholder, baseX: baseLX, baseY: baseLY, type: 'placeholder' };
      let right: any = { node: rightPlaceholder, baseX: baseRX, baseY: baseRY, type: 'placeholder' };
      const addShadow = (obj:any) => {
        const sh = new Graphics();
        sh.ellipse(0, 0, 26, 11).fill({ color: 0x000000, alpha: 0.4 });
        // Soft shadow effect using blur filter (Pixi v8 compatible)
        try {
          const blur = new BlurFilter({
            strength: 2,
            quality: 2
          });
          sh.filters = [blur];
        } catch (e) {
          // Fallback: no blur if filter fails
          console.warn('Shadow blur filter failed:', e);
        }
        scene.addChild(sh);
        return {
          follow: () => {
            const p = 'position' in obj.node ? obj.node.position : obj.node;
            sh.position.set(p.x, p.y + 2);
            // Sort by Y (shadows below character)
            // @ts-ignore
            sh.zIndex = (p.y as number) - 1;
          },
          destroy: () => { try { sh.destroy(); } catch {} },
        };
      };
      let shadowL = addShadow(left);
      let shadowR = addShadow(right);

      try {
        // Spine v8 (4.2) assets: mono-page atlas
        Assets.add({ alias: 'spineboyData', src: '/assets/spine/spineboy-pro.json' });
        Assets.add({ alias: 'spineboyAtlas', src: '/assets/spine/spineboy.atlas' });
        await Assets.load(['spineboyData', 'spineboyAtlas']);
        // CrÃ©e sans Ã©chelle, puis calibre sur une largeur cible (pour matcher l'officiel)
        const L = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 1 });
        L.x = baseLX; L.y = baseLY; scene.addChild(L);
        const R = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 1 });
        R.x = baseRX; R.y = baseRY; scene.addChild(R);
        const targetCharPxRaw = Number(params.get('charPx') ?? `${typeof charPx === 'number' ? charPx : 50}`);
        const TARGET_W = isNaN(targetCharPxRaw) ? 50 : targetCharPxRaw;
        const applyScale = (sp: any, side: 'L'|'R') => {
          try {
            const bw = Math.max(1, sp?.bounds?.width ?? 200);
            const s = (TARGET_W / bw);
            sp.scale.set(s, s);
            if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
          } catch {
            sp.scale.set(0.18, 0.18);
            if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
          }
        };
        applyScale(L, 'L');
        applyScale(R, 'R');
        spinesRef.current.L = L; spinesRef.current.R = R; charPxRef.current = TARGET_W;
        try { L.state.setAnimation(0, 'idle', true); } catch {}
        try { R.state.setAnimation(0, 'idle', true); } catch {}
        // Instrumentation: tracing root motion (optional)
        if (traceEnabled) {
          try { (L as any).autoUpdate = false; } catch {}
          try { (R as any).autoUpdate = false; } catch {}
          const sL = (L as any).state || (L as any).animationState; if (sL) { try { sL.timeScale = 1; } catch {} }
          const sR = (R as any).state || (R as any).animationState; if (sR) { try { sR.timeScale = 1; } catch {} }
          traceOnRef.current = false; traceT0Ref.current = null; traceRowsRef.current = [];
          // expose helpers
          // @ts-ignore
          (window as any).pixiTraceStart = () => { traceOnRef.current = true; traceT0Ref.current = performance.now() / 1000; };
          // @ts-ignore
          (window as any).pixiTraceDownload = () => {
            const header = 't,who,rootX,rootY,anim,trackTime\n';
            const body = traceRowsRef.current.map((r: any) => `${r.t.toFixed(4)},${r.who},${r.rootX.toFixed(2)},${r.rootY.toFixed(2)},${r.anim},${r.trackTime.toFixed(3)}`).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }));
            a.download = 'trace.csv'; a.click();
          };
          const tickTrace = (tk:any) => {
            try {
              const dt = (typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7) / 1000;
              sL?.update?.(dt); (L as any)?.update?.(dt);
              sR?.update?.(dt); (R as any)?.update?.(dt);
              if (!traceOnRef.current || !traceT0Ref.current) return;
              const t = performance.now() / 1000 - (traceT0Ref.current || 0);
              const curL = sL?.getCurrent?.(0); const curR = sR?.getCurrent?.(0);
              const pLx = (L as any)?.worldTransform?.tx ?? (L as any)?.x ?? 0;
              const pLy = (L as any)?.worldTransform?.ty ?? (L as any)?.y ?? 0;
              const pRx = (R as any)?.worldTransform?.tx ?? (R as any)?.x ?? 0;
              const pRy = (R as any)?.worldTransform?.ty ?? (R as any)?.y ?? 0;
              traceRowsRef.current.push({ t, who:'L', rootX: pLx, rootY: pLy, anim: curL?.animation?.name || '', trackTime: curL?.trackTime || 0 });
              traceRowsRef.current.push({ t, who:'R', rootX: pRx, rootY: pRy, anim: curR?.animation?.name || '', trackTime: curR?.trackTime || 0 });
            } catch {}
          };
          addTick(tickTrace);
        }
        const scaledWidth = (sp:any)=>{
          try { return Math.max(30, ((sp as any).bounds?.width ?? 40) * Math.max(Math.abs((sp as any).scale?.x ?? 1), 0.001)); } catch { return 40; }
        };
        left = { node: L, baseX: L.x, baseY: L.y, type: 'spine', width: scaledWidth(L) };
        right = { node: R, baseX: R.x, baseY: R.y, type: 'spine', width: scaledWidth(R) };
        shadowL?.destroy(); shadowR?.destroy();
        shadowL = addShadow(left);
        shadowR = addShadow(right);
        // Hide fighters and shadows until their Arrive step to avoid first-frame flicker
        try { L.visible = false; } catch {}
        try { R.visible = false; } catch {}
        try { (shadowL as any).visible = false; } catch {}
        try { (shadowR as any).visible = false; } catch {}
      } catch {
        // keep circles fallback if assets/runtimes unavailable
      }

      const mkHud = (side:'L'|'R', name:string|undefined, fighter: any) => {
        const isL = side === 'L';
        
        // EXACT SIZES FROM ORIGINAL LABRUTE
        const portraitSize = 48;  // Match original size
        const barHeight = 14;     // Thinner bar
        const barWidth = 230;     // Slightly shorter to create gap in middle
        
        // Portrait EXACTLY like original - simple brown square
        const portraitBg = new Graphics();
        portraitBg.rect(0, 0, portraitSize, portraitSize)
          .fill({ color: 0x3A2317 })  // Darker brown border
          .stroke({ width: 1.5, color: 0xB8860B, alpha: 1 });  // Same light brown border as HP bar
        
        // Portrait inner area
        const portrait = new Graphics();
        portrait.rect(2, 2, portraitSize - 4, portraitSize - 4)
          .fill({ color: 0x8B6534 });  // Lighter brown inner
        
        const portraitContainer = new Container();
        portraitContainer.addChild(portraitBg, portrait);
        // Freeze overlay (for hypnosis) - sits above portrait image
        const freezeOverlay = new Graphics();
        freezeOverlay.rect(2, 2, portraitSize - 4, portraitSize - 4)
          .fill({ color: 0x7f3a9a, alpha: 0.35 });
        freezeOverlay.visible = false;
        portraitContainer.addChild(freezeOverlay);
        
        // PFP image in portrait (masked), with URL params override
        const p = new URLSearchParams(window.location.search);
        const urlDefault = '/images/viewport.png';
        const url = (isL ? (p.get('pixiPfpL') || p.get('pixiPfp')) : (p.get('pixiPfpR') || p.get('pixiPfp'))) || urlDefault;
        const pScale = Number(p.get('pixiPfpScale') ?? '1');
        const offX = Number(p.get('pixiPfpOffX') ?? '0');
        const offY = Number(p.get('pixiPfpOffY') ?? '0');

        // Mask to keep sprite inside the frame (Pixi v8 syntax)
        const mask = new Graphics();
        mask.rect(2, 2, portraitSize - 4, portraitSize - 4);
        mask.fill({ color: 0xFFFFFF });
        portraitContainer.addChild(mask);

        // Red X overlay for loser — two filled bars (centered over PFP)
        let redX: Container | null = null;
        try {
          const cross = new Container();
          const size = Math.round(portraitSize * 1.28); // slightly larger than portrait
          const thick = Math.max(6, Math.round(portraitSize * 0.26));
          const barA = new Graphics();
          barA.rect(-size / 2, -thick / 2, size, thick);
          barA.fill({ color: 0xFF0000 });
          barA.rotation = Math.PI / 4;
          const barB = new Graphics();
          barB.rect(-size / 2, -thick / 2, size, thick);
          barB.fill({ color: 0xFF0000 });
          barB.rotation = -Math.PI / 4;
          cross.addChild(barA, barB);
          // Center the cross over the PFP (slight inward bias if needed later)
          const cx = portraitSize / 2;
          const cy = portraitSize / 2;
          cross.position.set(cx, cy);
          cross.visible = false;
          portraitContainer.addChild(cross);
          redX = cross;
        } catch {}

        const addPfpFromUrl = async (u: string) => {
          try {
            const tex = await Assets.load(u);
            if (!tex) throw new Error('No texture');
            const spr = new Sprite(tex as any);
            // Center the head in the square to avoid being too high
            spr.anchor.set(0.5, 0.5);
            // Auto-fit inside portrait (contain), then allow only downscale via pScale
            const baseScale = Number.isFinite(pScale) ? pScale : 1;
            const tw = ((spr as any).texture?.width ?? (spr as any).width ?? 1);
            const th = ((spr as any).texture?.height ?? (spr as any).height ?? 1);
            const maxW = portraitSize - 6;
            const maxH = portraitSize - 6;
            const fit = Math.min(maxW / Math.max(1, tw), maxH / Math.max(1, th));
            const eff = fit * Math.min(1, baseScale); // n’agrandit pas au-delà du fit
            // Flip on right so both look towards center
            spr.scale.set((isL ? 1 : -1) * eff, eff);
            spr.position.set(portraitSize / 2 + offX, portraitSize / 2 + offY);
            (spr as any).mask = mask;
            portraitContainer.addChild(spr);
            // Ensure overlays stay on top if they exist
            try { portraitContainer.addChild(freezeOverlay); } catch {}
            try { if (redX) portraitContainer.addChild(redX); } catch {}
          } catch {
            // Fallback to logo if loading fails
            try {
              const tex2 = await Assets.load('/logo192.png');
              const spr2 = new Sprite(tex2 as any);
              spr2.anchor.set(0.5, 0.5);
              const baseScale2 = Number.isFinite(pScale) ? pScale : 1;
              const tw2 = ((spr2 as any).texture?.width ?? (spr2 as any).width ?? 1);
              const th2 = ((spr2 as any).texture?.height ?? (spr2 as any).height ?? 1);
              const maxW2 = portraitSize - 6;
              const maxH2 = portraitSize - 6;
              const fit2 = Math.min(maxW2 / Math.max(1, tw2), maxH2 / Math.max(1, th2));
              const eff2 = fit2 * Math.min(1, baseScale2);
              spr2.scale.set((isL ? 1 : -1) * eff2, eff2);
              spr2.position.set(portraitSize / 2 + offX, portraitSize / 2 + offY);
              (spr2 as any).mask = mask;
              portraitContainer.addChild(spr2);
              try { portraitContainer.addChild(freezeOverlay); } catch {}
              try { if (redX) portraitContainer.addChild(redX); } catch {}
            } catch {
              // Last resort: initial letter
              const initialText = String(name ?? '?')[0];
              const initial = new Text(initialText ? initialText.toUpperCase() : '?', {
                fontSize: 18,
                fill: 0xFFDDCC,
                fontWeight: 'bold',
                stroke: 0x2A1810,
                strokeThickness: 2
              } as any);
              initial.anchor.set(0.5);
              initial.position.set(portraitSize/2, portraitSize/2);
              portraitContainer.addChild(initial);
              try { portraitContainer.addChild(freezeOverlay); } catch {}
              try { if (redX) portraitContainer.addChild(redX); } catch {}
            }
          }
        };
        // Start loading PFP (non-blocking)
        addPfpFromUrl(url);

        if (fighter) {
          portraitContainer.eventMode = 'static';
          try { portraitContainer.hitArea = new Rectangle(0, 0, portraitSize, portraitSize); } catch {}
          try { (portraitContainer as any).cursor = 'pointer'; } catch {}

          portraitContainer.on('pointerover', (e: any) => {
            if (disposed) return;

            // Get portrait bounds in Pixi coordinates
            const bounds = portraitContainer.getBounds();

            // Get canvas element and its position on screen
            const canvas = app.view as HTMLCanvasElement;
            const canvasRect = canvas.getBoundingClientRect();

            // Calculate scale factor (handles browser zoom and canvas scaling)
            const scaleX = canvasRect.width / canvas.width;
            const scaleY = canvasRect.height / canvas.height;

            // Convert portrait center to screen coordinates with proper scaling
            const portraitScreenX = canvasRect.left + (bounds.x + bounds.width / 2) * scaleX;
            const portraitScreenY = canvasRect.top + bounds.y * scaleY; // Position at top of portrait

            // Use portrait position for initial tooltip placement
            showTooltip(fighter, portraitScreenX, portraitScreenY);
          });

          portraitContainer.on('pointermove', (e: any) => {
            if (disposed || !currentHoveredFighter) return;

            // While moving, follow the mouse
            const canvas = app.view as HTMLCanvasElement;
            const canvasRect = canvas.getBoundingClientRect();

            // Calculate scale factor (handles browser zoom and canvas scaling)
            const scaleX = canvasRect.width / canvas.width;
            const scaleY = canvasRect.height / canvas.height;

            // Get mouse position relative to canvas
            const globalX = e.data?.global?.x || e.global?.x || 0;
            const globalY = e.data?.global?.y || e.global?.y || 0;

            // Convert to screen coordinates with proper scaling
            const mouseScreenX = canvasRect.left + globalX * scaleX;
            const mouseScreenY = canvasRect.top + globalY * scaleY - 30; // Closer to cursor

            showTooltip(fighter, mouseScreenX, mouseScreenY);
          });

          portraitContainer.on('pointerout', () => {
            if (disposed) return;
            hideTooltip();
          });
        }

        // Name text - bigger, whiter and bolder
        const nameText = new Text(String(name ?? '').toUpperCase(), {
          fill: '#FFFFFF',  // Pure white
          stroke: '#000000', 
          strokeThickness: 2,  // Reduced from 4 to 2 for cleaner look
          fontSize: 16,  // Just a tiny bit smaller
          fontWeight: '900',  // Maximum bold
          fontFamily: 'Arial Black, Arial'  // Use bolder font variant
        } as any);
        
        // HP Bar container
        const barContainer = new Container();
        const barW = barWidth;
        const barH = barHeight;
        
        // Bar background - black with light brown border
        const barBg = new Graphics();
        barBg.roundRect(0, 0, barW, barH, 4)
          .fill({ color: 0x000000 })
          .stroke({ width: 1.5, color: 0xB8860B, alpha: 1 });  // Light brown border (goldenrod)
        
        // Inner background area with rounded corners
        const barInner = new Graphics();
        barInner.roundRect(1, 1, barW - 2, barH - 2, 3)
          .fill({ color: 0x1A0F08 });  // Very dark brown
        
        // HP fill container
        const hpFill = new Container();
        
        // HP bar gradient-like effect
        const hpBar = new Graphics();
        hpBar.rect(1, 1, barW - 2, barH - 2)
          .fill({ color: 0xFFD700 });  // Gold/yellow - like official LaBrute
        
        // Top highlight for 3D effect
        const hpHighlight = new Graphics();
        hpHighlight.rect(1, 1, barW - 2, 2)
          .fill({ color: 0xFFD060, alpha: 0.5 });
        
        // Bottom shadow for depth
        const hpShadow = new Graphics();
        hpShadow.rect(1, barH - 3, barW - 2, 2)
          .fill({ color: 0xCC8020, alpha: 0.7 });
        
        hpFill.addChild(hpBar, hpShadow, hpHighlight);
        
        // Damage bar (shows lost HP in red)
        const dmgBar = new Graphics();
        // Heal spark (shows tiny heals even < 1px)
        const healBar = new Graphics();
        
        barContainer.addChild(barBg, barInner, hpFill, dmgBar, healBar);
        
        // Weapon icon (small, next to portrait)
        const weaponContainer = new Container();

        // Status icons (buffs) container next to portrait
        const statusContainer = new Container();
        const statusIcons = new Map<string, Container>();
        const layoutStatus = () => {
          const gap = 4;
          let x = 0;
          const items = Array.from(statusIcons.values());
          if (isL) {
            for (const c of items) { c.position.set(x, 0); x += (c.width || 18) + gap; }
          } else {
            // Align from right to left
            x = 0;
            for (let i = items.length - 1; i >= 0; i--) {
              const c = items[i]!; c.position.set(x, 0); x += (c.width || 18) + gap;
            }
          }
        };
        const makeStatusIcon = (emoji: string, bgColor: number) => {
          const c = new Container();
          const g = new Graphics();
          g.circle(9, 9, 9).fill({ color: bgColor, alpha: 0.9 }).stroke({ width: 1, color: 0x111111, alpha: 0.9 });
          const t = new Text(emoji, { fontSize: 12, fontWeight: '900' } as any);
          t.anchor.set(0.5, 0.5);
          t.position.set(9, 9);
          c.addChild(g, t);
          return c;
        };
        const setStatusFlag = (kind: 'vampirism'|'dropshield'|'haste'|'hypnosis') => {
          if (statusIcons.has(kind)) return;
          let icon: Container | null = null;
          if (kind === 'vampirism') icon = makeStatusIcon('🩸', 0x7a0022);
          else if (kind === 'dropshield') icon = makeStatusIcon('🛡', 0x0a4faa);
          else if (kind === 'haste') icon = makeStatusIcon('⚡', 0xb58900);
          else if (kind === 'hypnosis') icon = makeStatusIcon('🌀', 0x5e2c6c);
          if (icon) {
            statusIcons.set(kind, icon);
            statusContainer.addChild(icon);
            layoutStatus();
          }
        };
        const clearStatusFlag = (kind: 'vampirism'|'dropshield'|'haste'|'hypnosis') => {
          const icon = statusIcons.get(kind);
          if (!icon) return;
          statusIcons.delete(kind);
          try { statusContainer.removeChild(icon); } catch {}
          try { icon.destroy(); } catch {}
          layoutStatus();
        };
        
        
        
        // Create the full HUD layout
        const fullBar = new Container();
        
        if (isL) {
          // LEFT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(0, 0);
          nameText.position.set(0, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar
          portraitContainer.position.set(2, 32);

          // Weapon icon right next to portrait (to the right)
          weaponContainer.position.set(2 + portraitSize, 32);
          // Status icons just below weapon icons
          statusContainer.position.set(2 + portraitSize, 32 + 22);
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer, statusContainer);
          fullBar.position.set(5, 2);  // Back to edge, gap is in the middle now
        } else {
          // RIGHT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(1, 0);
          nameText.position.set(barW, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar
          portraitContainer.position.set(barW - portraitSize - 2, 32);

          // Weapon icons to the left of portrait, growing leftward
          weaponContainer.position.set(0, 32);  // Container starts at left edge of HUD
          // Status icons under weapons
          statusContainer.position.set(0, 32 + 22);
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer, statusContainer);
          fullBar.position.set(W - 5 - barW, 2);  // Back to edge, gap is in the middle now
        }
        
        ui.addChild(fullBar);
        
        // HP management
        let currentHp = 1;
        let displayHp = 1; // utilisé pour la traîne rouge (perte de PV)
        let lastRatio = 1; // dernier ratio affiché pour détecter un heal même < 1px
        
        const set = (ratio: number) => {
          const clamped = Math.max(0, Math.min(1, ratio));
          const prev = lastRatio;
          currentHp = clamped;
          lastRatio = clamped;
          const isHeal = currentHp > prev + 1e-6;
          
          // Animate HP bar
          // Ensure minimum visible width - at least 10% of bar width for visibility
          const targetWidth = currentHp > 0 ? barW * currentHp : 0;
          
          // Update HP bar graphics en garantissant une largeur minimale visible
          if (hpBar && !hpBar.destroyed && typeof hpBar.clear === 'function') {
            try {
              hpBar.clear();
            } catch {
              return; // Skip if graphics is in invalid state
            }
            
            // Only draw if there's health
            if (currentHp > 0) {
              const drawWidth = Math.max(1, (isHeal ? Math.ceil(targetWidth - 2) : Math.floor(targetWidth - 2)));
              
              // Always yellow HP bar - like official LaBrute
              if (isL) {
                // Left bar fills from left to right with rounded corners
                hpBar.roundRect(1, 1, drawWidth, barH - 2, 3);
              } else {
                // Right bar fills from right to left with rounded corners
                const startX = barW - drawWidth - 1;
                hpBar.roundRect(startX, 1, drawWidth, barH - 2, 3);
              }
              hpBar.fill({ color: 0xFFD700 }); // Gold/yellow
            }
          }
          
          // Update highlight and shadow to match current HP
          if (hpHighlight && !hpHighlight.destroyed && typeof hpHighlight.clear === 'function') {
            try {
              hpHighlight.clear();
              // Only show highlight if HP is above 10% to avoid artifacts
              if (currentHp > 0.1) {
                const drawWidth = Math.max(0, targetWidth - 2);
                if (drawWidth > 0) {
                  if (isL) {
                    hpHighlight.rect(1, 1, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpHighlight.rect(startX, 1, drawWidth, 2);
                  }
                  hpHighlight.fill({ color: 0xFFD060, alpha: 0.5 });
                }
              }
            } catch {
              return;
            }
          }
          
          if (hpShadow && !hpShadow.destroyed && typeof hpShadow.clear === 'function') {
            try {
              hpShadow.clear();
              // Only show shadow if HP is above 10% to avoid artifacts
              if (currentHp > 0.1) {
                const drawWidth = Math.max(0, targetWidth - 2);
                if (drawWidth > 0) {
                  if (isL) {
                    hpShadow.rect(1, barH - 3, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpShadow.rect(startX, barH - 3, drawWidth, 2);
                  }
                  hpShadow.fill({ color: 0xCC8020, alpha: 0.7 });
                }
              }
            } catch {
              return;
            }
          }
          
          // HEAL SPARK: for very small heals (< 2px), afficher une bande verte temporaire
          if (isHeal) {
            // Sur heal, on annule toute traîne rouge restante
            if (currentHp > displayHp) displayHp = currentHp;
            // calcul en coordonnées "intérieures" (barre avec bordure 1px)
            const prevW = Math.max(0, Math.floor(barW * prev - 2));
            const currW = Math.max(0, Math.ceil(barW * currentHp - 2));
            let d = Math.max(0, currW - prevW);
            if (d < 2) {
              try { healBar.clear(); } catch {}
              const sparkW = Math.max(2, d || 2);
              const y0 = 1;
              const h = barH - 2;
              if (isL) {
                // intérieur commence à x=1; dessiner après l'ancienne largeur
                const startX = 1 + prevW;
                healBar.rect(startX, y0, sparkW, h).fill({ color: 0x7CFC00, alpha: 0.9 });
              } else {
                // côté droit: bord gauche intérieur = (barW - 1) - largeur
                const newLeft = (barW - 1) - currW;
                healBar.rect(newLeft, y0, sparkW, h).fill({ color: 0x7CFC00, alpha: 0.9 });
              }
              // Fade out spark
              let a = 0.9;
              const tick = (tk:any) => {
                const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                a -= dm / 400;
                try { healBar.alpha = Math.max(0, a); } catch {}
                if (a <= 0) {
                  try { app.ticker.remove(tick); } catch {}
                  try { healBar.clear(); healBar.alpha = 1; } catch {}
                }
              };
              addTick(tick);
            } else {
              try { healBar.clear(); } catch {}
            }
          } else {
            try { healBar.clear(); } catch {}
          }

          // Show RED TRAILING EFFECT for lost HP - like official LaBrute
          if (dmgBar && !dmgBar.destroyed && typeof dmgBar.clear === 'function' && currentHp < displayHp) {
            try {
              dmgBar.clear();
            } catch {
              return;
            }
            
            // Draw red trailing bar that slowly catches up
            const trailWidth = barW * (displayHp - currentHp);
            
            if (isL) {
              // Left bar - red trail on the right side of green bar
              const trailStart = barW * currentHp;
              dmgBar.rect(trailStart, 1, trailWidth, barH - 2)
                .fill({ color: 0xFF0000, alpha: 0.9 });  // Bright red
            } else {
              // Right bar - red trail on the left side of green bar  
              const trailEnd = barW * (1 - currentHp);
              const trailStart = barW * (1 - displayHp);
              dmgBar.rect(trailStart, 1, trailEnd - trailStart, barH - 2)
                .fill({ color: 0xFF0000, alpha: 0.9 });  // Bright red
            }
            
            // Slowly animate the red trail to catch up with green bar
            const animateTrail = () => {
              if (dmgBar && !dmgBar.destroyed && displayHp > currentHp) {
                // Gradually reduce the gap
                displayHp -= (displayHp - currentHp) * 0.08;  // Slower catch-up
                
                if (displayHp - currentHp < 0.005) {
                  displayHp = currentHp;
                  try {
                    if (typeof dmgBar.clear === 'function') dmgBar.clear();
                  } catch {}
                } else {
                  // Redraw the trail
                  set(currentHp);  // This will trigger a redraw
                  setTimeout(animateTrail, 30);  // Continue animation
                }
              }
            };
            
            setTimeout(animateTrail, 30);
          }
        };
        
        // Track all equipped weapons for this fighter
        const weaponsList: string[] = [];
        
        const updateWeapon = (weaponName: string) => {
          // Add weapon to list if not empty
          if (weaponName && weaponName !== 'none' && weaponName !== '') {
            if (!weaponsList.includes(weaponName)) {
              weaponsList.push(weaponName);
            }
          }
          refreshWeaponDisplay();
        };
        
        const removeWeapon = (weaponName: string) => {
          const index = weaponsList.indexOf(weaponName);
          if (index > -1) {
            weaponsList.splice(index, 1);
          }
          refreshWeaponDisplay();
        };
        
        const clearWeapons = () => {
          weaponsList.length = 0;
          refreshWeaponDisplay();
        };
        
        const refreshWeaponDisplay = () => {
          // Clear previous weapon icons
          weaponContainer.removeChildren();
          
          if (weaponsList.length === 0) {
            return;
          }
          
          // Display each weapon icon
          weaponsList.forEach((weaponName, index) => {
            const weaponItemContainer = new Container();
            // For right fighter, align icons from right (next to portrait)
            if (!isL) {
              // Icons grow leftward from portrait position
              // Portrait is at (barW - portraitSize - 2), so weapons go to the left of that
              const portraitX = barW - portraitSize - 2;
              weaponItemContainer.position.set(portraitX - (index + 1) * 30, 0);
            } else {
              // For left fighter, keep normal left-to-right alignment
              weaponItemContainer.position.set(index * 30, 0);
            }
            
            // Weapon icon box (28x28) - transparent background with subtle border
            const weaponBg = new Graphics();
            weaponBg.roundRect(0, 0, 28, 28, 2)
              .fill({ color: 0x1A0F08, alpha: 0.3 });  // Semi-transparent background
            
            // Inner border - more visible
            const weaponBorder = new Graphics();
            weaponBorder.roundRect(1, 1, 26, 26, 2)
              .stroke({ width: 1.5, color: 0x8B6534, alpha: 0.8 });
            
            // Weapon icon - better shapes
            const weaponIcon = new Graphics();
            
            // Determine weapon type and draw appropriate icon
            const lowerName = weaponName.toLowerCase();
          
          if (lowerName.includes('sword') || lowerName.includes('scimitar')) {
            // Sword - vertical blade with guard
            weaponIcon.rect(13, 5, 2, 14)  // Blade
              .fill({ color: 0xE0E0E0 });
            weaponIcon.rect(10, 17, 8, 2)  // Guard
              .rect(13, 19, 2, 4)  // Handle
              .fill({ color: 0xB8860B });
          } else if (lowerName.includes('axe') || lowerName.includes('hatchet')) {
            // Axe - handle with axe head
            weaponIcon.rect(13, 8, 2, 12)  // Handle
              .fill({ color: 0x654321 });
            weaponIcon.moveTo(11, 8)
              .lineTo(17, 8)
              .lineTo(19, 5)
              .lineTo(19, 11)
              .lineTo(17, 11)
              .lineTo(11, 11)
              .closePath()
              .fill({ color: 0x808080 });
          } else if (lowerName.includes('hammer') || lowerName.includes('mace')) {
            // Hammer - T shape
            weaponIcon.rect(13, 10, 2, 10)  // Handle
              .fill({ color: 0x654321 });
            weaponIcon.rect(9, 6, 10, 5)   // Head
              .fill({ color: 0x696969 });
          } else if (lowerName.includes('lance') || lowerName.includes('trident')) {
            // Lance/Trident - long with point
            weaponIcon.rect(13, 8, 2, 12)  // Shaft
              .fill({ color: 0x4682B4 });
            weaponIcon.moveTo(14, 8)
              .lineTo(17, 5)
              .lineTo(14, 5)
              .lineTo(11, 5)
              .lineTo(14, 8)
              .fill({ color: 0x4682B4 });
          } else if (lowerName.includes('whip') || lowerName.includes('flail')) {
            // Whip - curved line
            weaponIcon.stroke({ width: 2, color: 0x8B4513 });
            weaponIcon.moveTo(10, 20);
            weaponIcon.bezierCurveTo(14, 18, 16, 12, 18, 8);
          } else if (lowerName.includes('knife') || lowerName.includes('dagger')) {
            // Knife - small blade
            weaponIcon.moveTo(14, 8)
              .lineTo(16, 12)
              .lineTo(14, 16)
              .lineTo(12, 12)
              .closePath()
              .fill({ color: 0xC0C0C0 });
            weaponIcon.rect(13, 16, 2, 4)  // Handle
              .fill({ color: 0x654321 });
          } else if (lowerName.includes('club') || lowerName.includes('baton')) {
            // Club - thick at top
            weaponIcon.rect(13, 12, 2, 8)  // Handle
              .ellipse(11, 6, 6, 8)  // Head
              .fill({ color: 0x654321 });
          } else if (lowerName.includes('fan') || lowerName.includes('shuriken')) {
            // Fan/Shuriken - star shape
            // Draw star manually
            const points = [];
            const outerRadius = 8;
            const innerRadius = 4;
            for (let i = 0; i < 10; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
              points.push(14 + Math.cos(angle) * radius, 14 + Math.sin(angle) * radius);
            }
            weaponIcon.poly(points)
              .fill({ color: 0x800080 });
          } else {
            // Default weapon - simple sword silhouette
            weaponIcon.rect(13, 6, 2, 16)
              .rect(11, 18, 6, 2)
              .fill({ color: 0x888888 });
          }
          
            // Add all parts to this weapon's container
            weaponItemContainer.addChild(weaponBg, weaponBorder, weaponIcon);
            weaponContainer.addChild(weaponItemContainer);
          });
        };
        
        const follow = () => {};

        // Haste aura around portrait (pulsing ring)
        let hasteRing: Graphics | null = null;
        let hasteTick: ((tk:any)=>void) | null = null;
        const setHasteAura = (on: boolean) => {
          if (on) {
            if (!hasteRing) {
              hasteRing = new Graphics();
              const r = Math.round(portraitSize/2 + 6);
              hasteRing.circle(portraitSize/2, portraitSize/2, r)
                .stroke({ width: 3, color: 0x2c8eea, alpha: 0.9 });
              portraitContainer.addChild(hasteRing);
              // keep overlays order
              try { portraitContainer.addChild(freezeOverlay); } catch {}
              try { if (redX) portraitContainer.addChild(redX); } catch {}
            }
            if (!hasteTick) {
              let t = 0;
              hasteTick = (tk:any) => {
                const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                t += dm;
                const a = 0.6 + 0.35 * Math.sin(t * 0.01);
                if (hasteRing) { try { hasteRing.alpha = a; } catch {} }
              };
              addTick(hasteTick);
            }
          } else {
            if (hasteTick) { try { app.ticker.remove(hasteTick); } catch {} hasteTick = null; }
            if (hasteRing) { try { portraitContainer.removeChild(hasteRing); hasteRing.destroy(); } catch {} hasteRing = null; }
          }
        };

        // Hypnosis freeze overlay on portrait
        let hypnosisPulseTick: ((tk:any)=>void) | null = null;
        const setHypnosisFreeze = (on: boolean) => {
          if (!on) {
            freezeOverlay.visible = false;
            if (hypnosisPulseTick) { try { app.ticker.remove(hypnosisPulseTick); } catch {} hypnosisPulseTick = null; }
          } else {
            freezeOverlay.visible = true;
          }
        };
        const pulseHypnosis = () => {
          try { setHypnosisFreeze(true); } catch {}
          let t = 0;
          const total = 2200; // ms
          hypnosisPulseTick = (tk:any) => {
            const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
            const a = 0.35 + 0.18 * Math.sin(t * 0.01);
            try { freezeOverlay.alpha = a; } catch {}
            if (t >= total) {
              if (hypnosisPulseTick) { try { app.ticker.remove(hypnosisPulseTick); } catch {} hypnosisPulseTick = null; }
              try { freezeOverlay.alpha = 0.35; } catch {}
            }
          };
          addTick(hypnosisPulseTick);
        };

        // Small HUD shake (used when taking a hit)
        const hitShake = (mag=2, dur=200) => {
          const base = { x: portraitContainer.x, y: portraitContainer.y };
          let t = 0;
          const tick = (tk:any) => {
            const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
            t += dm;
            const p = Math.min(1, t / dur);
            const jx = (Math.random()*2-1) * mag * (1 - p);
            portraitContainer.position.set(base.x + jx, base.y);
            if (p >= 1) {
              try { portraitContainer.position.set(base.x, base.y); } catch {}
              try { app.ticker.remove(tick); } catch {}
            }
          };
          addTick(tick);
        };
        
        const showDeathX = () => {
          try {
            if (redX) {
              redX.visible = true;
              // Ensure it renders on top
              portraitContainer.addChild(redX);
            }
          } catch {}
        };
        
        return { set, follow, nameText, updateWeapon, removeWeapon, clearWeapons, showDeathX, fullBar, hitShake, setStatusFlag, clearStatusFlag, setHasteAura, setHypnosisFreeze, pulseHypnosis };
      };

      const parseArr = (x: any) => { try { return Array.isArray(x) ? x : JSON.parse(x); } catch { return []; } };
      const steps: any[] = parseArr(fight.steps);
      const fighters: any[] = parseArr(fight.fighters);

      const byIndex = new Map<number, any>();
      const hpByIndex = new Map<number, { cur: number, max: number }>();
      for (const f of fighters) {
        if (typeof f?.index === 'number') {
          byIndex.set(f.index, f);
          const max = Number(f?.maxHp ?? f?.hp ?? 100) || 100;
          const cur = Number(f?.hp ?? max) || max;
          hpByIndex.set(f.index, { cur: Math.max(0, cur), max: Math.max(1, max) });
        }
      }
      // Track last known weapon by actor (from Hit steps)
      const lastWeaponByActor = new Map<number, string>();
      // Track which weapons are currently drawn (in hand) vs sheathed
      const drawnWeapons = new Set<string>(); // format: "actorIdx:weaponName"
      const leftMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute1Id);
      const rightMain = fighters.find((f:any) => !f?.master && f?.id === fight.brute2Id);
      const leftMainIdx = leftMain?.index ?? 1;
      const rightMainIdx = rightMain?.index ?? 2;
      const maxL = leftMain?.maxHp ?? leftMain?.hp ?? 100;
      const maxR = rightMain?.maxHp ?? rightMain?.hp ?? 100;
      let hpL = maxL, hpR = maxR;
      const hudL = mkHud('L', leftMain?.name, leftMain); 
      const hudR = mkHud('R', rightMain?.name, rightMain);
      const barL = { set: hudL.set, follow: hudL.follow, updateWeapon: hudL.updateWeapon, removeWeapon: hudL.removeWeapon, clearWeapons: hudL.clearWeapons }; 
      const barR = { set: hudR.set, follow: hudR.follow, updateWeapon: hudR.updateWeapon, removeWeapon: hudR.removeWeapon, clearWeapons: hudR.clearWeapons };
      barL.set(1); barR.set(1);
      
      // Show ALL weapons at start (they're sheathed) - LIKE OFFICIAL
      // Initialize ALL weapons for each fighter
      console.log('DEBUG: LeftMain weapons array:', leftMain?.weapons);
      if (leftMain?.weapons && Array.isArray(leftMain.weapons)) {
        leftMain.weapons.forEach((weapon: any) => {
          // Weapons are stored as number IDs, convert to names using WeaponById
          const weaponId = typeof weapon === 'number' ? weapon : (weapon?.id ?? weapon);
          const weaponName = WeaponById[weaponId as keyof typeof WeaponById];
          console.log('DEBUG: Left weapon ID:', weaponId, 'Name:', weaponName);
          if (weaponName) {
            barL.updateWeapon(weaponName);
          }
        });
      }
      console.log('DEBUG: RightMain weapons array:', rightMain?.weapons);
      if (rightMain?.weapons && Array.isArray(rightMain.weapons)) {
        rightMain.weapons.forEach((weapon: any) => {
          // Weapons are stored as number IDs, convert to names using WeaponById
          const weaponId = typeof weapon === 'number' ? weapon : (weapon?.id ?? weapon);
          const weaponName = WeaponById[weaponId as keyof typeof WeaponById];
          console.log('DEBUG: Right weapon ID:', weaponId, 'Name:', weaponName);
          if (weaponName) {
            barR.updateWeapon(weaponName);
          }
        });
      }

      // Small helpers
      const playAnim = (obj:any, name:string, loop=true) => {
        if (obj?.type === 'spine') {
          // For spineboy, we only use 'idle' and 'death' for now
          const mapped = name === 'death' ? 'death' : 'idle';
          try { (obj.node as any).state.setAnimation(0, mapped, mapped === 'idle'); } catch {}
        }
      };
      // Small pooled float text to reduce allocations
      const textPool: Text[] = [];
      const allTexts: Text[] = []; // Garder une rÃ©fÃ©rence Ã  tous les textes crÃ©Ã©s
      
      // PrÃ©-crÃ©er un pool de textes
      for (let i = 0; i < 10; i++) {
        const preText = new Text('', { fill: 0xffffff as any, fontSize: 12 } as any);
        preText.anchor.set(0.5);
        preText.visible = false;
        preText.renderable = false;
        scene.addChild(preText); // Ajouter Ã  la scÃ¨ne une fois pour toutes
        textPool.push(preText);
        allTexts.push(preText);
      }
      
      // Trace UI button (if tracing enabled)
      try {
        if (traceEnabled) {
          const btn = new Container();
          btn.eventMode = 'static';
          const bg = new Graphics();
          bg.roundRect(0, 0, 76, 18, 5).fill({ color: 0x333333, alpha: 0.85 });
          const label = new Text('Save Trace', { fontSize: 11, fill: 0xffffff } as any);
          label.position.set(6, 2);
          btn.addChild(bg, label);
          btn.position.set(6, 6);
          // @ts-ignore
          (btn as any).zIndex = 1000;
          ui.addChild(btn);
          btn.on('pointertap', () => { try { (window as any).pixiTraceDownload?.(); } catch {} });
        }
      } catch {}

      const getText = () => {
        let t = textPool.pop();
        if (!t) {
          // CrÃ©er un nouveau texte si le pool est vide
          t = new Text('', { fill: 0xffffff as any, fontSize: 12 } as any);
          t.anchor.set(0.5);
          scene.addChild(t); // Ajouter directement Ã  la scÃ¨ne
          allTexts.push(t);
        }
        // RÃ©initialiser l'Ã©tat du texte
        t.visible = true;
        t.renderable = true;
        t.alpha = 1;
        return t;
      };
      const recycleText = (t: Text) => { 
        try { 
          t.visible = false; 
          t.renderable = false;
          t.alpha = 1; 
        } catch {} 
        textPool.push(t); 
      };
      const floatText = (x:number, y:number, txt:string, color=0xffffff) => {
        const t = getText();
        t.text = txt; 
        (t.style as any).fill = color; 
        t.position.set(x, y - 60); 
        t.visible = true;
        t.renderable = true;
        // Le texte est dÃ©jÃ  dans la scÃ¨ne grÃ¢ce au pool prÃ©-crÃ©Ã©
        let a = 0;
        const duration = 650 / Math.max(0.001, speed);
        const tick = (tk:any) => {
          if (disposed) { 
            try { app.ticker.remove(tick); } catch {} 
            // Ne pas retirer pendant le disposed, juste masquer
            try { t.visible = false; t.renderable = false; } catch {}
            recycleText(t); 
            return; 
          }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          a += dm; const p = Math.min(1, a / duration);
          t.alpha = Math.max(0, 1 - p);
          t.y = (y - 60) - 20 * p;
          if (p >= 1) { 
            app.ticker.remove(tick); 
            // Batcher safety: NE PAS retirer de la scÃ¨ne pendant le tick
            // Juste masquer et marquer pour recyclage
            t.visible = false; 
            t.renderable = false;
            // Recycler sans retirer de la scÃ¨ne
            recycleText(t); 
          }
        };
        addTick(tick);
      };
      const shake = (mag=2, dur=120) => new Promise<void>((resolve) => {
        const baseX = scene.x; const baseY = scene.y; let t=0;
        const tick = (tk:any) => {
          if (disposed) { try { app.ticker.remove(tick); } catch {} scene.x=baseX; scene.y=baseY; resolve(); return; }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
          const p = Math.min(1, t / dur);
          scene.x = baseX + (Math.random()*2-1) * mag * (1-p);
          scene.y = baseY + (Math.random()*2-1) * mag * (1-p);
          if (p>=1){ app.ticker.remove(tick); scene.x=baseX; scene.y=baseY; resolve(); }
        };
        addTick(tick);
      });

      // Weapon and Pet Spine Animated Placeholders
      const weaponSpines = new Map<any, any>();
      const petSpines = new Map<number, any>();
      // Scene shields (visual overlay) per fighter index
      const shields = new Map<number, Graphics>();
      const attachShield = (fighterIdx: number, node: any, side: 'L'|'R') => {
        try {
          if (!node || shields.has(fighterIdx)) return;
          const g = new Graphics();
          // Rounded rectangular shield with subtle highlight
          g.lineStyle(2, 0x9ac7ff, 0.9);
          g.beginFill(0x3a78b3, 0.25);
          g.drawRoundedRect(-16, -26, 32, 44, 10);
          g.endFill();
          const edge = new Graphics();
          edge.lineStyle(2, 0xffffff, 0.3);
          edge.moveTo(-14, -20); edge.lineTo(14, -20);
          edge.moveTo(-12, -8); edge.lineTo(12, -8);
          g.addChild(edge);
          // Slightly in front of the fighter depending on side
          g.position.set(side === 'L' ? 18 : -18, -5);
          try { (g as any).zIndex = 5; } catch {}
          node.addChild(g);
          shields.set(fighterIdx, g);
        } catch {}
      };
      const dropShield = (fighterIdx: number) => {
        try {
          const g = shields.get(fighterIdx);
          if (!g) return;
          const parent = g.parent; if (!parent) { shields.delete(fighterIdx); return; }
          let t = 0; const startY = g.y; const dir = g.x >= 0 ? 1 : -1;
          const tick = (tk:any) => {
            const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
            const p = Math.min(1, t / (250 / Math.max(0.001, speed)));
            g.y = startY + p * 28;
            g.alpha = 1 - p;
            g.rotation = dir * p * 0.6;
            if (p >= 1) {
              try { parent.removeChild(g); } catch {}
              try { g.destroy(); } catch {}
              app.ticker.remove(tick);
              shields.delete(fighterIdx);
            }
          };
          app.ticker.add(tick);
        } catch {}
      };
      const allySpines = new Map<number, any>(); // renforts (Backup) humains supplémentaires
      // Track active nets per target (to break on hit)
      const activeNets = new Map<number, Container>();
      const petHudByIndex = new Map<number, { cont: Container, set: (r:number)=>void }>();
      let petHudTickStarted = false;

      const ensurePetHudTick = () => {
        if (petHudTickStarted) return;
        petHudTickStarted = true;
        const tick = () => {
          try {
            petHudByIndex.forEach((hud, idx) => {
              const pet = petSpines.get(idx);
              if (!pet) return;
              const pos = getPos(pet);
              hud.cont.position.set(pos.x, pos.y - 22);
            });
          } catch {}
        };
        addTick(tick);
      };

      const ensurePetHud = (idx:number) => {
        if (petHudByIndex.has(idx)) return petHudByIndex.get(idx)!;
        const cont = new Container();
        ui.addChild(cont);
        const bg = new Graphics();
        bg.roundRect(-16, -6, 32, 5, 2)
          .fill({ color: 0x000000, alpha: 0.9 })
          .stroke({ width: 1, color: 0xB8860B, alpha: 1 });
        const fill = new Graphics();
        cont.addChild(bg, fill);
        const set = (ratio:number) => {
          try { fill.clear(); } catch {}
          const r = Math.max(0, Math.min(1, ratio));
          if (r <= 0) return;
          fill.roundRect(-15, -5, Math.max(1, Math.floor(30*r)), 3, 1)
            .fill({ color: 0xFFD700 });
        };
        const entry = { cont, set } as const;
        petHudByIndex.set(idx, entry);
        ensurePetHudTick();
        const hp = hpByIndex.get(idx);
        if (hp) set(hp.cur / hp.max);
        return entry;
      };
      
      // Create animated weapon using Spine runtime
      const createWeaponSpine = (weaponName: string) => {
        // Create a container with animated parts
        const container = new Container();
        
        // Create base weapon mesh using Graphics (will animate it)
        const weaponGraphics = new Graphics();
        
        // Color by weapon type
        let color = 0x666666;
        if (weaponName.includes('sword') || weaponName.includes('scimitar')) color = 0xC0C0C0;
        else if (weaponName.includes('axe') || weaponName.includes('hatchet')) color = 0x8B4513;
        else if (weaponName.includes('hammer') || weaponName.includes('mace')) color = 0x696969;
        else if (weaponName.includes('lance') || weaponName.includes('trident')) color = 0x4682B4;
        else if (weaponName.includes('whip') || weaponName.includes('baton')) color = 0x654321;
        else if (weaponName.includes('shuriken') || weaponName.includes('fan')) color = 0x800080;
        else if (weaponName.includes('keyboard') || weaponName.includes('book')) color = 0x228B22;
        
        if (weaponName.includes('hammer') || weaponName.includes('mace')) {
          weaponGraphics.rect(-4, -25, 8, 20)  // Thicker: 6 -> 8
            .rect(-8, -30, 16, 10); // Thicker: 12 -> 16, 8 -> 10
        } else if (weaponName.includes('axe')) {
          weaponGraphics.rect(-3, -25, 6, 20)  // Thicker: 4 -> 6
            .moveTo(-10, -25)  // Wider: -8 -> -10
            .lineTo(10, -25)   // Wider: 8 -> 10
            .lineTo(8, -30)
            .lineTo(-8, -30)
            .closePath();
        } else {
          weaponGraphics.rect(-3, -30, 6, 30);  // Thicker: 4 -> 6
          if (weaponName.includes('sword')) {
            weaponGraphics.rect(-8, -30, 16, 4);  // Thicker: 12 -> 16, 3 -> 4
          }
        }
        weaponGraphics.fill({ color: color });
        
        // Add glow effect
        const glow = new Graphics();
        glow.circle(0, -15, 20)
          .fill({ color: color, alpha: 0.3 });
        
        container.addChild(glow, weaponGraphics);
        
        // Animate the weapon with swinging motion
        let swingTime = 0;
        const weaponTick = (tk: any) => {
          const dt = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          swingTime += dt * 0.003;
          
          // Swing animation
          weaponGraphics.rotation = Math.sin(swingTime) * 0.2;
          weaponGraphics.scale.set(1 + Math.sin(swingTime * 2) * 0.05);
          
          // Glow pulse
          glow.alpha = 0.3 + Math.sin(swingTime * 3) * 0.2;
          glow.scale.set(1 + Math.sin(swingTime * 2) * 0.1);
        };
        
        // Store tick function for cleanup
        (container as any).weaponTick = weaponTick;
        
        return container;
      };
      
      const createPetSpine = (petType: string, side: 'L'|'R') => {
        const container = new Container();
        
        // Color and size by pet type
        let color = 0x8B4513;
        let size = 12;
        if (petType === 'dog1') { color = 0x8B4513; size = 10; }
        else if (petType === 'dog2') { color = 0xA0522D; size = 12; }
        else if (petType === 'dog3') { color = 0xD2691E; size = 14; }
        else if (petType === 'panther') { color = 0x1C1C1C; size = 15; }
        else if (petType === 'bear') { color = 0x654321; size = 18; }
        
        // Body parts for animation
        const body = new Graphics();
        body.circle(0, 0, size)
          .fill({ color: color });
        
        // Head
        const head = new Graphics();
        head.circle(0, -size * 0.7, size * 0.8)
          .fill({ color: color });
        
        // Eyes that blink
        const eyes = new Graphics();
        eyes.circle(-size/3, -size/3, 2)
          .circle(size/3, -size/3, 2)
          .fill({ color: 0xFFFFFF });
        eyes.circle(-size/3, -size/3, 1)
          .circle(size/3, -size/3, 1)
          .fill({ color: 0x000000 });
        head.addChild(eyes);
        
        // Legs for walking animation
        const legFL = new Graphics(); // Front Left
        const legFR = new Graphics(); // Front Right
        const legBL = new Graphics(); // Back Left
        const legBR = new Graphics(); // Back Right
        
        [legFL, legFR, legBL, legBR].forEach(leg => {
          leg.rect(-2, 0, 4, size * 0.8)
            .fill({ color: color });
        });
        
        legFL.position.set(-size * 0.5, size * 0.7);
        legFR.position.set(size * 0.5, size * 0.7);
        legBL.position.set(-size * 0.5, size * 0.7);
        legBR.position.set(size * 0.5, size * 0.7);
        
        // Tail
        const tail = new Graphics();
        tail.rect(0, -2, size * 0.8, 4)
          .fill({ color: color });
        tail.position.set(size * 0.8, 0);
        tail.pivot.set(0, 2);
        
        // Shadow
        const shadow = new Graphics();
        shadow.ellipse(0, size + 2, size * 1.5, size * 0.5)
          .fill({ color: 0x000000, alpha: 0.3 });
        
        // Assemble pet
        container.addChild(shadow, legBL, legBR, body, legFL, legFR, head, tail);
        
        // Animation variables
        let animTime = 0;
        let blinkTimer = 0;
        let isMoving = false;
        
        // Animation tick
        const petTick = (tk: any) => {
          const dt = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          animTime += dt * 0.005;
          blinkTimer += dt;
          
          // Idle breathing animation
          body.scale.set(1 + Math.sin(animTime) * 0.05, 1 + Math.cos(animTime) * 0.05);
          head.y = -size * 0.7 + Math.sin(animTime * 1.5) * 2;
          
          // Tail wag
          tail.rotation = Math.sin(animTime * 3) * 0.3;
          
          // Walking animation
          if (isMoving) {
            const walkCycle = animTime * 3;
            legFL.rotation = Math.sin(walkCycle) * 0.3;
            legFR.rotation = -Math.sin(walkCycle) * 0.3;
            legBL.rotation = -Math.sin(walkCycle + Math.PI) * 0.3;
            legBR.rotation = Math.sin(walkCycle + Math.PI) * 0.3;
          } else {
            // Reset legs when idle
            legFL.rotation *= 0.9;
            legFR.rotation *= 0.9;
            legBL.rotation *= 0.9;
            legBR.rotation *= 0.9;
          }
          
          // Blink animation
          if (blinkTimer > 3000 + Math.random() * 2000) {
            eyes.scale.y = 0.1;
            setTimeout(() => { eyes.scale.y = 1; }, 100);
            blinkTimer = 0;
          }
        };
        
        // Store animation state
        (container as any).petTick = petTick;
        (container as any).setMoving = (moving: boolean) => { isMoving = moving; };
        
        // Flip based on side
        if (side === 'R') {
          container.scale.x = -1;
        }
        
        return container;
      };

      // Renfort humain (ally) basé sur SpineBoy (mêmes assets que les mains)
      const createAllySpine = (side: 'L'|'R') => {
        try {
          const ally = Spine.from({ skeleton: 'spineboyData', atlas: 'spineboyAtlas', scale: 1 });
          // Échelle identique aux mains si dispo
          const baseScale = Math.abs((spinesRef.current.L as any)?.scale?.x ?? 0.18) || 0.18;
          ally.scale.set(baseScale, baseScale);
          if (side === 'R') ally.scale.x = -Math.abs(ally.scale.x);
          try { (ally as any).state?.setAnimation(0, 'idle', true); } catch {}
          return ally;
        } catch {
          // Fallback silhouette si Spine indisponible
          const cont = new Container();
          const body = new Graphics();
          body.roundRect(-10, -28, 20, 40, 4).fill({ color: 0x444444 });
          const head = new Graphics();
          head.circle(0, -34, 8).fill({ color: 0x666666 });
          cont.addChild(body, head);
          const shadow = new Graphics();
          shadow.ellipse(0, 0, 12, 4).fill({ color: 0x000000, alpha: 0.25 });
          cont.addChildAt(shadow, 0);
          if (side === 'R') { cont.scale.x = -1; }
          return cont;
        }
      };
      
      const attachWeaponToFighter = (fighter: any, weaponName: string) => {
        // Remove old weapon if exists
        const oldWeapon = weaponSpines.get(fighter);
        if (oldWeapon) {
          if ((oldWeapon as any).weaponTick) {
            app.ticker.remove((oldWeapon as any).weaponTick);
          }
          scene.removeChild(oldWeapon);
          weaponSpines.delete(fighter);
        }
        
        // Create and attach new animated weapon
        if (weaponName && weaponName !== 'none') {
          const weapon = createWeaponSpine(weaponName);
          weaponSpines.set(fighter, weapon);
          scene.addChild(weapon);
          
          // Start weapon animation
          if ((weapon as any).weaponTick) {
            addTick((weapon as any).weaponTick);
          }
          
          // Position update tick
          const updateWeaponPosition = () => {
            const pos = getPos(fighter.node);
            const side = fighter === left ? 'L' : 'R';
            weapon.position.set(
              pos.x + (side === 'L' ? 15 : -15), 
              pos.y - 25  // Raised from -10 to -25 for higher position
            );
            // @ts-ignore
            weapon.zIndex = pos.y + 0.1;
          };
          
          updateWeaponPosition();
          
          const positionTick = (tk: any) => {
            if (disposed || !weaponSpines.has(fighter)) {
              app.ticker.remove(positionTick);
              return;
            }
            updateWeaponPosition();
          };
          addTick(positionTick);
        }
      };

      const getPos = (o:any) => ({ x: (o?.position?.x ?? o?.x) as number, y: clampY((o?.position?.y ?? o?.y) as number) });
      const setPos = (o:any, x:number, y:number) => { if ('position' in o) { o.position.set(x,y); } else { o.x = x; o.y = y; } };

      // Duration from distance constants close to legacy v6 renderer
      // Ralenti les dÃ©placements d'attaque (aller) pour plus de lisibilitÃ©
      // Vitesse paramétrable via URL/localStorage
      let approachPps = (() => { const u=params.get('pixiApproachPps'); const ls=localStorage.getItem('compare.pixiApproachPps'); const n=Number(u ?? ls ?? '380'); return Number.isFinite(n)&&n>0?n:380; })();
      let returnPps   = (() => { const u=params.get('pixiReturnPps');   const ls=localStorage.getItem('compare.pixiReturnPps');   const n=Number(u ?? ls ?? '600'); return Number.isFinite(n)&&n>0?n:600; })();
      const durationMoveMs = (px:number) => Math.max(80, (px / (approachPps||380)) * 1000) * (approachScale||1);
      const durationMoveBackMs = (px:number) => Math.max(50, (px / (returnPps||600)) * 1000);
      // Ecart de mêlée symétrique (en px)
      const meleeGapPx = (() => {
        const u = params.get('pixiGap');
        const ls = localStorage.getItem('compare.pixiGap');
        const def = STRICT ? '0' : '8';
        const n = Number(u ?? ls ?? def);
        return Number.isFinite(n) && n >= 0 ? n : Number(def);
      })();

      // Limites Y corrigÃ©es d'aprÃ¨s l'analyse CSV
      const minY = 153, maxY = 259;
      const minLX = 40, maxLX = 125, minRX = W - maxLX, maxRX = W - minLX;
      const occY: Record<'L'|'R', number[]> = { L: [], R: [] };
      const chooseLaneY = (side:'L'|'R') => {
        const comfort = 15;
        const ys = [...occY[side]].filter((y)=> y >= minY && y <= maxY).sort((a,b)=>a-b);
        const positions = [minY, ...ys, maxY];
        let largestGap = 0; let largest:{start:number,end:number}|null=null;
        const comfortable: {start:number,end:number}[] = [];
        for (let i=1;i<positions.length;i++){
          const gap = positions[i]! - positions[i-1]!;
          const segment = { start: positions[i-1]!, end: positions[i]! };
          if (gap > comfort*2) comfortable.push(segment);
          if (gap > largestGap){ largestGap = gap; largest = segment; }
        }
        let pick: {start:number,end:number};
        if (comfortable.length > 0) {
          pick = comfortable[Math.floor(rand()*comfortable.length)]!;
        } else if (largest) {
          pick = largest;
        } else {
          pick = { start: minY, end: maxY };
        }
        const space = pick.end - pick.start - comfort*2;
        let y: number;
        if (space <= 0) y = (pick.start + pick.end)/2; else {
          y = pick.start + comfort + space*0.15 + rand()*(space*0.8);
        }
        if (y <= minY + comfort && pick.start === minY) y = minY + 1;
        if (y >= maxY - comfort && pick.end === maxY) y = maxY - 1;
        return clampY(y);
      };
      const getRandomBaseForSide = (side:'L'|'R', currX?: number, actor?: any) => {
        const y = chooseLaneY(side);
        const minX = side === 'L' ? minLX : minRX;
        const maxX = side === 'L' ? maxLX : maxRX;
        // Official-like X factor with weapon/skills influence
        let factor = 0.4 + rand() * 0.6;
        try {
          let wname: string | undefined;
          try { if (actor && typeof actor.index === 'number') wname = lastWeaponByActor.get(actor.index); } catch {}
          const wobj = weapons.find((w) => w.name === wname);
          if (wobj) {
            if (wobj.types?.includes(WeaponType.LONG)) factor -= 0.25;
            if (wobj.types?.includes(WeaponType.THROWN)) factor -= 0.5;
            if (wobj.types?.includes(WeaponType.HEAVY) && Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.bodybuilder)) factor += 0.15;
            if (wobj.types?.includes(WeaponType.SHARP) && Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.weaponsMaster)) factor += 0.15;
          } else if (Array.isArray(actor?.skills) && (actor.skills as number[]).includes(SkillId.martialArts)) {
            factor += 0.25;
          }
          const mods: Partial<Record<number, number>> = {
            [SkillId.hideaway]: -0.25,
            [SkillId.monk]: -0.25,
            [SkillId.untouchable]: -0.25,
            [SkillId.sixthSense]: -0.1,
            [SkillId.balletShoes]: -0.05,
            [SkillId.shield]: 0.05,
            [SkillId.toughenedSkin]: 0.05,
            [SkillId.leadSkeleton]: 0.1,
            [SkillId.armor]: 0.1,
            [SkillId.ironHead]: 0.15,
          };
          if (Array.isArray(actor?.skills)) {
            for (const sId of actor.skills as number[]) factor += (mods[sId] ?? 0);
          }
        } catch {}
        factor = Math.max(0, Math.min(1, factor));
        let x = minX + factor * (maxX - minX);
        // Enforce diagonal shift
        const minShift = Math.max(60, (maxX - minX) * 0.6);
        let tries = 0;
        while (typeof currX === 'number' && Math.abs(x - currX) < minShift && tries < 5) {
          factor = rand();
          x = minX + factor * (maxX - minX);
          tries++;
        }
        if (typeof currX === 'number' && Math.abs(x - currX) < minShift) {
          x = currX < (minX + maxX) / 2 ? maxX : minX;
        }
        return { x, y };
      };

      const getHitDistance = (srcObj:any, tgtObj:any, step:any, useCounter=false) => {
        // Same space
        if (step?.s === 1) return 20;
        // Mesure de largeur symétrique (prend en compte l'échelle et le flip)
        const getScaledWidth = (obj:any) => {
          try {
            if (obj === left && (spinesRef.current as any).LWidth) return Math.max(30, (spinesRef.current as any).LWidth);
            if (obj === right && (spinesRef.current as any).RWidth) return Math.max(30, (spinesRef.current as any).RWidth);
            const n = obj?.node as any;
            const bw = Math.abs(n?.bounds?.width ?? n?.width ?? obj?.width ?? 40);
            const sx = Math.max(0.001, Math.abs(n?.scale?.x ?? 1));
            return Math.max(30, bw * sx);
          } catch { return 40; }
        };
        const srcW = getScaledWidth(srcObj);
        const tgtW = getScaledWidth(tgtObj);
        let dist = (srcW * 0.5) + (tgtW * 0.5);
        // reach from known weapon
        let reach = 0;
        try {
          const actorIdx = (typeof step.f === 'number') ? step.f : undefined;
          const targetIdx = (typeof step.t === 'number') ? step.t : undefined;
          if (useCounter && targetIdx !== undefined) {
            const wname = lastWeaponByActor.get(targetIdx);
            reach = (weapons.find((ww)=> ww.name === wname)?.reach ?? 0);
          } else if (!useCounter && actorIdx !== undefined) {
            const wname = lastWeaponByActor.get(actorIdx);
            reach = (weapons.find((ww)=> ww.name === wname)?.reach ?? 0);
          }
        } catch {}
        dist += reach * 16;
        // Appliquer un écart constant pour éviter un gap asymétrique
        dist = Math.max(0, dist - meleeGapPx);
        return dist;
      };

      const tweenTo = (obj: any, x:number, y:number, duration?: number, extraProps?: any) => new Promise<void>((resolve) => {
        const actualDuration = duration ?? 200;
        if (disposed) { resolve(); return; }
        const { x: startX, y: startY } = getPos(obj);
        const dx = x - startX; const dy = y - startY;
        
        // Track starting values for extra properties
        const startProps: any = {};
        const deltaProps: any = {};
        if (extraProps) {
          for (const key in extraProps) {
            startProps[key] = obj[key] ?? 0;
            deltaProps[key] = extraProps[key] - startProps[key];
          }
        }
        
        let t = 0; const total = Math.max(1, actualDuration / Math.max(0.001, speed));
        const tick = (tk: any) => {
          if (disposed) { app.ticker.remove(tick); resolve(); return; }
          const deltaMS = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
          t += deltaMS;
          const p = Math.min(1, t / total);
          setPos(obj, startX + dx * p, startY + dy * p);
          
          // Apply extra property animations
          if (extraProps) {
            for (const key in extraProps) {
              obj[key] = startProps[key] + deltaProps[key] * p;
            }
          }
          
          // Depth by Y
          const pos = getPos(obj);
          // @ts-ignore
          if ('zIndex' in obj) (obj as any).zIndex = pos.y;
          barL.follow(); barR.follow();
          shadowL.follow(); shadowR.follow();
          if (p >= 1) { app.ticker.remove(tick); resolve(); }
        };
        addTick(tick);
      });

      // Jump (parabolic) to target (used for entry "bond")
      const jumpTo = (obj:any, tx:number, ty:number, duration=380, arc=26) => new Promise<void>((resolve)=>{
        if (disposed) { resolve(); return; }
        const start = getPos(obj);
        const startAlpha = typeof (obj as any).alpha === 'number' ? (obj as any).alpha : 1;
        let t=0; const total = Math.max(1, duration / Math.max(0.001, speed));
        const tick = (tk:any)=>{
          if (disposed) { try{app.ticker.remove(tick);}catch{} resolve(); return; }
          const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t+=dm; const p=Math.min(1, t/total);
          const x = start.x + (tx - start.x) * p;
          const y = start.y + (ty - start.y) * p - Math.sin(p*Math.PI) * arc;
          setPos(obj, x, y);
          try { if (startAlpha < 1) { (obj as any).alpha = Math.min(1, startAlpha + (1 - startAlpha) * p); } } catch {}
          // @ts-ignore
          if ('zIndex' in obj) (obj as any).zIndex = y;
          if (p>=1){ try{app.ticker.remove(tick);}catch{} resolve(); }
        };
        addTick(tick);
      });

      const repositionIfNeeded = async (f: any, baseX: number, side: 'L'|'R') => {
        const cur = getPos(f.node);
        const centerMargin = 25;
        if (side === 'L' && cur.x > (W/2 - centerMargin)) {
          const dist = Math.abs((W/2 - centerMargin) - cur.x);
          const dur = Math.max(120, dist * 2);
          await tweenTo(f.node, baseX, f.baseY, dur);
        }
        if (side === 'R' && cur.x < (W/2 + centerMargin)) {
          const dist = Math.abs((W/2 + centerMargin) - cur.x);
          const dur = Math.max(120, dist * 2);
          await tweenTo(f.node, baseX, f.baseY, dur);
        }
      };

      const delay = (ms:number) => new Promise<void>((res)=>{ const id = window.setTimeout(()=>{ timeouts.delete(id); res(); }, ms); timeouts.add(id); });

      const play = async () => {
        const t0 = performance.now();
        for (const s of steps) {
          if (disposed) return;
          const a = s.a as number;
          console.log('Step action:', a, 'Full step:', s);
          if (a === 31) console.log('FOUND VAMPIRISM STEP!', s);
          const actorIdx: number | null = (typeof s.f === 'number') ? s.f : (typeof s.b === 'number' ? s.b : null);
          const targetIdx: number | null = (typeof s.t === 'number') ? s.t : null;
          const actor = actorIdx !== null ? byIndex.get(actorIdx) : undefined;
          const target = targetIdx !== null ? byIndex.get(targetIdx) : undefined;
          const actorSide: 'L'|'R' = actor?.team === 'R' ? 'R' : 'L';
          const targetSide: 'L'|'R' | null = target ? (target.team === 'R' ? 'R' : 'L') : null;

          // Check if actor is a pet
          const actorPet = actorIdx !== null ? petSpines.get(actorIdx) : null;
          const targetPet = targetIdx !== null ? petSpines.get(targetIdx) : null;
          const actorAlly = actorIdx !== null ? allySpines.get(actorIdx) : null;
          const targetAlly = targetIdx !== null ? allySpines.get(targetIdx) : null;

          // If actor is a pet, use the pet as src; otherwise use main fighter
          const src = actorPet ? { node: actorPet, baseX: actorPet.x, baseY: actorPet.y, type: 'pet', width: 30 }
                    : actorAlly ? { node: actorAlly, baseX: actorAlly.x, baseY: actorAlly.y, type: 'ally', width: 40 }
                    : (actorSide === 'L' ? left : right);

          // If target is a pet, use the pet as tgt; otherwise use main fighter
          const tgt = targetPet ? { node: targetPet, baseX: targetPet.x, baseY: targetPet.y, type: 'pet', width: 30 }
                    : targetAlly ? { node: targetAlly, baseX: targetAlly.x, baseY: targetAlly.y, type: 'ally', width: 40 }
                    : (targetSide ? (targetSide === 'L' ? left : right) : (src === left ? right : left));

          // Track Equip to update known weapon (real data)
          try {
            if (typeof (StepType as any) !== 'undefined' && a === (StepType as any).Equip && actorIdx !== null && typeof (s as any).w !== 'undefined') {
              const newWeaponName = WeaponById[(s as any).w as WeaponId];
              const oldWeaponName = lastWeaponByActor.get(actorIdx);
              
              // If switching weapons, animate dropping the old one
              if (oldWeaponName && oldWeaponName !== newWeaponName) {
                const pos = getPos(src.node);
                const dropWeapon = new Graphics();
                dropWeapon.rect(-4, -8, 8, 16)
                  .fill({ color: 0x888888 })
                  .stroke({ width: 1, color: 0x666666 });
                dropWeapon.position.set(pos.x, pos.y - 30);
                scene.addChild(dropWeapon);
                
                // Animate old weapon being tossed aside
                const dropDir = Math.random() > 0.5 ? 1 : -1;
                let dropTime = 0;
                const dropTick = (delta: any) => {
                  dropTime += delta.deltaMS ?? 16.7;
                  const progress = Math.min(dropTime / 400, 1);
                  dropWeapon.x = pos.x + dropDir * progress * 40;
                  dropWeapon.y = pos.y - 30 + progress * 60 - Math.sin(progress * Math.PI) * 20;
                  dropWeapon.rotation = progress * Math.PI * 3;
                  dropWeapon.alpha = 1 - progress * 0.3;
                  
                  if (progress >= 1) {
                    app.ticker.remove(dropTick);
                    scene.removeChild(dropWeapon);
                    dropWeapon.destroy();
                  }
                };
                app.ticker.add(dropTick);
              }
              
              lastWeaponByActor.set(actorIdx, newWeaponName);
              // Attach weapon placeholder to fighter
              attachWeaponToFighter(src, newWeaponName);
              
              // HIDE weapon icon when weapon is drawn - LIKE OFFICIAL
              const weaponKey = `${actorIdx}:${newWeaponName}`;
              drawnWeapons.add(weaponKey);
              
              if (actor === leftMain) {
                barL.removeWeapon(newWeaponName); // Remove this specific weapon icon when drawn
              } else if (actor === rightMain) {
                barR.removeWeapon(newWeaponName); // Remove this specific weapon icon when drawn
              }
            }
          } catch {}

          if (onStep) { try { onStep(steps.indexOf(s), s, performance.now() - t0); } catch {} }
          const stepT0 = performance.now();

          // Debug: log healing-related actions
          if (a === 6 || a === 34 || a === 13 || (s.d && (a === 9 || a === 10 || a === 11 || a === 12))) {
            console.log(`Action ${a}, damage/heal: ${s.d || s.h || s.v}, target: ${targetIdx}, actor: ${actorIdx}, step:`, s);
          }

          // Track HP changes for debugging
          const prevHpL = hpL;
          const prevHpR = hpR;

          if (eventTraceOn) {
            try { eventTrace.push({ t: performance.now()/1000 - traceT0, i: steps.indexOf(s), a, f: actorIdx, tId: targetIdx }); } catch {}
          }

          switch (a) {
          // SkillExpire: clear relevant HUD statuses
          case StepType.SkillExpire: {
            try {
              const skillId: number | undefined = (s as any)?.s;
              const actor = (typeof (s as any).b === 'number') ? (s as any).b : (typeof (s as any).f === 'number' ? (s as any).f : null);
              const clear = (kind: 'vampirism'|'dropshield'|'haste'|'hypnosis') => {
                if (actor === leftMainIdx) { (hudL as any)?.clearStatusFlag?.(kind); }
                if (actor === rightMainIdx) { (hudR as any)?.clearStatusFlag?.(kind); }
              };
              if (typeof skillId === 'number') {
                if (skillId === (SkillId as any).haste) clear('haste');
                if (skillId === (SkillId as any).hypnosis) clear('hypnosis');
                // Optional: clear vampirism if modeled as status
                if (skillId === (SkillId as any).vampirism) clear('vampirism');
                // Clear aura/freeze visuals
                if (skillId === (SkillId as any).haste) {
                  if (actor === leftMainIdx) { (hudL as any)?.setHasteAura?.(false); }
                  if (actor === rightMainIdx) { (hudR as any)?.setHasteAura?.(false); }
                }
                if (skillId === (SkillId as any).hypnosis) {
                  if (actor === leftMainIdx) { (hudL as any)?.setHypnosisFreeze?.(false); }
                  if (actor === rightMainIdx) { (hudR as any)?.setHypnosisFreeze?.(false); }
                }
                // TODO: ajouter cleanups spécifiques (fierceBrute ghosts) si utilisés
              }
              // Attach shield overlay for main fighters if they have one
              try { if (actor?.shield && actorIdx !== null) attachShield(actorIdx, src.node, actorSide); } catch {}
            } catch {}
            break; }

          // SkillActivate: déclenche FX pour certains supers
          case 28: {
            try {
              const skillId: number | undefined = (s as any)?.s;
              const pos = getPos(src.node);
              if (skillId === (SkillId as any).cryOfTheDamned) {
                floatText(pos.x, pos.y - 30, 'CRY!', 0xFFD700);
                // Trois ondes simples
                for (let i = 0; i < 3; i++) {
                  const ring = new Graphics();
                  ring.circle(0, 0, 6 + i * 4).stroke({ width: 2, color: 0xFFD700, alpha: 0.8 });
                  ring.position.set(pos.x, pos.y - 30);
                  scene.addChild(ring);
                  let t = 0; const tick = (tk:any) => {
                    const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
                    ring.scale.set(1 + t/200); ring.alpha = Math.max(0, 0.8 * (1 - t/300));
                    if (t >= 300) { app.ticker.remove(tick); try { scene.removeChild(ring); ring.destroy(); } catch {} }
                  }; addTick(tick);
                }
              } else if (skillId === (SkillId as any).fierceBrute) {
                floatText(pos.x, pos.y - 30, 'FIERCE!', 0xFF4500);
                // Fantômes simples derrière le main pendant un court laps
                const ghosts: Graphics[] = [];
                const makeGhost = () => {
                  const g = new Graphics(); g.rect(-6, -18, 12, 24).fill({ color: 0xFF4500, alpha: 0.15 });
                  g.position.set(getPos(src.node).x - (src===right?20: -20), getPos(src.node).y);
                  scene.addChild(g); ghosts.push(g);
                };
                for (let i=0;i<4;i++) setTimeout(makeGhost, i*80);
                let t=0; const tick=(tk:any)=>{
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t+=dm;
                  ghosts.forEach((g)=>{ try { g.alpha = Math.max(0, g.alpha - dm/600); } catch {} });
                  if (t>=700) { app.ticker.remove(tick); ghosts.forEach(g=>{ try { scene.removeChild(g); g.destroy(); } catch {} }); }
                }; addTick(tick);
              } else if (skillId === (SkillId as any).flashFlood) {
                // Déclencher l’effet flashFlood minimal (vague + shake)
                const wave = new Graphics();
                wave.rect(0, 0, W, 16).fill({ color: 0x1E90FF, alpha: 0.65 });
                wave.position.set(0, pos.y - 40); scene.addChild(wave);
                let t=0; const tick=(tk:any)=>{ const dm=typeof tk?.deltaMS==='number'?tk.deltaMS:16.7; t+=dm; wave.alpha=Math.max(0,0.65*(1-t/500)); if(t>=500){app.ticker.remove(tick); try{scene.removeChild(wave); wave.destroy();}catch{}}}; addTick(tick);
                await shake(4, 150);
              }
            } catch {}
            break; }
          
          // Leave: actor exits the arena (pets or fighters)
          case StepType.Leave: {
            try {
              // Sélectionner strictement l'acteur: pet, ally, ou main si l'index correspond
              let obj: any | null = null;
              let kind: 'pet'|'ally'|'main'|null = null;
              if (actorIdx !== null && petSpines.has(actorIdx)) { obj = petSpines.get(actorIdx); kind = 'pet'; }
              else if (actorIdx !== null && allySpines.has(actorIdx)) { obj = allySpines.get(actorIdx); kind = 'ally'; }
              else if (actorIdx === leftMainIdx) { obj = left.node; kind = 'main'; }
              else if (actorIdx === rightMainIdx) { obj = right.node; kind = 'main'; }
              else { break; } // ne rien faire si l'index ne correspond à aucune entité

              const start = getPos(obj);
              // Head off-screen horizontally depending on side
              const tx = (actorSide === 'L') ? -60 : (W + 60);
              const ty = start.y;
              // Play movement animation
              try { if (kind !== 'main') playAnim({ node: obj }, 'walk', true); } catch {}
              // Duration proportional to distance, aligned with move speed
              const dist = Math.abs(tx - start.x);
              const dur = (durationMoveMs(dist) * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
              await tweenTo(obj, tx, ty, dur);

              // Cleanup: retirer pet/ally; pour main on évite de le cacher si ce n'est pas attendu
              if (kind === 'pet' && actorIdx !== null) {
                const pet = petSpines.get(actorIdx);
                try { if ((pet as any).petTick) { app.ticker.remove((pet as any).petTick); } } catch {}
                try { scene.removeChild(pet); } catch {}
                try { (pet as any).destroy?.(); } catch {}
                petSpines.delete(actorIdx);
                try {
                  const hud = petHudByIndex.get(actorIdx);
                  if (hud) { ui.removeChild(hud.cont); petHudByIndex.delete(actorIdx); }
                } catch {}
              } else if (kind === 'ally' && actorIdx !== null) {
                const ally = allySpines.get(actorIdx);
                try { scene.removeChild(ally); } catch {}
                try { (ally as any).destroy?.(); } catch {}
                allySpines.delete(actorIdx);
              } else if (kind === 'main') {
                // Pour un main, ne pas le masquer par défaut: l'officiel conserve le main à l'écran
                // (laisser au StepType suivant la responsabilité de cacher si nécessaire)
              }
            } catch {}
            break; }

          // Arrive: pick lane using largest-gap strategy (official-like)
          case StepType.Arrive: {
            try {
              // Check if this is a pet arrival
              if (actor?.type === 'pet' && actor?.master && actorIdx !== null) {
                // Pet arrival - create and animate the pet
                const petType = actor.name || 'dog1';
                const pet = createPetSpine(petType, actorSide);
                petSpines.set(actorIdx, pet);
                scene.addChild(pet);

                // Get master position for pet landing
                const masterIdx = actor.master;
                const masterSide = masterIdx === leftMainIdx ? 'L' : 'R';
                const masterObj = masterSide === 'L' ? left : right;
                const masterPos = getPos(masterObj.node);

                // Pet arrives near master
                const petTargetX = masterPos.x + (actorSide === 'L' ? -30 : 30);
                const petTargetY = masterPos.y + 10;

                // Start pet off-screen and jump in
                if (actorSide === 'L') {
                  pet.position.set(-60, petTargetY + 12);
                } else {
                  pet.position.set(W + 60, petTargetY + 12);
                }
                pet.alpha = 0;

                // Animate pet arrival
                await jumpTo(pet, petTargetX, petTargetY, arriveMs, arriveArc * 0.7);
                if (arriveBounce) {
                  await tweenTo(pet, petTargetX, petTargetY + 3, Math.max(50, arriveMs*0.15));
                  await tweenTo(pet, petTargetX, petTargetY, Math.max(60, arriveMs*0.20));
                }

                // Start pet animation
                if ((pet as any).petTick) {
                  addTick((pet as any).petTick);
                }
              } else if (
                actor && actorIdx !== null && actor.type !== 'pet'
                // Considérer comme ALLY si différent des mains (par index) OU par id (backup a souvent un id négatif/différent)
                && (
                  (actorIdx !== leftMainIdx && actorIdx !== rightMainIdx)
                  || (typeof actor.id === 'number' && (actor.id < 0 || (actor.id !== (leftMain?.id ?? actor.id) && actor.id !== (rightMain?.id ?? actor.id))))
                )
              ) {
                // ALLY arrival (Backup): créer une silhouette humaine indépendante
                const ally = createAllySpine(actorSide);
                allySpines.set(actorIdx, ally);
                scene.addChild(ally);

                // Position proche du main de l'équipe, entrée depuis le bord
                const mate = actorSide === 'L' ? left : right;
                const matePos = getPos(mate.node);
                const targetX = matePos.x + (actorSide === 'L' ? -30 : 30);
                const targetY = matePos.y + 6;
                if (actorSide === 'L') ally.position.set(-60, targetY + 12); else ally.position.set(W + 60, targetY + 12);
                ally.alpha = 0;
                await jumpTo(ally, targetX, targetY, arriveMs, arriveArc*0.7);
                if (arriveBounce) {
                  await tweenTo(ally, targetX, targetY + Math.max(3, arriveArc*0.15), Math.max(60, arriveMs*0.18));
                  await tweenTo(ally, targetX, targetY, Math.max(60, arriveMs*0.20));
                }
                // Assurer le bon z-index (devant selon y)
                try { (ally as any).zIndex = targetY; } catch {}
                // Petit fondu d'entrée si besoin
                try {
                  let a = 0; const total = Math.max(1, 180 / Math.max(0.001, speed)); let t = 0;
                  const fade = (tk:any) => {
                    const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm; a = Math.min(1, t/total);
                    try { ally.alpha = a; } catch {}
                    if (a >= 1) { app.ticker.remove(fade); }
                  };
                  addTick(fade);
                } catch {}
              } else {
                // Main fighter arrival
                if (actorSide === 'L') {
                  const x = minLX + rand() * (maxLX - minLX);
                  const y = chooseLaneY('L'); occY.L.push(y);
                  // Start off-screen and jump in
                  setPos(src.node, -60, y + 12); src.baseX = x; src.baseY = y;
                  try { src.node.visible = true; } catch {}
                  try { (shadowL as any).visible = true; } catch {}
                  try { (src.node as any).alpha = 0; } catch {}
                  await jumpTo(src.node, x, y, arriveMs, arriveArc);
                  if (arriveBounce) {
                    await tweenTo(src.node, x, y + Math.max(4, arriveArc*0.18), Math.max(60, arriveMs*0.18));
                    await tweenTo(src.node, x, y, Math.max(80, arriveMs*0.22));
                  }
                } else {
                  const x = minRX + rand() * (maxRX - minRX);
                  const y = chooseLaneY('R'); occY.R.push(y);
                  setPos(src.node, W + 60, y + 12); src.baseX = x; src.baseY = y;
                  try { src.node.visible = true; } catch {}
                  try { (shadowR as any).visible = true; } catch {}
                  try { (src.node as any).alpha = 0; } catch {}
                  await jumpTo(src.node, x, y, arriveMs, arriveArc);
                  if (arriveBounce) {
                    await tweenTo(src.node, x, y + Math.max(4, arriveArc*0.18), Math.max(60, arriveMs*0.18));
                    await tweenTo(src.node, x, y, Math.max(80, arriveMs*0.22));
                  }
                }
              }
            } catch {}
            break; }
          // Move
          case StepType.Move: {
            // Set pet moving state if it's a pet
            const petSpine = petSpines.get(actorIdx ?? -1);
            if (petSpine && (petSpine as any).setMoving) {
              (petSpine as any).setMoving(true);
            }
            
            // Autoriser uniquement les dÃ©placements de mÃªlÃ©e explicites (r=1)
            // (r filter disabled to allow all Move steps)
            playAnim(src, 'walk', true);
            const tpos = getPos(tgt.node);
            const countered = s?.c === 1;
            const meleeDist = getHitDistance(src, tgt, s, countered);
            const targetX = (targetSide === 'R') ? (tpos.x - meleeDist) : (tpos.x + meleeDist);
            const start = getPos(src.node);
            let ty = clampY(tpos.y); // follow official by default
            // Éviter les diagonales pures: si deltaX est trop petit, on ajuste seulement en X (on conserve Y)
            const minDiagX = (Number(new URLSearchParams(window.location.search).get('pixiMinDiagX')) || Number(localStorage.getItem('compare.pixiMinDiagX')) || 60);
            if (Math.abs(targetX - start.x) < minDiagX) {
              ty = start.y; // micro-ajustement horizontal uniquement pour garantir un gap cohérent
            }
            const dist = Math.hypot(targetX - start.x, ty - start.y);
            addVector(start.x, start.y, targetX, ty, 0x00cc66);
            const dur = (durationMoveMs(dist) * approachScale * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            
            // JUST MOVE - no weapon animation here
            await tweenTo(src.node, targetX, ty, dur);
            
            // Stop pet movement
            if (petSpine && (petSpine as any).setMoving) {
              (petSpine as any).setMoving(false);
            }
            
            playAnim(src, 'idle', true);
            break; }
          // AttemptHit
          case StepType.AttemptHit: {
            if (traceEnabled && !traceOnRef.current) { traceOnRef.current = true; traceT0Ref.current = performance.now()/1000; }
            try {
              const tpos = getPos(tgt.node);
              const distX = getHitDistance(src, tgt, s, false);
              const idealX = (targetSide === 'R') ? (tpos.x - distX) : (tpos.x + distX);
              const cur = getPos(src.node);
              if ((src === left && idealX > cur.x) || (src === right && idealX < cur.x)) {
                const minDiag = (Number(new URLSearchParams(window.location.search).get('pixiMinDiagX'))
                  || Number(localStorage.getItem('compare.pixiMinDiagX')) || 60);
                if (Math.abs(idealX - cur.x) >= minDiag) {
                  // PrÃ©-move diagonal (X et Y ensemble)
                  const ty2 = cur.y;
                  addVector(cur.x, cur.y, idealX, ty2, 0xff66cc);
                  const dx = Math.abs(idealX - cur.x);
                  const durPre = Math.max(90, (dx / approachPps) * 1000) * approachScale / Math.max(0.001, speed);
                  await tweenTo(src.node, idealX, ty2, durPre);
                }
                // Fallback: réaligner en Y si pas de Move juste avant et gros écart Y
                const curIdx = steps.indexOf(s);
                const prev = steps[curIdx - 1];
                const prevIsMoveSameActor = prev && typeof prev.f === 'number' && prev.f === actorIdx && prev.a === StepType.Move;
                const tyTarget = getPos(tgt.node).y;
                if (!prevIsMoveSameActor && Math.abs(tyTarget - cur.y) > 6) {
                  const dist2 = Math.abs(tyTarget - cur.y);
                  const durPre2 = Math.max(60, (dist2 / approachPps) * 1000) * approachScale / Math.max(0.001, speed);
                  await tweenTo(src.node, idealX, tyTarget, durPre2);
                }
              }
            } catch {}
            // Ne pas simuler un coup avant le Hit réel
            playAnim(src, 'idle', true);
            break; }
          // Hit / variants - EXACT LIKE OFFICIAL LABRUTE
          case StepType.Hit: case StepType.FlashFlood: case StepType.Hammer: case StepType.Poison: {
            const dmg = s.d ?? s.damage ?? 0;
            const isCritical = (s?.c === 1); // Rouge uniquement si critique (logique officielle)
            const isFlash = false; // réservé à d'autres cas, non utilisé pour la couleur
            const isVersatile = false;
            // Do NOT auto-break net on Hit; released only by dedicated steps

            // WEAPON ANIMATION AND DAMAGE IN PARALLEL
            // Start animation immediately and apply damage at the right moment
            
            // Create attack swoosh effect
            const createSwoosh = () => {
              const swoosh = new Graphics();
              const srcPos = src?.node?.position || src?.position || { x: 100, y: 200 };
              const tgtPos = tgt?.node?.position || tgt?.position || { x: 400, y: 200 };

              // Calculate swoosh arc based on attack direction
              const isLeftAttacking = srcPos.x < tgtPos.x;
              const startX = srcPos.x + (isLeftAttacking ? 20 : -20);
              const startY = srcPos.y - 40;

              // Draw curved swoosh line
              swoosh.moveTo(0, 0);
              swoosh.bezierCurveTo(
                30 * (isLeftAttacking ? 1 : -1), -20,
                60 * (isLeftAttacking ? 1 : -1), -10,
                80 * (isLeftAttacking ? 1 : -1), 10
              );
              // Teinte jaune douce pour éviter les flashs blancs
              swoosh.stroke({ width: 3, color: 0xFFD200, alpha: 0.55 });

              swoosh.position.set(startX, startY);
              swoosh.zIndex = 100;
              scene.addChild(swoosh);

              // Fade out swoosh
              let alpha = 0.7;
              const fadeSwoosh = () => {
                alpha -= 0.05;
                swoosh.alpha = alpha;
                if (alpha <= 0) {
                  scene.removeChild(swoosh);
                  swoosh.destroy();
                } else {
                  requestAnimationFrame(fadeSwoosh);
                }
              };
              requestAnimationFrame(fadeSwoosh);
            };

            // Create swoosh effect
            createSwoosh();

            // Start weapon animation if weapon equipped
            let weaponAnimPromise: Promise<void> | null = null;
            if (typeof s.w !== 'undefined') {
              const weapon = weaponSpines.get(src);
              if (weapon) {
                const originalRotation = weapon.rotation;
                const originalY = weapon.y;
                const swingDirection = (src === left ? 1 : -1);
                
                weaponAnimPromise = (async () => {
                  // ULTRA quick raise - 20ms
                  await tweenTo(weapon, weapon.x, originalY - 40, 20, {
                    rotation: originalRotation - swingDirection * Math.PI / 4
                  });
                  
                  // Lightning fast swing - 30ms
                  await tweenTo(weapon, weapon.x, originalY + 20, 30, {
                    rotation: originalRotation + swingDirection * Math.PI / 3
                  });
                  
                  // Quick return - 50ms
                  await tweenTo(weapon, weapon.x, originalY, 50, {
                    rotation: originalRotation
                  });
                })();
              }
            }
            
            // Create blood particles effect
            const createBloodParticles = (x: number, y: number, count: number = 8) => {
              const particles: Graphics[] = [];
              for (let i = 0; i < count; i++) {
                const particle = new Graphics();
                particle.circle(0, 0, 2 + Math.random() * 2)
                  .fill({ color: 0xCC0000, alpha: 0.9 });
                particle.position.set(x, y);
                scene.addChild(particle);
                particles.push(particle);

                // Animate particle
                const vx = (Math.random() - 0.5) * 8;
                const vy = -Math.random() * 6 - 2;
                let gravity = 0.5;
                let alpha = 0.9;

                const animateParticle = () => {
                  particle.x += vx;
                  particle.y += vy + gravity;
                  gravity += 0.3;
                  alpha -= 0.03;
                  particle.alpha = alpha;

                  if (alpha <= 0) {
                    scene.removeChild(particle);
                    particle.destroy();
                  } else {
                    requestAnimationFrame(animateParticle);
                  }
                };
                requestAnimationFrame(animateParticle);
              }
            };

            // Create floating damage number
            const createDamageNumber = (x: number, y: number, damage: number, isCritical: boolean = false) => {
              const damageText = new Text(`-${damage}`, {
                fontSize: isCritical ? 28 : 22,
                fontWeight: 'bold',
                fill: isCritical ? '#FF0000' : '#FFFFFF',  // Red for critical, white for normal
                stroke: '#000000',
                strokeThickness: 3,
                dropShadow: true,
                dropShadowDistance: 2,
                dropShadowBlur: 2,
                dropShadowColor: '#000000',
              } as any);

              damageText.anchor.set(0.5, 0.5);
              damageText.position.set(x, y);
              damageText.zIndex = 1000;
              scene.addChild(damageText);

              // Animate floating up and fading
              let vy = -3;
              let alpha = 1;
              const animateNumber = () => {
                damageText.y += vy;
                vy *= 0.95; // Slow down
                alpha -= 0.02;
                damageText.alpha = alpha;

                if (alpha <= 0) {
                  scene.removeChild(damageText);
                  damageText.destroy();
                } else {
                  requestAnimationFrame(animateNumber);
                }
              };
              requestAnimationFrame(animateNumber);
            };

            // Retirer le flash plein écran sur critique (non présent dans l'officiel)
            const createCriticalFlash = () => {};

            // Apply damage IMMEDIATELY (animation happens in parallel)
            // If there's damage, someone's HP must decrease
            if (dmg > 0) {
              // Add blood particles at target position
              const targetPos = tgt?.node?.position || tgt?.position || { x: 300, y: 200 };
              createBloodParticles(targetPos.x, targetPos.y - 30);

              // Add floating damage number
              createDamageNumber(targetPos.x, targetPos.y - 50, dmg, isCritical);

              // Ne pas faire de flash plein écran; le critique est signalé par le texte rouge + secousse
              // Always update HP bars based on the actual target
              // Check if target is main fighter by ID
              if (target?.id === fight.brute1Id) {
                hpL = Math.max(0, hpL - dmg);
                // Immediate update
                barL.set(hpL / maxL);
                // Also schedule update after a small delay to ensure it sticks
                setTimeout(() => barL.set(hpL / maxL), 50);
                try { (hudL as any)?.hitShake?.(); } catch {}
              } else if (target?.id === fight.brute2Id) {
                hpR = Math.max(0, hpR - dmg);
                // Immediate update
                barR.set(hpR / maxR);
                // Also schedule update after a small delay to ensure it sticks
                setTimeout(() => barR.set(hpR / maxR), 50);
                try { (hudR as any)?.hitShake?.(); } catch {}
              }
              // Fallback: check by index
              else if (targetIdx === leftMainIdx) {
                hpL = Math.max(0, hpL - dmg);
                barL.set(hpL / maxL);
                setTimeout(() => barL.set(hpL / maxL), 50);
                try { (hudL as any)?.hitShake?.(); } catch {}
              } else if (targetIdx === rightMainIdx) {
                hpR = Math.max(0, hpR - dmg);
                barR.set(hpR / maxR);
                setTimeout(() => barR.set(hpR / maxR), 50);
                try { (hudR as any)?.hitShake?.(); } catch {}
              }
              // If it's a pet, also track its HP separately (but pets don't have HUD bars)
              const isPetTarget = (targetIdx !== null) && petSpines.has(targetIdx);
              if (isPetTarget && targetIdx !== null) {
                const hp = hpByIndex.get(targetIdx) || { cur: (target?.hp ?? 1), max: (target?.maxHp ?? 1) };
                hp.cur = Math.max(0, (hp.cur ?? 0) - dmg);
                hpByIndex.set(targetIdx, hp);
              }
            }
            
            // Update pet HP if target is pet
            const petSpine = petSpines.get(targetIdx ?? -1);
            if (petSpine && targetIdx !== null) {
              const hp = hpByIndex.get(targetIdx) || { cur: (target?.hp ?? 0), max: (target?.maxHp ?? 100) };
              const petHpRatio = Math.max(0, (hp.cur ?? 0) / Math.max(1, hp.max ?? 100));
              if (petHpRatio <= 0) {
                // Pet death animation - stop animation and fade
                petSpine.alpha = 0.3;
                if ((petSpine as any).petTick) {
                  app.ticker.remove((petSpine as any).petTick);
                }
                // Death pose - lay down
                petSpine.rotation = Math.PI / 2;
                petSpine.y += 10;
              }
            }
            
            // feedback with special effects
            const tpos = getPos(tgt.node);
            if (isCritical) {
              floatText(tpos.x, tpos.y - 20, 'CRITICAL!', 0xFFD700);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFF0000); // rouge pour critique (comme officiel)
              await shake(4, 150);
            } else if (isFlash) {
              floatText(tpos.x, tpos.y - 20, 'FLASH!', 0x00FFFF);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFFFFFF); // blanc pour non-critique
              await shake(3, 120);
            } else if (isVersatile) {
              floatText(tpos.x, tpos.y - 20, 'VERSATILE!', 0xFF69B4);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFFFFFF); // blanc pour non-critique
              await shake(2, 100);
            } else {
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFFFFFF); // blanc pour non-critique
              await shake(2, 100);
            }
            
            // Knockback effect on target
            if (dmg > 10) {
              const cur = getPos(tgt.node);
              const knockX = tgt === left ? cur.x - 8 : cur.x + 8;
              await tweenTo(tgt.node, knockX, cur.y, 60);
              await tweenTo(tgt.node, cur.x, cur.y, 60);
            }
            
            // Wait for weapon animation to complete
            if (weaponAnimPromise) {
              await weaponAnimPromise;
            }
            
            // Pas de retour base ici (Ã©vite micro-dÃ©placements). Le retour se fait au Step MoveBack.
            playAnim(src, 'idle', true);
            // Track last weapon used if provided
            try {
              if (typeof s.w !== 'undefined' && actorIdx !== null) {
                const wname = WeaponById[s.w as WeaponId];
                lastWeaponByActor.set(actorIdx, wname);
                // Update weapon visual
                attachWeaponToFighter(src, wname);
                
                // NO ANIMATION HERE - already done in Move phase with proper timing
                
                // DO NOT show weapon icon - weapon stays drawn after attack - LIKE OFFICIAL
                // The weapon remains in hand, so icon stays hidden
              }
            } catch {}
            break; }
          // Heal (potion, drink, etc.)
          case StepType.Heal: {
            const healAmount = Math.max(0, Number(s.h ?? s.v ?? s.d ?? 0));
            const healerPos = getPos(src.node);

            // Show heal text
            floatText(healerPos.x, healerPos.y - 30, `+${healAmount}`, 0x00ff75);

            const particles: Graphics[] = [];
            for (let i = 0; i < 14; i++) {
              const particle = new Graphics();
              particle.circle(0, 0, 3).fill({ color: 0x3ad66f, alpha: 0.85 });
              particle.position.set(
                healerPos.x + (rand() - 0.5) * 28,
                healerPos.y + (rand() * 12) + 10,
              );
              scene.addChild(particle);
              particles.push(particle);
            }

            const particleTicker = (tk: any) => {
              const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
              let alive = false;
              for (const particle of particles) {
                if (particle.destroyed) { continue; }
                particle.y -= 0.06 * dm;
                particle.alpha -= 0.0025 * dm;
                if (particle.alpha <= 0) {
                  scene.removeChild(particle);
                  particle.destroy();
                } else {
                  alive = true;
                }
              }
              if (!alive) {
                try { app.ticker.remove(particleTicker); } catch {}
              }
            };
            addTick(particleTicker);

            if (typeof actorIdx === 'number') {
              const hpEntry = hpByIndex.get(actorIdx) || { cur: 0, max: 1 };
              hpEntry.cur = Math.min(hpEntry.max, hpEntry.cur + healAmount);
              hpByIndex.set(actorIdx, hpEntry);
              const petHud = petHudByIndex.get(actorIdx);
              if (petHud) { petHud.set(hpEntry.cur / Math.max(1, hpEntry.max)); }
            }

            if (actorSide === 'L') {
              hpL = Math.min(maxL, hpL + healAmount);
              barL.set(hpL / maxL);
            } else if (actorSide === 'R') {
              hpR = Math.min(maxR, hpR + healAmount);
              barR.set(hpR / maxR);
            }
            break; }

          // Trash (drop current weapon without throwing at target)
          case StepType.Trash: {
            try {
              if (actorIdx == null) break;
              // Resolve current weapon name from step or last known
              const weaponId: number | undefined = (s as any).w;
              const weaponName = (typeof weaponId === 'number') ? (WeaponById as any)[weaponId] : (lastWeaponByActor.get(actorIdx) || 'knife');

              // Remove from HUD (like official)
              if (actor === leftMain) { barL.removeWeapon(weaponName); }
              else if (actor === rightMain) { barR.removeWeapon(weaponName); }

              // Detach any weapon visual bound to fighter
              const curWeapon = weaponSpines.get(src);
              if (curWeapon) {
                try { if ((curWeapon as any).weaponTick) app.ticker.remove((curWeapon as any).weaponTick); } catch {}
                try { scene.removeChild(curWeapon); } catch {}
                weaponSpines.delete(src);
              }

              // Clear tracking
              lastWeaponByActor.delete(actorIdx);

              // Visual drop
              const pos = getPos(src.node);
              const dropped = new Graphics();
              // Simple blade-like shape
              dropped.rect(-4, -10, 8, 20).fill({ color: 0x8A8A8A }).stroke({ width: 1, color: 0x666666 });
              dropped.position.set(pos.x, pos.y - 30);
              dropped.zIndex = pos.y - 1;
              scene.addChild(dropped);

              // Decide trajectory by an inferred "weight" (from damage proxy)
              let weight = 20;
              try {
                const w = (weapons as any[]).find((it) => it?.name === weaponName);
                if (w && typeof w.damage === 'number') weight = Math.max(1, Math.min(60, w.damage));
              } catch {}
              const throwBackward = Math.random() > Math.max(0.12, Math.min(0.88, weight / 40));

              if (throwBackward) {
                // Arc behind the actor, slight spin and fade
                const dx = (actorSide === 'L') ? -70 : 70;
                const targetX = pos.x + dx;
                const targetY = pos.y + 15;
                let t = 0;
                const total = 360 / Math.max(0.001, speed);
                const tick = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm; const p = Math.min(1, t/total);
                  const x = pos.x + (targetX - pos.x) * p;
                  const y = (pos.y - 30) + (targetY - (pos.y - 30)) * p - Math.sin(p*Math.PI) * 20;
                  dropped.position.set(x, y);
                  try { dropped.rotation = p * Math.PI * 3 * (actorSide === 'L' ? -1 : 1); } catch {}
                  dropped.alpha = 1 - p * 0.2;
                  // Depth
                  (dropped as any).zIndex = y;
                  if (p >= 1) {
                    try { app.ticker.remove(tick); } catch {}
                    // small delay then fade out
                    setTimeout(() => {
                      let a = 1;
                      const fade = (tk2:any) => {
                        const dm2 = typeof tk2?.deltaMS === 'number' ? tk2.deltaMS : 16.7;
                        a -= dm2 / (260 / Math.max(0.001, speed));
                        dropped.alpha = Math.max(0, a);
                        if (a <= 0) {
                          try { app.ticker.remove(fade); } catch {}
                          try { scene.removeChild(dropped); } catch {}
                          try { dropped.destroy(); } catch {}
                        }
                      };
                      app.ticker.add(fade);
                    }, 140 / Math.max(0.001, speed));
                  }
                };
                app.ticker.add(tick);
              } else {
                // Short ground bounce in front
                const dx = (actorSide === 'L') ? 24 : -24;
                const gx = pos.x + dx;
                const gy = pos.y + 22;
                let t = 0;
                const total = 240 / Math.max(0.001, speed);
                const tick = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm; const p = Math.min(1, t/total);
                  const x = pos.x + (gx - pos.x) * p;
                  const y = (pos.y - 30) + (gy - (pos.y - 30)) * p - Math.sin(p*Math.PI) * 10;
                  dropped.position.set(x, y);
                  try { dropped.rotation = p * Math.PI * 1.5 * (actorSide === 'L' ? 1 : -1); } catch {}
                  (dropped as any).zIndex = y;
                  if (p >= 1) {
                    try { app.ticker.remove(tick); } catch {}
                    // Fade out on ground
                    let a = 1;
                    const fade = (tk2:any) => {
                      const dm2 = typeof tk2?.deltaMS === 'number' ? tk2.deltaMS : 16.7;
                      a -= dm2 / (360 / Math.max(0.001, speed));
                      dropped.alpha = Math.max(0, a);
                      if (a <= 0) {
                        try { app.ticker.remove(fade); } catch {}
                        try { scene.removeChild(dropped); } catch {}
                        try { dropped.destroy(); } catch {}
                      }
                    };
                    app.ticker.add(fade);
                  }
                };
                app.ticker.add(tick);
              }

              // Return to idle
              playAnim(src, 'idle', true);
            } catch {}
            break; }

          // Block
          case StepType.Block: {
            const tpos = getPos(tgt.node); 
            floatText(tpos.x, tpos.y, 'BLOCK', 0x4169E1);
            // Small knockback effect
            const cur = getPos(tgt.node);
            const knockX = tgt === left ? cur.x - 5 : cur.x + 5;
            await tweenTo(tgt.node, knockX, cur.y, 50);
            await tweenTo(tgt.node, cur.x, cur.y, 50);
            // Repulse visual (if target has the Repulse passive)
            try {
              if (Array.isArray((target as any)?.skills) && ((target as any).skills as number[]).includes(SkillId.repulse)) {
                const ring = new Graphics();
                ring.circle(0, 0, 10).stroke({ width: 2, color: 0x1E90FF, alpha: 0.8 });
                ring.position.set(tpos.x, tpos.y - 26);
                ring.zIndex = 1000;
                scene.addChild(ring);
                let t = 0; const life = Math.max(1, 260 / Math.max(0.001, speed));
                const tick = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
                  const p = Math.min(1, t / life);
                  try { ring.scale.set(1 + p * 1.2); ring.alpha = Math.max(0, 0.8 * (1 - p)); } catch {}
                  if (p >= 1) { app.ticker.remove(tick); try { scene.removeChild(ring); ring.destroy(); } catch {} }
                };
                addTick(tick);
              }
            } catch {}
            break; }
          // Evade/Dodge
          case StepType.Evade: {
            const tpos = getPos(tgt.node); 
            floatText(tpos.x, tpos.y, 'MISS', 0xFFD700);
            
            // Attacker swings and misses
            const attackerPos = getPos(src.node);
            const attackerForward = (actorSide === 'L') ? 30 : -30;
            
            // Jump dodge animation - like official LaBrute
            const cur = getPos(tgt.node);
            const dodgeBack = (targetSide === 'L') ? -25 : 25;
            const jumpHeight = 0; // pas de saut vertical hors aller/retour
            
            // Both animations happen simultaneously
            const [dodgePromise, attackPromise] = [
              // Target jumps back to dodge
              (async () => {
                await tweenTo(tgt.node, cur.x + dodgeBack/2, cur.y + jumpHeight, 100);
                await tweenTo(tgt.node, cur.x + dodgeBack, cur.y, 100);
                await tweenTo(tgt.node, cur.x, cur.y, 150);
              })(),
              // Attacker swings forward (missing)
              (async () => {
                playAnim(src, 'walk', true);
                await tweenTo(src.node, attackerPos.x + attackerForward, attackerPos.y, 150);
                playAnim(src, 'idle', true);
                await tweenTo(src.node, attackerPos.x, attackerPos.y, 100);
              })()
            ];
            
            await Promise.all([dodgePromise, attackPromise]);
            break; }
          // MoveBack
          case StepType.MoveBack: {
            // Check if this is after a disarm (previous step was disarm)
            const prevStep = steps[steps.indexOf(s) - 1];
            const isAfterDisarm = prevStep && prevStep.a === 23;
            
            const cur = getPos(src.node);
            let pos;
            
            if (isAfterDisarm) {
              // After disarm, keep same Y position
              pos = { x: src.baseX || cur.x, y: cur.y };
            } else {
              // Normal repositioning to a new lane
              pos = getRandomBaseForSide(actorSide, cur.x);
              // update occupancy with new lane
              if (actorSide === 'L') occY.L.push(pos.y); else occY.R.push(pos.y);
              src.baseY = pos.y;
            }
            
            src.baseX = pos.x;
            const start = getPos(src.node);
            const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
            addVector(start.x, start.y, pos.x, pos.y, 0x66ccff);
            const dur = (durationMoveBackMs(dist) * (actorSide === 'R' ? mulR : mulL)) / Math.max(0.001, speed);
            await tweenTo(src.node, pos.x, pos.y, dur);
            playAnim(src, 'idle', true);
            break; }
          // Death
          case StepType.Death: {
            // Use the same logic as Hit to identify who died
            const diedIdx = actorIdx; // Fix: Define diedIdx like in official LaBrute
            const diedFighter = actor;

            console.log(`DEATH: Fighter ${diedFighter?.name} (idx: ${diedIdx}) died, leftMainIdx=${leftMainIdx}, rightMainIdx=${rightMainIdx}`);

            // Check if it's one of the main fighters - ONLY set HP to 0 for the one who actually died
            if (diedIdx !== null && (diedFighter?.id === fight.brute1Id || diedIdx === leftMainIdx)) {
              left.node.alpha = 0.2;
              hpL = 0;
              barL.set(0);
              if (hudL.showDeathX) hudL.showDeathX();
              playAnim(left, 'death', false);
              floatText(left.node.x, left.node.y, 'DEAD', 0x8B0000);
            } else if (diedIdx !== null && (diedFighter?.id === fight.brute2Id || diedIdx === rightMainIdx)) {
              right.node.alpha = 0.2;
              hpR = 0; 
              try { (hudR as any)?.showDeathX?.(); } catch {}
              playAnim(right, 'death', false);
              floatText(right.node.x, right.node.y, 'DEAD', 0x8B0000);
            }
            // Handle pet death
            const petSpine = petSpines.get(diedIdx ?? -1);
            if (petSpine) {
              petSpine.alpha = 0.2;
              if ((petSpine as any).petTick) {
                app.ticker.remove((petSpine as any).petTick);
              }
              // Death animation - fall over
              petSpine.rotation = Math.PI / 2;
              petSpine.y += 10;
              floatText(petSpine.x, petSpine.y, 'PET DEAD', 0x8B0000);
              try { const hud = petHudByIndex.get(diedIdx!); if (hud) hud.set(0); } catch {}
            }
            break; }
          // Throw (projectile weapon)
          case StepType.Throw: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            
            // Create animated projectile
            const projectileContainer = new Container();
            
            // Determine projectile type from weapon
            const weaponName = lastWeaponByActor.get(actorIdx ?? -1) || 'knife';
            
            // Remove weapon icon when thrown - LIKE OFFICIAL
            const thrownWeapon = weaponName;
            if (actor === leftMain) {
              barL.removeWeapon(thrownWeapon); // Remove thrown weapon icon
              lastWeaponByActor.delete(actorIdx ?? -1);
            } else if (actor === rightMain) {
              barR.removeWeapon(thrownWeapon); // Remove thrown weapon icon
              lastWeaponByActor.delete(actorIdx ?? -1);
            }
            
            // Create weapon sprite for throw animation
            const weaponSprite = new Graphics();
            // Draw weapon shape based on type
            if (weaponName.includes('knife') || weaponName.includes('dagger')) {
              weaponSprite.rect(-3, -15, 6, 30);
            } else if (weaponName.includes('axe') || weaponName.includes('hatchet')) {
              weaponSprite.moveTo(-10, -10)
                .lineTo(10, -10)
                .lineTo(5, 0)
                .lineTo(0, 15)
                .lineTo(-5, 0)
                .closePath();
            } else {
              weaponSprite.rect(-5, -10, 10, 20);
            }
            weaponSprite.fill({ color: 0x888888 })
              .stroke({ width: 2, color: 0x666666 });
            
            const projectile = weaponSprite;
            
            if (weaponName.includes('shuriken')) {
              // Spinning shuriken
              projectile.stroke({ width: 2, color: 0x800080 });
              for (let i = 0; i < 4; i++) {
                const angle = (i * 90) * Math.PI / 180;
                projectile.moveTo(0, 0);
                projectile.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
              }
            } else if (weaponName.includes('knife')) {
              // Knife shape
              projectile.rect(-1, -6, 2, 12)
                .fill({ color: 0xC0C0C0 });
            } else {
              // Generic projectile
              projectile.circle(0, 0, 4)
                .fill({ color: 0x808080 });
            }
            
            // Trail effect
            const trail = new Graphics();
            trail.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.3 });
            
            projectileContainer.addChild(trail, projectile);
            projectileContainer.position.set(spos.x, spos.y - 20);
            scene.addChild(projectileContainer);
            
          // Animate with rotation and trail
          let throwTime = 0;
          const throwDuration = Math.max(220, 380 / Math.max(0.001, speed));
            const startX = spos.x;
            const startY = spos.y - 20;
            const endX = tpos.x;
            const endY = tpos.y - 20;
            const trailPoints: {x: number, y: number}[] = [];
            
            const throwTick = (tk: any) => {
              throwTime += tk.deltaMS || 16.7;
              const progress = Math.min(1, throwTime / throwDuration);
              
              // Parabolic arc
              const x = startX + (endX - startX) * progress;
              const baseY = startY + (endY - startY) * progress;
              const arcHeight = Math.sin(progress * Math.PI) * 30;
              const y = baseY - arcHeight;
              
              projectileContainer.position.set(x, y);
              projectile.rotation += 0.3;
              
              // Update trail
              trailPoints.push({x, y});
              if (trailPoints.length > 10) trailPoints.shift();
              
              if (trail && !trail.destroyed && typeof trail.clear === 'function') {
                try { trail.clear(); } catch {}
              }
              trail.stroke({ width: 2, color: 0xFFD200, alpha: 0.25 });
              if (trailPoints.length > 1) {
                const firstPoint = trailPoints[0];
                if (firstPoint) {
                  trail.moveTo(firstPoint.x - x, firstPoint.y - y);
                  for (let i = 1; i < trailPoints.length; i++) {
                    const point = trailPoints[i];
                    if (point) {
                      trail.lineTo(point.x - x, point.y - y);
                    }
                  }
                }
              }
              
              if (progress >= 1) {
                app.ticker.remove(throwTick);
                scene.removeChild(projectileContainer);
                // Destroy all children properly
                try {
                  projectile.destroy();
                  trail.destroy();
                  projectileContainer.destroy();
                } catch {}
              }
            };
            addTick(throwTick);
            await delay(throwDuration);
            break; }
          
          // Disarm
          case StepType.Disarm: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'DISARMED!', 0xFF6347);
            
            // Animate weapon flying away
            const disarmedWeapon = lastWeaponByActor.get(targetIdx ?? -1) || 'knife';
            const weaponFly = new Graphics();
            weaponFly.rect(-5, -10, 10, 20)
              .fill({ color: 0x888888 })
              .stroke({ width: 2, color: 0x666666 });
            weaponFly.position.set(tpos.x, tpos.y - 30);
            scene.addChild(weaponFly);
            
            // Animate weapon flying and spinning away
            const flyDir = Math.random() > 0.5 ? 1 : -1;
            let flyTime = 0;
            const flyTick = (delta: any) => {
              flyTime += delta.deltaMS ?? 16.7;
              const progress = Math.min(flyTime / 500, 1);
              weaponFly.x = tpos.x + flyDir * progress * 60;
              weaponFly.y = tpos.y - 30 - Math.sin(progress * Math.PI) * 40 + progress * 50;
              weaponFly.rotation = progress * Math.PI * 4;
              weaponFly.alpha = 1 - progress * 0.5;
              
              if (progress >= 1) {
                app.ticker.remove(flyTick);
                scene.removeChild(weaponFly);
                weaponFly.destroy();
              }
            };
            app.ticker.add(flyTick);
            
            // Remove weapon visual from target
            const targetWeapon = weaponSpines.get(tgt);
            if (targetWeapon) {
              if ((targetWeapon as any).weaponTick) {
                app.ticker.remove((targetWeapon as any).weaponTick);
              }
              scene.removeChild(targetWeapon);
              weaponSpines.delete(tgt);
            }
            // Remove weapon icon from HUD - LIKE OFFICIAL
            if (target === leftMain && disarmedWeapon) {
              barL.removeWeapon(disarmedWeapon); // Remove disarmed weapon icon
              lastWeaponByActor.delete(targetIdx ?? -1);
            } else if (target === rightMain && disarmedWeapon) {
              barR.removeWeapon(disarmedWeapon); // Remove disarmed weapon icon
              lastWeaponByActor.delete(targetIdx ?? -1);
            }
            break; }
          
          // Steal (weapon steal)
          case StepType.Steal: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'STOLEN!', 0x9370DB);
            // Transfer weapon visual
            const targetWeapon = weaponSpines.get(tgt);
            if (targetWeapon) {
              weaponSpines.delete(tgt);
              weaponSpines.set(src, targetWeapon);
            }
            // Get the stolen weapon name from target
            const stolenWeapon = lastWeaponByActor.get(targetIdx ?? -1) || '';
            // Remove weapon icon from victim - LIKE OFFICIAL
            if (target === leftMain && stolenWeapon) {
              barL.removeWeapon(stolenWeapon); // Remove stolen weapon from victim
            } else if (target === rightMain && stolenWeapon) {
              barR.removeWeapon(stolenWeapon); // Remove stolen weapon from victim
            }
            // Add weapon icon to thief - LIKE OFFICIAL
            if (actor === leftMain && stolenWeapon) {
              barL.updateWeapon(stolenWeapon); // Add stolen weapon to thief
              lastWeaponByActor.set(actorIdx ?? -1, stolenWeapon);
            } else if (actor === rightMain && stolenWeapon) {
              barR.updateWeapon(stolenWeapon); // Add stolen weapon to thief
              lastWeaponByActor.set(actorIdx ?? -1, stolenWeapon);
            }
            // Remove from victim's tracking
            lastWeaponByActor.delete(targetIdx ?? -1);
            break; }
          
          // Sabotage (StepType.Sabotage)
          case StepType.Sabotage: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'SABOTAGED!', 0xFFA500);
            try {
              if (targetIdx !== null && activeNets.has(targetIdx)) {
                const net = activeNets.get(targetIdx)!;
                activeNets.delete(targetIdx);
                const follow = (net as any).__followTick;
                if (follow) { try { app.ticker.remove(follow); } catch {} }
                let apha = 1;
                const fade = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                  apha -= dm / (240 / Math.max(0.001, speed));
                  try { net.alpha = Math.max(0, apha); } catch {}
                  if (apha <= 0) {
                    app.ticker.remove(fade);
                    try { scene.removeChild(net); } catch {}
                    try { net.destroy(); } catch {}
                  }
                };
                addTick(fade);
              }
            } catch {}
            break; }

          // Spy (swap weapons between actor and target)
          case StepType.Spy: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'SPY!', 0x87CEFA);
            try {
              if (actorIdx !== null && targetIdx !== null) {
                const aName = lastWeaponByActor.get(actorIdx) || '';
                const tName = lastWeaponByActor.get(targetIdx) || '';
                // Swap in tracking
                lastWeaponByActor.set(actorIdx, tName);
                lastWeaponByActor.set(targetIdx, aName);
                // HUD update
                if (actor === leftMain) {
                  if (tName) barL.updateWeapon(tName);
                } else if (actor === rightMain) {
                  if (tName) barR.updateWeapon(tName);
                }
                if (target === leftMain) {
                  if (aName) barL.updateWeapon(aName);
                } else if (target === rightMain) {
                  if (aName) barR.updateWeapon(aName);
                }
              }
            } catch {}
            break; }
          
          // Net (trap)
          case StepType.Trap: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'TRAPPED!', 0x8B4513);
            
            // Create animated net with physics simulation
            const netContainer = new Container();
            const netNodes: {x: number, y: number, vx: number, vy: number}[] = [];
            
            // Create net grid nodes
            const gridSize = 6;
            const spacing = 8;
            for (let i = 0; i < gridSize; i++) {
              for (let j = 0; j < gridSize; j++) {
                netNodes.push({
                  x: (i - gridSize/2) * spacing,
                  y: (j - gridSize/2) * spacing - 30,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -5 - Math.random() * 3
                });
              }
            }
            
            netContainer.position.set(tpos.x, tpos.y);
            scene.addChild(netContainer);
            // Attach to target and follow its node position every tick
            const follow = (tk:any) => {
              try {
                const p = getPos(tgt.node);
                netContainer.position.set(p.x, p.y);
              } catch {}
            };
            addTick(follow);
            if (targetIdx !== null) {
              try { (netContainer as any).__followTick = follow; } catch {}
              try { activeNets.set(targetIdx, netContainer); } catch {}
            }
            
            // Animate net falling and settling briefly, then keep attached
            let netTime = 0;
            const netTick = (tk: any) => {
              netTime += tk.deltaMS || 16.7;
              
              // Clear and redraw net - SAFE CLEAR
              try {
                netContainer.removeChildren();
              } catch {}
              const netGraphics = new Graphics();
              netGraphics.stroke({ width: 2, color: 0x8B4513, alpha: 0.7 });
              
              // Update physics
              netNodes.forEach(node => {
                // Gravity
                node.vy += 0.5;
                // Air resistance
                node.vx *= 0.98;
                node.vy *= 0.98;
                // Update position
                node.x += node.vx * 0.5;
                node.y += node.vy * 0.5;
                
                // Constrain to target area
                if (node.y > 10) {
                  node.y = 10;
                  node.vy *= -0.3;
                }
              });
              
              // Draw net lines
              for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                  const idx = i * gridSize + j;
                  const node = netNodes[idx];
                  if (!node) continue;
                  
                  // Draw horizontal lines
                  if (j < gridSize - 1) {
                    const next = netNodes[idx + 1];
                    if (next) {
                      netGraphics.moveTo(node.x, node.y);
                      netGraphics.lineTo(next.x, next.y);
                    }
                  }
                  
                  // Draw vertical lines
                  if (i < gridSize - 1) {
                    const next = netNodes[idx + gridSize];
                    if (next) {
                      netGraphics.moveTo(node.x, node.y);
                      netGraphics.lineTo(next.x, next.y);
                    }
                  }
                }
              }
              
              netContainer.addChild(netGraphics);
              
              // Stop physics after a short settle period; keep the net attached
              if (netTime > 700) {
                app.ticker.remove(netTick);
              }
            };
            addTick(netTick);
            break; }
          
          // Bomb
          case StepType.Bomb: {
            const tpos = getPos(tgt.node);
            
            // Create animated bomb with Spine-like parts
            const bombContainer = new Container();
            
            // Bomb body
            const bomb = new Graphics();
            bomb.circle(0, 0, 8)
              .fill({ color: 0x1C1C1C });
            
            // Fuse
            const fuse = new Graphics();
            fuse.stroke({ width: 2, color: 0x8B4513 });
            fuse.moveTo(0, -8);
            fuse.lineTo(0, -15);
            
            // Spark
            const spark = new Graphics();
            spark.star(0, -15, 5, 4, 2)
              .fill({ color: 0xFFFF00 });
            
            bombContainer.addChild(bomb, fuse, spark);
            bombContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(bombContainer);
            
            // Animate fuse burning
            let fuseTime = 0;
            const fuseTick = (tk: any) => {
              fuseTime += tk.deltaMS || 16.7;
              spark.y = -15 + (fuseTime / 500) * 7;
              spark.scale.set(1 + Math.random() * 0.3);
              spark.rotation += 0.2;
              
              if (fuseTime > 500) {
                app.ticker.remove(fuseTick);
                // Defer destruction to avoid batcher error
                setTimeout(() => {
                  if (scene && bombContainer && bombContainer.parent) {
                    scene.removeChild(bombContainer);
                    bombContainer.destroy(true);
                  }
                }, 0);
                
                // Create explosion with multiple layers
                const explosion = new Container();
                
                // Inner core
                const core = new Graphics();
                core.circle(0, 0, 10)
                  .fill({ color: 0xFFD200, alpha: 0.85 });
                
                // Middle layer
                const middle = new Graphics();
                middle.circle(0, 0, 20)
                  .fill({ color: 0xFFA500, alpha: 0.8 });
                
                // Outer layer
                const outer = new Graphics();
                outer.circle(0, 0, 30)
                  .fill({ color: 0xFF4500, alpha: 0.6 });
                
                // Shockwave ring
                const ring = new Graphics();
                ring.circle(0, 0, 5)
                  .stroke({ width: 3, color: 0xFFFF00, alpha: 0.8 });
                
                explosion.addChild(outer, middle, core, ring);
                explosion.position.set(tpos.x, tpos.y);
                scene.addChild(explosion);
                
                // Animate explosion
                let expTime = 0;
                const expTick = (tk: any) => {
                  expTime += tk.deltaMS || 16.7;
                  const progress = expTime / 300;
                  
                  core.scale.set(1 + progress * 2);
                  core.alpha = Math.max(0, 1 - progress);
                  
                  middle.scale.set(1 + progress * 1.5);
                  middle.alpha = Math.max(0, 0.8 - progress);
                  
                  outer.scale.set(1 + progress);
                  outer.alpha = Math.max(0, 0.6 - progress);
                  
                  ring.scale.set(1 + progress * 4);
                  ring.alpha = Math.max(0, 0.8 - progress * 2);
                  
                  if (progress >= 1) {
                    app.ticker.remove(expTick);
                    scene.removeChild(explosion);
                    setTimeout(() => { try { explosion.destroy(); } catch {} }, 0);
                  }
                };
                addTick(expTick);
              }
            };
            addTick(fuseTick);
            
            floatText(tpos.x, tpos.y, 'BOMB!', 0xFF4500);
            await delay(600);
            await shake(6, 250);
            break; }
          
          // Hammer (stun)
          case StepType.Hammer: {
            // Official: Hammer drops both shields; ensure visuals reflect it
            try { if (actorIdx !== null) dropShield(actorIdx); } catch {}
            try { if (targetIdx !== null) dropShield(targetIdx); } catch {}
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'STUNNED!', 0x4B0082);
            
            // Create animated stars circling around head
            const starsContainer = new Container();
            const starSprites: Graphics[] = [];
            
            for (let i = 0; i < 5; i++) {
              const star = new Graphics();
              star.star(0, 0, 6, 5, 2)
                .fill({ color: 0xFFFF00, alpha: 0.9 });
              starSprites.push(star);
              starsContainer.addChild(star);
            }
            
            starsContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(starsContainer);
            
            // Animate stars in spiral pattern
            let animTime = 0;
            const starTick = (tk: any) => {
              animTime += (tk.deltaMS || 16.7) * 0.003;
              
              starSprites.forEach((star, i) => {
                const angle = animTime * 2 + (i * Math.PI * 2 / 5);
                const radius = 20 + Math.sin(animTime * 3) * 5;
                star.x = Math.cos(angle) * radius;
                star.y = Math.sin(angle) * radius * 0.5; // Elliptical orbit
                star.rotation = animTime * 3;
                star.scale.set(0.8 + Math.sin(animTime * 4 + i) * 0.2);
                star.alpha = 0.6 + Math.sin(animTime * 5 + i) * 0.4;
              });
              
              if (animTime > Math.PI * 3) {
                app.ticker.remove(starTick);
                scene.removeChild(starsContainer);
                setTimeout(() => { try { starsContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(starTick);
            break; }

          // FlashFlood
          case StepType.FlashFlood: {
            // Official: Flash Flood drops the attacker's shield before damage
            try { if (actorIdx !== null) dropShield(actorIdx); } catch {}
            // Effet simple: vague horizontale + secousse
            const wave = new Graphics();
            const h = 16;
            wave.rect(0, 0, W, h).fill({ color: 0x1E90FF, alpha: 0.65 });
            wave.position.set(0, (getPos(src.node).y - 40));
            scene.addChild(wave);
            let t = 0;
            const tick = (tk:any) => {
              const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
              wave.y += Math.sin(t * 0.02) * 0.6;
              wave.alpha = Math.max(0, 0.65 * (1 - t / 600));
              if (t >= 600) { app.ticker.remove(tick); try { scene.removeChild(wave); wave.destroy(); } catch {} }
            };
            addTick(tick);
            await shake(4, 180);
            break; }

          // Haste (status buff)
          case StepType.Haste: {
            const apos = getPos(src.node);
            floatText(apos.x, apos.y, 'HASTE!', 0xFFD700);
            // HUD status icon for haste on actor side + aura
            try {
              if (actorSide === 'L') { (hudL as any)?.setStatusFlag?.('haste'); (hudL as any)?.setHasteAura?.(true); }
              else { (hudR as any)?.setStatusFlag?.('haste'); (hudR as any)?.setHasteAura?.(true); }
            } catch {}

            // Speed lines near actor to emphasize haste
            const actorObj = (actorSide === 'L') ? left : right;
            const lines = new Container();
            const base = getPos(actorObj.node);
            lines.position.set(base.x, base.y - 18);
            scene.addChild(lines);
            const count = 8;
            for (let i = 0; i < count; i++) {
              const g = new Graphics();
              const len = 18 + Math.random() * 12;
              const x0 = (actorSide === 'L') ? -len : len;
              const x1 = (actorSide === 'L') ? 0 : 0;
              const y = (Math.random() * 18) - 9;
              g.moveTo(x0, y).lineTo(x1, y).stroke({ width: 2, color: 0x2c8eea, alpha: 0.85 });
              lines.addChild(g);
            }
            // Fade and remove lines
            let t = 0;
            const tick = (tk:any) => {
              const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7; t += dm;
              const p = Math.min(1, t / 600);
              try { lines.alpha = 1 - p; } catch {}
              if (p >= 1) {
                app.ticker.remove(tick);
                try { scene.removeChild(lines); } catch {}
                try { lines.destroy({ children: true }); } catch {}
              }
            };
            addTick(tick);
            break; }

          // Resist
          case StepType.Resist: {
            const tpos = getPos(src.node);
            floatText(tpos.x, tpos.y, 'RESIST!', 0x87CEEB);
            // Halo protecteur bleu pâle
            try {
              const halo = new Graphics();
              halo.lineStyle(3, 0x87CEEB, 0.8);
              halo.drawCircle(0, 0, 18);
              halo.endFill?.();
              halo.position.set(tpos.x, tpos.y - 26);
              halo.zIndex = 1000;
              scene.addChild(halo);
              let t = 0; const life = Math.max(1, 420 / Math.max(0.001, speed));
              const tick = (tk:any) => {
                const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                t += dm; halo.alpha = Math.max(0, 1 - (t / life));
                if (t >= life) { app.ticker.remove(tick); try { scene.removeChild(halo); halo.destroy(); } catch {} }
              };
              addTick(tick);
            } catch {}
            break; }

          // Survive
          case StepType.Survive: {
            const tpos = getPos(src.node);
            floatText(tpos.x, tpos.y, 'SURVIVE!', 0xFFD700);
            // Lueur dorée brève autour du buste
            try {
              const glow = new Graphics();
              glow.beginFill(0xFFD700, 0.35);
              glow.drawCircle(0, 0, 16);
              glow.endFill?.();
              glow.position.set(tpos.x, tpos.y - 28);
              glow.zIndex = 999;
              scene.addChild(glow);
              let t = 0; const life = Math.max(1, 380 / Math.max(0.001, speed));
              const tick = (tk:any) => {
                const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                t += dm; glow.alpha = Math.max(0, 0.35 * (1 - (t / life)));
                if (t >= life) { app.ticker.remove(tick); try { scene.removeChild(glow); glow.destroy(); } catch {} }
              };
              addTick(tick);
            } catch {}
            break; }

          // Eat (self heal)
          case StepType.Eat: {
            const healAmount = (s as any)?.h ?? (s as any)?.v ?? 0;
            const apos = getPos(src.node);
            floatText(apos.x, apos.y - 20, 'EAT!', 0x90EE90);
            if (healAmount > 0) {
              if (actorIdx !== null) {
                const hpEntry = hpByIndex.get(actorIdx) || { cur: 0, max: 1 };
                hpEntry.cur = Math.min(hpEntry.max, (hpEntry.cur ?? 0) + healAmount);
                hpByIndex.set(actorIdx, hpEntry);
                const petHud = petHudByIndex.get(actorIdx);
                if (petHud) { petHud.set(hpEntry.cur / Math.max(1, hpEntry.max)); }
              }
              if (actorSide === 'L') { hpL = Math.min(maxL, hpL + healAmount); barL.set(hpL / maxL); }
              else if (actorSide === 'R') { hpR = Math.min(maxR, hpR + healAmount); barR.set(hpR / maxR); }
            }
            break; }

          // Vampirism
          case StepType.Vampirism: {
            console.log('VAMPIRISM ACTION FULL DETAILS:', s);
            console.log('Actor from b:', s.b, 'Target from t:', s.t);
            console.log('Actor from f:', s.f, 'Target still t:', s.t);

            // VAMPIRISM uses b for actor, t for target (not f!)
            const vampireIdx = s.b as number;
            const victimIdx = s.t as number;
            const damage = s.d || 0;
            const healAmount = s.h || 0;

            const vampire = vampireIdx !== undefined ? byIndex.get(vampireIdx) : undefined;
            const victim = victimIdx !== undefined ? byIndex.get(victimIdx) : undefined;

            console.log(`Vampirism: Vampire ${vampire?.name}(${vampireIdx}) sucks ${damage} HP from ${victim?.name}(${victimIdx}) and heals ${healAmount} HP`);

            const vampireSide = (vampire === leftMain || vampireIdx === leftMainIdx) ? 'L' : 'R';
            const victimSide = (victim === leftMain || victimIdx === leftMainIdx) ? 'L' : 'R';

            console.log(`Vampire side: ${vampireSide}, Victim side: ${victimSide}`);
            // Get the actual sprite nodes for animation
            let vampireSprite: any = null;
            let victimSprite: any = null;

            // Find vampire sprite
            if (vampire === leftMain) {
              vampireSprite = left;
            } else if (vampire === rightMain) {
              vampireSprite = right;
            } else {
              // Check if it's a pet
              const leftPetData = leftMain?.pets?.[0];
              const rightPetData = rightMain?.pets?.[0];
              if (leftPetData && vampire?.name === leftPetData.name) {
                vampireSprite = left; // Use main fighter's position for now
              } else if (rightPetData && vampire?.name === rightPetData.name) {
                vampireSprite = right; // Use main fighter's position for now
              }
            }

            // Find victim sprite
            if (victim === leftMain) {
              victimSprite = left;
            } else if (victim === rightMain) {
              victimSprite = right;
            } else {
              // Check if it's a pet
              const leftPetData = leftMain?.pets?.[0];
              const rightPetData = rightMain?.pets?.[0];
              if (leftPetData && victim?.name === leftPetData.name) {
                victimSprite = left; // Use main fighter's position for now
              } else if (rightPetData && victim?.name === rightPetData.name) {
                victimSprite = right; // Use main fighter's position for now
              }
            }

            if (!vampireSprite || !victimSprite) {
              console.error('Could not find sprite for vampire or victim');
              // Fall back to using main fighters
              vampireSprite = vampireSide === 'L' ? left : right;
              victimSprite = victimSide === 'L' ? left : right;
            }

            const spos = getPos(vampireSprite.node);
            const tpos = getPos(victimSprite.node);

            // Store vampire's original position
            const originalVampireX = vampireSprite.node.x;
            const originalVampireY = vampireSprite.node.y;

            // Calculate position close to victim (offset by 80 pixels to avoid overlap)
            const targetX = vampireSide === 'L' ? tpos.x - 80 : tpos.x + 80;
            const targetY = tpos.y;

            // Animate vampire moving to victim
            let moveTime = 0;
            const moveDuration = 300; // 300ms to move to victim
            const stayDuration = 500; // Stay for 500ms while sucking blood
            const returnDuration = 300; // 300ms to return
            const totalDuration = moveDuration + stayDuration + returnDuration;

            const vampireMoveTick = (tk: any) => {
              moveTime += tk.deltaMS || 16.7;

              if (moveTime <= moveDuration) {
                // Phase 1: Move to victim
                const progress = moveTime / moveDuration;
                const eased = progress * progress; // Ease in
                vampireSprite.node.x = originalVampireX + (targetX - originalVampireX) * eased;
                vampireSprite.node.y = originalVampireY + (targetY - originalVampireY) * eased;
              } else if (moveTime <= moveDuration + stayDuration) {
                // Phase 2: Stay at victim position
                vampireSprite.node.x = targetX;
                vampireSprite.node.y = targetY;
              } else if (moveTime <= totalDuration) {
                // Phase 3: Return to original position
                const returnProgress = (moveTime - moveDuration - stayDuration) / returnDuration;
                const eased = 1 - (1 - returnProgress) * (1 - returnProgress); // Ease out
                vampireSprite.node.x = targetX + (originalVampireX - targetX) * eased;
                vampireSprite.node.y = targetY + (originalVampireY - targetY) * eased;
              } else {
                // Animation complete, ensure vampire is back at original position
                vampireSprite.node.x = originalVampireX;
                vampireSprite.node.y = originalVampireY;
                app.ticker.remove(vampireMoveTick);
              }
            };
            addTick(vampireMoveTick);

            // Store initial HP values
            const beforeVictimHP = victimSide === 'L' ? hpL : hpR;
            const beforeVampireHP = vampireSide === 'L' ? hpL : hpR;

            console.log(`BEFORE VAMPIRISM: Victim(${victimSide}) HP=${beforeVictimHP}, Vampire(${vampireSide}) HP=${beforeVampireHP}`);

            // Delay HP updates and effects until vampire reaches victim (after 300ms)
            setTimeout(() => {
              // Apply damage to victim
              if (victimSide === 'L') {
                hpL = Math.max(0, hpL - damage);
                barL.set(hpL / maxL);
                console.log(`Victim LEFT HP: ${beforeVictimHP} -> ${hpL}`);
              } else if (victimSide === 'R') {
                hpR = Math.max(0, hpR - damage);
                barR.set(hpR / maxR);
                console.log(`Victim RIGHT HP: ${beforeVictimHP} -> ${hpR}`);
              }

              // Heal the vampire - check if they're on same side (vampirism can hit same team)
              if (vampireSide === 'L' && victimSide === 'L') {
                // Both on left side - vampire heals after damaging teammate
                hpL = Math.min(maxL, hpL + healAmount);
                const ratio = hpL / maxL;
                console.log(`Vampire LEFT HP (heal after team damage): ${hpL - healAmount} -> ${hpL}, ratio: ${ratio}`);
                barL.set(ratio);
              } else if (vampireSide === 'R' && victimSide === 'R') {
                // Both on right side - vampire heals after damaging teammate
                hpR = Math.min(maxR, hpR + healAmount);
                const ratio = hpR / maxR;
                console.log(`Vampire RIGHT HP (heal after team damage): ${hpR - healAmount} -> ${hpR}, ratio: ${ratio}`);
                barR.set(ratio);
              } else if (vampireSide === 'L') {
                // Normal case - vampire on left, victim on right
                hpL = Math.min(maxL, hpL + healAmount);
                const ratio = hpL / maxL;
                console.log(`Vampire LEFT HP (heal): ${beforeVampireHP} -> ${hpL}, ratio: ${ratio}`);
                barL.set(ratio);
              } else if (vampireSide === 'R') {
                // Normal case - vampire on right, victim on left
                hpR = Math.min(maxR, hpR + healAmount);
                const ratio = hpR / maxR;
                console.log(`Vampire RIGHT HP (heal): ${beforeVampireHP} -> ${hpR}, ratio: ${ratio}`);
                barR.set(ratio);
              }
              // Show damage number on target (officiel: blanc si non-critique)
              const damageText = new Text(`-${damage}`, {
                fontSize: 22,
                fontWeight: 'bold',
                fill: '#FFFFFF',
              });
              damageText.anchor.set(0.5);
              damageText.position.set(tpos.x, tpos.y - 50);
              scene.addChild(damageText);

              // Show heal number on vampire at victim position (green)
              const healText = new Text(`+${healAmount}`, {
                fontSize: 22,
                fontWeight: 'bold',
                fill: '#00FF00',
              });
              healText.anchor.set(0.5);
              // Show heal number where vampire is (near victim)
              const vampireCurrentX = vampireSide === 'L' ? tpos.x - 50 : tpos.x + 50;
              healText.position.set(vampireCurrentX, tpos.y - 50);
              scene.addChild(healText);

              // Animate numbers floating up
              let floatTime = 0;
              const floatTick = (tk: any) => {
                floatTime += tk.deltaMS || 16.7;
                const progress = floatTime / 800;

                damageText.y = tpos.y - 50 - progress * 30;
                damageText.alpha = 1 - progress;

                healText.y = tpos.y - 50 - progress * 30;
                healText.alpha = 1 - progress;

                if (progress >= 1) {
                  app.ticker.remove(floatTick);
                  scene.removeChild(damageText);
                  scene.removeChild(healText);
                  damageText.destroy();
                  healText.destroy();
                }
              };
              addTick(floatTick);

              // Blood effect particles
              for (let i = 0; i < 10; i++) {
                const blood = new Graphics();
                blood.circle(0, 0, 2)
                  .fill({ color: 0x8B0000, alpha: 0.8 });

                const startX = tpos.x + (Math.random() - 0.5) * 20;
                const startY = tpos.y + (Math.random() - 0.5) * 20;
                blood.position.set(startX, startY);
                scene.addChild(blood);

                // Animate blood moving from victim to vampire's current position
                let bloodTime = 0;
                const bloodTick = (tk: any) => {
                  bloodTime += tk.deltaMS || 16.7;
                  const progress = Math.min(bloodTime / 500, 1);

                  const vampireTargetX = vampireSide === 'L' ? tpos.x - 50 : tpos.x + 50;
                  blood.x = startX + (vampireTargetX - startX) * progress;
                  blood.y = startY + (tpos.y - startY) * progress;
                  blood.alpha = 0.8 * (1 - progress);

                  if (progress >= 1) {
                    app.ticker.remove(bloodTick);
                    scene.removeChild(blood);
                    blood.destroy();
                  }
                };
                addTick(bloodTick);
              }
            }, 300); // Wait for vampire to reach victim

            // HUD status icon for vampirism on actor side
            try {
              if (vampireSide === 'L') (hudL as any)?.setStatusFlag?.('vampirism');
              else (hudR as any)?.setStatusFlag?.('vampirism');
            } catch {}

            console.log(`AFTER VAMPIRISM: Left HP = ${hpL}/${maxL}, Right HP = ${hpR}/${maxR}`);
            break; }

          // Hypnotise
          case StepType.Hypnotise: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'HYPNOTIZED!', 0x9932CC);
            
            // Create hypnotic spiral effect
            const spiralContainer = new Container();
            const spirals: Graphics[] = [];
            
            for (let i = 0; i < 3; i++) {
              const spiral = new Graphics();
              spiral.stroke({ width: 3, color: i % 2 === 0 ? 0x9932CC : 0xFFFFFF, alpha: 0.6 });
              
              // Draw spiral
              let prevX = 0, prevY = 0;
              for (let j = 0; j < 50; j++) {
                const angle = j * 0.3;
                const radius = j * 0.8;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (j === 0) {
                  spiral.moveTo(x, y);
                } else {
                  spiral.lineTo(x, y);
                }
                prevX = x;
                prevY = y;
              }
              
              spirals.push(spiral);
              spiralContainer.addChild(spiral);
            }
            
            spiralContainer.position.set(tpos.x, tpos.y - 30);
            scene.addChild(spiralContainer);
            
            // Animate spirals
            let spiralTime = 0;
            const spiralTick = (tk: any) => {
              spiralTime += (tk.deltaMS || 16.7) * 0.002;
              
              spirals.forEach((spiral, i) => {
                spiral.rotation = spiralTime * (i % 2 === 0 ? 1 : -1);
                spiral.scale.set(0.5 + Math.sin(spiralTime * 2) * 0.12);
                // Réduire les flashes blancs: limiter l'alpha et éviter 0xFFFFFF
                try { (spiral as any).clear(); } catch {}
                const draw = new Graphics();
                const col = (i % 2 === 0) ? 0x9932CC : 0xAD3C8F; // violet seulement
                draw.stroke({ width: 3, color: col, alpha: 0.35 });
                // Réutiliser le même container: on dessine un court arc
                const r = 16 + i * 6; const segs = 18;
                for (let k = 0; k < segs; k++) {
                  const ang0 = (k / segs) * Math.PI * 2;
                  const ang1 = ((k+1) / segs) * Math.PI * 2;
                  draw.moveTo(Math.cos(ang0)*r, Math.sin(ang0)*r);
                  draw.lineTo(Math.cos(ang1)*r, Math.sin(ang1)*r);
                }
                try { spiral.addChild(draw); } catch {}
                spiral.alpha = 0.25 + Math.sin(spiralTime * 2.6 + i) * 0.15;
              });
              
              spiralContainer.scale.set(1 + Math.sin(spiralTime * 2) * 0.1);
              
              if (spiralTime > Math.PI * 2) {
                app.ticker.remove(spiralTick);
                scene.removeChild(spiralContainer);
                setTimeout(() => { try { spiralContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(spiralTick);

            // HUD: set hypnosis status on targets if they are main fighters + freeze portrait
            try {
              const targets: number[] = Array.isArray((s as any).t) ? (s as any).t : (typeof (s as any).t === 'number' ? [(s as any).t] : []);
              if (targets.includes(leftMainIdx)) { (hudL as any)?.setStatusFlag?.('hypnosis'); (hudL as any)?.setHypnosisFreeze?.(true); (hudL as any)?.pulseHypnosis?.(); }
              if (targets.includes(rightMainIdx)) { (hudR as any)?.setStatusFlag?.('hypnosis'); (hudR as any)?.setHypnosisFreeze?.(true); (hudR as any)?.pulseHypnosis?.(); }
            } catch {}
            break; }
          
          // Treat (healing potion)
          case StepType.Treat: {
            const healAmount = s.h || s.v || s.d || 0;
            const targetPos = getPos(tgt.node);

            // Create healing particles
            const particlesContainer = new Container();
            const particles: {g: Graphics, vx: number, vy: number, life: number}[] = [];

            // Create particles
            for (let i = 0; i < 20; i++) {
              const particle = new Graphics();
              particle.circle(0, 0, 2 + Math.random() * 2)
                .fill({ color: 0xFF69B4, alpha: 0.8 });

              particles.push({
                g: particle,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 1
              });

              particlesContainer.addChild(particle);
            }

            particlesContainer.position.set(targetPos.x, targetPos.y);
            scene.addChild(particlesContainer);

            floatText(targetPos.x, targetPos.y, 'HEALED!', 0xFF69B4);

            // Update HP bars - The ACTOR heals themselves
            if (actorSide === 'L') {
              hpL = Math.min(maxL, hpL + healAmount);
              barL.set(hpL / maxL);
            } else if (actorSide === 'R') {
              hpR = Math.min(maxR, hpR + healAmount);
              barR.set(hpR / maxR);
            }

            // Animate particles
            const particleTick = (tk: any) => {
              const dt = (tk.deltaMS || 16.7) * 0.001;

              let allDead = true;
              particles.forEach(p => {
                if (p.life > 0) {
                  allDead = false;
                  p.vy += 9.8 * dt; // gravity
                  p.g.x += p.vx;
                  p.g.y += p.vy;
                  p.life -= dt;
                  p.g.alpha = Math.max(0, p.life);
                  p.g.scale.set(p.life);
                }
              });

              if (allDead) {
                app.ticker.remove(particleTick);
                scene.removeChild(particlesContainer);
                setTimeout(() => { try { particlesContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(particleTick);
            // Release trap if any on self
            try {
              if (actorIdx !== null && activeNets.has(actorIdx)) {
                const net = activeNets.get(actorIdx)!;
                activeNets.delete(actorIdx);
                const follow = (net as any).__followTick;
                if (follow) { try { app.ticker.remove(follow); } catch {} }
                let apha = 1;
                const fade = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                  apha -= dm / (240 / Math.max(0.001, speed));
                  try { net.alpha = Math.max(0, apha); } catch {}
                  if (apha <= 0) {
                    app.ticker.remove(fade);
                    try { scene.removeChild(net); } catch {}
                    try { net.destroy(); } catch {}
                  }
                };
                addTick(fade);
              }
            } catch {}
            break; }

          // Poison
          case StepType.Poison: {
            const targetPos = getPos(tgt.node);
            
            // Create particle effect
            const particlesContainer = new Container();
            const particles: {g: Graphics, vx: number, vy: number, life: number}[] = [];
            
            // Create particles
            for (let i = 0; i < 20; i++) {
              const particle = new Graphics();
              particle.circle(0, 0, 2 + Math.random() * 2)
                .fill({ color: 0x00FF00, alpha: 0.8 });

              particles.push({
                g: particle,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 1
              });

              particlesContainer.addChild(particle);
            }

            particlesContainer.position.set(targetPos.x, targetPos.y);
            scene.addChild(particlesContainer);

            floatText(targetPos.x, targetPos.y, 'POISONED!', 0x00FF00);
            
            // Animate particles
            const particleTick = (tk: any) => {
              const dt = (tk.deltaMS || 16.7) * 0.001;
              
              let allDead = true;
              particles.forEach(p => {
                if (p.life > 0) {
                  allDead = false;
                  p.vy += 9.8 * dt; // gravity
                  p.g.x += p.vx;
                  p.g.y += p.vy;
                  p.life -= dt;
                  p.g.alpha = Math.max(0, p.life);
                  p.g.scale.set(p.life);
                }
              });
              
              if (allDead) {
                app.ticker.remove(particleTick);
                scene.removeChild(particlesContainer);
                setTimeout(() => { try { particlesContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(particleTick);
            break; }

          // DropShield
          case StepType.DropShield: {
            // Visual cue
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'SHIELD BROKEN', 0x1E90FF);
            // HUD status icon
            try {
              if (actorSide === 'L') (hudL as any)?.setStatusFlag?.('dropshield');
              else (hudR as any)?.setStatusFlag?.('dropshield');
            } catch {}
            // Remove scene shield if present
            try { if (actorIdx !== null) dropShield(actorIdx); } catch {}
            // Release any active trap attached to actor
            try {
              if (actorIdx !== null && activeNets.has(actorIdx)) {
                const net = activeNets.get(actorIdx)!;
                activeNets.delete(actorIdx);
                const follow = (net as any).__followTick;
                if (follow) { try { app.ticker.remove(follow); } catch {} }
                let a = 1;
                const fade = (tk:any) => {
                  const dm = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                  a -= dm / (240 / Math.max(0.001, speed));
                  try { net.alpha = Math.max(0, a); } catch {}
                  if (a <= 0) {
                    app.ticker.remove(fade);
                    try { scene.removeChild(net); } catch {}
                    try { net.destroy(); } catch {}
                  }
                };
                addTick(fade);
              }
            } catch {}
            break; }

          // Regeneration (subtle sparkles, no full-screen flash) + mise à jour HP
          case StepType.Regeneration: {
            const apos = getPos(src.node);
            floatText(apos.x, apos.y, 'REGEN', 0x00FF75);
            const cont = new Container();
            cont.position.set(apos.x, apos.y);
            scene.addChild(cont);
            const sparks: Graphics[] = [];
            for (let i = 0; i < 14; i++) {
              const g = new Graphics();
              g.circle(0, 0, 2 + Math.random()*1.5).fill({ color: 0x39d98a, alpha: 0.9 });
              g.x = (Math.random()-0.5) * 26;
              g.y = (Math.random()-0.5) * 20;
              cont.addChild(g); sparks.push(g);
            }
            let t = 0;
            const tick = (tk:any) => {
              t += tk.deltaMS || 16.7;
              const p = Math.min(1, t / (520 / Math.max(0.001, speed)));
              for (const g of sparks) {
                try { g.y -= 0.05 * (tk.deltaMS || 16.7); g.alpha = Math.max(0, 1 - p); } catch {}
              }
              if (p >= 1) {
                app.ticker.remove(tick);
                try { scene.removeChild(cont); } catch {}
                setTimeout(() => { try { cont.destroy({ children: true }); } catch {} }, 0);
              }
            };
            addTick(tick);

            // Appliquer le heal du tick si présent (certains pas de regen portent la valeur)
            try {
              const healAmount = Math.max(0, Number((s as any).h ?? (s as any).v ?? 0));
              if (healAmount > 0) {
                if (actorIdx !== null) {
                  // maj HP par index (pets, etc.)
                  const hpEntry = hpByIndex.get(actorIdx) || { cur: 0, max: 1 };
                  hpEntry.cur = Math.min(hpEntry.max, (hpEntry.cur ?? 0) + healAmount);
                  hpByIndex.set(actorIdx, hpEntry);
                  const petHud = petHudByIndex.get(actorIdx);
                  if (petHud) { petHud.set(hpEntry.cur / Math.max(1, hpEntry.max)); }
                }
                if (actorSide === 'L') {
                  hpL = Math.min(maxL, hpL + healAmount);
                  barL.set(hpL / maxL);
                } else if (actorSide === 'R') {
                  hpR = Math.min(maxR, hpR + healAmount);
                  barR.set(hpR / maxR);
                }
              }
            } catch {}
            break; }

          // End
          case StepType.End: {
            try {
              const qp = new URLSearchParams(window.location.search);
              const auto = (qp.get("pixiTraceAuto") === "1" || localStorage.getItem("compare.pixiTraceAuto") === "1");
              const enabled = (qp.get("pixiTrace") === "1" || localStorage.getItem("compare.pixiTrace") === "1");
              if (auto && enabled) { try { (window as any).pixiTraceDownload?.(); } catch {} }
            } catch {}

            // Determine winner/loser and show red X on loser
            let winnerSide: 'L'|'R' | null = null;
            try {
              if (hpL > hpR) { (hudR as any)?.showDeathX?.(); winnerSide = 'L'; }
              else if (hpR > hpL) { (hudL as any)?.showDeathX?.(); winnerSide = 'R'; }
            } catch {}

            // Victory banner (sobre)
            try {
              const winnerName = winnerSide === 'L' ? (leftMain?.name ?? 'GAUCHE') : winnerSide === 'R' ? (rightMain?.name ?? 'DROITE') : '';
              if (winnerName) {
                const t = new Text(`${winnerName.toUpperCase()} WON THE FIGHT`, {
                  fill: 0xFFFFFF,
                  stroke: 0x000000,
                  strokeThickness: 3,
                  fontSize: 20,
                  fontWeight: '900'
                } as any);
                t.anchor.set(0.5, 1);
                t.position.set(W / 2, H - 28);
                ui.addChild(t);
                // Do not auto-remove the victory banner; keep it visible until view unmounts
              }
            } catch {}

            // Confettis au-dessus du HUD du gagnant
            try {
              if (winnerSide) {
                const baseX = winnerSide === 'L' ? 5 + 80 : W - 5 - 80;
                const baseY = 10;
                const confContainer = new Container();
                ui.addChild(confContainer);
                const colors: number[] = [0xFFD700, 0xFF69B4, 0x00FFFF, 0xADFF2F, 0xFFA500, 0xFFFFFF];
                const parts: { g: Graphics, vy: number, vx: number, rot: number, life: number }[] = [];
                for (let i = 0; i < 28; i++) {
                  const g = new Graphics();
                  const col = colors[i % colors.length] ?? 0xFFFFFF;
                  if (i % 3 === 0) g.rect(-2, -2, 4, 4);
                  else if (i % 3 === 1) g.circle(0, 0, 2);
                  else g.poly([0,0, 3,0, 1.5,3]);
                  g.fill({ color: col as any });
                  g.position.set(baseX + (Math.random()*60 - 30), baseY + Math.random()*10);
                  confContainer.addChild(g);
                  parts.push({ g, vy: 0.5 + Math.random()*1.0, vx: (Math.random()*1.2 - 0.6), rot: (Math.random()*0.1 - 0.05), life: 3000 });
                }
                const confTick = (tk:any) => {
                  const dt = typeof tk?.deltaMS === 'number' ? tk.deltaMS : 16.7;
                  let anyAlive = false;
                  for (const p of parts) {
                    p.vy += 0.002 * dt; // gravity
                    p.g.y += p.vy * (dt/16.7) * 2.0;
                    p.g.x += p.vx * (dt/16.7) * 2.0;
                    p.g.rotation += p.rot * (dt/16.7) * 2.0;
                    p.life -= dt;
                    if (p.life > 0) anyAlive = true; else p.g.alpha = Math.max(0, p.life/300);
                  }
                  if (!anyAlive) {
                    try { app.ticker.remove(confTick); ui.removeChild(confContainer); confContainer.destroy({ children: true }); } catch {}
                  }
                };
                addTick(confTick);
                const id = window.setTimeout(() => { try { app.ticker.remove(confTick); ui.removeChild(confContainer); confContainer.destroy({ children: true }); } catch {} }, 3200);
                timeouts.add(id);
              }
            } catch {}

            return; }
        }
        {
          // Slightly slow down healing steps to avoid too-fast chaining
          let base = Math.max(60, Math.min(260, s.dt ?? 120));
          if (a === StepType.Heal || a === StepType.Treat || a === StepType.Regeneration) {
            base = Math.max(base, 200);
          }
          const ideal = base / Math.max(0.001, speed);
          const elapsed = performance.now() - stepT0;
          const wait = Math.max(0, ideal - elapsed);
          await delay(wait);
        }
        // Log HP changes after each action
        if (prevHpL !== hpL || prevHpR !== hpR) {
          console.log(`HP CHANGED after action ${a}: L: ${prevHpL} -> ${hpL}, R: ${prevHpR} -> ${hpR}`);
        }
        if (disposed) return;
        }
      };

      // Start play after a small delay to ensure everything is initialized
      setTimeout(() => {
        if (!disposed) {
          play();
        }
      }, 100);
    };

    run();

    return () => {
      disposed = true;
      
      hideTooltip();
      if (tooltipFadeTimeoutRef.current) {
        try { clearTimeout(tooltipFadeTimeoutRef.current); } catch {}
        tooltipFadeTimeoutRef.current = null;
      }
      try {
        const root = tooltipElementsRef.current?.root;
        if (root?.parentElement) {
          root.parentElement.removeChild(root);
        }
      } catch {}
      tooltipElementsRef.current = null;
      tooltipStateRef.current = { fighter: null, anchorX: 0, anchorY: 0, portraitWidth: 0, portraitHeight: 0, visible: false };
      
      // Restore original console.error
      console.error = originalError;
      
      // Stop ticker first to prevent any new renders
      try { 
        if (app && app.ticker) {
          app.ticker.stop();
          removeAllTicks();
        }
      } catch {}
      
      // Clear timeouts
      try { clearAllTimeouts(); } catch {}
      
      // Defer all cleanup to next frame to avoid batcher errors
      setTimeout(() => {
        // Pause any background videos
        try {
          for (const spr of mediaSprites) {
            const v = (spr.texture as any)?.baseTexture?.resource?.source as HTMLVideoElement | undefined;
            try { v?.pause?.(); } catch {}
            try { v?.removeAttribute?.('src'); v?.load?.(); } catch {}
          }
        } catch {}
        // Clean up debug vectors
        try {
          debugVectorsRef.current.length = 0;
        } catch {}
        
        // Clean up app and canvas
        try {
          if (app) {
            const canvas = app.canvas as HTMLCanvasElement | undefined;
            if (canvas && canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
            app.destroy(true);
          }
        } catch {}
        
        if (appRef.current === app) appRef.current = null;
      }, 100); // Longer delay to ensure render is complete
    };
  }, [fight, scale, speedBoost, /* stageOffsetX, stageOffsetY, */ clampYMinRatio, clampYMaxRatio, leftOffsetX, leftOffsetY, rightOffsetX, rightOffsetY, approachOffset, preferVideoBackground]);

  // Live updates without tearing down the Pixi app
  useEffect(() => {
    try { spinesRef.current.scene?.position.set(stageOffsetX, stageOffsetY); } catch {}
  }, [stageOffsetX, stageOffsetY]);

  useEffect(() => {
    const L = spinesRef.current.L; const R = spinesRef.current.R;
    const target = (typeof charPx === 'number' && !isNaN(charPx)) ? charPx : (charPxRef.current ?? 50);
    const apply = (sp: any, side: 'L'|'R') => {
      if (!sp) return;
      try {
        const bw = Math.max(1, sp?.bounds?.width ?? 200);
        const s = target / bw;
        sp.scale.set(s, s);
        if (side === 'R') sp.scale.x = -Math.abs(sp.scale.x);
      } catch {}
    };
    apply(L, 'L'); apply(R, 'R');
    // Update cached widths for distance calc
    try {
      const scaledWidth = (sp:any)=>{
        try { return Math.max(30, ((sp as any).bounds?.width ?? 40) * Math.max(Math.abs((sp as any).scale?.x ?? 1), 0.001)); } catch { return 40; }
      };
      if (spinesRef.current.L) (spinesRef.current as any).LWidth = scaledWidth(spinesRef.current.L);
      if (spinesRef.current.R) (spinesRef.current as any).RWidth = scaledWidth(spinesRef.current.R);
    } catch {}
    charPxRef.current = target;
  }, [charPx]);

  return <div ref={containerRef} />;
};

export default PixiFight;

























