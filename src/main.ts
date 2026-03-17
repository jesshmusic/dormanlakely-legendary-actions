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

/* Register all sub-modules on Foundry's setup hook */
Hooks.on("setup", () => {
    Object.values(SUB_MODULES).forEach((cl) => cl.register());
    Hooks.callAll("npcactionsReady", { MODULE, logger });
});
