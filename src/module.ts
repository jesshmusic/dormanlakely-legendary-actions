import { logger } from './utils/logger.js';
import { HELPER } from './utils/helper.js';

const NAME = "dormanlakely-legendary-actions";
const PATH = `/modules/${NAME}`;
const TITLE = "Dorman Lakely's Legendary Actions";

const { ApplicationV2, DialogV2 } = (foundry as any).applications.api;

/**
 * Invisible ApplicationV2 that opens a DialogV2.prompt pointing at Patreon.
 * Registered as a settings submenu so users get a "Visit Patreon" button in
 * the module settings UI.
 */
class PatreonLink extends ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: 'dormanlakely-legendary-actions-patreon',
        classes: [],
        tag: 'div',
        window: {
            title: 'Support on Patreon',
            icon: 'fab fa-patreon'
        },
        position: { width: 1, height: 1 }
    };

    async _renderHTML(): Promise<HTMLElement> {
        return document.createElement('div');
    }

    _replaceHTML(result: HTMLElement, content: HTMLElement): void {
        content.replaceChildren(result);
    }

    async _onFirstRender(_context: unknown, _options: unknown): Promise<void> {
        (this as any).element?.style?.setProperty('display', 'none');

        await DialogV2.prompt({
            window: { title: 'Support on Patreon' },
            content: '<p>Open the Patreon page in a new tab.</p>',
            ok: {
                label: '<i class="fab fa-patreon"></i> Visit Patreon',
                callback: () => {
                    window.open('https://www.patreon.com/c/DormanLakely', '_blank', 'noopener,noreferrer');
                }
            }
        });

        this.close();
    }
}

/**
 * Invisible ApplicationV2 that opens a DialogV2.prompt pointing at
 * dungeonmaster.guru. Registered as a settings submenu.
 */
class DmGuruLink extends ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: 'dormanlakely-legendary-actions-dmguru',
        classes: [],
        tag: 'div',
        window: {
            title: 'Dungeon Master Guru',
            icon: 'fas fa-dragon'
        },
        position: { width: 1, height: 1 }
    };

    async _renderHTML(): Promise<HTMLElement> {
        return document.createElement('div');
    }

    _replaceHTML(result: HTMLElement, content: HTMLElement): void {
        content.replaceChildren(result);
    }

    async _onFirstRender(_context: unknown, _options: unknown): Promise<void> {
        (this as any).element?.style?.setProperty('display', 'none');

        await DialogV2.prompt({
            window: { title: 'Dungeon Master Guru' },
            content: '<p>Open the Dungeon Master Guru site in a new tab.</p>',
            ok: {
                label: '<i class="fas fa-dragon"></i> Visit Dungeon Master Guru',
                callback: () => {
                    window.open('https://dungeonmaster.guru', '_blank', 'noopener,noreferrer');
                }
            }
        });

        this.close();
    }
}

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

        // Patreon settings submenu — opens a DialogV2 prompt that links to
        // the author's Patreon page in a new tab.
        game.settings.registerMenu(MODULE.data.name, 'patreonLink', {
            name: 'Support on Patreon',
            label: 'Visit Patreon',
            hint: 'Support the development of this module on Patreon! Your contributions help fund new features and updates.',
            icon: 'fab fa-patreon',
            type: PatreonLink as any,
            restricted: false
        });

        // Dungeon Master Guru settings submenu — opens a DialogV2 prompt that
        // links to dungeonmaster.guru in a new tab.
        game.settings.registerMenu(MODULE.data.name, 'dmGuruLink', {
            name: 'Dungeon Master Guru',
            label: 'Visit Dungeon Master Guru',
            hint: 'SRD rules and DM tools. Free resources for Dungeon Masters at dungeonmaster.guru.',
            icon: 'fas fa-dragon',
            type: DmGuruLink as any,
            restricted: false
        });
    }
}
