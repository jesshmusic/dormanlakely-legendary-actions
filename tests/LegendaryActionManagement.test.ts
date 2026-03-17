import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { LegendaryActionManagement } from "../src/modules/LegendaryActionManagement.js";
import { MODULE } from "../src/module.js";
import { mockGM } from "./setup.js";

// ---- Helpers to build mock Foundry objects ----

function makeMockItem(activationType: string, isSpell = false): Item {
    return {
        id: "item-1",
        uuid: "Actor.abc.Item.item-1",
        name: "Claw Attack",
        type: isSpell ? "spell" : "feat",
        img: "icons/claw.png",
        system: {
            activities: {
                size: 1,
                contents: [{ activation: { type: activationType, value: 1 } }],
                some: (fn: (a: { activation?: { type?: string } }) => boolean) =>
                    [{ activation: { type: activationType, value: 1 } }].some(fn),
                find: (fn: (a: { activation?: { type?: string } }) => boolean) =>
                    [{ activation: { type: activationType, value: 1 } }].find(fn),
            },
            activation: { type: activationType, value: 1 },
            uses: undefined,
            description: { value: "<p>A claw attack.</p>" },
        },
        actor: {} as Actor,
        use: vi.fn(),
    };
}

function makeMockCombatant(
    id: string,
    hasLegendary: boolean,
    legactValue = 3,
    legactMax = 3,
    hpValue = 50
): Combatant {
    const flags: Record<string, Record<string, unknown>> = {};
    if (hasLegendary) {
        flags["dormanlakely-legendary-actions"] = { hasLegendary: true };
    }

    return {
        id,
        uuid: `Combatant.${id}`,
        name: "Test Monster",
        img: "icons/monster.png",
        actor: {
            id: `actor-${id}`,
            uuid: `Actor.actor-${id}`,
            name: "Test Monster",
            type: "npc",
            system: {
                resources: { legact: { value: legactValue, max: legactMax, spent: legactMax - legactValue } },
                attributes: { hp: { value: hpValue, max: hpValue } },
            },
            items: {
                find: (fn: (i: Item) => boolean) => [makeMockItem("legendary")].find(fn),
                filter: (fn: (i: Item) => boolean) => [makeMockItem("legendary")].filter(fn),
                map: <T>(fn: (i: Item) => T) => [makeMockItem("legendary")].map(fn),
            },
            sheet: { render: vi.fn() },
            update: vi.fn().mockResolvedValue({ sheet: { render: vi.fn() } }),
            rollSavingThrow: vi.fn(),
        } as unknown as Actor,
        token: {
            id: `token-${id}`,
            uuid: `Token.token-${id}`,
            name: "Test Monster Token",
            object: { x: 100, y: 100, control: vi.fn() },
        } as unknown as TokenDocument,
        combat: { id: "combat-1" } as unknown as Combat,
        getFlag: (ns: string, key: string) => flags[ns]?.[key],
        setFlag: vi.fn().mockResolvedValue(undefined),
    } as unknown as Combatant;
}

function makeMockCombat(
    combatants: Combatant[],
    previousId?: string
): Combat {
    const map = new Map(combatants.map((c) => [c.id, c]));
    return {
        id: "combat-1",
        uuid: "Combat.combat-1",
        name: "Test Combat",
        started: true,
        combatants: {
            size: combatants.length,
            filter: (fn: (c: Combatant) => boolean) => combatants.filter(fn),
            get: (id: string) => map.get(id),
            map: <T>(fn: (c: Combatant) => T) => combatants.map(fn),
        } as unknown as CombatantCollection,
        previous: previousId ? { combatantId: previousId } : null,
        turn: 1,
        round: 1,
    } as unknown as Combat;
}

// ---- Tests ----

beforeAll(async () => {
    await MODULE.build();
});

describe("LegendaryActionManagement._createCombatant", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (game.user as unknown as typeof mockGM) = mockGM;
        (game.users as unknown as { find: (fn: (u: typeof mockGM) => boolean) => typeof mockGM | undefined }) = {
            find: (fn) => [mockGM].find(fn as (u: typeof mockGM) => boolean),
        };
    });

    it("flags combatant when it has legendary activities", () => {
        const combatant = makeMockCombatant("c1", false);
        LegendaryActionManagement._createCombatant(combatant);
        expect(combatant.setFlag).toHaveBeenCalledWith(
            "dormanlakely-legendary-actions",
            "hasLegendary",
            true
        );
    });

    it("does not flag combatant when it has no legendary activities", () => {
        const combatant = makeMockCombatant("c1", false);
        (combatant.actor.items as unknown as { find: (fn: (i: Item) => boolean) => Item | undefined }).find = () => undefined;
        LegendaryActionManagement._createCombatant(combatant);
        expect(combatant.setFlag).not.toHaveBeenCalled();
    });

    it("bails early when not the first GM", () => {
        (game.user as unknown as { id: string }) = { id: "someone-else" };
        const combatant = makeMockCombatant("c1", false);
        LegendaryActionManagement._createCombatant(combatant);
        expect(combatant.setFlag).not.toHaveBeenCalled();
    });
});

describe("LegendaryActionManagement._updateCombat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (game.user as unknown as typeof mockGM) = mockGM;
        (game.users as unknown as { find: (fn: (u: typeof mockGM) => boolean) => typeof mockGM | undefined }) = {
            find: (fn) => [mockGM].find(fn as (u: typeof mockGM) => boolean),
        };
        vi.spyOn(LegendaryActionManagement, "showLegendaryActions").mockImplementation(() => {});
        vi.spyOn(LegendaryActionManagement, "rechargeLegendaryActions").mockImplementation(() => {});
    });

    it("bails when not GM", () => {
        (game.user as unknown as { id: string }) = { id: "player-id" };
        const combat = makeMockCombat([]);
        LegendaryActionManagement._updateCombat(combat, { turn: 2 });
        expect(LegendaryActionManagement.showLegendaryActions).not.toHaveBeenCalled();
    });

    it("bails when not a turn change", () => {
        const combat = makeMockCombat([]);
        // No 'turn' or 'round' in changed
        LegendaryActionManagement._updateCombat(combat, {});
        expect(LegendaryActionManagement.showLegendaryActions).not.toHaveBeenCalled();
    });

    it("calls showLegendaryActions with alive legendary combatants (excluding previous)", () => {
        const c1 = makeMockCombatant("c1", true, 3, 3, 50); // alive, has legendary
        const c2 = makeMockCombatant("c2", true, 3, 3, 50); // alive, has legendary — this is previous
        const combat = makeMockCombat([c1, c2], "c2");

        LegendaryActionManagement._updateCombat(combat, { turn: 1 });

        expect(LegendaryActionManagement.showLegendaryActions).toHaveBeenCalledWith([c1]);
    });

    it("filters out dead combatants (hp = 0)", () => {
        const c1 = makeMockCombatant("c1", true, 3, 3, 0); // dead
        const c2 = makeMockCombatant("c2", true, 3, 3, 50);
        const combat = makeMockCombat([c1, c2], "c2");

        LegendaryActionManagement._updateCombat(combat, { turn: 1 });

        expect(LegendaryActionManagement.showLegendaryActions).not.toHaveBeenCalledWith(
            expect.arrayContaining([c1])
        );
    });

    it("filters out exhausted combatants (legact value = 0)", () => {
        const c1 = makeMockCombatant("c1", true, 0, 3, 50); // no legact remaining
        const c2 = makeMockCombatant("c2", true, 3, 3, 50);
        const combat = makeMockCombat([c1, c2], "c2");

        LegendaryActionManagement._updateCombat(combat, { turn: 1 });

        expect(LegendaryActionManagement.showLegendaryActions).not.toHaveBeenCalledWith(
            expect.arrayContaining([c1])
        );
    });

    it("calls rechargeLegendaryActions for the previous combatant", () => {
        const c1 = makeMockCombatant("c1", true, 3, 3, 50);
        const c2 = makeMockCombatant("c2", true, 1, 3, 50); // needs recharge
        const combat = makeMockCombat([c1, c2], "c2");

        LegendaryActionManagement._updateCombat(combat, { turn: 1 });

        expect(LegendaryActionManagement.rechargeLegendaryActions).toHaveBeenCalledWith(c2);
    });
});

describe("LegendaryActionManagement.rechargeLegendaryActions", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it("posts notification and queues update when legact.value < max", () => {
        const combatant = makeMockCombatant("c1", true, 1, 3, 50);
        LegendaryActionManagement.rechargeLegendaryActions(combatant);
        expect(ui.notifications.info).toHaveBeenCalled();
    });

    it("does nothing when legact is already at max", () => {
        const combatant = makeMockCombatant("c1", true, 3, 3, 50);
        LegendaryActionManagement.rechargeLegendaryActions(combatant);
        expect(ui.notifications.info).not.toHaveBeenCalled();
    });

    it("does nothing when combatant has no actor", () => {
        const combatant = makeMockCombatant("c1", true, 1, 3, 50);
        (combatant as unknown as { actor: null }).actor = null as unknown as Actor;
        LegendaryActionManagement.rechargeLegendaryActions(combatant);
        expect(ui.notifications.info).not.toHaveBeenCalled();
    });
});
