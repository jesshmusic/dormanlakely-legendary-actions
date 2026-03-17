import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionDialog } from "../src/apps/ActionDialog.js";

// ---- Item factories ----

function makeItem(
    type: string,
    activationType: string,
    usesValue?: number,
    usesMax?: number
): Item {
    return {
        id: `item-${Math.random()}`,
        uuid: `Actor.abc.Item.${Math.random()}`,
        name: "Test Ability",
        type,
        img: "icons/test.png",
        system: {
            activities: {
                size: 1,
                contents: [{ activation: { type: activationType, value: 1, condition: "" } }],
                some: (fn: (a: { activation?: { type?: string } }) => boolean) =>
                    [{ activation: { type: activationType, value: 1 } }].some(fn),
                find: (fn: (a: { activation?: { type?: string } }) => boolean) =>
                    [{ activation: { type: activationType, value: 1 } }].find(fn),
            },
            activation: { type: activationType, value: 1, condition: "" },
            uses: usesMax ? { value: usesValue ?? usesMax, max: usesMax } : undefined,
            description: { value: "<p>Description.</p>" },
        },
        actor: {} as Actor,
        use: vi.fn(),
    };
}

function makeSpell(activationType: string): Item {
    return makeItem("spell", activationType);
}

function makeCombatant(
    items: Item[],
    legactSpent = 0,
    legactMax = 3
): Combatant {
    return {
        id: "combatant-1",
        uuid: "Combatant.combatant-1",
        name: "Test Monster",
        img: "icons/monster.png",
        actor: {
            id: "actor-1",
            uuid: "Actor.actor-1",
            name: "Test Monster",
            type: "npc",
            system: {
                resources: {
                    legact: { value: legactMax - legactSpent, max: legactMax, spent: legactSpent },
                },
                attributes: { hp: { value: 50, max: 50 } },
            },
            items: {
                find: (fn: (i: Item) => boolean) => items.find(fn),
                filter: (fn: (i: Item) => boolean) => items.filter(fn),
                map: <T>(fn: (i: Item) => T) => items.map(fn),
            },
            sheet: { render: vi.fn() },
            update: vi.fn(),
            rollSavingThrow: vi.fn(),
        } as unknown as Actor,
        token: { id: "token-1", uuid: "Token.token-1", name: "Token" } as unknown as TokenDocument,
        combat: { id: "combat-1" } as unknown as Combat,
        getFlag: vi.fn(),
        setFlag: vi.fn(),
    } as unknown as Combatant;
}

// ---- Tests ----

describe("ActionDialog.getCombatantItemData", () => {
    let dialog: ActionDialog;

    beforeEach(() => {
        // ActionDialog constructor calls super() which hits ApplicationV2
        // The mock in setup.ts makes ApplicationV2 a no-op class.
        dialog = Object.create(ActionDialog.prototype) as ActionDialog;
        dialog.combatants = [];
        dialog["actionOptions"] = {
            action: true, bonus: true, reaction: true,
            legendary: true, lair: true, special: true,
        };
    });

    it("filters out spells even when they have matching activation type", () => {
        const spell = makeSpell("legendary");
        const combatant = makeCombatant([spell]);

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result).toHaveLength(0);
    });

    it("includes feat-type items with matching activity activation type", () => {
        const feat = makeItem("feat", "legendary");
        const combatant = makeCombatant([feat]);

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Test Ability");
    });

    it("falls back to item-level activation when no activities", () => {
        const feat = makeItem("feat", "legendary");
        // Remove activities
        (feat.system as unknown as { activities: undefined }).activities = undefined;

        const combatant = makeCombatant([feat]);
        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result).toHaveLength(1);
    });

    it("does not include items with non-matching activation type", () => {
        const feat = makeItem("feat", "action");
        const combatant = makeCombatant([feat]);

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result).toHaveLength(0);
    });
});

describe("ActionDialog legact availability math", () => {
    let dialog: ActionDialog;

    beforeEach(() => {
        dialog = Object.create(ActionDialog.prototype) as ActionDialog;
        dialog.combatants = [];
        dialog["actionOptions"] = {
            action: true, bonus: true, reaction: true,
            legendary: true, lair: true, special: true,
        };
    });

    it("sets canUse=true when legact has points remaining and cost is covered", () => {
        const feat = makeItem("feat", "legendary"); // cost = 1
        const combatant = makeCombatant([feat], 0, 3); // 3/3 remaining

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result[0].activation.canUse).toBe(true);
        expect(result[0].activation.available).toBe(3);
        expect(result[0].activation.availableMax).toBe(3);
    });

    it("sets canUse=false when all legact points are spent", () => {
        const feat = makeItem("feat", "legendary"); // cost = 1
        const combatant = makeCombatant([feat], 3, 3); // 0/3 remaining

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result[0].activation.canUse).toBe(false);
        expect(result[0].activation.available).toBe(0);
    });

    it("sets canUse=false when remaining legact is less than action cost", () => {
        // Make an item that costs 2 legendary actions
        const feat = makeItem("feat", "legendary");
        feat.system.activities!.contents[0].activation!.value = 2;
        feat.system.activation!.value = 2;

        const combatant = makeCombatant([feat], 2, 3); // 1/3 remaining — not enough for cost=2

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result[0].activation.canUse).toBe(false);
    });

    it("respects item-level limited uses — canUse=false when uses.value=0", () => {
        const feat = makeItem("feat", "legendary", 0, 1); // uses: 0/1
        const combatant = makeCombatant([feat], 0, 3);

        const result = dialog.getCombatantItemData(combatant, "legendary");
        expect(result[0].activation.canUse).toBe(false);
    });
});
