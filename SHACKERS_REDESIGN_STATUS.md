# 🎮 SHACKERS Redesign - Implementation Status

**Date Started**: 2025-10-01
**Design System**: Cyberpunk/Sci-Fi with neon cyan and flame accents
**Status**: 🟢 **Phase 1 In Progress**

---

## 📊 Overall Progress

- [x] ✅ **Research Complete** - Master-pupil system found and documented
- [x] ✅ **Design System Created** - Theme tokens defined (`theme/shackers.ts`)
- [x] ✅ **Component Library Started** - ShackersButton, ShackersCard
- [ ] ⏳ **View Redesign** - Starting with HomeView
- [ ] 📅 **Master-Pupil Enhancement** - Scheduled for Week 7
- [ ] 📅 **Full Site Launch** - Target: 12 weeks from start

---

## 🎨 Design System

### Color Palette (Extracted from shackers.xyz)

| Color Type | Value | Usage |
|------------|-------|-------|
| **Primary (Cyan)** | `#00E5FF` | Main brand color, primary buttons, highlights |
| **Primary Light** | `#62EFFF` | Hover states, lighter accents |
| **Primary Dark** | `#00B8D4` | Button gradients, darker variants |
| **Secondary (Red)** | `#FF5252` | Flame accents, damage, errors |
| **Secondary Light** | `#FF6E40` | Orange flame, hover states |
| **Background** | `#000000` | Pure black base |
| **Background Paper** | `#0A0A0A` | Cards, panels |
| **Text Primary** | `#FFFFFF` | Main text |
| **Text Secondary** | `#B0BEC5` | Secondary text |
| **Success** | `#00E676` | Neon green for wins |
| **Warning** | `#FFD600` | Yellow for alerts |

### Typography
- **Display Font**: Orbitron (futuristic, headings)
- **Primary Font**: Rajdhani (body text)
- **Mono Font**: Roboto Mono (codes, stats)
- **Weight**: Bold (700) for emphasis, uppercase for headings
- **Letter Spacing**: Wide (0.1em) for futuristic feel

### Effects
- **Neon Glow**: Drop shadows with cyan/red
- **Pulse Animation**: For active elements
- **Particle Background**: Subtle dots effect
- **Shine Effect**: Sweep animation on hover

---

## 🔧 Components Created

### ✅ ShackersButton (`client/src/components/Shackers/ShackersButton.tsx`)

**Variants:**
- `primary` - Cyan gradient with glow
- `secondary` - Red/orange flame gradient
- `ghost` - Transparent with cyan border
- `danger` - Red gradient for destructive actions

**Features:**
- Neon glow effect (optional)
- Sweep animation on hover
- Gradient backgrounds
- Uppercase, bold text
- Full width option

**Usage:**
```tsx
<ShackersButton variant="primary" glow>
  Create Brute
</ShackersButton>
```

### ✅ ShackersCard (`client/src/components/Shackers/ShackersCard.tsx`)

**Features:**
- Neon border (optional)
- Glow effect (optional)
- Gradient background (optional)
- Particle background overlay
- Hover lift animation

**Usage:**
```tsx
<ShackersCard glow bordered>
  <Text>Card content</Text>
</ShackersCard>
```

---

## 📂 File Structure

```
client/src/
├── theme/
│   └── shackers.ts                 ✅ Design system tokens
├── components/
│   └── Shackers/
│       ├── ShackersButton.tsx      ✅ Primary button component
│       ├── ShackersCard.tsx        ✅ Card/panel component
│       └── index.ts                ✅ Exports
└── views/
    ├── HomeView.tsx                ⏳ Next: Apply SHACKERS theme
    ├── CellView.tsx                📅 Week 3
    ├── FightView.tsx               📅 Week 4-5
    └── ...
```

---

## 🎯 Immediate Next Steps

### Week 1 (Current) ✅ COMPLETE
- [x] Extract color palette from shackers.xyz screenshot
- [x] Create `theme/shackers.ts` design system
- [x] Build `ShackersButton` component
- [x] Build `ShackersCard` component
- [x] ✅ **COMPLETE**: Apply SHACKERS theme to HomeView
  - [x] Replace `FantasyButton` → `ShackersButton`
  - [x] Replace `Paper`/`BoxBg` → `ShackersCard`
  - [x] Update layout/spacing for cyberpunk aesthetic
  - [x] Add neon glow effects to character preview
  - [x] Add features section with hover effects
  - [x] Redesign ad cards with neon borders
  - **See**: `HOMEVIEW_REDESIGN_COMPLETE.md` for full details

### Week 2
- [ ] Create additional SHACKERS components:
  - `ShackersInput` (form inputs)
  - `ShackersText` (typography)
  - `ShackersModal` (dialogs)
  - `ShackersTooltip` (tooltips with glow)
- [ ] Apply theme to CellView
- [ ] Create SHACKERS header/navigation

---

## 📝 Master-Pupil System Research Summary

### ✅ Current Implementation
**Location**:
- Frontend: `client/src/views/CellView.tsx:340` (referral link)
- Frontend: `client/src/components/Cell/CellSocials.tsx:114-148` (display)
- Backend: `server/src/controllers/Brutes.ts:314-399` (creation logic)
- Database: `prisma/schema.prisma:104,120-121` (masterId, pupils relation)

**How it works:**
1. Each brute has referral URL: `?ref={bruteName}`
2. Creating brute via ref link sets `masterId`
3. Master's `pupilsCount` increments
4. Master receives log notifications for:
   - New pupil signup (`LogType.child`)
   - Pupil level up (`LogType.childup`)

**Key Difference from Original LaBrute:**
- ❌ **No XP rewards** (removed to prevent bot abuse)
- Original gave: 1 XP on pupil signup + 1 XP per pupil level up
- Current: Tracking only, no gameplay impact

### 📅 Planned Enhancements (Week 7)

**New Views:**
1. **PupilsView** - List all your pupils
   - Pupil stats (name, level, XP, last fight)
   - Master chain visualization
   - Total XP gained by pupils

2. **ReferralStatsView** - Referral dashboard
   - Total signups
   - Active pupils (fought recently)
   - Share buttons (Twitter, Discord, copy link)

**New Features:**
3. **Achievement System** (Option C from plan)
   - "Master Recruiter" (5/10/25/50/100 pupils)
   - "Legendary Mentor" (pupils reach level 10/20/30)
   - Titles and badges (no exploitable XP/gold rewards)

4. **Enhanced CellSocials**
   - "Recruit Pupils" section
   - Pupil count badge
   - Master lineage tree link

**Decision Made:**
- ✅ Implement Option A (stats dashboard) + Option C (achievements)
- ❌ Skip Option B (XP/gold rewards) to avoid bot abuse

---

## 🚀 12-Week Roadmap

| Week | Phase | Focus |
|------|-------|-------|
| 1-2 | Design System | ✅ Theme, ⏳ Components |
| 3 | Core Views | HomeView, CellView redesign |
| 4-5 | Combat | FightView Pixi v8 + Spine completion |
| 6 | Features | TournamentView, DestinyView, ClanView |
| 7 | **Master-Pupil** | **PupilsView, referral stats, achievements** |
| 8 | Notifications | Real-time notification system |
| 9 | Onboarding | Tutorial, help system |
| 10 | Additional Views | Ranking, events, admin |
| 11 | Polish | Performance, mobile, SEO |
| 12 | Launch | Testing, QA, deployment |

---

## 🔗 Related Documentation

- **Full Redesign Plan**: See conversation summary (2025-10-01)
- **Combat Audit**: `COMBAT_COMPLETENESS_AUDIT.md`
- **Site Features Audit**: `SITE_FEATURES_AUDIT.md` (updated with parrainage findings)
- **Shackers v03 Audit**: `project_docs/AUDIT_SHACKERSV03_vs_LaBrute_PixiSpine.md`
- **Calibration Reference**: `CALIBRATION_REFERENCE_FIGHTS.md`

---

## 📞 Open Questions / Decisions Needed

1. ✅ **Color palette** - APPROVED (extracted from screenshot)
2. ✅ **Master-pupil rewards** - DECISION: No XP/gold, achievements only
3. ⏳ **Font loading** - Need to add Orbitron/Rajdhani to project
4. ⏳ **Asset creation** - When to start Spine rigs/weapon sprites?
5. ⏳ **Background effects** - Use video backgrounds like original or static?

---

**Last Updated**: 2025-10-01
**Next Review**: After HomeView redesign complete
