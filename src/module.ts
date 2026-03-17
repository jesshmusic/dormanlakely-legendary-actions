import { logger } from './utils/logger.js';
import { HELPER } from './utils/helper.js';

const NAME = "dormanlakely-legendary-actions";
const PATH = `/modules/${NAME}`;
const TITLE = "Dorman Lakely's Legendary Actions";

interface ModuleData {
    name: string;
    path: string;
    title: string;
}

/**
 * MODULE - Central registration and settings management.
 */
export class MODULE {
    static data: ModuleData;

    static async register(): Promise<void> {
        logger.info(NAME, "Initializing Module");
        MODULE.globals();
        MODULE.debugSettings();
    }

    static async build(): Promise<void> {
        MODULE.data = { name: NAME, path: PATH, title: TITLE };
    }

    static globals(): void {
        game.dnd5e.npcactions = {};
    }

    static debugSettings(): void {
        const config = true;
        const settingsData: Record<string, {
            scope: string;
            config: boolean;
            default: boolean;
            type: typeof Boolean;
        }> = {
            debug: {
                scope: "world", config, default: false, type: Boolean,
            },
        };
        MODULE.applySettings(settingsData);
    }

    static applySettings(settingsData: Record<string, object>): void {
        Object.entries(settingsData).forEach(([key, data]) => {
            game.settings.register(MODULE.data.name, key, {
                name: HELPER.localize(`setting.${key}.name`),
                hint: HELPER.localize(`setting.${key}.hint`),
                ...data,
            });
        });
    }
}
