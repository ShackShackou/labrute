/* eslint-disable unicode-bom, quotes, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-len, lines-between-class-members, one-var, one-var-declaration-per-line, no-empty, comma-spacing, space-infix-ops, key-spacing, arrow-spacing, arrow-parens, object-curly-spacing, block-spacing, space-before-function-paren, default-case, no-promise-executor-return, @typescript-eslint/no-floating-promises */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Application, Container, Graphics, Text, Assets, Sprite, Rectangle, BlurFilter } from 'pixi.js';
// @ts-ignore - official Spine v8 runtime for Pixi v8
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { FightGetResponse, WeaponById, WeaponId, weapons, StepType, WeaponType, SkillId, SkillById, skills } from '@labrute/core';

// SKILL CATEGORIZATION - Based on core/src/brute/skills.ts
// This is the OFFICIAL categorization from LaBrute source
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
    48, // vampirism (ID 48, not 49!)
    50, // haste (ID 50, not 51!)
    51, // treat (ID 51, not 52!)
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
  // Type 'passive' - All other passive skills
  // Type 'booster' - Stat boosters (herculeanStrength, etc.)
};

// Helper to check skill type
const isSuper = (skillId: number) => SKILL_CATEGORIES.SUPERS.includes(skillId);
const isTalent = (skillId: number) => SKILL_CATEGORIES.TALENTS.includes(skillId);
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
      // Debug layer (optional)
      const debugLayer = new Container();
      // @ts-ignore
      (debugLayer as any).zIndex = 998;
      app.stage.addChild(debugLayer);
      debugLayerRef.current = debugLayer;


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
      const debugDiag = (params.get('pixiDiag') === '1' || localStorage.getItem('compare.pixiDiag') === '1');
      const traceEnabled = (params.get('pixiTrace') === '1' || localStorage.getItem('compare.pixiTrace') === '1');
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
        tooltipDiv.style.position = 'absolute';
        tooltipDiv.style.zIndex = '99999';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.display = 'none';
        tooltipDiv.style.opacity = '0';
        tooltipDiv.style.transition = 'opacity 0.2s ease-in-out';

        // Style exact de la carte originale
        tooltipDiv.style.background = '#FFF6D5';
        tooltipDiv.style.border = '2px solid #8B4513';
        tooltipDiv.style.borderRadius = '8px';
        tooltipDiv.style.padding = '10px';
        tooltipDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        tooltipDiv.style.fontFamily = 'Arial, sans-serif';
        tooltipDiv.style.fontSize = '14px';
        tooltipDiv.style.minWidth = '240px';

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

        // Supers section: includes both 'super' and 'talent' types (as in original LaBrute)
        const supers = skills.filter((id: number) => isSuperOrTalent(id));

        // Skills section: everything else (passive and booster types)
        const normalSkills = skills.filter((id: number) => !isSuperOrTalent(id));

        // Map skill IDs to names
        const getSkillName = (id: number) => {
          try {
            return SkillById[id as SkillId] || `Skill${id}`;
          } catch {
            return `Skill${id}`;
          }
        };

        const supersText = supers.length > 0 ? supers.map(getSkillName).join(', ') : 'None';
        const skillsText = normalSkills.length > 0 ? normalSkills.map(getSkillName).join(', ') : 'None';

        // Create HTML content
        tooltipDiv.innerHTML = `
          <div style="margin-bottom: 6px;">
            <span style="color: #D2691E; font-weight: bold; font-size: 18px;">${fighter.name || 'Unknown'}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #D2691E; font-weight: bold;">LEVEL</span>
            <span style="color: #333; font-weight: bold;"> ${level}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 36px;">🧡</span>
              <span style="position: absolute; color: white; font-weight: bold; font-size: 18px; text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">${hp}</span>
            </div>
            <div style="flex: 1;">
              <!-- Strength Bar -->
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="width: 24px; text-align: center; font-size: 18px;">💪</span>
                <div style="flex: 1; position: relative; height: 18px; background: #E0E0E0; border: 1px solid #999; margin: 0 8px; border-radius: 2px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFA500, #FF8C00); width: ${Math.min(100, (strength / 50) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; min-width: 30px; font-size: 16px;">${strength}</span>
              </div>
              <!-- Agility Bar -->
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="width: 24px; text-align: center; font-size: 18px;">🪶</span>
                <div style="flex: 1; position: relative; height: 18px; background: #E0E0E0; border: 1px solid #999; margin: 0 8px; border-radius: 2px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFA500, #FF8C00); width: ${Math.min(100, (agility / 50) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; min-width: 30px; font-size: 16px;">${agility}</span>
              </div>
              <!-- Speed Bar -->
              <div style="display: flex; align-items: center;">
                <span style="width: 24px; text-align: center; font-size: 18px;">⚡</span>
                <div style="flex: 1; position: relative; height: 18px; background: #E0E0E0; border: 1px solid #999; margin: 0 8px; border-radius: 2px; overflow: hidden;">
                  <div style="position: absolute; height: 100%; background: linear-gradient(to bottom, #FFA500, #FF8C00); width: ${Math.min(100, (speed / 50) * 100)}%;"></div>
                </div>
                <span style="color: #4169E1; font-weight: bold; min-width: 30px; font-size: 16px;">${speed}</span>
              </div>
            </div>
          </div>
          <div style="border-top: 1px solid #CDB79E; padding-top: 6px;">
            <div style="margin-bottom: 3px;">
              <span style="color: #8B4513; font-weight: bold;">Supers:</span>
              <span style="color: #333; margin-left: 4px;">${supersText}</span>
            </div>
            <div>
              <span style="color: #8B4513; font-weight: bold;">Skills:</span>
              <span style="color: #333; margin-left: 4px;">${skillsText}</span>
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
      let rngState = hash32(String((fight as any)?.id ?? 'fight')) || 123456789;
      const rand = () => {
        if (!DETERMINISTIC) return Math.random();
        // LCG: Numerical Recipes
        rngState = (Math.imul(1664525, rngState) + 1013904223) | 0;
        return ((rngState >>> 0) / 4294967296);
      };

      // Arrival jump tunables
      const arriveMs = (() => { const u=params.get('pixiArriveMs'); const n=Number(u ?? '420'); return Number.isFinite(n) && n>0 ? n : 420; })();
      const arriveArc = (() => { const u=params.get('pixiArriveArc'); const n=Number(u ?? '28'); return Number.isFinite(n) ? n : 28; })();
      const arriveBounce = (params.get('pixiArriveBounce') ?? '1') === '1';
      const addVector = (x1:number,y1:number,x2:number,y2:number,color=0x00ff88) => {
        if (!debugDiag) return;
        try {
          const g = new Graphics();
          g.lineStyle(2, color, 0.9).moveTo(x1,y1).lineTo(x2,y2);
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
            const g = new Graphics(); g.beginFill(0x333333, 0.85).drawRoundedRect(0, 0, 86, 18, 5).endFill();
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
          // overlay graphics + tick
          const gL = new Graphics(); const gR = new Graphics();
          const info = new Text('', { fontSize: 10, fill: 0xffffff, stroke: 0x000000, strokeThickness: 2 } as any);
          info.position.set(W/2 - 60, 6);
          // @ts-ignore
          (gL as any).zIndex = 999; (gR as any).zIndex = 999; (info as any).zIndex = 999;
          ui.addChild(gL, gR, info);
          overlayGraphicsRef.current = { L: gL, R: gR, text: info };
          const errBufL:number[]=[]; const errBufR:number[]=[];
          const sampleAt = (arr:{t:number,x:number,y:number}[], t:number) => {
            if (!arr || arr.length===0) return null;
            let lo=0, hi=arr.length-1; while (lo<hi){ const mid=(lo+hi)>>1; if(arr[mid] && arr[mid].t < t) lo=mid+1; else hi=mid; }
            return arr[lo] || null;
          };
          const tickOverlay = () => {
            try {
              if (!overlayOnRef.current || !overlayRefData.current || !overlayGraphicsRef.current) return;
              const t = (performance.now()/1000) - (overlayStartRef.current || 0);
              const refL = sampleAt(overlayRefData.current.L, t);
              const refR = sampleAt(overlayRefData.current.R, t);
              const og = overlayGraphicsRef.current;
              if (og) {
                try { if (og.L && typeof og.L.clear === 'function') { og.L.clear(); } } catch {}
                try { if (og.R && typeof og.R.clear === 'function') { og.R.clear(); } } catch {}
              }
              if (refL) { og.L.lineStyle(0).beginFill(0xff2222, 0.8).drawCircle(refL.x, refL.y, 3).endFill(); }
              if (refR) { og.R.lineStyle(0).beginFill(0x22aaff, 0.8).drawCircle(refR.x, refR.y, 3).endFill(); }
              let maeL=0, maeR=0; let nL=0,nR=0;
              if (spinesRef.current.L && refL) { const p = getPos(spinesRef.current.L); const d=Math.hypot((p.x-refL.x),(p.y-refL.y)); errBufL.push(d); if (errBufL.length>60) errBufL.shift(); maeL=errBufL.reduce((a,b)=>a+b,0)/errBufL.length; nL=errBufL.length; }
              if (spinesRef.current.R && refR) { const p = getPos(spinesRef.current.R); const d=Math.hypot((p.x-refR.x),(p.y-refR.y)); errBufR.push(d); if (errBufR.length>60) errBufR.shift(); maeR=errBufR.reduce((a,b)=>a+b,0)/errBufR.length; nR=errBufR.length; }
              og.text.text = `MAE L:${maeL.toFixed(1)}px (${nL})  R:${maeR.toFixed(1)}px (${nR})`;
            } catch {}
          };
          addTick(tickOverlay);
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
        sh.beginFill(0x000000, 0.28).drawEllipse(0, 0, 26, 11).endFill();
        const blur = new BlurFilter();
        blur.blur = 4.5;
        blur.quality = 3;
        try { (sh as any).filters = [blur]; } catch {}
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
        portraitBg.lineStyle(1.5, 0xB8860B, 1);  // Same light brown border as HP bar
        portraitBg.beginFill(0x3A2317);  // Darker brown border
        portraitBg.drawRect(0, 0, portraitSize, portraitSize);
        portraitBg.endFill();
        
        // Portrait inner area
        const portrait = new Graphics();
        portrait.beginFill(0x8B6534);  // Lighter brown inner
        portrait.drawRect(2, 2, portraitSize - 4, portraitSize - 4);
        portrait.endFill();
        
        const portraitContainer = new Container();
        portraitContainer.addChild(portraitBg, portrait);
        
        // PFP image in portrait (masked), with URL params override
        const p = new URLSearchParams(window.location.search);
        const urlDefault = '/images/viewport.png';
        const url = (isL ? (p.get('pixiPfpL') || p.get('pixiPfp')) : (p.get('pixiPfpR') || p.get('pixiPfp'))) || urlDefault;
        const pScale = Number(p.get('pixiPfpScale') ?? '1');
        const offX = Number(p.get('pixiPfpOffX') ?? '0');
        const offY = Number(p.get('pixiPfpOffY') ?? '0');

        // Mask to keep sprite inside the frame
        const mask = new Graphics();
        mask.beginFill(0xFFFFFF);
        mask.drawRect(2, 2, portraitSize - 4, portraitSize - 4);
        mask.endFill();
        portraitContainer.addChild(mask);

        // Red X overlay for loser — two filled bars (centered over PFP)
        let redX: Container | null = null;
        try {
          const cross = new Container();
          const size = Math.round(portraitSize * 1.28); // slightly larger than portrait
          const thick = Math.max(6, Math.round(portraitSize * 0.26));
          const barA = new Graphics();
          barA.beginFill(0xFF0000).drawRect(-size / 2, -thick / 2, size, thick).endFill();
          barA.rotation = Math.PI / 4;
          const barB = new Graphics();
          barB.beginFill(0xFF0000).drawRect(-size / 2, -thick / 2, size, thick).endFill();
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
            // Ensure red X stays on top if it exists
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

            // Convert portrait center to screen coordinates
            const portraitScreenX = canvasRect.left + bounds.x + (bounds.width / 2);
            const portraitScreenY = canvasRect.top + bounds.y; // Position at top of portrait

            // Use portrait position for initial tooltip placement
            showTooltip(fighter, portraitScreenX, portraitScreenY);
          });

          portraitContainer.on('pointermove', (e: any) => {
            if (disposed || !currentHoveredFighter) return;

            // While moving, follow the mouse
            const canvas = app.view as HTMLCanvasElement;
            const canvasRect = canvas.getBoundingClientRect();

            // Get mouse position relative to canvas
            const globalX = e.data?.global?.x || e.global?.x || 0;
            const globalY = e.data?.global?.y || e.global?.y || 0;

            // Convert to screen coordinates
            const mouseScreenX = canvasRect.left + globalX;
            const mouseScreenY = canvasRect.top + globalY - 30; // Closer to cursor

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
        barBg.lineStyle(1.5, 0xB8860B, 1);  // Light brown border (goldenrod)
        barBg.beginFill(0x000000);
        barBg.drawRoundedRect(0, 0, barW, barH, 4);
        barBg.endFill();
        
        // Inner background area with rounded corners
        const barInner = new Graphics();
        barInner.beginFill(0x1A0F08);  // Very dark brown
        barInner.drawRoundedRect(1, 1, barW - 2, barH - 2, 3);
        barInner.endFill();
        
        // HP fill container
        const hpFill = new Container();
        
        // HP bar gradient-like effect
        const hpBar = new Graphics();
        hpBar.beginFill(0xFFD700);  // Gold/yellow - like official LaBrute
        hpBar.drawRect(1, 1, barW - 2, barH - 2);
        hpBar.endFill();
        
        // Top highlight for 3D effect
        const hpHighlight = new Graphics();
        hpHighlight.beginFill(0xFFD060, 0.5);
        hpHighlight.drawRect(1, 1, barW - 2, 2);
        hpHighlight.endFill();
        
        // Bottom shadow for depth
        const hpShadow = new Graphics();
        hpShadow.beginFill(0xCC8020, 0.7);
        hpShadow.drawRect(1, barH - 3, barW - 2, 2);
        hpShadow.endFill();
        
        hpFill.addChild(hpBar, hpShadow, hpHighlight);
        
        // Damage bar (shows lost HP in red)
        const dmgBar = new Graphics();
        
        barContainer.addChild(barBg, barInner, hpFill, dmgBar);
        
        // Weapon icon (small, next to portrait)
        const weaponContainer = new Container();
        
        
        
        // Create the full HUD layout
        const fullBar = new Container();
        
        if (isL) {
          // LEFT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(0, 0);
          nameText.position.set(0, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar
          portraitContainer.position.set(2, 32);
          
          // Weapon icon next to portrait (same position as right side)
          weaponContainer.position.set(portraitSize + 8, 36);
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer);
          fullBar.position.set(5, 2);  // Back to edge, gap is in the middle now
        } else {
          // RIGHT SIDE - ORDER: Name at top, bar below, portrait below bar
          nameText.anchor.set(1, 0);
          nameText.position.set(barW, 0);
          
          barContainer.position.set(0, 18);
          
          // Portrait just below bar
          portraitContainer.position.set(barW - portraitSize - 2, 32);
          
          // Weapon icons aligned left of portrait for right fighter, growing leftward
          weaponContainer.position.set(barW - portraitSize - 148, 36);  // Space for weapons to grow left
          
          fullBar.addChild(nameText, barContainer, portraitContainer, weaponContainer);
          fullBar.position.set(W - 5 - barW, 2);  // Back to edge, gap is in the middle now
        }
        
        ui.addChild(fullBar);
        
        // HP management
        let currentHp = 1;
        let displayHp = 1;
        
        const set = (ratio: number) => {
          currentHp = Math.max(0, Math.min(1, ratio));
          
          // Animate HP bar
          // Ensure minimum visible width - at least 10% of bar width for visibility
          const targetWidth = currentHp > 0 ? barW * currentHp : 0;
          
          // Update HP bar graphics safely
          if (hpBar && !hpBar.destroyed && typeof hpBar.clear === 'function') {
            try {
              hpBar.clear();
            } catch {
              return; // Skip if graphics is in invalid state
            }
            
            // Only draw if there's health
            if (currentHp > 0) {
              // Don't subtract anything from targetWidth - use it directly
              const drawWidth = targetWidth;
              
              // Always yellow HP bar - like official LaBrute
              hpBar.beginFill(0xFFD700); // Gold/yellow
              
              if (isL) {
                // Left bar fills from left to right with rounded corners
                hpBar.drawRoundedRect(1, 1, drawWidth - 2, barH - 2, 3);
              } else {
                // Right bar fills from right to left with rounded corners
                const startX = barW - drawWidth + 1;
                hpBar.drawRoundedRect(startX, 1, drawWidth - 2, barH - 2, 3);
              }
              hpBar.endFill();
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
                  hpHighlight.beginFill(0xFFD060, 0.5);
                  if (isL) {
                    hpHighlight.drawRect(1, 1, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpHighlight.drawRect(startX, 1, drawWidth, 2);
                  }
                  hpHighlight.endFill();
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
                  hpShadow.beginFill(0xCC8020, 0.7);
                  if (isL) {
                    hpShadow.drawRect(1, barH - 3, drawWidth, 2);
                  } else {
                    const startX = barW - drawWidth - 1;
                    hpShadow.drawRect(startX, barH - 3, drawWidth, 2);
                  }
                  hpShadow.endFill();
                }
              }
            } catch {
              return;
            }
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
              dmgBar.beginFill(0xFF0000, 0.9);  // Bright red
              dmgBar.drawRect(trailStart, 1, trailWidth, barH - 2);
              dmgBar.endFill();
            } else {
              // Right bar - red trail on the left side of green bar  
              const trailEnd = barW * (1 - currentHp);
              const trailStart = barW * (1 - displayHp);
              dmgBar.beginFill(0xFF0000, 0.9);  // Bright red
              dmgBar.drawRect(trailStart, 1, trailEnd - trailStart, barH - 2);
              dmgBar.endFill();
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
            // For right fighter, align icons from right (closest to portrait)
            if (!isL) {
              // Icons align right-to-left, rightmost weapon closest to portrait
              const rightmostX = 100; // Start position for rightmost weapon
              weaponItemContainer.position.set(rightmostX - index * 30, 0);
            } else {
              // For left fighter, keep normal left-to-right alignment
              weaponItemContainer.position.set(index * 30, 0);
            }
            
            // Weapon icon box (28x28) - transparent background with subtle border
            const weaponBg = new Graphics();
            weaponBg.beginFill(0x1A0F08, 0.3);  // Semi-transparent background
            weaponBg.drawRoundedRect(0, 0, 28, 28, 2);
            weaponBg.endFill();
            
            // Inner border - more visible
            const weaponBorder = new Graphics();
            weaponBorder.lineStyle(1.5, 0x8B6534, 0.8);
            weaponBorder.drawRoundedRect(1, 1, 26, 26, 2);
            
            // Weapon icon - better shapes
            const weaponIcon = new Graphics();
            
            // Determine weapon type and draw appropriate icon
            const lowerName = weaponName.toLowerCase();
          
          if (lowerName.includes('sword') || lowerName.includes('scimitar')) {
            // Sword - vertical blade with guard
            weaponIcon.beginFill(0xE0E0E0);
            weaponIcon.drawRect(13, 5, 2, 14);  // Blade
            weaponIcon.endFill();
            weaponIcon.beginFill(0xB8860B);
            weaponIcon.drawRect(10, 17, 8, 2);  // Guard
            weaponIcon.drawRect(13, 19, 2, 4);  // Handle
            weaponIcon.endFill();
          } else if (lowerName.includes('axe') || lowerName.includes('hatchet')) {
            // Axe - handle with axe head
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 8, 2, 12);  // Handle
            weaponIcon.endFill();
            weaponIcon.beginFill(0x808080);
            weaponIcon.moveTo(11, 8);
            weaponIcon.lineTo(17, 8);
            weaponIcon.lineTo(19, 5);
            weaponIcon.lineTo(19, 11);
            weaponIcon.lineTo(17, 11);
            weaponIcon.lineTo(11, 11);
            weaponIcon.closePath();
            weaponIcon.endFill();
          } else if (lowerName.includes('hammer') || lowerName.includes('mace')) {
            // Hammer - T shape
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 10, 2, 10);  // Handle
            weaponIcon.endFill();
            weaponIcon.beginFill(0x696969);
            weaponIcon.drawRect(9, 6, 10, 5);   // Head
            weaponIcon.endFill();
          } else if (lowerName.includes('lance') || lowerName.includes('trident')) {
            // Lance/Trident - long with point
            weaponIcon.beginFill(0x4682B4);
            weaponIcon.drawRect(13, 8, 2, 12);  // Shaft
            weaponIcon.moveTo(14, 8);
            weaponIcon.lineTo(17, 5);
            weaponIcon.lineTo(14, 5);
            weaponIcon.lineTo(11, 5);
            weaponIcon.lineTo(14, 8);
            weaponIcon.endFill();
          } else if (lowerName.includes('whip') || lowerName.includes('flail')) {
            // Whip - curved line
            weaponIcon.lineStyle(2, 0x8B4513);
            weaponIcon.moveTo(10, 20);
            weaponIcon.bezierCurveTo(14, 18, 16, 12, 18, 8);
          } else if (lowerName.includes('knife') || lowerName.includes('dagger')) {
            // Knife - small blade
            weaponIcon.beginFill(0xC0C0C0);
            weaponIcon.moveTo(14, 8);
            weaponIcon.lineTo(16, 12);
            weaponIcon.lineTo(14, 16);
            weaponIcon.lineTo(12, 12);
            weaponIcon.closePath();
            weaponIcon.endFill();
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 16, 2, 4);  // Handle
            weaponIcon.endFill();
          } else if (lowerName.includes('club') || lowerName.includes('baton')) {
            // Club - thick at top
            weaponIcon.beginFill(0x654321);
            weaponIcon.drawRect(13, 12, 2, 8);  // Handle
            weaponIcon.drawEllipse(11, 6, 6, 8);  // Head
            weaponIcon.endFill();
          } else if (lowerName.includes('fan') || lowerName.includes('shuriken')) {
            // Fan/Shuriken - star shape
            weaponIcon.beginFill(0x800080);
            // Draw star manually
            const points = [];
            const outerRadius = 8;
            const innerRadius = 4;
            for (let i = 0; i < 10; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
              points.push(14 + Math.cos(angle) * radius, 14 + Math.sin(angle) * radius);
            }
            weaponIcon.drawPolygon(points);
            weaponIcon.endFill();
          } else {
            // Default weapon - simple sword silhouette
            weaponIcon.beginFill(0x888888);
            weaponIcon.drawRect(13, 6, 2, 16);
            weaponIcon.drawRect(11, 18, 6, 2);
            weaponIcon.endFill();
          }
          
            // Add all parts to this weapon's container
            weaponItemContainer.addChild(weaponBg, weaponBorder, weaponIcon);
            weaponContainer.addChild(weaponItemContainer);
          });
        };
        
        const follow = () => {};

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
        
        return { set, follow, nameText, updateWeapon, removeWeapon, clearWeapons, showDeathX, fullBar, hitShake };
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
          bg.beginFill(0x333333, 0.85).drawRoundedRect(0, 0, 76, 18, 5).endFill();
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
        bg.lineStyle(1, 0xB8860B, 1);
        bg.beginFill(0x000000, 0.9).drawRoundedRect(-16, -6, 32, 5, 2).endFill();
        const fill = new Graphics();
        cont.addChild(bg, fill);
        const set = (ratio:number) => {
          try { fill.clear(); } catch {}
          const r = Math.max(0, Math.min(1, ratio));
          if (r <= 0) return;
          fill.beginFill(0xFFD700).drawRoundedRect(-15, -5, Math.max(1, Math.floor(30*r)), 3, 1).endFill();
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
        
        weaponGraphics.beginFill(color);
        if (weaponName.includes('hammer') || weaponName.includes('mace')) {
          weaponGraphics.drawRect(-4, -25, 8, 20);  // Thicker: 6 -> 8
          weaponGraphics.drawRect(-8, -30, 16, 10); // Thicker: 12 -> 16, 8 -> 10
        } else if (weaponName.includes('axe')) {
          weaponGraphics.drawRect(-3, -25, 6, 20);  // Thicker: 4 -> 6
          weaponGraphics.moveTo(-10, -25);  // Wider: -8 -> -10
          weaponGraphics.lineTo(10, -25);   // Wider: 8 -> 10
          weaponGraphics.lineTo(8, -30);
          weaponGraphics.lineTo(-8, -30);
          weaponGraphics.closePath();
        } else {
          weaponGraphics.drawRect(-3, -30, 6, 30);  // Thicker: 4 -> 6
          if (weaponName.includes('sword')) {
            weaponGraphics.drawRect(-8, -30, 16, 4);  // Thicker: 12 -> 16, 3 -> 4
          }
        }
        weaponGraphics.endFill();
        
        // Add glow effect
        const glow = new Graphics();
        glow.beginFill(color, 0.3);
        glow.drawCircle(0, -15, 20);
        glow.endFill();
        
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
        body.beginFill(color);
        body.drawCircle(0, 0, size);
        body.endFill();
        
        // Head
        const head = new Graphics();
        head.beginFill(color);
        head.drawCircle(0, -size * 0.7, size * 0.8);
        head.endFill();
        
        // Eyes that blink
        const eyes = new Graphics();
        eyes.beginFill(0xFFFFFF);
        eyes.drawCircle(-size/3, -size/3, 2);
        eyes.drawCircle(size/3, -size/3, 2);
        eyes.endFill();
        eyes.beginFill(0x000000);
        eyes.drawCircle(-size/3, -size/3, 1);
        eyes.drawCircle(size/3, -size/3, 1);
        eyes.endFill();
        head.addChild(eyes);
        
        // Legs for walking animation
        const legFL = new Graphics(); // Front Left
        const legFR = new Graphics(); // Front Right
        const legBL = new Graphics(); // Back Left
        const legBR = new Graphics(); // Back Right
        
        [legFL, legFR, legBL, legBR].forEach(leg => {
          leg.beginFill(color);
          leg.drawRect(-2, 0, 4, size * 0.8);
          leg.endFill();
        });
        
        legFL.position.set(-size * 0.5, size * 0.7);
        legFR.position.set(size * 0.5, size * 0.7);
        legBL.position.set(-size * 0.5, size * 0.7);
        legBR.position.set(size * 0.5, size * 0.7);
        
        // Tail
        const tail = new Graphics();
        tail.beginFill(color);
        tail.drawRect(0, -2, size * 0.8, 4);
        tail.endFill();
        tail.position.set(size * 0.8, 0);
        tail.pivot.set(0, 2);
        
        // Shadow
        const shadow = new Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawEllipse(0, size + 2, size * 1.5, size * 0.5);
        shadow.endFill();
        
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
          const actorIdx: number | null = (typeof s.f === 'number') ? s.f : (typeof s.b === 'number' ? s.b : null);
          const targetIdx: number | null = (typeof s.t === 'number') ? s.t : null;
          const actor = actorIdx !== null ? byIndex.get(actorIdx) : undefined;
          const target = targetIdx !== null ? byIndex.get(targetIdx) : undefined;
          const actorSide: 'L'|'R' = actor?.team === 'R' ? 'R' : 'L';
          const targetSide: 'L'|'R' | null = target ? (target.team === 'R' ? 'R' : 'L') : null;
          const src = actorSide === 'L' ? left : right;
          const tgt = targetSide ? (targetSide === 'L' ? left : right) : (src === left ? right : left);

          // Track Equip to update known weapon (real data)
          try {
            if (typeof (StepType as any) !== 'undefined' && a === (StepType as any).Equip && actorIdx !== null && typeof (s as any).w !== 'undefined') {
              const newWeaponName = WeaponById[(s as any).w as WeaponId];
              const oldWeaponName = lastWeaponByActor.get(actorIdx);
              
              // If switching weapons, animate dropping the old one
              if (oldWeaponName && oldWeaponName !== newWeaponName) {
                const pos = getPos(src.node);
                const dropWeapon = new Graphics();
                dropWeapon.lineStyle(1, 0x666666);
                dropWeapon.beginFill(0x888888);
                dropWeapon.drawRect(-4, -8, 8, 16);
                dropWeapon.endFill();
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
          switch (a) {
          // Arrive: pick lane using largest-gap strategy (official-like)
          case 2: {
            try {
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
              
              // Check if this is a pet arrival
              if (actor?.type === 'pet' && actor?.master && actorIdx !== null) {
                const petType = actor.name || 'dog1';
                const pet = createPetSpine(petType, actorSide);
                petSpines.set(actorIdx, pet);
                scene.addChild(pet);
                
                // Start pet animation
                if ((pet as any).petTick) {
                  addTick((pet as any).petTick);
                }
                
                // Position near master
                const masterIdx = actor.master;
                const masterSide = masterIdx === leftMainIdx ? 'L' : 'R';
                const masterObj = masterSide === 'L' ? left : right;
                const masterPos = getPos(masterObj.node);
                
                pet.position.set(
                  masterPos.x + (actorSide === 'L' ? -30 : 30),
                  masterPos.y + 10
                );
                
                // Update src to use pet container
                if (actorSide === 'L') {
                  left = { node: pet, baseX: pet.x, baseY: pet.y, type: 'pet', width: 30 };
                } else {
                  right = { node: pet, baseX: pet.x, baseY: pet.y, type: 'pet', width: 30 };
                }
                try { ensurePetHud(actorIdx); } catch {}
              }
            } catch {}
            break; }
          // Move
          case 15: {
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
          case 19: {
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
          case 9: case 10: case 11: case 12: {
            const dmg = s.d ?? s.damage ?? 0;
            const isCritical = a === 10; // HitCritical
            const isFlash = a === 11; // HitFlash  
            const isVersatile = a === 12; // HitVersatile
            
            // WEAPON ANIMATION AND DAMAGE IN PARALLEL
            // Start animation immediately and apply damage at the right moment
            
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
            
            // Apply damage IMMEDIATELY (animation happens in parallel)
            // If there's damage, someone's HP must decrease
            if (dmg > 0) {
              const targetPet = (targetIdx !== null) && (petSpines.has(targetIdx) || (target && ((target as any).type === 'pet' || (target as any).master)));
              if (targetPet && targetIdx !== null) {
                const hp = hpByIndex.get(targetIdx) || { cur: (target?.hp ?? 1), max: (target?.maxHp ?? 1) };
                hp.cur = Math.max(0, (hp.cur ?? 0) - dmg);
                hpByIndex.set(targetIdx, hp);
                try { const hud = ensurePetHud(targetIdx); hud.set(hp.cur / Math.max(1, hp.max)); } catch {}
              } else {
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
              // Last resort: use visual position
              else if (tgt === left) {
                hpL = Math.max(0, hpL - dmg);
                barL.set(hpL / maxL);
                setTimeout(() => barL.set(hpL / maxL), 50);
                try { (hudL as any)?.hitShake?.(); } catch {}
              } else if (tgt === right) {
                hpR = Math.max(0, hpR - dmg);
                barR.set(hpR / maxR);
                setTimeout(() => barR.set(hpR / maxR), 50);
                try { (hudR as any)?.hitShake?.(); } catch {}
              }
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
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xFF0000);
              await shake(4, 150);
            } else if (isFlash) {
              floatText(tpos.x, tpos.y - 20, 'FLASH!', 0x00FFFF);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
              await shake(3, 120);
            } else if (isVersatile) {
              floatText(tpos.x, tpos.y - 20, 'VERSATILE!', 0xFF69B4);
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
              await shake(2, 100);
            } else {
              floatText(tpos.x, tpos.y, `-${dmg}`, 0xff5555);
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
          // Block
          case 20: {
            const tpos = getPos(tgt.node); 
            floatText(tpos.x, tpos.y, 'BLOCK', 0x4169E1);
            // Small knockback effect
            const cur = getPos(tgt.node);
            const knockX = tgt === left ? cur.x - 5 : cur.x + 5;
            await tweenTo(tgt.node, knockX, cur.y, 50);
            await tweenTo(tgt.node, cur.x, cur.y, 50);
            break; }
          // Evade/Dodge
          case 21: {
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
          case 17: {
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
          case 24: {
            // Use the same logic as Hit to identify who died
            const diedIdx = actorIdx; // Fix: Define diedIdx like in official LaBrute
            const diedFighter = actor;
            
            // Check if it's one of the main fighters
            if (diedFighter?.id === fight.brute1Id || actorIdx === leftMainIdx) { 
              left.node.alpha = 0.2; 
              hpL = 0; 
              barL.set(0); 
              if (hudL.showDeathX) hudL.showDeathX();
              playAnim(left, 'death', false);
              floatText(left.node.x, left.node.y, 'DEAD', 0x8B0000);
            } else if (diedFighter?.id === fight.brute2Id || actorIdx === rightMainIdx) { 
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
          case 22: {
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
            weaponSprite.lineStyle(2, 0x666666);
            weaponSprite.beginFill(0x888888);
            
            // Draw weapon shape based on type
            if (weaponName.includes('knife') || weaponName.includes('dagger')) {
              weaponSprite.drawRect(-3, -15, 6, 30);
            } else if (weaponName.includes('axe') || weaponName.includes('hatchet')) {
              weaponSprite.moveTo(-10, -10);
              weaponSprite.lineTo(10, -10);
              weaponSprite.lineTo(5, 0);
              weaponSprite.lineTo(0, 15);
              weaponSprite.lineTo(-5, 0);
              weaponSprite.closePath();
            } else {
              weaponSprite.drawRect(-5, -10, 10, 20);
            }
            weaponSprite.endFill();
            
            const projectile = weaponSprite;
            
            if (weaponName.includes('shuriken')) {
              // Spinning shuriken
              projectile.lineStyle(2, 0x800080);
              for (let i = 0; i < 4; i++) {
                const angle = (i * 90) * Math.PI / 180;
                projectile.moveTo(0, 0);
                projectile.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
              }
            } else if (weaponName.includes('knife')) {
              // Knife shape
              projectile.beginFill(0xC0C0C0);
              projectile.drawRect(-1, -6, 2, 12);
              projectile.endFill();
            } else {
              // Generic projectile
              projectile.beginFill(0x808080);
              projectile.drawCircle(0, 0, 4);
              projectile.endFill();
            }
            
            // Trail effect
            const trail = new Graphics();
            trail.lineStyle(2, 0xFFFFFF, 0.3);
            
            projectileContainer.addChild(trail, projectile);
            projectileContainer.position.set(spos.x, spos.y - 20);
            scene.addChild(projectileContainer);
            
            // Animate with rotation and trail
            let throwTime = 0;
            const throwDuration = 300 / speed;
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
              trail.lineStyle(2, 0xFFFFFF, 0.3);
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
          case 23: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'DISARMED!', 0xFF6347);
            
            // Animate weapon flying away
            const disarmedWeapon = lastWeaponByActor.get(targetIdx ?? -1) || 'knife';
            const weaponFly = new Graphics();
            weaponFly.lineStyle(2, 0x666666);
            weaponFly.beginFill(0x888888);
            weaponFly.drawRect(-5, -10, 10, 20);
            weaponFly.endFill();
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
          case 25: {
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
          
          // Sabotage
          case 27: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'SABOTAGED!', 0xFFA500);
            break; }
          
          // Net (trap)
          case 28: {
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
            
            // Animate net falling and settling
            let netTime = 0;
            const netTick = (tk: any) => {
              netTime += tk.deltaMS || 16.7;
              
              // Clear and redraw net - SAFE CLEAR
              try {
                netContainer.removeChildren();
              } catch {}
              const netGraphics = new Graphics();
              netGraphics.lineStyle(2, 0x8B4513, 0.7);
              
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
              
              // Remove after settling
              if (netTime > 2500) {
                app.ticker.remove(netTick);
                scene.removeChild(netContainer);
                setTimeout(() => { try { netContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(netTick);
            break; }
          
          // Bomb
          case 29: {
            const tpos = getPos(tgt.node);
            
            // Create animated bomb with Spine-like parts
            const bombContainer = new Container();
            
            // Bomb body
            const bomb = new Graphics();
            bomb.beginFill(0x1C1C1C);
            bomb.drawCircle(0, 0, 8);
            bomb.endFill();
            
            // Fuse
            const fuse = new Graphics();
            fuse.lineStyle(2, 0x8B4513);
            fuse.moveTo(0, -8);
            fuse.lineTo(0, -15);
            
            // Spark
            const spark = new Graphics();
            spark.beginFill(0xFFFF00);
            spark.drawStar(0, -15, 5, 4, 2);
            spark.endFill();
            
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
                core.beginFill(0xFFFFFF, 1);
                core.drawCircle(0, 0, 10);
                core.endFill();
                
                // Middle layer
                const middle = new Graphics();
                middle.beginFill(0xFFA500, 0.8);
                middle.drawCircle(0, 0, 20);
                middle.endFill();
                
                // Outer layer
                const outer = new Graphics();
                outer.beginFill(0xFF4500, 0.6);
                outer.drawCircle(0, 0, 30);
                outer.endFill();
                
                // Shockwave ring
                const ring = new Graphics();
                ring.lineStyle(3, 0xFFFF00, 0.8);
                ring.drawCircle(0, 0, 5);
                
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
          case 30: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'STUNNED!', 0x4B0082);
            
            // Create animated stars circling around head
            const starsContainer = new Container();
            const starSprites: Graphics[] = [];
            
            for (let i = 0; i < 5; i++) {
              const star = new Graphics();
              star.beginFill(0xFFFF00, 0.9);
              star.drawStar(0, 0, 6, 5, 2);
              star.endFill();
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
          
          // Hypnosis
          case 31: {
            const spos = getPos(src.node);
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'HYPNOTIZED!', 0x9932CC);
            
            // Create hypnotic spiral effect
            const spiralContainer = new Container();
            const spirals: Graphics[] = [];
            
            for (let i = 0; i < 3; i++) {
              const spiral = new Graphics();
              spiral.lineStyle(3, i % 2 === 0 ? 0x9932CC : 0xFFFFFF, 0.6);
              
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
                spiral.scale.set(0.5 + Math.sin(spiralTime * 2) * 0.2);
                spiral.alpha = 0.3 + Math.sin(spiralTime * 3 + i) * 0.3;
              });
              
              spiralContainer.scale.set(1 + Math.sin(spiralTime * 2) * 0.1);
              
              if (spiralTime > Math.PI * 2) {
                app.ticker.remove(spiralTick);
                scene.removeChild(spiralContainer);
                setTimeout(() => { try { spiralContainer.destroy(); } catch {} }, 0);
              }
            };
            addTick(spiralTick);
            break; }
          
          // Flashbang
          case 32: {
            const tpos = getPos(tgt.node);
            floatText(tpos.x, tpos.y, 'BLINDED!', 0xFFFFFF);
            
            // Create flash effect
            const flash = new Graphics();
            flash.beginFill(0xFFFFFF, 1);
            flash.drawRect(0, 0, W, H);
            flash.endFill();
            ui.addChild(flash);
            
            // Fade out flash
            let flashTime = 0;
            const flashTick = (tk: any) => {
              flashTime += tk.deltaMS || 16.7;
              flash.alpha = Math.max(0, 1 - flashTime / 200);
              
              if (flashTime > 200) {
                app.ticker.remove(flashTick);
                ui.removeChild(flash);
                setTimeout(() => { try { flash.destroy(); } catch {} }, 0);
              }
            };
            addTick(flashTick);
            break; }
          
          // Poison / Treat (healing)
          case 33: case 34: {
            const isPoison = a === 33;
            const targetPos = getPos(tgt.node);
            
            // Create particle effect
            const particlesContainer = new Container();
            const particles: {g: Graphics, vx: number, vy: number, life: number}[] = [];
            
            // Create particles
            for (let i = 0; i < 20; i++) {
              const particle = new Graphics();
              particle.beginFill(isPoison ? 0x00FF00 : 0xFF69B4, 0.8);
              particle.drawCircle(0, 0, 2 + Math.random() * 2);
              particle.endFill();
              
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
            
            floatText(targetPos.x, targetPos.y, isPoison ? 'POISONED!' : 'HEALED!', isPoison ? 0x00FF00 : 0xFF69B4);
            
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
            
          // End
          case 26: {
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
                  g.beginFill(col as any);
                  if (i % 3 === 0) g.drawRect(-2, -2, 4, 4);
                  else if (i % 3 === 1) g.drawCircle(0, 0, 2);
                  else g.drawPolygon([0,0, 3,0, 1.5,3]);
                  g.endFill();
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
          const ideal = Math.max(60, Math.min(260, s.dt ?? 120)) / Math.max(0.001, speed);
          const elapsed = performance.now() - stepT0;
          const wait = Math.max(0, ideal - elapsed);
          await delay(wait);
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

























