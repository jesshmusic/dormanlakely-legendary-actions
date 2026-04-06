# v 2.1.0 — 2026-04-06

## Foundry v14 + dnd5e 5.3 Compatibility

### Compatibility
* **Foundry VTT v14 verified** — bumped `compatibility.verified` to `14`.
* **Minimum Foundry version bumped to `14`**. Earlier versions of this module remain available for v13 users from the GitHub releases page; this version is v14-only by design.
* **dnd5e 5.3 verified** — bumped `relationships.systems.dnd5e.compatibility.verified` to `5.3.0`.

### Improvements
* When the user clicks a legendary action in the dialog, the matched activity's `Activity#use()` is now called directly instead of `Item#use()`. This avoids dnd5e's "pick which activity" dialog when an item has multiple activities (e.g. a creature ability that's both an action and a legendary action). Falls back to `Item#use()` if the activity instance does not expose `use()`.
* Filter out spell items in `_createCombatant`'s legendary detection so DDB/MM-imported spells with `activation.type: "legendary"` are not double-counted alongside their feat wrapper.
* Defensive optional chaining around `item.system?.activities` reads.

### Notes
* dnd5e 5.x stores legendary actions as `system.resources.legact.{max, spent}` with `value` computed during data prep as `clamp(max - spent, 0, max)`. This module continues to update `legact.spent` directly, which round-trips correctly through dnd5e's data preparation.

# v 2.0.0

## Foundry v13 Migration

This release brings full compatibility with Foundry VTT v13 and removes the dependency on simbuls-athenaeum.

### Breaking Changes
* **Requires Foundry v13+** - This version is not compatible with Foundry v12 or earlier
* **Requires dnd5e v4.0.0+** - Updated for dnd5e v4.x/v5.x compatibility
* **Removed simbuls-athenaeum dependency** - All utilities are now bundled directly in this module

### New Features
* Migrated to ApplicationV2 and DialogV2 UI framework for modern Foundry v13 styling
* Updated CSS to use v13 design tokens and CSS custom properties
* Improved dark mode support
* Better responsive design for smaller screens

### Technical Changes
* Inlined all athenaeum utilities (logger, helper, update-queue)
* Migrated ActionDialog to use HandlebarsApplicationMixin(ApplicationV2)
* Migrated HelpersSettingsConfig to use HandlebarsApplicationMixin(ApplicationV2)
* Fixed Roll.toMessage() API signature for v13 compatibility
* Updated all Dialog calls to use DialogV2.wait()
* New template structure using Handlebars (.hbs files)

---

# v 1.2.1

* Fixed an issue where any effect on a creature with regeneration would stop the regeneration

# v 1.2.0

* v12 compatibility
* fix issue with Undead Fortitude popups

# v 1.1.1
* Refactor to use Simbul's Atheneaum

# v 1.1.0
* Undead Fortitude

# v 1.0.0

* Initial release.
