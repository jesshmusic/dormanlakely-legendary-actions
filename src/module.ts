import { logger } from './utils/logger.js';
import { HELPER } from './utils/helper.js';

const NAME = "dormanlakely-legendary-actions";
const PATH = `/modules/${NAME}`;
const TITLE = "Dorman Lakely's Legendary Actions";

/**
 * Invisible ApplicationV2 that opens a DialogV2.wait pointing at Patreon.
 * Registered as a settings submenu so users get a "Visit Patreon" button in
 * the module settings UI.
 *
 * Method signatures match the ambient `foundry.applications.api` types in
 * `src/types/foundry.d.ts` — no local `as any` casts. `DialogV2.wait` is used
 * (not `.prompt`) to match the rest of the codebase (see `utils/helper.ts`).
 */
class PatreonLink extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS: Partial<ApplicationV2Options> = {
        id: 'dormanlakely-legendary-actions-patreon',
        classes: [],
        tag: 'div',
        window: {
            title: 'Support on Patreon',
            icon: 'fab fa-patreon'
        },
        position: { width: 1, height: 1 }
    };

    _onRender(_context: Record<string, unknown>, _options: object): void {
        // Hide the host window chrome — we only exist as a launcher for the
        // DialogV2 prompt.
        if (this.element) this.element.style.display = 'none';
        void foundry.applications.api.DialogV2.wait({
            window: { title: 'Support on Patreon' },
            content: '<p>Open the Patreon page in a new tab.</p>',
            buttons: [
                {
                    action: 'ok',
                    label: '<i class="fab fa-patreon"></i> Visit Patreon',
                    callback: () => {
                        window.open(
                            'https://www.patreon.com/c/DormanLakely',
                            '_blank',
                            'noopener,noreferrer'
                        );
                    }
                }
            ]
        }).then(() => this.close());
    }
}

/**
 * Invisible ApplicationV2 that opens a DialogV2.wait pointing at
 * dungeonmaster.guru. Registered as a settings submenu.
 */
class DmGuruLink extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS: Partial<ApplicationV2Options> = {
        id: 'dormanlakely-legendary-actions-dmguru',
        classes: [],
        tag: 'div',
        window: {
            title: 'Dungeon Master Guru',
            icon: 'fas fa-dragon'
        },
        position: { width: 1, height: 1 }
    };

    _onRender(_context: Record<string, unknown>, _options: object): void {
        if (this.element) this.element.style.display = 'none';
        void foundry.applications.api.DialogV2.wait({
            window: { title: 'Dungeon Master Guru' },
            content: '<p>Open the Dungeon Master Guru site in a new tab.</p>',
            buttons: [
                {
                    action: 'ok',
                    label: '<i class="fas fa-dragon"></i> Visit Dungeon Master Guru',
                    callback: () => {
                        window.open(
                            'https://dungeonmaster.guru',
                            '_blank',
                            'noopener,noreferrer'
                        );
                    }
                }
            ]
        }).then(() => this.close());
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

    // Tracks whether the one-time submenu registrations (Patreon / DM Guru)
    // have already run. `applySettings` is called from multiple places
    // (`debugSettings`, `LegendaryActionManagement.settings`) and each call
    // would otherwise attempt to re-register the same menus, which Foundry
    // treats as a fatal error.
    private static _submenusRegistered = false;

    static applySettings(settingsData: Record<string, object>): void {
        Object.entries(settingsData).forEach(([key, data]) => {
            game.settings.register(MODULE.data.name, key, {
                name: HELPER.localize(`setting.${key}.name`),
                hint: HELPER.localize(`setting.${key}.hint`),
                ...data,
            });
        });

        if (MODULE._submenusRegistered) return;
        MODULE._submenusRegistered = true;

        // Patreon settings submenu — opens a DialogV2 prompt that links to
        // the author's Patreon page in a new tab.
        game.settings.registerMenu(MODULE.data.name, 'patreonLink', {
            name: 'Support on Patreon',
            label: 'Visit Patreon',
            hint: 'Support the development of this module on Patreon! Your contributions help fund new features and updates.',
            icon: 'fab fa-patreon',
            type: PatreonLink as unknown as typeof foundry.applications.api.ApplicationV2,
            restricted: false
        });

        // Dungeon Master Guru settings submenu — opens a DialogV2 prompt that
        // links to dungeonmaster.guru in a new tab.
        game.settings.registerMenu(MODULE.data.name, 'dmGuruLink', {
            name: 'Dungeon Master Guru',
            label: 'Visit Dungeon Master Guru',
            hint: 'SRD rules and DM tools. Free resources for Dungeon Masters at dungeonmaster.guru.',
            icon: 'fas fa-dragon',
            type: DmGuruLink as unknown as typeof foundry.applications.api.ApplicationV2,
            restricted: false
        });
    }
}
