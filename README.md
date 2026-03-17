[![Latest Release](https://img.shields.io/github/v/release/jesshmusic/dormanlakely-legendary-actions?label=Latest%20Release)](https://github.com/jesshmusic/dormanlakely-legendary-actions/releases/latest)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdormanlakely-legendary-actions&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=dormanlakely-legendary-actions)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/N4N36ZSPQ)

# Dorman Lakely's Legendary Actions

A FoundryVTT module for **D&D 5e** that automates legendary action management during combat. At the end of each combatant's turn, the GM is prompted with a dialog showing every creature in the encounter that has legendary actions available — so nothing gets forgotten mid-fight.

## Features

- Prompts the GM with available legendary actions at the end of each combatant's turn
- Shows remaining legendary action uses (e.g. `[3/3]`) alongside each action
- Filters out dead creatures (0 HP) and creatures with no remaining legendary actions
- Legendary action recharge is handled natively by the dnd5e system

## Legendary Action Dialog

![Legendary Action Dialog](images/legendary-action-dialog.png)

Each creature with available legendary actions appears in the dialog. Clicking an action executes it and decrements the legendary action counter automatically.

## Requirements

- FoundryVTT v13+
- D&D 5e system v4.0+

## Settings

Found under **Settings → Module Settings → Dorman Lakely's Legendary Actions**:

| Setting | Default | Description |
|---|---|---|
| Legendary Action Prompt | On | Show the legendary action dialog at the end of each combatant's turn |
| Extended debug output | Off | Log additional debugging information to the browser console |

## Development

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript → dist/main.js
npm run dev       # Watch mode (rebuilds on file change)
npm test          # Run unit tests
npm test -- --coverage  # Run tests with coverage report
```

## Credits

Originally derived from [Simbul's Creature Aide](https://github.com/vtt-lair/simbuls-creature-aide), stripped down to legendary actions only and rewritten in TypeScript for Foundry v13 / dnd5e v4.
