import { logger } from '../utils/logger.js';
import { HELPER } from '../utils/helper.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

interface ActionOptions {
    action: boolean;
    bonus: boolean;
    reaction: boolean;
    legendary: boolean;
    lair: boolean;
    special: boolean;
}

interface ConstructorOptions extends Partial<ApplicationV2Options> {
    action?: boolean;
    bonus?: boolean;
    reaction?: boolean;
    legendary?: boolean;
    lair?: boolean;
    special?: boolean;
}

interface ItemActivationData {
    type?: string;
    cost?: number;
    condition?: string;
    canUse: boolean;
    usesValue?: number;
    usesMax?: number;
    available?: number;
    availableMax?: number;
}

interface CombatantItemData {
    name: string;
    id: string;
    activation: ItemActivationData;
    description?: string;
    img: string;
    uuid: string;
}

interface CombatantData {
    id: string;
    combatId: string;
    img: string;
    name: string;
    items: {
        action?: CombatantItemData[];
        bonus?: CombatantItemData[];
        reaction?: CombatantItemData[];
        legendary?: CombatantItemData[];
        lair?: CombatantItemData[];
        special?: CombatantItemData[];
    };
}

/**
 * ActionDialog - A dialog for selecting and using creature actions.
 * Updated for Foundry v13 using ApplicationV2 with HandlebarsApplicationMixin.
 */
export class ActionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    combatants: Combatant[];
    protected actionOptions: ActionOptions;

    constructor(combatants: Combatant[], options: ConstructorOptions = {}) {
        super(options);
        this.combatants = combatants;
        this.actionOptions = {
            action: options.action ?? true,
            bonus: options.bonus ?? true,
            reaction: options.reaction ?? true,
            legendary: options.legendary ?? true,
            lair: options.lair ?? true,
            special: options.special ?? true,
        };
    }

    static DEFAULT_OPTIONS: Partial<ApplicationV2Options> = {
        id: "dla-action-dialog",
        classes: ["dormanlakely-legendary-actions", "dla-action-dialog"],
        tag: "div",
        window: {
            title: "Action Dialog",
            icon: "fa-solid fa-dragon",
            resizable: true,
            minimizable: true,
        },
        position: {
            width: 550,
            height: "auto",
        },
        actions: {
            useItem: ActionDialog.#onUseItem as unknown as (...args: unknown[]) => unknown,
            focusToken: ActionDialog.#onFocusToken as unknown as (...args: unknown[]) => unknown,
            close: ActionDialog.#onClose as unknown as (...args: unknown[]) => unknown,
        },
    };

    static PARTS = {
        content: {
            template: "modules/dormanlakely-legendary-actions/templates/action-dialog.hbs",
        },
    };

    /** Remember last position for each dialog ID */
    static _lastPosition: Map<string, Partial<ApplicationPosition>> = new Map();

    get title(): string {
        return (this.options as ApplicationV2Options).window?.title ?? "Action Dialog";
    }

    async _prepareContext(options: object): Promise<Record<string, unknown>> {
        const context = await super._prepareContext(options);
        context["combatants"] = this._generateCombatantData();
        return context;
    }

    protected _generateCombatantData(): CombatantData[] {
        return this.combatants.map((combatant) => ({
            id: combatant.id,
            combatId: combatant.combat.id,
            img: combatant.img,
            name: combatant.name,
            items: {
                action: this.actionOptions.action
                    ? this.getCombatantItemData(combatant, "action")
                    : undefined,
                bonus: this.actionOptions.bonus
                    ? this.getCombatantItemData(combatant, "bonus")
                    : undefined,
                reaction: this.actionOptions.reaction
                    ? this.getCombatantItemData(combatant, "reaction")
                    : undefined,
                legendary: this.actionOptions.legendary
                    ? this.getCombatantItemData(combatant, "legendary")
                    : undefined,
                lair: this.actionOptions.lair
                    ? this.getCombatantItemData(combatant, "lair")
                    : undefined,
                special: this.actionOptions.special
                    ? this.getCombatantItemData(combatant, "special")
                    : undefined,
            },
        }));
    }

    getCombatantItemData(combatant: Combatant, type: string): CombatantItemData[] {
        return combatant.actor.items
            .filter((item) => {
                /* legendary/lair actions are always feats or abilities, never raw spells —
                   DDB imports spells with activation.type "legendary" alongside the feat wrapper */
                if (item.type === "spell") return false;
                const contents = item?.system?.activities?.contents;
                if (contents?.length) {
                    return contents.some((a) => a.activation?.type === type);
                }
                return item?.system?.activation?.type === type;
            })
            .map((item): CombatantItemData => {
                const matchingActivity = item?.system?.activities?.contents?.find(
                    (a) => a.activation?.type === type
                );
                const activationSource =
                    matchingActivity?.activation ??
                    (foundry.utils.getProperty(item, "system.activation") as ItemActivation | undefined);
                const uses = foundry.utils.getProperty(item, "system.uses") as ItemUses | undefined;
                const hasUsesRemaining = !uses?.max || (uses.value ?? 0) > 0;

                const data: CombatantItemData = {
                    name: item.name,
                    id: item.id,
                    activation: {
                        type: activationSource?.type,
                        cost: activationSource?.value,
                        condition: activationSource?.condition,
                        canUse: hasUsesRemaining,
                        usesValue: uses?.max ? (uses.value ?? 0) : undefined,
                        usesMax: uses?.max ?? undefined,
                    },
                    description: foundry.utils.getProperty(item, "system.description.value") as string | undefined,
                    img: item.img,
                    uuid: item.uuid,
                };

                if (type === "legendary") {
                    const legact = foundry.utils.getProperty(
                        combatant.actor,
                        "system.resources.legact"
                    ) as LegactResource | undefined;
                    const legactMax = legact?.max ?? 0;
                    const legactSpent = legact?.spent ?? 0;
                    const legactRemaining = legactMax - legactSpent;
                    data.activation.available = legactRemaining;
                    data.activation.availableMax = legactMax;
                    data.activation.canUse =
                        hasUsesRemaining && legactRemaining >= (data.activation.cost ?? 1);
                }

                return data;
            });
    }

    static async #onFocusToken(
        this: ActionDialog,
        _event: Event,
        target: HTMLElement
    ): Promise<void> {
        const combatantId = target.dataset["combatantId"];
        if (!combatantId || !game.combats.active) return;

        const token = game.combats.active.combatants.get(combatantId)?.token?.object;
        if (!token) return;

        token.control({ releaseOthers: true });
        canvas.animatePan({ x: token.x, y: token.y });
    }

    static async #onUseItem(
        this: ActionDialog,
        event: Event,
        target: HTMLElement
    ): Promise<void> {
        const itemUuid = target.dataset["uuid"];
        if (!itemUuid) return;

        const doc = await fromUuid(itemUuid);
        if (!doc || !(doc as Item).actor) return;
        const item = doc as Item;

        const actor = item.actor;
        const legendaryActivity = item.system.activities?.contents?.find(
            (a) => a.activation?.type === "legendary"
        );
        const legactSpentBefore =
            (foundry.utils.getProperty(actor, "system.resources.legact.spent") as number) ?? 0;

        await item.use({ event: event as Event });

        if (legendaryActivity) {
            const legactSpentAfter =
                (foundry.utils.getProperty(actor, "system.resources.legact.spent") as number) ?? 0;
            if (legactSpentAfter === legactSpentBefore) {
                const cost = legendaryActivity.activation?.value ?? 1;
                await actor.update({ "system.resources.legact.spent": legactSpentBefore + cost });
            }
        }

        logger.debug(false, "ActionDialog | Item used:", { itemUuid, item });

        if (this.combatants.length === 1) {
            return void this.close();
        } else {
            this.combatants = this.combatants.map(
                (c) => game.combats.active?.combatants.get(c.id) ?? c
            );
            return void this.render();
        }
    }

    static async #onClose(this: ActionDialog, _event: Event, _target: HTMLElement): Promise<void> {
        this.close();
    }

    _onClose(options: object): void {
        ActionDialog._lastPosition.set(
            (this.options as ApplicationV2Options).id,
            { ...this.position }
        );
        super._onClose(options);
    }

    _onRender(context: Record<string, unknown>, options: object): void {
        super._onRender(context, options);

        const lastPos = ActionDialog._lastPosition.get((this.options as ApplicationV2Options).id);
        if (lastPos) {
            this.setPosition(lastPos);
        }

        for (const item of this.element.querySelectorAll(".dla-action-item")) {
            const src = item.querySelector(".dla-action-tooltip-src");
            if (!src?.innerHTML.trim()) continue;
            item.addEventListener("pointerenter", () => {
                game.tooltip.activate(item, { content: src.innerHTML, direction: "RIGHT" });
            });
            item.addEventListener("pointerleave", () => game.tooltip.deactivate());
        }
    }
}

/**
 * LegendaryActionDialog - Specialized dialog showing only legendary actions.
 */
export class LegendaryActionDialog extends ActionDialog {
    constructor(combatants: Combatant[]) {
        super(combatants, {
            id: "dla-legendary-action-dialog",
            window: { title: HELPER.localize("DND5E.LegendaryAction.LabelPl") },
            legendary: true,
            action: false,
            bonus: false,
            reaction: false,
            lair: false,
            special: false,
        });
    }
}
