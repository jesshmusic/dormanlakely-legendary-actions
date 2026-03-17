/**
 * Dorman Lakely's Legendary Actions
 * Main entry point — compiled to dist/main.js by Vite.
 */
import { MODULE } from './module.js';
import { logger } from './utils/logger.js';
import { LegendaryActionManagement } from './modules/LegendaryActionManagement.js';

const SUB_MODULES = {
    MODULE,
    LegendaryActionManagement,
};

/* Initialize module data (id, path, title) */
MODULE.build();

Hooks.once("init", () => {
    const moduleData = game.modules.get(MODULE.data.name);
    const version = moduleData?.version ?? "0.0.0";

    console.log(
        "%c⚔️ Dorman Lakely's Legendary Actions %cv" + version,
        "color: #d32f2f; font-weight: bold; font-size: 16px;",
        "color: #ff9800; font-weight: bold; font-size: 14px;"
    );
});

Hooks.once("ready", () => {
    console.log(
        "%c⚔️ Dorman Lakely's Legendary Actions %c✓ Ready!",
        "color: #d32f2f; font-weight: bold; font-size: 16px;",
        "color: #4caf50; font-weight: bold; font-size: 14px;"
    );
});

/* Register all sub-modules on Foundry's setup hook */
Hooks.on("setup", () => {
    Object.values(SUB_MODULES).forEach((cl) => cl.register());
    Hooks.callAll("npcactionsReady", { MODULE, logger });
});
