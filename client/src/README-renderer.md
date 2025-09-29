Renderer integration notes

- Tuning defaults live in `client/src/config/renderer.ts` and can be overridden via `localStorage.setItem('renderer.config', JSON.stringify({ charPx, drift, contactBias, returnFactor }))`.
- Weapon textures mapping lives in `client/src/assets/weaponSprites.ts`. Drop images under `client/public/images/weapons/` and map each `WeaponName` to a file path. The HUD and thrown projectiles will try to use these textures; if missing, vector fallbacks are used.
- Le mapping est pré‑rempli avec toutes les armes; laisse la valeur vide jusqu’à ce que l’image existe.
- Attachments: weapons are attached via `attachWeaponToFighter(...)` and auto-follow the fighter. When Spine rigs are available, replace the position logic with slot attachments.
- Pets: simple vector placeholders per pet type are present; swap with Spine rigs when ready.
- Page d’édition des réglages: route `/tools/renderer` dans l’app.
