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
