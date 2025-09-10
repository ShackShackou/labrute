# SHACKERSV10 - Viewer Phaser+Spine (LaBrute)

Goal: 100% faithful visual replay of official LaBrute fights using Phaser+Spine, without touching the official backend. This app proxies to http://localhost:9000 and replays steps from /api/fight/:id.

How to run
- Dev: `npm run dev` then open `http://localhost:5199/?fight=UUID` or `http://localhost:5199/?brute=NAME`
- Preview: `npm run build && npm run preview` → `http://localhost:5200/?fight=UUID` or `?brute=NAME`

Get a fight UUID
- Prisma Studio: open http://localhost:5555, table Fight, copy an id.
- Or API: `GET http://localhost:9000/api/log/list/:bruteName` → pick a log with a `fight` id, then `GET /api/fight/:id`.

Notes
- No RNG on client. The viewer only replays server steps.
- Already includes basic HUD (HP bars) and damage text; uses `dt` when available.
- Spineboy is loaded; if assets fail, viewer falls back to simple shapes.
