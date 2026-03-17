import { MODULE } from "../module.js";
import { HELPER } from "../utils/helper.js";
import { logger } from "../utils/logger.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface GroupLabel {
    faIcon: string;
    tabLabel: string;
}

interface TabData {
    faIcon: string;
    tabLabel: string;
    settings: SettingEntry[];
    menus: MenuEntry[];
}

interface SettingEntry {
    namespace: string;
    key: string;
    scope: string;
    config: boolean;
    group?: string;
    type: unknown;
    choices?: Record<string, string>;
    range?: { min: number; max: number; step: number };
    default: unknown;
    isCheckbox: boolean;
    isSelect: boolean;
    isRange: boolean;
    value: unknown;
    path: string;
}

interface MenuEntry {
    parentMenu?: string;
    tab?: string;
    type: new (options?: object) => unknown;
    options?: object;
}

interface SettingsConstructorOptions extends Partial<ApplicationV2Options> {
    subModule?: unknown;
    subMenuId?: string | null;
    groupLabels?: Record<string, GroupLabel>;
    parentMenu?: unknown;
}

/**
 * HelpersSettingsConfig - Settings configuration dialog.
 * Updated for Foundry v13 using ApplicationV2 with HandlebarsApplicationMixin.
 * Trimmed to Legendary Actions only.
 */
export class HelpersSettingsConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    private subModule: unknown;
    private subMenuId: string | null;
    protected groupLabels: Record<string, GroupLabel>;
    private parentMenu: unknown;

    constructor(options: SettingsConstructorOptions = {}) {
        super(options);
        this.subModule = options.subModule ?? null;
        this.subMenuId = options.subMenuId ?? null;
        this.groupLabels = options.groupLabels ?? HelpersSettingsConfig.defaultGroupLabels;
        this.parentMenu = options.parentMenu ?? null;
    }

    static _menus: Map<string, MenuEntry> = new Map();

    static get menus(): Map<string, MenuEntry> {
        return HelpersSettingsConfig._menus;
    }

    get menus(): Map<string, MenuEntry> {
        return HelpersSettingsConfig.menus;
    }

    static DEFAULT_OPTIONS: Partial<ApplicationV2Options> = {
        id: "dla-settings",
        classes: ["dormanlakely-legendary-actions", "dla-settings"],
        tag: "form",
        window: {
            title: "DLA.ConfigApp.title",
            icon: "fa-solid fa-cog",
            resizable: true,
        },
        position: {
            width: 600,
            height: "auto",
        },
        form: {
            handler: HelpersSettingsConfig.#onSubmit as unknown as (...args: unknown[]) => unknown,
            closeOnSubmit: true,
        },
        actions: {
            openSubMenu: HelpersSettingsConfig.#onOpenSubMenu as unknown as (...args: unknown[]) => unknown,
            returnToParent: HelpersSettingsConfig.#onReturnToParent as unknown as (...args: unknown[]) => unknown,
        },
    };

    static PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
        },
        content: {
            template: "modules/dormanlakely-legendary-actions/templates/settings-config.hbs",
            scrollable: [".dla-settings-content"],
        },
        footer: {
            template: "templates/generic/form-footer.hbs",
        },
    };

    static TABS = {
        primary: {
            legendary: {
                id: "legendary",
                group: "primary",
                icon: "fas fa-paw",
                label: "DLA.groupLabel.legendary",
            },
        },
    };

    static get defaultGroupLabels(): Record<string, GroupLabel> {
        return {
            legendary: { faIcon: "fas fa-paw", tabLabel: "DLA.groupLabel.legendary" },
            misc: { faIcon: "fas fa-cog", tabLabel: "DLA.groupLabel.misc" },
        };
    }

    get title(): string {
        return HELPER.format("DLA.ConfigApp.title");
    }

    _configureRenderOptions(options: Record<string, unknown>): void {
        super._configureRenderOptions(options);
        if (this.tabGroups["primary"]) options["parts"] = ["tabs", "content", "footer"];
    }

    async _prepareContext(options: object): Promise<Record<string, unknown>> {
        const context = await super._prepareContext(options);
        const canConfigure =
            game.user.can("SETTING_MODIFY") || game.user.can("SETTINGS_MODIFY");

        context["tabs"] = this._prepareTabs();
        context["tabData"] = this._prepareTabData(canConfigure);
        context["hasParent"] = !!this.subMenuId;
        context["parentMenu"] = this.parentMenu;
        context["canConfigure"] = canConfigure;
        context["systemTitle"] = game.system.title;

        context["buttons"] = [
            { type: "submit", icon: "far fa-save", label: HELPER.localize("SETTINGS.Save") },
        ];

        return context;
    }

    private _prepareTabs(): Record<string, unknown> {
        const tabs: Record<string, unknown> = {};
        for (const [key, tab] of Object.entries(HelpersSettingsConfig.TABS.primary)) {
            tabs[key] = {
                ...tab,
                active: this.tabGroups["primary"] === key,
                cssClass: this.tabGroups["primary"] === key ? "active" : "",
            };
        }
        return tabs;
    }

    private _prepareTabData(canConfigure: boolean): Record<string, TabData> {
        const settings = Array.from(game.settings.settings);
        const tabData: Record<string, TabData> = {};

        for (const [tabName, tabConfig] of Object.entries(this.groupLabels)) {
            tabData[tabName] = { ...tabConfig, settings: [], menus: [] };
        }

        for (const [, setting] of settings.filter(
            ([, s]) => (s as SettingConfig).namespace === MODULE.data.name
        )) {
            const s = setting as SettingConfig;
            if (!s.config) {
                if (!canConfigure && s.scope !== "client") continue;
                const groupName = tabData[s.group ?? ""] ? (s.group ?? "") : "misc";
                if (!tabData[groupName]) continue;

                tabData[groupName].settings.push({
                    ...s,
                    type: s.type instanceof Function ? s.type.name : "String",
                    isCheckbox: s.type === Boolean,
                    isSelect: s.choices !== undefined,
                    isRange: s.type === Number && !!s.range,
                    value: HELPER.setting(MODULE.data.name, s.key),
                    path: `${s.namespace}.${s.key}`,
                });
            }
        }

        const childMenus = [...this.menus.values()].filter(
            (menu) => menu.parentMenu === this.subMenuId
        );
        childMenus.forEach((menu) => {
            if (menu.tab && tabData[menu.tab]) {
                tabData[menu.tab].menus.push(menu);
            }
        });

        for (const [tabName, data] of Object.entries(tabData)) {
            if (data.settings.length === 0 && data.menus.length === 0) {
                delete tabData[tabName];
            }
        }

        logger.debug(
            game.settings.get(MODULE.data.name, "debug") as boolean,
            `${MODULE.data.name} | Settings Config | Tab Data:`,
            tabData
        );

        return tabData;
    }

    async _preparePartContext(
        partId: string,
        context: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
        context = await super._preparePartContext(partId, context);

        if (partId === "tabs") {
            context["tabs"] = Object.values(context["tabs"] as object);
        }

        return context;
    }

    static async #onSubmit(
        _event: Event,
        _form: HTMLFormElement,
        formData: { object: Record<string, unknown> }
    ): Promise<void> {
        const fd = foundry.utils.expandObject(formData.object) as Record<
            string,
            Record<string, unknown>
        >;

        for (const [namespace, settings] of Object.entries(fd)) {
            for (const [key, value] of Object.entries(settings)) {
                try {
                    await game.settings.set(namespace, key, value);
                } catch (e) {
                    logger.error(MODULE.data.name, `Failed to save setting ${namespace}.${key}:`, e);
                }
            }
        }

        ui.notifications.info(
            HELPER.localize("SETTINGS.Save") + " - " + HELPER.localize("DLA.ConfigApp.title")
        );
    }

    static async #onOpenSubMenu(
        this: HelpersSettingsConfig,
        _event: Event,
        target: HTMLElement
    ): Promise<void> {
        const menuKey = target.dataset["key"];
        if (!menuKey) return;
        const menu = this.menus.get(menuKey);
        if (menu) {
            const app = new menu.type(menu.options);
            (app as { render(v: boolean): void }).render(true);
        }
    }

    static async #onReturnToParent(
        this: HelpersSettingsConfig,
        _event: Event,
        _target: HTMLElement
    ): Promise<void> {
        const menu = game.settings.menus.get("dormanlakely-legendary-actions.helperOptions");
        if (!menu) {
            ui.notifications.error("No parent menu found");
            return;
        }
        const app = new menu.type();
        (app as { render(v: boolean): void }).render(true);
    }
}
