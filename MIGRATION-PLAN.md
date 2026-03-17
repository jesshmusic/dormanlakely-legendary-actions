# Plan: Rename & Convert to TypeScript — Dorman Lakely's Legendary Actions

## Context
The `simbuls-creature-aide` module has been stripped down to Legendary Actions only (Regeneration, Lair Actions, Ability Recharge, and Undead Fortitude all removed). The user wants to rebrand it as "Dorman Lakely's Legendary Actions", convert all JS to TypeScript with a Vite build pipeline, and add Vitest unit tests covering pure logic.

## New Identity
- **Title:** Dorman Lakely's Legendary Actions
- **Module ID:** `dormanlakely-legendary-actions`
- **CSS class prefix:** `dla` (replacing `sca`)
- **Entry point:** `src/main.ts` → compiled to `dist/main.js`

---

## Step 1: Add Build Tooling

Create the following new files:

### `package.json`
```json
{
  "name": "dormanlakely-legendary-actions",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "vitest": "^1.x",
    "@league-of-foundry-developers/foundry-vtt-types": "^11.x"
  }
}
```

### `tsconfig.json`
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`
- `strict: true`
- Include `src/**/*.ts` and `tests/**/*.ts`
- Reference `@league-of-foundry-developers/foundry-vtt-types`

### `vite.config.ts`
- Single entry: `src/main.ts`
- Output: `dist/main.js` (ES module, no chunking)
- External: nothing (bundle everything)

---

## Step 2: Migrate Source Files

Move all `scripts/` files into `src/`, convert `.js` → `.ts`, rename as needed.

| Old path | New path | Notes |
|---|---|---|
| `scripts/creature-aide.js` | `src/main.ts` | Remove all non-legendary imports |
| `scripts/module.js` | `src/module.ts` | Update module ID, title |
| `scripts/modules/LegendaryActionManagement.js` | `src/modules/LegendaryActionManagement.ts` | Type all params |
| `scripts/apps/action-dialog.js` | `src/apps/ActionDialog.ts` | Already has only `ActionDialog` + `LegendaryActionDialog` |
| `scripts/apps/config-app.js` | `src/apps/SettingsConfig.ts` | Remove regen/lair/undead/recharge tabs |
| `scripts/utils/helper.ts` | `src/utils/helper.ts` | Add types |
| `scripts/utils/logger.ts` | `src/utils/logger.ts` | Add types |
| `scripts/utils/update-queue.ts` | `src/utils/update-queue.ts` | Add types |

**Delete:** `scripts/modules/AbilityRecharge.js`, `LairActionManagement.js`, `Regeneration.js`, `UndeadFortitude.js`

### Key type annotations needed:
- `combat: Combat`, `changed: Partial<Combat>` in hook handlers
- `combatant: Combatant`, `actor: Actor`, `item: Item` throughout
- Return types on all static methods
- `queueUpdate(fn: () => Promise<void>): void`

---

## Step 3: Update module.json

- `id`: `dormanlakely-legendary-actions`
- `title`: `Dorman Lakely's Legendary Actions`
- `description`: updated to legendary actions only
- `esmodules`: `["dist/main.js"]` (compiled output)
- `styles`: `["styles/legendary-actions.css"]`
- Remove non-English language files (or keep — user's call; keep for now)

---

## Step 4: Rename CSS & Templates

**`styles/creature-aide.css` → `styles/legendary-actions.css`**
- Replace all `sca-` prefixes with `dla-`
- Remove legacy `.simbuls-athenaeum` block (lines 202–237) — dead code
- Remove settings dialog styles (only needed if settings UI is kept)

**`templates/action-dialog.hbs`**
- Replace all `sca-` CSS class references with `dla-`

**`src/apps/ActionDialog.ts`**
- Replace all `sca-` string references with `dla-`
- Update `id: "dla-legendary-action-dialog"`
- Update `classes: ["dormanlakely-legendary-actions", "dla-action-dialog"]`
- Update template path to `modules/dormanlakely-legendary-actions/templates/action-dialog.hbs`

---

## Step 5: Trim lang/en.json

Remove all keys for: `autoRegen`, `regenBlock`, `lairAction`, `undeadFort`, `abilityRecharge`, `groupLabel.regen`, `groupLabel.recharge`, `groupLabel.lair`, `groupLabel.undead`.

Keep: `legendaryAction*`, `CombatLegendary_notification`, `ConfigApp`, `debug`, `groupLabel.legendary`, `groupLabel.misc`, `Close`.

---

## Step 6: Add Unit Tests

Create `tests/` directory with Vitest. Mock Foundry globals (`game`, `Hooks`, `foundry`) in a `tests/setup.ts`.

### `tests/helper.test.ts`
- `isTurnChange` — test various combat/changed combinations
- `isFirstGM` — mock `game.users`, `game.user`

### `tests/LegendaryActionManagement.test.ts`
- `_createCombatant` — flags combatant when it has legendary activities
- `_updateCombat` — bails when not GM, bails when no turn change, filters dead/exhausted combatants, calls `showLegendaryActions` with correct list
- `rechargeLegendaryActions` — resets `legact.value` to max, skips if already full, posts notification

### `tests/ActionDialog.test.ts`
- `getCombatantItemData` — correctly filters spells, detects legendary via activities, falls back to item-level activation
- `legact` availability math — `canUse` false when spent >= max

---

## Step 7: Update module.json esmodules path

After Vite build, `module.json` must point to `dist/main.js`. During development, run `npm run dev` (watch mode) to rebuild on file change.

---

## Files Modified
- `module.json` — rebrand + dist path
- `lang/en.json` — trim dead keys
- `styles/creature-aide.css` → `styles/legendary-actions.css`
- `templates/action-dialog.hbs` — CSS class renames

## Files Created
- `package.json`, `tsconfig.json`, `vite.config.ts`
- `src/main.ts`, `src/module.ts`
- `src/modules/LegendaryActionManagement.ts`
- `src/apps/ActionDialog.ts`, `src/apps/SettingsConfig.ts`
- `src/utils/helper.ts`, `src/utils/logger.ts`, `src/utils/update-queue.ts`
- `tests/setup.ts`, `tests/helper.test.ts`, `tests/LegendaryActionManagement.test.ts`, `tests/ActionDialog.test.ts`

## Files Deleted
- `scripts/` directory (all old JS files)
- `scripts/modules/AbilityRecharge.js`, `LairActionManagement.js`, `Regeneration.js`, `UndeadFortitude.js`

---

## Step 8: Add CLAUDE.md (Token Optimization)

A `CLAUDE.md` at the project root primes Claude with project context at the start of every session, preventing repeated file exploration and agent spawning.

**Contents to include:**
- Module ID, title, entry point, and build command
- File map: what each `src/` file does (one line each)
- Key Foundry v13 / dnd5e v4 API notes that caused bugs:
  - Activation type lives on `item.system.activities.contents[n].activation.type`, NOT `item.system.activation.type`
  - `legact` uses `spent` field (not `value`) — `value` is computed as `max - spent`
  - `this.options` is frozen after `super()` in ApplicationV2 — pass `id` and `window.title` in constructor options
  - `rollAbilitySave` removed — use `actor.rollSavingThrow({ ability: 'con' })`
  - `item.system.activities` is a Foundry `Collection` — use `.contents` for array iteration
  - Spells from DDB/MM have `activation.type: "legendary"` — filter with `if (item.type === 'spell') return false`
- Test setup note: Foundry globals are mocked in `tests/setup.ts`
- Note: use Read/Grep/Glob directly — do not spawn Explore agents

This file alone significantly reduces tokens per session by eliminating the need to re-read source files or search for context.

---

## Verification
1. `npm install` — installs deps cleanly
2. `npm run build` — compiles to `dist/main.js` with no TS errors
3. `npm test` — all unit tests pass
4. Load Foundry, enable module — settings menu shows only Legendary Action options
5. Add a creature with legendary actions to combat, advance turns — dialog appears with correct actions and legact counter
6. Use a legendary action — legact decrements, dialog re-renders