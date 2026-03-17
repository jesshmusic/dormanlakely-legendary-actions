/**
 * Vitest global setup — mocks all Foundry VTT globals so pure-logic
 * unit tests can run in Node without a browser or Foundry instance.
 */
import { vi } from "vitest";

// ---- ui.notifications ----
(globalThis as Record<string, unknown>)["ui"] = {
    notifications: {
        info: vi.fn(),
        error: vi.fn(),
        notify: vi.fn(),
    },
};

// ---- foundry.utils ----
(globalThis as Record<string, unknown>)["foundry"] = {
    utils: {
        getProperty: (obj: Record<string, unknown>, key: string): unknown => {
            return key.split(".").reduce((acc: unknown, part: string) => {
                if (acc && typeof acc === "object") {
                    return (acc as Record<string, unknown>)[part];
                }
                return undefined;
            }, obj);
        },
        expandObject: (obj: Record<string, unknown>) => obj,
    },
    applications: {
        api: {
            ApplicationV2: class {},
            HandlebarsApplicationMixin: (Base: unknown) => Base,
            DialogV2: { wait: vi.fn() },
        },
    },
};

// ---- Hooks ----
(globalThis as Record<string, unknown>)["Hooks"] = {
    on: vi.fn(),
    callAll: vi.fn(),
};

// ---- game ----
const mockGM: Record<string, unknown> = {
    id: "gm-user-id",
    isGM: true,
    active: true,
    can: vi.fn(() => true),
};

const mockPlayer: Record<string, unknown> = {
    id: "player-user-id",
    isGM: false,
    active: true,
    can: vi.fn(() => false),
};

(globalThis as Record<string, unknown>)["game"] = {
    user: mockGM,
    users: {
        find: (fn: (u: Record<string, unknown>) => boolean) =>
            [mockGM, mockPlayer].find(fn),
    },
    settings: {
        get: vi.fn((ns: string, key: string) => {
            if (key === "debug") return false;
            if (key === "legendaryActionHelper") return true;
            if (key === "legendaryActionRecharge") return true;
            return undefined;
        }),
        set: vi.fn(),
        register: vi.fn(),
        registerMenu: vi.fn(),
        settings: new Map(),
        menus: { get: vi.fn() },
    },
    i18n: {
        localize: (key: string) => key,
        format: (key: string, _data?: unknown) => key,
    },
    combats: { active: null },
    system: { title: "dnd5e" },
    dnd5e: { npcactions: {} },
    tooltip: {
        activate: vi.fn(),
        deactivate: vi.fn(),
    },
};

// Export the mocks for use in individual test files
export { mockGM, mockPlayer };
