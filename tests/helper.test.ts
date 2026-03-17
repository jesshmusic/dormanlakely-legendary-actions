import { describe, it, expect, beforeEach } from "vitest";
import { HELPER } from "../src/utils/helper.js";
import { mockGM, mockPlayer } from "./setup.js";

// Re-export types inline for tests
type MockCombat = {
    started: boolean;
    combatants: { size: number };
    previous?: { combatantId?: string } | null;
    turn?: number;
    round?: number;
};

describe("HELPER.isTurnChange", () => {
    it("returns true for a normal turn advance", () => {
        const combat: MockCombat = {
            started: true,
            combatants: { size: 3 },
        };
        const changed = { turn: 1 };
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(true);
    });

    it("returns false when combat has not started", () => {
        const combat: MockCombat = {
            started: false,
            combatants: { size: 3 },
        };
        const changed = { turn: 1 };
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(false);
    });

    it("returns false when changed has no turn or round key", () => {
        const combat: MockCombat = {
            started: true,
            combatants: { size: 3 },
        };
        const changed = {};
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(false);
    });

    it("returns false when there are no combatants", () => {
        const combat: MockCombat = {
            started: true,
            combatants: { size: 0 },
        };
        const changed = { turn: 1 };
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(false);
    });

    it("returns false for the very first turn (turn 0, round 1)", () => {
        const combat: MockCombat = {
            started: true,
            combatants: { size: 3 },
        };
        const changed = { turn: 0, round: 1 };
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(false);
    });

    it("returns true for a round change", () => {
        const combat: MockCombat = {
            started: true,
            combatants: { size: 3 },
        };
        const changed = { round: 2 };
        expect(HELPER.isTurnChange(combat as unknown as Combat, changed as Partial<Combat>)).toBe(true);
    });
});

describe("HELPER.isFirstGM", () => {
    it("returns true when current user is the first active GM", () => {
        (game.user as unknown as typeof mockGM) = mockGM;
        (game.users as unknown as { find: (fn: (u: typeof mockGM) => boolean) => typeof mockGM | undefined }) = {
            find: (fn) => [mockGM, mockPlayer].find(fn as (u: typeof mockGM) => boolean),
        };
        expect(HELPER.isFirstGM()).toBe(true);
    });

    it("returns false when current user is not a GM", () => {
        (game.user as unknown as typeof mockPlayer) = mockPlayer;
        (game.users as unknown as { find: (fn: (u: typeof mockGM) => boolean) => typeof mockGM | undefined }) = {
            find: (fn) => [mockGM, mockPlayer].find(fn as (u: typeof mockGM) => boolean),
        };
        expect(HELPER.isFirstGM()).toBe(false);
    });

    it("returns false when no GM is active", () => {
        const inactiveGM = { ...mockGM, active: false };
        (game.user as unknown as typeof mockPlayer) = mockPlayer;
        (game.users as unknown as { find: (fn: (u: typeof mockGM) => boolean) => typeof mockGM | undefined }) = {
            find: (fn) => [inactiveGM, mockPlayer].find(fn as (u: typeof mockGM) => boolean),
        };
        expect(HELPER.isFirstGM()).toBe(false);
    });
});
