/**
 * Helper utility class for Dorman Lakely's Legendary Actions
 */
export class HELPER {
    static localize(...args: Parameters<typeof game.i18n.localize>): string {
        return game.i18n.localize(...args);
    }

    static format(key: string, data?: Record<string, unknown>): string {
        return game.i18n.format(key, data);
    }

    static setting(moduleName: string, key: string): unknown {
        return game.settings.get(moduleName, key);
    }

    static isTurnChange(combat: Combat, changed: Partial<Combat>): boolean {
        const liveCombat =
            !!combat.started &&
            (("turn" in changed) || ("round" in changed));
        const anyCombatants = (combat.combatants.size ?? 0) !== 0;
        const notFirstTurn = !(
            ((changed.turn ?? undefined) === 0) &&
            ((changed.round ?? 0) === 1)
        );

        return liveCombat && anyCombatants && notFirstTurn;
    }

    static isFirstTurn(combat: Combat, changed: Partial<Combat>): boolean {
        return combat.started && changed.round === 1;
    }

    static firstGM(): GameUser | undefined {
        return game.users.find(u => u.isGM && u.active);
    }

    static isFirstGM(): boolean {
        return game.user.id === HELPER.firstGM()?.id;
    }

    static async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    static async waitFor(
        fn: (i: number, elapsed: number) => boolean,
        m = 200,
        w = 100,
        i = 0
    ): Promise<boolean> {
        while (!fn(i, (i * w) / 100) && i < m) {
            i++;
            await HELPER.wait(w);
        }
        return i !== m;
    }

    static stringToDom(innerHTML: string, className: string): HTMLElement {
        const dom = document.createElement("div");
        dom.innerHTML = innerHTML;
        dom.className = className;
        return dom;
    }

    /**
     * Simple button dialog using Foundry v13 DialogV2.
     */
    static async buttonDialog(
        data: { title: string; content: string; buttons: Array<{ label: string; value: unknown }> },
        _direction = "row"
    ): Promise<unknown> {
        const buttons = data.buttons.map((button, index) => ({
            action: `button-${index}`,
            label: button.label,
            callback: () => button.value,
        }));

        return foundry.applications.api.DialogV2.wait({
            window: { title: data.title },
            content: data.content,
            buttons,
            close: () => "Exit, No Button Click",
        });
    }
}
