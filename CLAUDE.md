# Dorman Lakely's Legendary Actions — CLAUDE.md

## Identity
- **Module ID:** `dormanlakely-legendary-actions`
- **Title:** Dorman Lakely's Legendary Actions
- **Entry point:** `src/main.ts` → compiled to `dist/main.js`
- **Build:** `npm run build` (Vite); **Dev watch:** `npm run dev`; **Tests:** `npm test`

## File Map
| File | Purpose |
|---|---|
| `src/main.ts` | Entry point — calls `MODULE.build()`, registers sub-modules on `setup` hook |
| `src/module.ts` | `MODULE` class — module ID/path/title, settings registration, `applySettings()` |
| `src/modules/LegendaryActionManagement.ts` | Core logic — `createCombatant` flag, `updateCombat` turn hook, `rechargeLegendaryActions`, `showLegendaryActions` |
| `src/apps/ActionDialog.ts` | `ActionDialog` (ApplicationV2) + `LegendaryActionDialog` subclass; `getCombatantItemData()` filters and maps items |
| `src/apps/SettingsConfig.ts` | `HelpersSettingsConfig` — settings UI, legendary tab only |
| `src/utils/helper.ts` | `HELPER` — `isTurnChange`, `isFirstGM`, `localize`, `format`, `setting`, `buttonDialog` |
| `src/utils/logger.ts` | `logger` — `info`, `debug`, `error`, `notify` |
| `src/utils/update-queue.ts` | `queueUpdate(fn)` — serialises async Foundry document updates |
| `src/types/foundry.d.ts` | Minimal Foundry/dnd5e ambient type declarations |
| `tests/setup.ts` | Vitest setup — mocks `game`, `Hooks`, `ui`, `foundry` globals |
| `tests/helper.test.ts` | Unit tests for `HELPER.isTurnChange` and `HELPER.isFirstGM` |
| `tests/LegendaryActionManagement.test.ts` | Unit tests for combatant flagging, combat update logic, recharge |
| `tests/ActionDialog.test.ts` | Unit tests for `getCombatantItemData` filtering and legact availability math |

## CSS / Template
- CSS: `styles/legendary-actions.css` — class prefix `dla-`, container class `dormanlakely-legendary-actions`
- Template: `templates/action-dialog.hbs` — uses `dla-*` classes
- Settings template: `templates/settings-config.hbs` — uses `dla-*` classes

## Key Foundry v13 / dnd5e v4 API Facts

### Activation type location
Activation type lives on **activities**, not directly on the item:
```
item.system.activities.contents[n].activation.type
```
NOT `item.system.activation.type` (that is a legacy fallback).

### `legact` fields
- `legact.spent` — directly stored (incremented when actions are used)
- `legact.value` — **computed** as `max - spent` (do not store directly if possible)
- `legact.max` — maximum legendary actions per round

### ApplicationV2 frozen options
`this.options` is frozen after `super()` in `ApplicationV2`. Pass `id` and `window.title`
in the constructor `options` argument — do NOT try to mutate `this.options` after construction.

### `rollAbilitySave` removed
Use `actor.rollSavingThrow({ ability: 'con' })` instead.

### `item.system.activities` is a Foundry Collection
Use `.contents` for array iteration:
```ts
item.system.activities.contents.some(a => ...)
item.system.activities.contents.find(a => ...)
```

### Spells from DDB/MM
Spells imported from D&D Beyond or Monster Manual have `activation.type: "legendary"` on the spell
alongside the feat wrapper. Always filter them out:
```ts
if (item.type === 'spell') return false;
```

## Test Setup
Foundry globals (`game`, `Hooks`, `ui`, `foundry`) are mocked in `tests/setup.ts`.
Tests run in Node via Vitest — no browser required.

## Workflow Notes
- Use **Read / Grep / Glob** directly — do not spawn Explore agents for file lookup.
- After editing source files run `npm run build` to verify no TypeScript errors.
- `dist/main.js` is the file Foundry loads; `module.json` points to it.
