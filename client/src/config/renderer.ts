// Centralise renderer tuning so defaults are consistent and overridable
export type RendererConfig = {
  charPx: number;
  drift: number;
  contactBias: number;
  returnFactor: number;
};

const DEFAULTS: RendererConfig = {
  charPx: 50,
  drift: 40,
  contactBias: 5,
  returnFactor: 2,
};

export const getRendererConfig = (): RendererConfig => {
  try {
    const raw = localStorage.getItem('renderer.config');
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      charPx: Number(parsed.charPx ?? DEFAULTS.charPx) || DEFAULTS.charPx,
      drift: Number(parsed.drift ?? DEFAULTS.drift) || DEFAULTS.drift,
      contactBias: Number(parsed.contactBias ?? DEFAULTS.contactBias) || DEFAULTS.contactBias,
      returnFactor: Number(parsed.returnFactor ?? DEFAULTS.returnFactor) || DEFAULTS.returnFactor,
    };
  } catch {
    return DEFAULTS;
  }
};

export const setRendererConfig = (cfg: Partial<RendererConfig>) => {
  const current = getRendererConfig();
  const next = { ...current, ...cfg };
  try { localStorage.setItem('renderer.config', JSON.stringify(next)); } catch {}
  return next;
};

export const DEFAULT_RENDERER_CONFIG = DEFAULTS;

